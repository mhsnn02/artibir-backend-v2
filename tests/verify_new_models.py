
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Importing models...")
    from models import User, Event, Message, Base
    print("Models imported successfully.")
except ImportError as e:
    print(f"FAILED to import models: {e}")
    sys.exit(1)

try:
    print("Importing schemas...")
    from schemas import UserOut, EventOut
    print("Schemas imported successfully.")
except ImportError as e:
    print(f"FAILED to import schemas: {e}")
    sys.exit(1)

# Check dependencies
try:
    import geoalchemy2
    print("geoalchemy2 is installed.")
except ImportError:
    print("WARNING: geoalchemy2 is NOT installed. Models will fail to load in runtime.")

try:
    import sqlalchemy
    print(f"SQLAlchemy version: {sqlalchemy.__version__}")
except ImportError:
    print("FAILED: SQLAlchemy not found.")

# Try to create tables (will verify SQLAlchemy mapping)
from database import engine
print("Attempting to create tables (Dry Run)...")
try:
    # Use mock engine or just try print schema
    from sqlalchemy.schema import CreateTable
    from sqlalchemy import create_mock_engine

    def dump(sql, *multiparams, **params):
        print(sql.compile(dialect=engine.dialect))
    
    # We can try to compile the CREATE TABLE statements
    # This checks generic SQL generation validity
    # But since we use PostGIS types, we need PostGIS dialect usually.
    # If engine is SQLite, it might fail.
    
    # Just try Base.metadata.create_all(bind=engine) and catch error
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully (or already exist).")

except Exception as e:
    print(f"ERROR creating tables: {e}")
    print("Note: If this is an SQLite database, PostGIS types like GEOGRAPHY might fallback or fail.")

print("Verification complete.")
