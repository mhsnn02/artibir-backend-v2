import sys
import os

# Ana dizini path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import User

def make_everyone_admin():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Toplam {len(users)} kullanıcı bulundu.")
        for user in users:
            print(f"Yetki veriliyor: {user.email} (Eski Skor: {user.trust_score})")
            user.trust_score = 1000
            user.is_verified = True
        
        db.commit()
        print("✅ Başarılı! Tüm kullanıcılar artık Admin yetkisine (Trust Score: 1000) sahip.")
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    make_everyone_admin()
