from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
import database, models, schemas, security

router = APIRouter(prefix="/social", tags=["Social & Friends"])

# --- Friendship Endpoints ---

@router.post("/friends/request", response_model=schemas.FriendshipOut)
def send_friend_request(
    request: schemas.FriendshipRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    if request.friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinize istek gönderemezsiniz.")
        
    exists = db.query(models.Friendship).filter(
        models.Friendship.user_id == current_user.id,
        models.Friendship.friend_id == request.friend_id
    ).first()
    
    if exists:
        raise HTTPException(status_code=400, detail="Zaten bir arkadaşlık durumu mevcut.")
        
    friendship = models.Friendship(
        user_id=current_user.id,
        friend_id=request.friend_id,
        status="pending"
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship

@router.post("/friends/accept")
def accept_friend_request(
    friend_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    request = db.query(models.Friendship).filter(
        models.Friendship.user_id == friend_id,
        models.Friendship.friend_id == current_user.id,
        models.Friendship.status == "pending"
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Bekleyen istek bulunamadı.")
        
    request.status = "accepted"
    
    # Karşıt ilişkiyi de ekle (Simetrik arkadaşlık)
    reverse_friendship = models.Friendship(
        user_id=current_user.id,
        friend_id=friend_id,
        status="accepted"
    )
    db.add(reverse_friendship)
    db.commit()
    return {"status": "success", "message": "Arkadaşlık isteği kabul edildi."}

# --- Moments Endpoints ---

@router.post("/moments", response_model=schemas.MomentOut)
def create_moment(
    moment: schemas.MomentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Katılımcı olup olmadığını kontrol et
    participation = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == moment.event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participation:
        raise HTTPException(status_code=403, detail="Sadece katıldığınız etkinliklerde moment paylaşabilirsiniz.")
        
    db_moment = models.EventMoment(
        **moment.model_dump(),
        user_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(db_moment)
    db.commit()
    db.refresh(db_moment)
    return db_moment

@router.get("/moments/feed", response_model=List[schemas.MomentOut])
def get_moments_feed(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # Arkadaşların momentlerini getir
    friend_ids = db.query(models.Friendship.friend_id).filter(
        models.Friendship.user_id == current_user.id,
        models.Friendship.status == "accepted"
    ).all()
    
    ids = [fid[0] for fid in friend_ids]
    # Kendi ID'sini de ekle
    ids.append(current_user.id)
    
    active_moments = db.query(models.EventMoment).filter(
        models.EventMoment.user_id.in_(ids),
        models.EventMoment.expires_at > datetime.utcnow()
    ).order_by(models.EventMoment.created_at.desc()).all()
    
    return active_moments

@router.post("/moments/{moment_id}/view")
def increment_moment_view(
    moment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    moment = db.query(models.EventMoment).filter(models.EventMoment.id == moment_id).first()
    if not moment:
        raise HTTPException(status_code=404, detail="Moment bulunamadı.")
    
    moment.view_count += 1
    db.commit()
    return {"status": "success", "view_count": moment.view_count}
