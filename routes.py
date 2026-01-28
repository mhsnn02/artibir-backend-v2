from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import datetime

# Kendi modüllerimizi çağırıyoruz
import database, schemas, crud, security, models

# Rota oluşturucu
router = APIRouter()

# Veritabanı bağlantısını getiren yardımcı
get_db = database.get_db
UPLOAD_DIR = "uploads"

# --- 1. KAYIT OL (POST /users) ---
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Yeni Kullanıcı Oluşturma (Kayıt Ol)
    
    Bu endpoint, sisteme yeni bir kullanıcı kaydeder.
    
    Parametreler:
    - user (schemas.UserCreate): Kullanıcı kayıt bilgileri (email, password, full_name, phone_number).
    
    Dönüş Değeri:
    - schemas.UserOut: Oluşturulan kullanıcının bilgileri (id, email, full_name, vb. - şifre hariç).
    
    Hatalar:
    - 400 Bad Request: Eğer e-posta adresi sistemde zaten kayıtlıysa döner.
    """
    # Önce böyle bir e-posta var mı diye bak
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı!")
    
    # Yoksa kaydet
    return crud.create_user(db=db, user=user)

# --- 2. GİRİŞ YAP (POST /login) ---
@router.post("/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Kullanıcı Girişi (Login)
    
    Kullanıcının e-posta ve şifresi ile sisteme giriş yapmasını sağlar ve bir JWT token üretir.
    
    Parametreler:
    - user_data (schemas.UserLogin): Giriş bilgileri (email, password).
    
    Dönüş Değeri:
    - JSON: Erişim token'ı (access_token), token türü ve kullanıcı bilgilerini içeren bir obje.
    
    Hatalar:
    - 400 Bad Request: E-posta veya şifre hatalıysa döner.
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
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "profile_image": user.profile_image,
        "phone_number": user.phone_number
    }

# --- 3. ETKİNLİKLERİ GETİR (GET /events) ---
@router.get("/events", response_model=List[schemas.EventOut])
def read_events(db: Session = Depends(get_db)):
    """
    Etkinlikleri Listele
    
    Sistemdeki tüm etkinlikleri listeler.
    
    Dönüş Değeri:
    - List[schemas.EventOut]: Etkinlik objelerinden oluşan bir liste.
    """
    return crud.get_events(db)

# --- 4. PROFİL RESMİ YÜKLE (POST /upload-profile) ---
@router.post("/upload-profile/{user_id}")
async def upload_profile_image(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Profil Resmi Yükleme
    
    Belirtilen kullanıcının profil resmini yükler ve veritabanını günceller.
    
    Parametreler:
    - user_id (int): Resmi yüklenecek kullanıcının ID'si.
    - file (UploadFile): Yüklenecek resim dosyası.
    
    Dönüş Değeri:
    - JSON: İşlem durumu ve yüklenen resmin URL'i.
    
    Hatalar:
    - Sadece başarılı/başarısız durumu JSON olarak döner.
    """
    # Klasör yoksa oluştur
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    # Dosyayı kaydet
    file_location = f"{UPLOAD_DIR}/{user_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # Veritabanını güncelle
    # (Burada basit bir SQL update işlemi yapıyoruz)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # Resmin tam adresi
        # Not: Production ortamında burası domain olmalı
        full_url = f"http://127.0.0.1:8000/{file_location}"
        user.profile_image = full_url
        db.commit()
        return {"status": "success", "image_url": full_url}
    
    return {"status": "fail", "message": "Kullanıcı bulunamadı"}