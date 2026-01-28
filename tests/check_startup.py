import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

print(f"Checking startup from {os.getcwd()}")

try:
    from main import app
    print("SUCCESS: main.py imported successfully.")
except Exception as e:
    print(f"FAILURE: Could not import main.py. Error: {e}")
    import traceback
    traceback.print_exc()
