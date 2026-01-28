import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, security
from uuid import UUID

router = APIRouter(
    prefix="/activity",
    tags=["User Activity & History"]
)

@router.get("/history", response_model=List[schemas.EventOut])
def get_event_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının geçmişte katıldığı (veya katılmadığı) tüm etkinlikleri getirir."""
    participated_ids = db.query(models.EventParticipant.event_id).filter(
        models.EventParticipant.user_id == current_user.id
    ).all()
    event_ids = [eid[0] for eid in participated_ids]
    
    return db.query(models.Event).filter(models.Event.id.in_(event_ids)).all()

@router.post("/like/{event_id}")
def like_event(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Bir etkinliği beğenir veya beğeniyi geri çeker."""
    existing_like = db.query(models.EventLike).filter(
        models.EventLike.user_id == current_user.id,
        models.EventLike.event_id == event_id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"liked": False}
    
    new_like = models.EventLike(user_id=current_user.id, event_id=event_id)
    db.add(new_like)
    db.commit()
    return {"liked": True}

@router.get("/liked-events", response_model=List[schemas.EventOut])
def get_liked_events(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının beğendiği tüm etkinlikleri listeler."""
    liked_ids = db.query(models.EventLike.event_id).filter(
        models.EventLike.user_id == current_user.id
    ).all()
    event_ids = [eid[0] for eid in liked_ids]
    
    return db.query(models.Event).filter(models.Event.id.in_(event_ids)).all()
