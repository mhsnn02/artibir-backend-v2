import json
from datetime import datetime
from database import SessionLocal
from models import User, Event
from main import app  # API şemasını alabilmek için app'i import ediyoruz

def datetime_serializer(obj):
    """Datetime nesnelerini stringe çevirir."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)

def export_data():
    """Veritabanı verilerini ve API şemasını ayrı JSON dosyalarına aktarır."""
    
    # ---------------------------------------------------------
    # 1. API Şemasını Dışa Aktar (artibir_api_schema.json)
    # ---------------------------------------------------------
    try:
        print("API Şeması oluşturuluyor...")
        openapi_schema = app.openapi()
        
        api_filename = "artibir_api_schema.json"
        with open(api_filename, "w", encoding="utf-8") as f:
            json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
        print(f"BAŞARILI: API şeması '{api_filename}' dosyasına kaydedildi.")
        
    except Exception as e:
        print(f"HATA: API şeması oluşturulurken bir sorun oluştu: {str(e)}")

    # ---------------------------------------------------------
    # 2. Veritabanı Verilerini Dışa Aktar (artibir_data_schema.json)
    # ---------------------------------------------------------
    db = SessionLocal()
    try:
        print("Veritabanına bağlanılıyor...")
        users = db.query(User).all()
        events = db.query(Event).all()
        
        print(f"{len(users)} kullanıcı ve {len(events)} etkinlik bulundu.")

        data = {
            "project": "ArtıBir Backend V2",
            "generated_at": datetime.now().isoformat(),
            "description": "Bu dosya veritabanındaki GERÇEK verilerden üretilmiştir.",
            "database": {
                "users": [],
                "events": []
            },
            "relationships": {
                 "user_events": {
                    "from": "users.id",
                    "to": "events.organizer_id",
                    "type": "one-to-many",
                    "note": "İlişkiler veritabanı yapısına göre değişebilir."
                }
            }
        }

        for user in users:
            user_dict = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "phone_number": user.phone_number,
                "city": user.city,
                "profile_image": user.profile_image,
                "role": "student"
            }
            data["database"]["users"].append(user_dict)

        for event in events:
            event_dict = {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "date": event.date,
                "location": event.location,
                "city": event.city,
                "campus": event.campus
            }
            data["database"]["events"].append(event_dict)

        output_file = "artibir_data_schema.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=datetime_serializer, ensure_ascii=False)
            
        print(f"BAŞARILI: Veritabanı verileri '{output_file}' dosyasına aktarıldı.")
        print("-" * 50)
        print("Şimdi 'artibir_data_schema.json' (Veriler) ve 'artibir_api_schema.json' (API Yapısı)")
        print("dosyalarını JSON Crack ile inceleyebilirsiniz.")

    except Exception as e:
        print(f"HATA: Veri dışa aktarılırken bir sorun oluştu: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    export_data()
