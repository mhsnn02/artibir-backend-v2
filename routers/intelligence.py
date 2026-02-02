from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, security, models, schemas
from services.matching_engine import MatchingEngine
from services.ai_engine import AIEngine

router = APIRouter(prefix="/intelligence", tags=["AI & Intelligence"])

@router.get("/match-suggestions", response_model=List[dict])
def get_match_suggestions(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcıya ilgi alanları bazında en uyumlu diğer kullanıcıları önerir."""
    # 1. Aynı üniversitedeki diğer kullanıcıları çek (Basit filtre)
    other_users = db.query(models.User).filter(
        models.User.id != current_user.id,
        models.User.university_id == current_user.university_id
    ).all()
    
    suggestions = []
    
    # 2. Mevcut kullanıcının verilerini hazırla
    current_user_data = {
        "university_id": current_user.university_id,
        "interests": [i.name for i in current_user.interests]
    }
    
    # 3. Her bir kullanıcı için skor hesapla
    for user in other_users:
        target_data = {
            "university_id": user.university_id,
            "interests": [i.name for i in user.interests]
        }
        
        result = MatchingEngine.artibir_matcher(current_user_data, target_data)
        
        if result["match"]:
            suggestions.append({
                "user_id": str(user.id),
                "full_name": user.full_name,
                "profile_image": user.profile_image,
                "match_score": result["score"],
                "common_interests": result["common_interests"]
            })
            
    # 4. Skora göre sırala (En yüksek uyum üstte)
    suggestions.sort(key=lambda x: x["match_score"], reverse=True)
    
    return suggestions[:10] # En iyi 10 öneriyi döndür

@router.get("/recommendations", response_model=List[schemas.EventOut])
def get_recommendations(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcıya özel AI tabanlı etkinlik önerileri sunar."""
    recommendations = AIEngine.recommend_events(db, current_user.id)
    return recommendations

@router.post("/moderate")
def moderate_content(
    text: str,
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Gönderilen metnin güvenli olup olmadığını kontrol eder.
    Frontend girişlerinde veya yorumlarda kullanılabilir.
    """
    is_safe = AIEngine.content_moderation(text)
    return {
        "text": text,
        "is_safe": is_safe,
        "action": "approve" if is_safe else "reject"
    }
