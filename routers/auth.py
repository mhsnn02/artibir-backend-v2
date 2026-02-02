from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import datetime
# Üst klasörden modülleri çağırıyoruz
import sys
import os

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, security
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["Authentication"])
get_db = database.get_db
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute") # Dakikada maksimum 5 giriş denemesi
def login(request: Request, user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Kullanıcı Girişi (Login)
    """
    # GÜVENLİK BOTU: Girdi Süzgeci
    from utils.security_bot import validate_input_raise
    validate_input_raise(user_data.email, "E-posta")

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

# --- UNUTULAN ŞİFRE İŞLEMLERİ ---
from pydantic import EmailStr, BaseModel
from services import notification
import random

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Şifre sıfırlama kodu gönderir."""
    user = crud.get_user_by_email(db, email=request.email)
    if not user:
        # Güvenlik nedeniyle "Böyle bir e-posta yok" yerine "Kod gönderildi" demek daha iyidir ama 
        # geliştirme için 404 mantıklı olabilir.
        raise HTTPException(status_code=404, detail="Bu e-posta ile kayıtlı bir kullanıcı bulunamadı.")
    
    otp = str(random.randint(100000, 999999))
    user.password_reset_code = otp
    db.commit()
    
    # E-posta Gönder
    subject = "ArtıBir Şifre Sıfırlama Talebi 🔑"
    body = f"Şifrenizi sıfırlamak için kodunuz: {otp}"
    html_body = f"""
    <div style='font-family:sans-serif; border:1px solid #ddd; padding:20px; border-radius:8px;'>
        <h3 style='color:#E67E22;'>Şifre Sıfırlama İsteği</h3>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Kodunuz:</p>
        <div style='background:#eee; padding:10px; font-size:24px; text-align:center;'><b>{otp}</b></div>
        <p style='font-size:12px; color:#777;'>Eğer bu işlemi siz yapmadıysanız şifrenizi değiştirmenizi öneririz.</p>
    </div>
    """
    notification.send_email(user.email, subject, body, html_body=html_body)
    
    return {"status": "success", "message": "Şifre sıfırlama kodu gönderildi."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Yeni şifreyi kaydeder."""
    user = crud.get_user_by_email(db, email=request.email)
    if not user or user.password_reset_code != request.code:
        raise HTTPException(status_code=400, detail="Geçersiz e-posta veya kod!")
    
    # Şifreyi güncelle ve kodu sil
    user.password = security.get_password_hash(request.new_password)
    user.password_reset_code = None
    db.commit()
    
    return {"status": "success", "message": "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz."}
