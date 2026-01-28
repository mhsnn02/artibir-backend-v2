import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, security
from uuid import UUID
from datetime import datetime, timedelta
import random

router = APIRouter(
    prefix="/interact",
    tags=["Interactions (Icebreakers, Voice)"]
)

@router.get("/icebreaker/{event_id}", response_model=dict)
def get_icebreaker_question(
    event_id: UUID, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Etkinlik sohbeti için rastgele bir buz kırıcı (tanışma) sorusu getirir."""
    # Etkinliği kontrol et
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")
    
    # Sisteme kayıtlı aktif sorulardan rastgele birini seç
    questions = db.query(models.IcebreakerQuestion).filter(models.IcebreakerQuestion.is_active == True).all()
    if not questions:
        return {"question": "En son hangi konsere gittin?", "category": "Genel"}
    
    question = random.choice(questions)
    
    # Log kaydı at (Hangi sorunun sorulduğunu takip etmek için)
    log = models.ChatLog(event_id=event_id, question_id=question.id)
    db.add(log)
    db.commit()
    
    return {
        "question": question.question_text,
        "category": question.category,
        "sent_at": datetime.utcnow()
    }

@router.get("/voice-room/{event_id}", response_model=dict)
def get_voice_room(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Etkinliğe özel sesli oda (Voice Room) bilgilerini getirir veya oluşturur."""
    # Kullanıcı etkinliğe katılmış mı bak
    participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Sesli odaya erişmek için etkinliğe katılmalısınız.")
    
    # Oda var mı bak
    room = db.query(models.VoiceRoom).filter(models.VoiceRoom.event_id == event_id).first()
    
    if not room:
        # Yeni oda oluştur
        room = models.VoiceRoom(
            event_id=event_id,
            room_token=f"room-{event_id.hex[:8]}-{random.randint(1000, 9999)}",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(hours=24) # 24 saat sonra kapanır
        )
        db.add(room)
        db.commit()
        db.refresh(room)
    
    return {
        "room_token": room.room_token,
        "is_active": room.is_active,
        "expires_at": room.expires_at
    }
