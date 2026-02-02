
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def fix_enums():
    db = SessionLocal()
    try:
        print("Starting raw SQL update for Enums...")
        
        # TargetGender
        r1 = db.execute(text("UPDATE events SET target_gender='HERKES' WHERE target_gender='Herkes'"))
        r2 = db.execute(text("UPDATE events SET target_gender='SADECE_KIZLAR' WHERE target_gender='Sadece Kızlar'"))
        r3 = db.execute(text("UPDATE events SET target_gender='SADECE_ERKEKLER' WHERE target_gender='Sadece Erkekler'"))
        
        # EventStatus
        r4 = db.execute(text("UPDATE events SET status='AKTIF' WHERE status='Aktif'"))
        r5 = db.execute(text("UPDATE events SET status='DOLDU' WHERE status='Doldu'"))
        r6 = db.execute(text("UPDATE events SET status='IPTAL' WHERE status='İptal'"))
        r7 = db.execute(text("UPDATE events SET status='TAMAMLANDI' WHERE status='Tamamlandı'"))
        
        db.commit()
        print(f"Database enums updated successfully via SQL!")
        # rowcount is not always reliable in all drivers but good to check if possible
        # print(f"Rows affected: {r1.rowcount + r2.rowcount + ...}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_enums()
