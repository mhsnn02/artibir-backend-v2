
import os
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from database import engine, Base
from models import *  # Import all models to ensure they are registered

# Environment variables are already loaded in database.py
# Make sure we are connected to the correct DB (Render)
print(f"Connecting to database...")

def reset_database():
    try:
        # 1. Drop all tables
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("All tables dropped.")

        # 2. Create all tables
        print("Creating all tables from scratch...")
        Base.metadata.create_all(bind=engine)
        print("All tables created successfully.")
        
        # 3. Verify
        inspector = sa.inspect(engine)
        tables = inspector.get_table_names()
        print(f"Verified tables: {tables}")
        
        if 'users' in tables:
            columns = [c['name'] for c in inspector.get_columns('users')]
            if 'is_email_verified' in columns:
                print("SUCCESS: Critical columns verified.")
            else:
                print("ERROR: Critical columns missing after reset!")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    reset_database()
