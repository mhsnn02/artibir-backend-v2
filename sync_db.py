import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# .env yükle
load_dotenv()

def sync_db():
    print("🔄 Veritabanı senkronizasyonu başlıyor...")

    # Veritabanı URL'sini al
    database_url = os.getenv("DATABASE_URL", "sqlite:///./artibir.db")
    
    # Postgres düzeltmesi (Render/Railway 'postgres://' verebilir)
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    try:
        engine = create_engine(database_url)
        connection = engine.connect()
        print(f"✅ Veritabanına bağlanıldı: {database_url.split('://')[0].upper()}")
    except Exception as e:
        print(f"❌ Veritabanı bağlantı hatası: {e}")
        return

    # Mevcut tablolara bak
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        print("⚠️ 'users' tablosu bulunamadı. Lütfen önce uygulamayı başlatıp tabloların oluşmasını sağlayın (SQLAlchemy create_all).")
        connection.close()
        return

    # Mevcut kolonları al
    existing_columns = [col['name'] for col in inspector.get_columns("users")]
    print(f"📋 Mevcut Kolonlar: {len(existing_columns)} adet")

    # Eklenecek kolonlar ve tipleri (SQLAlchemy Text/Boolean vb. yerine ham SQL tipleri)
    # SQLite ve Postgres için ortak tipler kullanmaya çalışacağız.
    required_columns = {
        "university_id": "TEXT",
        "department": "TEXT",
        "bio": "TEXT",
        "tc_no": "TEXT",
        "birth_date": "DATE",
        "gender": "VARCHAR(10)", # Postgres için VARCHAR daha güvenli
        "phone_number": "TEXT",
        "interests": "TEXT",
        "profile_image": "TEXT",
        "favorite_music_url": "TEXT",
        "is_private": "BOOLEAN DEFAULT FALSE", # 0 yerine FALSE
        "ghost_mode": "BOOLEAN DEFAULT FALSE",
        "show_way_to_everyone": "BOOLEAN DEFAULT TRUE", # 1 yerine TRUE
        "theme_preference": "TEXT",
        "language_preference": "TEXT",
        "data_saver_mode": "BOOLEAN DEFAULT FALSE",
        "notify_event_reminders": "BOOLEAN DEFAULT TRUE",
        "notify_campus_announcements": "BOOLEAN DEFAULT TRUE",
        "notify_social": "BOOLEAN DEFAULT TRUE",
        "current_latitude": "FLOAT",
        "current_longitude": "FLOAT",
        "last_location_update": "TIMESTAMP", # DATETIME yerine TIMESTAMP daha yaygın
        "id_card_front_url": "TEXT",
        "id_card_back_url": "TEXT",
        "blue_tick_status": "TEXT",
        "is_email_verified": "BOOLEAN DEFAULT FALSE",
        "is_phone_verified": "BOOLEAN DEFAULT FALSE",
        "email_verification_code": "TEXT",
        "phone_verification_code": "TEXT",
        "password_reset_code": "TEXT",
        "student_document_barcode": "TEXT",
        "is_student_verified": "BOOLEAN DEFAULT FALSE",
        "wallet_balance": "FLOAT DEFAULT 0.0",
        "trust_score": "INTEGER DEFAULT 50",
        "kvkk_accepted": "BOOLEAN DEFAULT FALSE",
        "kvkk_accepted_at": "TIMESTAMP"
    }

    # Transaction başlat
    trans = connection.begin()
    
    try:
        for col_name, col_type in required_columns.items():
            if col_name not in existing_columns:
                print(f"➕ Ekleniyor: {col_name} ({col_type})")
                try:
                    # ALTER TABLE komutu veritabanına göre değişebilir ama basit ADD COLUMN genelde ortaktır.
                    # SQLite'da tek seferde birden fazla add column yapılmaz, döngüyle tek tek yapıyoruz.
                    # BOOLEAN default değerleri için dialect kontrolü yapmak daha iyi olabilir ama
                    # Basit SQL stringi çoğu durumda çalışır.
                    
                    # TIP DUZELTMESİ:
                    # SQLite Boolean'ı 0/1 olarak tutar, Postgres True/False.
                    # Ancak SQL standardında TRUE/FALSE genelde çalışır.
                    
                    stmt = text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                    connection.execute(stmt)
                except Exception as e:
                    print(f"⚠️ Hata ({col_name}): {e}")
        
        trans.commit()
        print("✅ Senkronizasyon başarıyla tamamlandı.")
        
    except Exception as e:
        trans.rollback()
        print(f"❌ Genel Hata: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    sync_db()
