
import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

print("Checking imports...")
try:
    from app.services import research_service
    print("SUCCESS: app.services.research_service imported.")
except Exception as e:
    print(f"FAILURE: Could not import research_service: {e}")
    sys.exit(1)

try:
    from app.main import app
    print("SUCCESS: app.main imported.")
except Exception as e:
    print(f"FAILURE: Could not import app.main: {e}")
    sys.exit(1)

print("All checks passed.")
