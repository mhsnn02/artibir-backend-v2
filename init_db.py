from database import engine
from models import Base

if __name__ == "__main__":
    try:
        Base.metadata.create_all(bind=engine)
        print("Patron, tüm tablolar ve sütunlar (university_id dahil) sıfırdan oluşturuldu!")
    except Exception as e:
        print(f"Hata oluştu: {e}")
