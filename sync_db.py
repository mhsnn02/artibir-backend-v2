import os
import sys
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv

# .env yükle
load_dotenv()

def get_db_connection():
    # Veritabanı URL'sini al
    database_url = os.getenv("DATABASE_URL", "sqlite:///./artibir.db")
    
    # Postgres düzeltmesi (Render/Railway 'postgres://' verebilir)
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    try:
        engine = create_engine(database_url)
        connection = engine.connect()
        print(f"✅ Veritabanına bağlanıldı: {database_url.split('://')[0].upper()}")
        return engine, connection
    except Exception as e:
        print(f"❌ Veritabanı bağlantı hatası: {e}")
        return None, None

def sync_table(engine, connection, table_name, required_columns):
    inspector = inspect(engine)
    if not inspector.has_table(table_name):
        print(f"⚠️ '{table_name}' tablosu bulunamadı. Atlanıyor.")
        return

    # Mevcut kolonları al
    existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
    print(f"📋 '{table_name}' Mevcut Kolonlar: {len(existing_columns)} adet")

    # Transaction başlat
    trans = connection.begin()
    
    try:
        for col_name, col_type in required_columns.items():
            if col_name not in existing_columns:
                print(f"➕ '{table_name}' tablosuna ekleniyor: {col_name} ({col_type})")
                try:
                    stmt = text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                    connection.execute(stmt)
                except Exception as e:
                    print(f"⚠️ Hata ({col_name}): {e}")
        
        trans.commit()
        print(f"✅ '{table_name}' senkronizasyonu tamamlandı.")
        
    except Exception as e:
        trans.rollback()
        print(f"❌ '{table_name}' Genel Hata: {e}")

def sync_db():
    print("🔄 Veritabanı senkronizasyonu başlıyor...")
    engine, connection = get_db_connection()
    if not connection:
        return

    try:
        # 1. Users Tablosu
        users_columns = {
            "university_id": "TEXT",
            "department": "TEXT",
            "bio": "TEXT",
            "tc_no": "TEXT",
            "birth_date": "DATE",
            "gender": "VARCHAR(10)",
            "phone_number": "TEXT",
            "interests": "TEXT",
            "profile_image": "TEXT",
            "favorite_music_url": "TEXT",
            "is_private": "BOOLEAN DEFAULT FALSE",
            "ghost_mode": "BOOLEAN DEFAULT FALSE",
            "show_way_to_everyone": "BOOLEAN DEFAULT TRUE",
            "theme_preference": "TEXT",
            "language_preference": "TEXT",
            "data_saver_mode": "BOOLEAN DEFAULT FALSE",
            "notify_event_reminders": "BOOLEAN DEFAULT TRUE",
            "notify_campus_announcements": "BOOLEAN DEFAULT TRUE",
            "notify_social": "BOOLEAN DEFAULT TRUE",
            "current_latitude": "FLOAT",
            "current_longitude": "FLOAT",
            "last_location_update": "TIMESTAMP",
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
            "kvkk_accepted_at": "TIMESTAMP",
            "artibir_points": "INTEGER DEFAULT 0",
            "level": "INTEGER DEFAULT 1"
        }
        sync_table(engine, connection, "users", users_columns)

        # 2. Events Tablosu (Yeni Eklenen Kısım)
        events_columns = {
            "capacity": "INTEGER DEFAULT 10",
            "price": "FLOAT DEFAULT 0.0",
            "location_name": "TEXT",
            "club_id": "INTEGER",
            "category": "TEXT",
            "image_url": "TEXT",
            "external_url": "TEXT",
            "campus": "TEXT",
            "city": "TEXT",
            "session_token": "TEXT"
        }
        sync_table(engine, connection, "events", events_columns)

    finally:
        connection.close()

if __name__ == "__main__":
    sync_db()
