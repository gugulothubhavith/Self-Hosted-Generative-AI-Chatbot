
import sys
import os

# Add the backend directory and its parent to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'backend'))

print("Attempting to import app.services.chat_service...")
try:
    from app.services import chat_service
    print("SUCCESS: chat_service imported.")
except ImportError as e:
    print(f"IMPORT ERROR: {e}")
    # Trace the cause
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"GENERAL ERROR: {e}")
    import traceback
    traceback.print_exc()
