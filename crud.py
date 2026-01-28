from sqlalchemy.orm import Session
import models, schemas, security
from uuid import UUID
import datetime
import math

# --- Events ---
def create_event(db: Session, event: schemas.EventCreate, host_id: UUID):
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
        price=event.price,
        location_name=event.location_name,
        
        host_id=host_id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_events(db: Session, city: str = None, category: str = None, skip: int = 0, limit: int = 100):
    query = db.query(models.Event)
    if city:
        query = query.filter(models.Event.city == city)
    if category:
        query = query.filter(models.Event.category == category)
    return query.offset(skip).limit(limit).all()

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
        # New required fields
        birth_date=user.birth_date,
        gender=user.gender,
        department=user.department,
        # Defaults handled by DB model or explicit here if needed
        is_verified=False,
        trust_score=50
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Messages ---
from services import encryption

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
