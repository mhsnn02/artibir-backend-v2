from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime
# Üst klasörden modülleri çağırıyoruz
import sys
import os

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, security

router = APIRouter(tags=["Authentication"])
get_db = database.get_db

@router.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Kullanıcı Girişi (Login)
    """
    # Kullanıcıyı bul
    user = crud.get_user_by_email(db, email=user_data.email)
    
    # Kullanıcı yoksa veya şifre yanlışsa hata ver
    if not user or not security.verify_password(user_data.password, user.password):
        raise HTTPException(status_code=400, detail="Hatalı e-posta veya şifre!")
    
    # JWT Token oluştur
    access_token_expires = datetime.timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Her şey doğruysa giriş onayı ve token ver
    return {
        "status": "success",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id), # UUID safe conversion
        "full_name": user.full_name,
        "email": user.email,
        "profile_image": user.profile_image,
        "phone_number": user.phone_number
    }
