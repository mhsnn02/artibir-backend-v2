import redis
import time
import os
from dotenv import load_dotenv

load_dotenv()

# Sabitler
GEO_KEY = "artibir:locations"    # Tüm konumların tutulduğu harita anahtarı
USER_META_KEY = "user:last_seen" # Kullanıcının son görülme zamanı

# Redis Bağlantısı (Cloud Redis credentials)
# Çevresel değişkenlerden al, yoksa varsayılanları kullan
REDIS_HOST = os.getenv("REDIS_HOST", 'redis-14185.c250.eu-central-1-1.ec2.cloud.redislabs.com')
REDIS_PORT = int(os.getenv("REDIS_PORT", 14185))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

try:
    r = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        decode_responses=True,
        # db parametresi cloud instance'larda genelde 0'dır, ama gerekiyorsa eklenebilir.
        db=0 
    )
except Exception as e:
    print(f"Redis Bağlantı Hatası: {e}")
    r = None

def update_location(user_id: str, latitude: float, longitude: float, is_ghost_mode: bool = False):
    """
    Kullanıcının konumunu günceller veya gizler.
    """
    if not r:
        raise Exception("Redis bağlantısı yok")

    if is_ghost_mode:
        # Kullanıcı görünmezse haritadan sil
        r.zrem(GEO_KEY, user_id)
        return {"status": "hidden", "msg": "Kullanıcı gizlendi"}

    # 1. Redis GEO Modülüne Konumu Ekle
    r.geoadd(GEO_KEY, (longitude, latitude, user_id))
    
    # 2. TTL Mekanizması (Son görülme)
    r.set(f"{USER_META_KEY}:{user_id}", int(time.time()), ex=300)

    return {"status": "success", "msg": "Konum güncellendi"}

def get_nearby_users(user_id: str, latitude: float, longitude: float, radius_km: float = 5.0, limit: int = 50):
    """
    Çevredeki kullanıcıları getirir.
    """
    if not r:
        raise Exception("Redis bağlantısı yok")
        
    results = r.geosearch(
        name=GEO_KEY,
        longitude=longitude,
        latitude=latitude,
        radius=radius_km,
        unit="km",
        withdist=True,
        sort="ASC",
        count=limit
    )

    response_list = []
    
    for member, dist in results:
        # Kendini hariç tut
        if member == user_id:
            continue
            
        response_list.append({
            "user_id": member,
            "distance_meter": int(dist * 1000),
            "distance_text": f"{dist:.2f} km"
        })

    return {
        "center": {"lat": latitude, "lon": longitude},
        "count": len(response_list),
        "users": response_list
    }
