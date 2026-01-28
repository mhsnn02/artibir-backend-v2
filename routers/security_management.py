import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, schemas, security
from typing import List
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(
    prefix="/security",
    tags=["Security & Authentication"]
)

@router.post("/change-password")
def change_password(
    data: schemas.PasswordChange,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının şifresini güvenli bir şekilde değiştirir."""
    if not pwd_context.verify(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı.")
    
    current_user.password = pwd_context.hash(data.new_password)
    db.commit()
    return {"message": "Şifre başarıyla güncellendi."}

@router.get("/devices", response_model=List[schemas.LoginDeviceOut])
def get_login_devices(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının hesabına giriş yapmış olan cihazları listeler."""
    return db.query(models.LoginDevice).filter(models.LoginDevice.user_id == current_user.id).all()

@router.delete("/devices/{device_id}")
def logout_device(
    device_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Belirli bir cihazın oturumunu sonlandırır (Aktifliğini kaldırır)."""
    device = db.query(models.LoginDevice).filter(
        models.LoginDevice.id == device_id,
        models.LoginDevice.user_id == current_user.id
    ).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı.")
    
    db.delete(device)
    db.commit()
    return {"message": "Cihaz oturumu sonlandırıldı."}
