from schemas import UserCreate
from pydantic import ValidationError

def test_validation():
    print("Testing Validation Logic...")
    
    # 1. Valid User
    try:
        UserCreate(
            email="valid@example.com", 
            full_name="Valid User", 
            password="StrongPassword1", 
            phone_number="+905551234567"
        )
        print("✅ Valid user accepted.")
    except ValidationError as e:
        print(f"❌ Valid user rejected: {e}")

    # 2. Invalid Phone
    try:
        UserCreate(
            email="invalid_phone@example.com", 
            full_name="Invalid Phone", 
            password="StrongPassword1", 
            phone_number="123"
        )
        print("❌ Invalid phone accepted (FAILED).")
    except ValidationError as e:
        print("✅ Invalid phone rejected (PASSED).")

    # 3. Invalid Password (Short)
    try:
        UserCreate(
            email="short_pw@example.com", 
            full_name="Short PW", 
            password="short", 
            phone_number="+905551234567"
        )
        print("❌ Short password accepted (FAILED).")
    except ValidationError as e:
        print("✅ Short password rejected (PASSED).")

    # 4. Invalid Password (No Digit)
    try:
        UserCreate(
            email="nodigit@example.com",
            full_name="No Digit", 
            password="NoDigitPassword", 
            phone_number="+905551234567"
        )
        print("❌ No-digit password accepted (FAILED).")
    except ValidationError as e:
        print("✅ No-digit password rejected (PASSED).")

if __name__ == "__main__":
    test_validation()
