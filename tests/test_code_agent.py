import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.code_agent import validate_code_output

client = TestClient(app)

@pytest.fixture
def auth_token(monkeypatch):
    """Mock auth token for testing"""
    return "test-token"

def test_validate_code_output_valid():
    """Valid code passes validation"""
    code = """
def hello_world():
    print("Hello, World!")
hello_world()
"""
    assert validate_code_output(code) == True

def test_validate_code_output_placeholder():
    """Placeholder code fails validation"""
    code = "TODO: implement this function"
    assert validate_code_output(code) == False

def test_code_generate_endpoint(auth_token, monkeypatch):
    """Test code generation endpoint"""
    # Mock LLM call
    def mock_call_llm(request_type, payload):
        return {
            "choices": [{
                "message": {
                    "content":  'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)'
                }
            }]
        }
    
    monkeypatch.setattr("app.services.code_agent.call_llm", mock_call_llm)
    
    response = client.post(
        "/code/generate",
        json={"language": "python", "prompt": "Generate fibonacci function"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    assert "fibonacci" in response.json()["result"]

def test_code_refactor_endpoint(auth_token, monkeypatch):
    """Test code refactoring"""
    def mock_call_llm(request_type, payload):
        return {
            "choices": [{
                "message": {
                    "content": "# Refactored code\ndef fibonacci(n):\n    cache = {}\n    def fib(x):\n        if x in cache:\n            return cache[x]\n        if x <= 1:\n            return x\n        cache[x] = fib(x-1) + fib(x-2)\n        return cache[x]\n    return fib(n)"
                }
            }]
        }
    
    monkeypatch.setattr("app.services.code_agent.call_llm", mock_call_llm)
    
    response = client.post(
        "/code/refactor",
        json={
            "language": "python",
            "code": "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)",
            "goal": "optimize with memoization"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    assert "cache" in response.json()["result"]

def test_code_execute_python(auth_token, monkeypatch):
    """Test Python code execution"""
    def mock_sandbox(code, language, user_id, timeout):
        return '{"status": "success", "exit_code": 0, "output": "Hello, World!"}'
    
    monkeypatch.setattr("app.services.sandbox_service.execute_in_sandbox", mock_sandbox)
    
    response = client.post(
        "/code/execute",
        json={
            "language": "python",
            "code": 'print("Hello, World!")'
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200

def test_dangerous_code_blocked(auth_token, monkeypatch):
    """Dangerous code is rejected"""
    response = client.post(
        "/code/execute",
        json={
            "language": "python",
            "code": "import os; os.system('rm -rf /')"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Should be rejected by validation
    assert response. status_code in [400, 403]