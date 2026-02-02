from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, schemas, crud, models, security

router = APIRouter(tags=["Gamification"])
get_db = database.get_db

@router.get("/gamification/leaderboard", response_model=List[schemas.UserPublic])
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Kampüs genelindeki liderlik tablosunu getirir.
    """
    return crud.get_leaderboard(db, limit=limit)
