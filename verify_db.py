from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./artibir.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
columns = [col['name'] for col in inspector.get_columns('users')]

print("--- USERS TABLE COLUMNS ---")
required_cols = ['is_email_verified', 'is_phone_verified', 'student_document_barcode']
missing = []

for req in required_cols:
    if req in columns:
        print(f"[OK] {req} found.")
    else:
        print(f"[FAIL] {req} MISSING!")
        missing.append(req)

if not missing:
    print("\nSUCCESS: All new columns exist.")
else:
    print("\nFAILURE: Some columns are missing.")
