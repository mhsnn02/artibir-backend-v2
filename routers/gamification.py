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
    prefix="/gamification",
    tags=["Gamification & Badges"]
)

@router.get("/badges", response_model=List[dict])
def get_all_badges(db: Session = Depends(database.get_db)):
    """Sistemdeki tüm rozetleri listeler."""
    badges = db.query(models.Badge).all()
    return badges

@router.get("/my-badges", response_model=List[dict])
def get_user_badges(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının kazandığı rozetleri listeler."""
    user_badges = db.query(models.UserBadge).filter(models.UserBadge.user_id == current_user.id).all()
    badge_ids = [ub.badge_id for ub in user_badges]
    badges = db.query(models.Badge).filter(models.Badge.id.in_(badge_ids)).all()
    return badges

@router.post("/check-achievements", response_model=dict)
def check_achievements(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının yeni rozet kazanıp kazanmadığını kontrol eder (Manuel tetikleme)."""
    # Örnek Kontrol: 10'dan fazla etkinliğe katılmış mı? (Sadık Dost Rozeti)
    participation_count = db.query(models.EventParticipant).filter(
        models.EventParticipant.user_id == current_user.id,
        models.EventParticipant.qr_scanned == True
    ).count()
    
    new_badges = []
    
    # Rozet Tanımları (Normalde veritabanından çekilip criteria_type'a göre dinamik yapılmalı)
    # Burada demo amaçlı sabit mantık kuruyoruz:
    
    if participation_count >= 5:
        # 'Sadık Dost' rozeti var mı bak
        badge = db.query(models.Badge).filter(models.Badge.name == "Sadık Dost").first()
        if badge:
            exists = db.query(models.UserBadge).filter(
                models.UserBadge.user_id == current_user.id,
                models.UserBadge.badge_id == badge.id
            ).first()
            if not exists:
                user_badge = models.UserBadge(user_id=current_user.id, badge_id=badge.id)
                db.add(user_badge)
                new_badges.append(badge.name)
    
    db.commit()
    
    return {
        "participation_count": participation_count,
        "new_badges_earned": new_badges,
        "message": "Rozet kontrolleri tamamlandı." if new_badges else "Yeni rozet kazanılmadı."
    }
