import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Add the directory containing this script to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Load environment variables from .env file
load_dotenv(os.path.join(current_dir, ".env"))

from app.database.db import SessionLocal
from app.models.user import User

def check_users():
    print("Connecting to database...")
    try:
        db = SessionLocal()
        users = db.query(User).all()
        print(f"\nFound {len(users)} registered users:")
        print("-" * 105)
        print(f"{'ID':<36} | {'Username':<20} | {'Email':<30} | {'Role':<10} | {'Verified':<8}")
        print("-" * 105)
        for user in users:
            print(f"{str(user.id):<36} | {user.username:<20} | {user.email:<30} | {user.role.value:<10} | {str(user.is_verified):<8}")
        print("-" * 105)
        db.close()
    except Exception as e:
        print(f"Error checking users: {e}")
        print("Ensure the database is running (Docker) and the environment variables are set correctly.")

if __name__ == "__main__":
    check_users()
