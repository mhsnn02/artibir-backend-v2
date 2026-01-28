import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, security
from uuid import UUID
from datetime import datetime

router = APIRouter(
    prefix="/tracking",
    tags=["Live Tracking (Uber Mode)"]
)

@router.post("/update-location", response_model=dict)
def update_event_live_location(
    event_id: UUID,
    lat: float,
    lon: float,
    status: str = "on_way", # on_way, arrived
    transport_type: str = "walk",
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının etkinliğe giderken canlı konumunu günceller."""
    # Etkinliğe katılmış mı bak
    participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Canlı takip için etkinliğe kayıtlı olmalısınız.")
    
    # Mevcut takip verisi var mı bak
    tracking = db.query(models.LiveTracking).filter(
        models.LiveTracking.event_id == event_id,
        models.LiveTracking.user_id == current_user.id
    ).first()
    
    if tracking:
        tracking.latitude = lat
        tracking.longitude = lon
        tracking.status = status
        tracking.transport_type = transport_type
        tracking.last_updated = datetime.utcnow()
    else:
        tracking = models.LiveTracking(
            event_id=event_id,
            user_id=current_user.id,
            latitude=lat,
            longitude=lon,
            status=status,
            transport_type=transport_type
        )
        db.add(tracking)
    
    db.commit()
    
    return {"message": "Konumunuz güncellendi.", "status": status}

@router.get("/event-map/{event_id}", response_model=List[dict])
def get_event_live_map(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Etkinliğe giden tüm kullanıcıların canlı konumlarını getirir."""
    # Son 10 dakika içinde güncellenmiş konumları getir
    ten_minutes_ago = datetime.utcnow() - datetime.timedelta(minutes=10)
    
    trackings = db.query(models.LiveTracking).filter(
        models.LiveTracking.event_id == event_id,
        models.LiveTracking.last_updated >= ten_minutes_ago
    ).all()
    
    results = []
    for t in trackings:
        user = db.query(models.User).filter(models.User.id == t.user_id).first()
        results.append({
            "user_id": t.user_id,
            "full_name": user.full_name if user else "Gizli Kullanıcı",
            "latitude": t.latitude,
            "longitude": t.longitude,
            "status": t.status,
            "transport_type": t.transport_type,
            "last_updated": t.last_updated
        })
        
    return results
