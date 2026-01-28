from schemas import UserCreate
from pydantic import ValidationError

def test_artibir_validation():
    print("Testing ArtıBir Specific Validations...")
    
    # 1. Valid University Email
    try:
        UserCreate(
            email="ogrenci@bogazici.edu.tr", 
            full_name="Valid Uni Student", 
            password="StrongPassword1", 
            phone_number="+905551234567"
        )
        print("✅ University email (.edu.tr) accepted.")
    except ValidationError as e:
        print(f"❌ University email rejected: {e}")

    # 2. Invalid Email (Gmail)
    try:
        UserCreate(
            email="hackerman@gmail.com", 
            full_name="Random User", 
            password="StrongPassword1", 
            phone_number="+905551234567"
        )
        print("❌ Gmail accepted (FAILED) - Security breach!")
    except ValidationError as e:
        print("✅ Gmail rejected (PASSED).")

    # 3. Invalid Email (Random .com)
    try:
        UserCreate(
            email="test@example.com", 
            full_name="Test User", 
            password="StrongPassword1", 
            phone_number="+905551234567"
        )
        print("❌ .com email accepted (FAILED).")
    except ValidationError as e:
        print("✅ .com email rejected (PASSED).")

if __name__ == "__main__":
    test_artibir_validation()
