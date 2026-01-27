
import sys
import os
import traceback

# Add the backend directory to path
current_dir = os.getcwd()
sys.path.append(current_dir)

print(f"DIAGNOSTIC: Current Working Directory: {current_dir}")

def test_import(module_path):
    print(f"TESTING: {module_path}...", end=" ")
    try:
        __import__(module_path)
        print("SUCCESS")
        return True
    except Exception as e:
        print("FAILED")
        print("-" * 40)
        traceback.print_exc()
        print("-" * 40)
        return False

modules_to_test = [
    "app.core.config",
    "app.database.db",
    "app.models.user",
    "app.models.chat",
    "app.core.deps",
    "app.services.llm_router",
    "app.services.chat_service",
    "app.api.auth",
    "app.api.chat",
    "app.api.rag",
    "app.api.image",
    "app.main"
]

all_passed = True
for mod in modules_to_test:
    if not test_import(mod):
        all_passed = False
        break

if all_passed:
    print("\nALL IMPORTS PASSED! The issue might be at runtime (e.g. DB connection).")
else:
    print("\nDIAGNOSTIC FAILED. Fix the error above.")
