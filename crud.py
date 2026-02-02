from sqlalchemy.orm import Session
import math
import models, schemas, security
import uuid
from uuid import UUID
import datetime
from fastapi import HTTPException
from utils import tracking

# --- Events ---
def create_event(db: Session, event: schemas.EventCreate, host_id: UUID):
    # 1. Moderation Check (Küfür/Sorunlu içerik kontrolü)
    is_safe_title, reason_title = moderation.check_message(event.title, 100) # Host her zaman yetkili sayılır ama başlık temiz olmalı
    is_safe_desc, reason_desc = moderation.check_message(event.description, 100)
    
    if not is_safe_title or not is_safe_desc:
        raise HTTPException(
            status_code=400, 
            detail=f"İçerik kurallara aykırı: {reason_title if not is_safe_title else reason_desc}"
        )

    # Location conversion from lat/lon to WKT
    # PostGIS expects 'POINT(longitude latitude)'
    location_wkt = f"POINT({event.longitude} {event.latitude})"
    
    db_event = models.Event(
        title=event.title,
        description=event.description,
        date=event.date,
        location=location_wkt, # GeoAlchemy2 handles WKT string
        min_age_limit=event.min_age_limit,
        max_age_limit=event.max_age_limit,
        target_gender=event.target_gender,
        status=event.status,
        
        # Coordinates (For SQLite compatibility)
        latitude=event.latitude,
        longitude=event.longitude,
        
        city=event.city,
        campus=event.campus,
        category=event.category,
        image_url=event.image_url,
        external_url=event.external_url,
        
        # New Fields
        capacity=event.capacity,
        price=event.price if event.price > 0 else event.deposit_amount,
        deposit_amount=event.deposit_amount if event.deposit_amount > 0 else event.price,
        location_name=event.location_name,
        session_token=str(uuid.uuid4()), # QR Kod için oturum anahtarı
        host_id=host_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # JSON Takibi
    tracking.log_event("CREATE_EVENT", {
        "event_id": str(db_event.id),
        "title": db_event.title,
        "city": db_event.city
    }, host_id)
    
    return db_event

def get_events(db: Session, city: str = None, category: str = None, skip: int = 0, limit: int = 100, show_past: bool = False):
    query = db.query(models.Event)
    
    # İptal edilmiş etkinlikleri gizle
    query = query.filter(models.Event.status != models.EventStatus.IPTAL)
    
    if not show_past:
        # 24 saat öncesinden eski etkinlikleri gizle (Varsayılan)
        cutoff_date = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
        query = query.filter(models.Event.date >= cutoff_date)
        
    if city:
        query = query.filter(models.Event.city == city)
    if category:
        query = query.filter(models.Event.category == category)
    return query.order_by(models.Event.date.asc()).offset(skip).limit(limit).all()

def get_nearby_events(db: Session, lat: float, lon: float, radius_km: float = 10.0, limit: int = 50):
    """
    Belirli bir koordinata yakın etkinlikleri getirir (Bounding Box yöntemi).
    1 derece enlem yaklaşık 111km'dir.
    """
    delta_lat = radius_km / 111.0
    delta_lon = radius_km / (111.0 * abs(complex(math.cos(math.radians(lat)), 0).real))
    
    query = db.query(models.Event).filter(
        models.Event.latitude >= lat - delta_lat,
        models.Event.latitude <= lat + delta_lat,
        models.Event.longitude >= lon - delta_lon,
        models.Event.longitude <= lon + delta_lon
    )
    
    return query.limit(limit).all()

def get_event(db: Session, event_id: UUID):
    """Belirli bir etkinliği ID'sine göre getirir."""
    return db.query(models.Event).filter(models.Event.id == event_id).first()

# --- Users ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password=hashed_password,
        full_name=user.full_name,
        phone_number=user.phone_number,
        city=user.city,
        birth_date=user.birth_date,
        gender=user.gender,
        department=user.department,
        university_id=user.university_id,
        kvkk_accepted=user.kvkk_accepted,
        is_verified=False,
        trust_score=50
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Otomatik Hoş Geldin Bildirimi
    welcome_notif = models.Notification(
        user_id=db_user.id,
        title="ArtıBir'e Hoş Geldiniz! 🎉",
        message=f"Merhaba {db_user.full_name}, topluluğumuza katıldığın için mutluyuz. Profilini doğrula ve ilk etkinliğine katıl!",
        type="system"
    )
    db.add(welcome_notif)
    db.commit()
    
    # JSON Takibi
    tracking.log_event("USER_REGISTER", {
        "user_id": str(db_user.id),
        "email": db_user.email,
        "full_name": db_user.full_name
    })
    
    return db_user

# --- Messages ---
from services import encryption, moderation

def create_message(db: Session, message: schemas.MessageCreate, sender_id: UUID):
    encrypted_content = encryption.encrypt_message(message.content)
    
    db_message = models.Message(
        sender_id=sender_id,
        receiver_id=message.receiver_id,
        content=encrypted_content,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_history(db: Session, user1_id: UUID, user2_id: UUID):
    messages = db.query(models.Message).filter(
        ((models.Message.sender_id == user1_id) & (models.Message.receiver_id == user2_id)) |
        ((models.Message.sender_id == user2_id) & (models.Message.receiver_id == user1_id))
    ).order_by(models.Message.timestamp).all()
    
    for msg in messages:
        msg.content = encryption.decrypt_message(msg.content)
        
    return messages

# --- Background & Cleanup ---
def cleanup_expired_moments(db: Session):
    """24 saati dolmuş momentleri (hikayeleri) veritabanından siler."""
    now = datetime.datetime.utcnow()
    expired_moments = db.query(models.EventMoment).filter(models.EventMoment.expires_at <= now).all()
    
    count = len(expired_moments)
    for moment in expired_moments:
        db.delete(moment)
    
    if count > 0:
        db.commit()
        tracking.log_event("SYSTEM_CLEANUP", {"type": "moments", "count": count})
    
    return count
def get_leaderboard(db: Session, limit: int = 10):
    return db.query(models.User).order_by(models.User.artibir_points.desc()).limit(limit).all()
