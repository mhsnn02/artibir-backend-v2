import random
from datetime import datetime, timedelta
import schemas

# Mock Data Havuzu
CATEGORIES = ["Futbol", "Konser", "Tiyatro", "Stand-up", "Festival"]

CITIES = ["İstanbul", "Ankara", "İzmir", "Eskişehir", "Antalya"]

# Coordinates for cities (Approx lat, lon)
CITY_COORDS = {
    "İstanbul": (41.0082, 28.9784),
    "Ankara": (39.9334, 32.8597),
    "İzmir": (38.4192, 27.1287),
    "Eskişehir": (39.7667, 30.5256),
    "Antalya": (36.8969, 30.7133)
}

TITLES = {
    "Futbol": ["Derbi Maçı: FB vs GS", "Şampiyonluk Maçı", "Kupa Finali", "Milli Maç"],
    "Konser": ["Yaz Festivali", "Rock Gecesi", "Pop Müzik Şöleni", "Jazz Geceleri", "Rap Battle"],
    "Tiyatro": ["Hamlet Oyunu", "Kibarlık Budalası", "Bir Delinin Hatıra Defteri", "Zengin Mutfağı"],
    "Stand-up": ["Gülmeye Geldik", "Tek Kişilik Dev Kadro", "Açık Mikrofon"],
    "Festival": ["Gençlik Festivali", "Bahar Şenliği", "Kahve Festivali"]
}

IMAGES = {
    "Futbol": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop",
    "Konser": "https://images.unsplash.com/photo-1459749411177-27532f83e679?q=80&w=1000&auto=format&fit=crop",
    "Tiyatro": "https://images.unsplash.com/photo-1503095392269-41a971d24265?q=80&w=1000&auto=format&fit=crop",
    "Stand-up": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?q=80&w=1000&auto=format&fit=crop",
    "Festival": "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=1000&auto=format&fit=crop"
}

def generate_mock_events(count: int = 5):
    """
    Belirtilen sayıda rastgele etkinlik üretir.
    Bu fonksiyon gerçek bir API isteğini simüle eder.
    """
    mock_events = []
    
    for _ in range(count):
        city = random.choice(CITIES)
        category = random.choice(CATEGORIES)
        title = random.choice(TITLES.get(category, ["Etkinlik"]))
        
        # Tarih: Gelecek 30 gün içinde rastgele bir zaman
        days_offset = random.randint(1, 30)
        event_date = datetime.utcnow() + timedelta(days=days_offset)
        
        # Coordinates with slight jitter
        base_lat, base_lon = CITY_COORDS.get(city, (41.0, 29.0))
        lat = base_lat + random.uniform(-0.05, 0.05)
        lon = base_lon + random.uniform(-0.05, 0.05)
        
        # Etkinlik oluştur
        event = schemas.EventCreate(
            title=f"{title} - {city}",
            description=f"Bu harika {category.lower()} etkinliğini kaçırmayın!",
            date=event_date,
            latitude=lat,
            longitude=lon,
            min_age_limit=18,
            max_age_limit=35,
            target_gender=schemas.TargetGender.HERKES,
            status=schemas.EventStatus.AKTIF,
            
            city=city,
            campus=None, 
            category=category,
            image_url=IMAGES.get(category),
            external_url="https://biletix.com/mock-link"
        )
        mock_events.append(event)
        
    return mock_events
