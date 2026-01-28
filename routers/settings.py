import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, schemas, security
from typing import List

router = APIRouter(
    prefix="/settings",
    tags=["User Settings & Privacy"]
)

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(
    update_data: schemas.UserProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının profil bilgilerini (isim, biyo, müzik vb.) günceller."""
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/preferences", response_model=schemas.UserOut)
def update_preferences(
    settings_data: schemas.UserSettingsUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Gizlilik (Hayalet Mod) ve Uygulama (Tema, Dil) tercihlerini günceller."""
    for key, value in settings_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_full(
    current_user: models.User = Depends(security.get_current_user)
):
    """Mevcut kullanıcının tüm ayar ve profil verilerini getirir."""
    return current_user
