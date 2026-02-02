import sqlite3
import os

db_path = "artibir.db"

def sync_db():
    if not os.path.exists(db_path):
        print("Veritabanı bulunamadı. FastAPI başlatıldığında otomatik oluşturulacaktır.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Mevcut kolonları kontrol et
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]

    # Eksik kolonları ekle
    required_columns = {
        "university_id": "TEXT",
        "department": "TEXT",
        "bio": "TEXT",
        "tc_no": "TEXT",
        "birth_date": "DATE",
        "gender": "TEXT",
        "phone_number": "TEXT",
        "interests": "TEXT",
        "profile_image": "TEXT",
        "favorite_music_url": "TEXT",
        "is_private": "BOOLEAN DEFAULT 0",
        "ghost_mode": "BOOLEAN DEFAULT 0",
        "show_way_to_everyone": "BOOLEAN DEFAULT 1",
        "theme_preference": "TEXT",
        "language_preference": "TEXT",
        "data_saver_mode": "BOOLEAN DEFAULT 0",
        "notify_event_reminders": "BOOLEAN DEFAULT 1",
        "notify_campus_announcements": "BOOLEAN DEFAULT 1",
        "notify_social": "BOOLEAN DEFAULT 1",
        "current_latitude": "FLOAT",
        "current_longitude": "FLOAT",
        "last_location_update": "DATETIME",
        "id_card_front_url": "TEXT",
        "id_card_back_url": "TEXT",
        "blue_tick_status": "TEXT",
        "is_email_verified": "BOOLEAN DEFAULT 0",
        "is_phone_verified": "BOOLEAN DEFAULT 0",
        "email_verification_code": "TEXT",
        "phone_verification_code": "TEXT",
        "password_reset_code": "TEXT",
        "student_document_barcode": "TEXT",
        "is_student_verified": "BOOLEAN DEFAULT 0",
        "wallet_balance": "FLOAT DEFAULT 0.0",
        "trust_score": "INTEGER DEFAULT 50",
        "kvkk_accepted": "BOOLEAN DEFAULT 0",
        "kvkk_accepted_at": "DATETIME"
    }

    for col_name, col_type in required_columns.items():
        if col_name not in columns:
            try:
                print(f"Eksik kolon ekleniyor: {col_name} ({col_type})")
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Hata ({col_name}): {e}")

    # Eksik tabloları oluşturmak için en temiz yol: 
    # FastAPI/SQLAlchemy'nin otomatik yaratma özelliğini kullanmak.
    # Ama burada manuel de ekleyebiliriz:
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS interests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_interests (
                user_id CHAR(32),
                interest_id INTEGER,
                PRIMARY KEY (user_id, interest_id),
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(interest_id) REFERENCES interests(id) ON DELETE CASCADE
            )
        """)
    except Exception as e:
        print(f"Tablo oluşturma hatası: {e}")

    conn.commit()
    conn.close()
    print("Veritabanı senkronizasyonu tamamlandı. ✅")

if __name__ == "__main__":
    sync_db()
