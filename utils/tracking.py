import json
import os
from datetime import datetime
from typing import Any, Dict

TRACKING_FILE = os.path.join("data", "tracking.json")

def ensure_tracking_file():
    """Takip dosyasının ve klasörünün varlığını kontrol eder."""
    os.makedirs(os.path.dirname(TRACKING_FILE), exist_ok=True)
    if not os.path.exists(TRACKING_FILE):
        with open(TRACKING_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)

def log_event(event_type: str, data: Dict[str, Any], user_id: str = None):
    """
    Kritik bir işlemi JSON dosyasına kaydeder.
    
    Args:
        event_type: İşlem tipi (örn: 'CREATE_EVENT', 'USER_REGISTER', 'CHAT_MESSAGE')
        data: Kaydedilecek veri içeriği
        user_id: İşlemi yapan kullanıcının ID'si (opsiyonel)
    """
    ensure_tracking_file()
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "user_id": str(user_id) if user_id else "anonymous",
        "details": data
    }
    
    try:
        with open(TRACKING_FILE, "r+", encoding="utf-8") as f:
            # Dosyayı oku
            logs = json.load(f)
            # Yeni kaydı ekle
            logs.append(log_entry)
            # Başa dön ve yaz
            f.seek(0)
            json.dump(logs, f, ensure_ascii=False, indent=4)
            f.truncate()
    except (json.JSONDecodeError, IOError):
        # Dosya bozuksa veya okunamazsa yeniden oluştur
        with open(TRACKING_FILE, "w", encoding="utf-8") as f:
            json.dump([log_entry], f, ensure_ascii=False, indent=4)

def log_api_request(method: str, path: str, status_code: int, client_ip: str, request_data: Any = None):
    """API isteklerini loglar."""
    # Sadece veri değiştiren (POST, PUT, DELETE) veya hatalı istekleri loglayabiliriz
    # Ya da tüm istekleri takip etmek istiyorsak filtre uyarlaabiliriz.
    if method in ["POST", "PUT", "DELETE"] or status_code >= 400:
        log_event("API_REQUEST", {
            "method": method,
            "path": path,
            "status_code": status_code,
            "client_ip": client_ip,
            "payload": request_data
        })
