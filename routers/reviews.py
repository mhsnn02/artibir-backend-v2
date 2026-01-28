from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import sys
import os

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security

router = APIRouter(tags=["Reviews"])
get_db = database.get_db

@router.post("/reviews", response_model=schemas.UserReviewOut)
def create_review(
    review: schemas.UserReviewCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bir kullanıcı için yorum ve puan (1-5) bırakır.
    """
    if review.reviewed_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinize yorum yapamazsınız.")

    db_review = models.UserReview(
        reviewer_id=current_user.id,
        reviewed_id=review.reviewed_id,
        event_id=review.event_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    
    # Hedef kullanıcının Trust Score'unu güncelle (Basit bir ağırlıkla)
    target_user = db.query(models.User).filter(models.User.id == review.reviewed_id).first()
    if target_user:
        # Puan 5 ise +2, puan 1 ise -5 gibi bir mantık
        score_change = (review.rating - 3) * 2
        target_user.trust_score = max(0, min(100, target_user.trust_score + score_change))

    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/reviews/user/{user_id}", response_model=List[schemas.UserReviewOut])
def get_user_reviews(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Belirli bir kullanıcıya yapılmış tüm yorumları getirir.
    """
    return db.query(models.UserReview).filter(models.UserReview.reviewed_id == user_id).order_by(models.UserReview.created_at.desc()).all()

@router.get("/reviews/average/{user_id}")
def get_average_rating(
    user_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Kullanıcının ortalama puanını (Rating) döner.
    """
    reviews = db.query(models.UserReview).filter(models.UserReview.reviewed_id == user_id).all()
    if not reviews:
        return {"average_rating": 0, "count": 0}
    
    avg = sum([r.rating for r in reviews]) / len(reviews)
    return {"average_rating": round(avg, 1), "count": len(reviews)}
