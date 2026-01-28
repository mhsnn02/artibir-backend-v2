import sys
import os

sys.path.append(os.getcwd())

print("Testing Moderation Service...")
try:
    from services import moderation
    
    # Test 1: Bad Word
    print("Test 1: Bad Word")
    safe, reason = moderation.check_message("Sen bir aptalsın", 50)
    if not safe:
        print(f"PASS: Caught bad word. Reason: {reason}")
    else:
        print("FAIL: Failed to catch bad word.")

    # Test 2: Phone Number (Low Score)
    print("Test 2: Phone Number (Low Score 50)")
    safe, reason = moderation.check_message("Numaram 05551234567", 50)
    if not safe:
        print(f"PASS: Caught phone number for low score. Reason: {reason}")
    else:
        print("FAIL: Allowed phone number for low score.")

    # Test 3: Phone Number (High Score)
    print("Test 3: Phone Number (High Score 80)")
    safe, reason = moderation.check_message("Numaram 05551234567", 80)
    if safe:
        print("PASS: Allowed phone number for high score.")
    else:
        print(f"FAIL: Blocked phone number for high score. Reason: {reason}")

    # Test 4: Short Message
    print("Test 4: Short Message")
    safe, reason = moderation.check_message("a", 50)
    if not safe:
        print(f"PASS: Caught short message. Reason: {reason}")
    else:
        print("FAIL: Allowed short message.")

except ImportError as e:
    print(f"Import Error: {e}")
except Exception as e:
    print(f"Test Error: {e}")
