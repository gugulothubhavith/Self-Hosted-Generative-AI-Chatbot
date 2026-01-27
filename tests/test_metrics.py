import pytest
import uuid
import uuid as uuid_lib
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.types import String

@compiles(UUID, 'sqlite')
def compile_uuid(type_, compiler, **kw):
    return "VARCHAR(36)"

from app.main import app
from app.database.db import Base, get_db
from app.core.deps import get_current_user
from app.models.user import User, RoleEnum
from app.models.chat import ChatSession, ChatMessage

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Mock user for auth
test_user_id = uuid.uuid4()
def override_get_current_user():
    return User(
        id=test_user_id,
        username="admin_test",
        email="admin@test.com",
        role=RoleEnum.admin,
        is_verified=True
    )

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

@pytest.fixture
def db():
    # Re-create tables before each test to have a clean state?
    # For simplicity in this file, we might just drop/create or just let it persist if we are careful.
    # But better to have clean DB.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    
    # Create the test user in the DB so FKs work if needed (although get_current_user returns a detached object usually, the models might check existence)
    # Actually, the override returns a user object. The admin API might not query the user table for the current user, 
    # but the metrics will query the User table to count users.
    
    # Let's insert the admin user
    admin_user = User(
        id=test_user_id,
        username="admin_test",
        email="admin@test.com",
        role=RoleEnum.admin,
        is_verified=True
    )
    db.add(admin_user)
    db.commit()
    
    yield db
    db.close()

def test_empty_stats(db):
    """Test stats endpoint with only the admin user"""
    response = client.get("/admin/stats")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_users"] == 1 # Just the admin
    assert data["total_messages"] == 0
    assert data["total_tokens"] == 0
    assert len(data["daily_stats"]) == 7
    # All counts should be 0
    for day in data["daily_stats"]:
        assert day["count"] == 0

def test_stats_counts(db):
    """Test stats with populated data"""
    # 1. Add another user
    other_user = User(
        id=uuid.uuid4(),
        username="user2",
        email="user2@test.com",
        role=RoleEnum.user
    )
    db.add(other_user)
    
    # 2. Add chat sessions
    session1 = ChatSession(id=uuid.uuid4(), user_id=test_user_id, title="Test Chat 1")
    db.add(session1)
    
    # 3. Add messages
    # Content length 20 chars -> ~5 tokens? calculation is content/4
    msg1 = ChatMessage(
        id=uuid.uuid4(), 
        session_id=session1.id, 
        role="user", 
        content="Hello world 12345678", # 20 chars
        created_at=datetime.utcnow()
    )
    # Content length 40 chars -> ~10 tokens
    msg2 = ChatMessage(
        id=uuid.uuid4(), 
        session_id=session1.id, 
        role="assistant", 
        content="Response content here for testing metrics", # 41 chars
        created_at=datetime.utcnow()
    )
    
    db.add(msg1)
    db.add(msg2)
    db.commit()
    
    response = client.get("/admin/stats")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_users"] == 2 # Admin + user2
    assert data["total_messages"] == 2
    
    # Token calc: (20 + 41) / 4 = 61 / 4 = 15.25 -> 15
    assert data["total_tokens"] == 15 
    
    # Daily stats should have 2 for today
    today_str = datetime.utcnow().strftime("%a")
    today_stat = next((d for d in data["daily_stats"] if d["date"] == today_str), None)
    assert today_stat is not None
    assert today_stat["count"] == 2

def test_daily_stats_history(db):
    """Test daily stats with historical data"""
    session = ChatSession(id=uuid.uuid4(), user_id=test_user_id, title="Old Chat")
    db.add(session)
    
    # Message from 2 days ago
    two_days_ago = datetime.utcnow() - timedelta(days=2)
    msg_old = ChatMessage(
        id=uuid.uuid4(),
        session_id=session.id,
        role="user",
        content="Old message",
        created_at=two_days_ago
    )
    db.add(msg_old)
    db.commit()
    
    response = client.get("/admin/stats")
    data = response.json()
    
    target_day_str = two_days_ago.strftime("%a")
    day_stat = next((d for d in data["daily_stats"] if d["date"] == target_day_str), None)
    
    assert day_stat is not None
    assert day_stat["count"] == 1
