from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, security
from services.ai_engine import AIEngine
from datetime import datetime, timedelta

router = APIRouter(prefix="/feed", tags=["Home Feed"])

@router.get("/home")
def get_home_feed(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Kullanıcı için özelleştirilmiş ana sayfa akışını döner.
    """
    # 1. AI Önerileri (Etkinlikler)
    recommendations = AIEngine.recommend_events(db, current_user.id, limit=5)
    
    # 2. Sosyal Momentler
    # Friendships manuel query
    f1 = db.query(models.Friendship.friend_id).filter(models.Friendship.user_id == current_user.id, models.Friendship.status == "accepted").all()
    f2 = db.query(models.Friendship.user_id).filter(models.Friendship.friend_id == current_user.id, models.Friendship.status == "accepted").all()
    friends_ids = [x[0] for x in f1] + [x[0] for x in f2]
    
    moments = []
    if friends_ids:
        moments = db.query(models.EventMoment).filter(
            models.EventMoment.user_id.in_(friends_ids),
            models.EventMoment.expires_at > datetime.utcnow()
        ).order_by(models.EventMoment.created_at.desc()).limit(20).all()
    
    # 3. Yaklaşan Kulüp Etkinlikleri
    # Clubs manuel query
    user_club_memberships = db.query(models.ClubMember.club_id).filter(models.ClubMember.user_id == current_user.id).all()
    club_ids = [x[0] for x in user_club_memberships]
    
    club_events = []
    if club_ids:
        club_events = db.query(models.Event).filter(
            models.Event.club_id.in_(club_ids),
            models.Event.date >= datetime.utcnow()
        ).order_by(models.Event.date.asc()).limit(5).all()
    
    return {
        "user": {
            "name": current_user.full_name,
            "trust_score": current_user.trust_score
        },
        "sections": [
            {
                "type": "moments",
                "title": "Arkadaşlarının Hikayeleri",
                "data": moments
            },
            {
                "type": "recommendations",
                "title": "Senin İçin Önerilenler",
                "data": recommendations
            },
            {
                "type": "club_events",
                "title": "Kulüplerinden Haberler",
                "data": club_events
            },
            {
                "type": "marketplace",
                "title": "Kampüste Satılık",
                "data": db.query(models.MarketplaceItem).filter(models.MarketplaceItem.status == "active").order_by(models.MarketplaceItem.created_at.desc()).limit(5).all()
            }
        ]
    }
