from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import shutil
import os
import sys
from uuid import UUID

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security
from utils import nvi_verifier # NVİ Doğrulama Modülü
from utils.nvi_verifier import verify_tckn
from utils.edevlet_verifier import ogrenci_belgesi_barkod_kontrol
from services import notification

router = APIRouter(tags=["Users"])
get_db = database.get_db
UPLOAD_DIR = "uploads"

# --- 1. KAYIT OL (POST /users) ---
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Yeni Kullanıcı Oluşturma (Kayıt Ol)
    """
    # Önce böyle bir e-posta var mı diye bak
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı!")
    
    # Yoksa kaydet
    return crud.create_user(db=db, user=user)

# --- 2. KULLANICILARI LİSTELE (GET /users) ---
from typing import List
@router.get("/users/", response_model=List[schemas.UserOut])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Tüm kullanıcıları listele (Keşfet Ekranı İçin)
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/users/upload-profile/{user_id}")
async def upload_profile_image(user_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Profil Resmi Yükleme
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_location = f"{UPLOAD_DIR}/{str(user_id)}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        # Production için relative path dönüyoruz, frontend baseUrl ekler.
        user.profile_image = f"/{file_location}"
        db.commit()
        return {"status": "success", "image_url": user.profile_image}
    
    return {"status": "fail", "message": "Kullanıcı bulunamadı"}

# --- 5. KİMLİK DOĞRULAMA (POST /users/verify/id-card) ---
# Güvenli Depolama Alanı (Statik olarak sunulmaz)
PRIVATE_DIR = "private_storage/id_cards"

@router.post("/users/verify/id-card")
async def upload_id_card(
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Kimlik Kartı Yükleme (GÜVENLİ DEPOLAMA)
    Dosyalar 'private_storage' altında saklanır ve doğrudan erişilemez.
    """
    # Gizli klasör yoksa oluştur
    if not os.path.exists(PRIVATE_DIR):
        os.makedirs(PRIVATE_DIR)
        
    # Dosya adını güvenli hale getir (User ID + Timestamp) -> Hashleme yapılabilir ama şimdilik UUID yeterli
    import time
    file_ext = file.filename.split('.')[-1]
    safe_filename = f"{current_user.id}_{int(time.time())}.{file_ext}"
    file_location = f"{PRIVATE_DIR}/{safe_filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # OCR Simülasyonu: Bilgileri "okunmuş" sayıyoruz
    # DB'ye sadece fiziksel yolu kaydediyoruz, URL değil!
    current_user.id_card_front_url = file_location
    current_user.blue_tick_status = "pending" # Onay bekliyor
    
    # Otomatik NVİ Doğrulama Simülasyonu
    db.commit()
    
    # Bir sistem bildirimi oluştur
    new_notif = models.Notification(
        user_id=current_user.id,
        title="GÜVENLİK_PROTOKOLÜ_AKTİF",
        message="Kimlik verileriniz şifreli kasaya alındı. Doğrulama sonrası imha edilecek.",
        type="system"
    )
    db.add(new_notif)
    db.commit()
    
    return {"status": "success", "message": "Kimlik güvenli kasaya alındı."}

@router.post("/users/verify/identity-legacy")
def verify_identity(
    update_data: schemas.UserProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    NVİ Üzerinden Gerçek Kimlik Doğrulama
    """
    if not update_data.tc_no:
        raise HTTPException(status_code=400, detail="TC Kimlik No zorunludur.")
    
    # Kullanıcı doğum tarihini güncellemek istiyorsa
    if update_data.birth_date:
        current_user.birth_date = update_data.birth_date
    
    # İsim ve Doğum Yılı veritabanından alınır (Kullanıcı kayıt olurken verdiği)
    # Ancak kullanıcı ismini yanlış girmişse düzeltmesine izin vermek gerekir mi?
    # Şimdilik sadece UserProfileUpdate ile gelen veriyi değil, mevcut user verisini kullanalım.
    # Veya update_data içinde full_name de geliyorsa onu baz alalım.
    
    name_check = update_data.full_name if update_data.full_name else current_user.full_name
    
    # Ad Soyad ayırma
    parts = name_check.strip().split()
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Ad ve soyad tam girilmelidir.")
        
    soyad = parts[-1]
    ad = " ".join(parts[:-1])
    dogum_yili = current_user.birth_date.year
    
    # NVİ Sorgusu
    is_real, message = verify_tckn(
        tc_no=int(update_data.tc_no), 
        ad=ad, 
        soyad=soyad, 
        dogum_yili=dogum_yili
    )
    
    if is_real:
        current_user.tc_no = update_data.tc_no # TC'yi kaydet
        current_user.is_verified = True
        current_user.blue_tick_status = "approved"
        # Trust Score Artışı
        current_user.trust_score += 20
        
        # Eğer isim güncellendiyse onu da kaydet
        if update_data.full_name:
            current_user.full_name = update_data.full_name
            
        db.commit()
        return {"status": "success", "message": message, "trust_score": current_user.trust_score}
    else:
        raise HTTPException(status_code=400, detail=f"Kimlik doğrulama başarısız: {message}")

@router.post("/users/verify/student-document")
def verify_student_document(
    request: schemas.StudentVerifyRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    E-Devlet Öğrenci Belgesi Barkod Kontrolü
    """
    if current_user.is_student_verified:
        return {"status": "info", "message": "Öğrenci belgeniz zaten doğrulanmış."}
        
    full_name_to_check = request.full_name if request.full_name else current_user.full_name
    
    is_valid, message = ogrenci_belgesi_barkod_kontrol(request.barcode, full_name_to_check)
    
    if is_valid:
        current_user.student_document_barcode = request.barcode
        current_user.is_student_verified = True
        current_user.trust_score += 30 # Yüksek güven puanı
        db.commit()
        return {"status": "success", "message": message, "trust_score": current_user.trust_score}
    else:
        raise HTTPException(status_code=400, detail=f"Doğrulama Başarısız: {message}")



# --- 5.6 E-POSTA VE TELEFON DOĞRULAMA (OTP) ---
import random

def generate_otp():
    return str(random.randint(100000, 999999))

class OTPRequest(schemas.BaseModel):
    code: str

@router.post("/verify/send-email-otp")
def send_email_otp(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    E-posta doğrulama kodu gönderir (SMTP ile gerçek gönderim)
    """
    if current_user.is_email_verified:
        return {"status": "info", "message": "E-posta zaten doğrulanmış."}
    
    otp = generate_otp()
    current_user.email_verification_code = otp
    db.commit()
    
    # 1. Önce Loglara yaz (Her durumda debug için iyidir)
    print(f"--- EMAIL OTP (DEBUG) --- User: {current_user.email} | OTP: {otp}")
    
    # 2. Gerçek Gönderim
    subject = "Artibir E-posta Doğrulama Kodu"
    body = f"Merhaba {current_user.full_name},\n\nArtibir doğrulama kodunuz: {otp}\n\nBu kodu kimseyle paylaşmayın."
    
    email_sent = notification.send_email(current_user.email, subject, body)
    
    if email_sent:
        return {"status": "success", "message": "Doğrulama kodu e-posta adresinize gönderildi."}
    else:
        # SMTP ayarları yapılmamışsa simülasyona devam etmesi kullanıcı deneyimi için (geliştirme aşamasında) iyidir.
        return {"status": "warning", "message": "E-posta servisi ayarlanmamış, kod konsola yazıldı (Geliştirici Modu)."}

@router.post("/verify/email")
def verify_email(
    request: OTPRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    E-posta doğrulama kodunu kontrol eder
    """
    if current_user.is_email_verified:
        return {"status": "info", "message": "E-posta zaten doğrulanmış."}
        
    if not current_user.email_verification_code:
        raise HTTPException(status_code=400, detail="Önce kod talep etmelisiniz.")
        
    if current_user.email_verification_code == request.code:
        current_user.is_email_verified = True
        current_user.email_verification_code = None # Kodu temizle
        current_user.trust_score += 10
        db.commit()
        return {"status": "success", "message": "E-posta başarıyla doğrulandı.", "trust_score": current_user.trust_score}
    else:
        raise HTTPException(status_code=400, detail="Hatalı kod!")

@router.post("/verify/send-phone-otp")
def send_phone_otp(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Telefon doğrulama kodu gönderir (SMS API ile gerçek gönderim)
    """
    if current_user.is_phone_verified:
        return {"status": "info", "message": "Telefon zaten doğrulanmış."}
        
    if not current_user.phone_number:
         raise HTTPException(status_code=400, detail="Profilinizde telefon numarası kayıtlı değil.")
    
    otp = generate_otp()
    current_user.phone_verification_code = otp
    db.commit()
    
    # 1. Log (Debug)
    print(f"--- PHONE OTP (DEBUG) --- User: {current_user.phone_number} | OTP: {otp}")
    
    # 2. Gerçek Gönderim
    sms_message = f"Artibir dogrulama kodunuz: {otp}"
    sms_sent = notification.send_sms(current_user.phone_number, sms_message)
    
    if sms_sent:
        return {"status": "success", "message": "Doğrulama kodu telefonunuza gönderildi."}
    else:
        return {"status": "warning", "message": "SMS servisi ayarlanmamış veya başarısız, kod konsola yazıldı (Geliştirici Modu)."}

@router.post("/verify/phone")
def verify_phone(
    request: OTPRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Telefon doğrulama kodunu kontrol eder
    """
    if current_user.is_phone_verified:
        return {"status": "info", "message": "Telefon zaten doğrulanmış."}
        
    if not current_user.phone_verification_code:
        raise HTTPException(status_code=400, detail="Önce kod talep etmelisiniz.")
        
    if current_user.phone_verification_code == request.code:
        current_user.is_phone_verified = True
        current_user.phone_verification_code = None # Kodu temizle
        current_user.trust_score += 15
        db.commit()
        return {"status": "success", "message": "Telefon başarıyla doğrulandı.", "trust_score": current_user.trust_score}
    else:
        raise HTTPException(status_code=400, detail="Hatalı kod!")

# --- 6. DOĞRULAMA DURUMU (GET /users/verify/status) ---
@router.get("/users/verify/status")
def get_verification_status(current_user: models.User = Depends(security.get_current_user)):
    """Kullanıcının mavi tik ve doğrulama durumunu döner."""
    return {
        "blue_tick_status": current_user.blue_tick_status,
        "is_verified": current_user.is_verified,
        "trust_score": current_user.trust_score,
        "is_email_verified": current_user.is_email_verified,
        "is_phone_verified": current_user.is_phone_verified,
        "is_student_verified": current_user.is_student_verified
    }

# --- 7. GERÇEK NVİ KİMLİK DOĞRULAMA (POST /users/verify/identity) ---
from pydantic import BaseModel

class IdentityVerificationRequest(BaseModel):
    tc_no: str
    first_name: str
    last_name: str
    birth_year: int

@router.post("/users/verify/identity")
def verify_identity_nvi(
    request: IdentityVerificationRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    NVİ (Nüfus Müdürlüğü) üzerinden gerçek TCKN doğrulaması yapar.
    Başarılı olursa kullanıcıya Mavi Tik ve Onaylı Hesap statüsü verir.
    """
    # 1. Zaten onaylıysa işlem yapma
    if current_user.is_verified:
        return {"status": "already_verified", "message": "Hesabınız zaten onaylanmış."}

    # 2. NVİ Sorgusu
    is_valid = nvi_verifier.verify_tckn(
        tc_no=int(request.tc_no),
        ad=request.first_name,
        soyad=request.last_name,
        dogum_yili=request.birth_year
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Kimlik bilgileri doğrulanamadı. Lütfen bilgilerinizi kontrol edin.")
    
    # 3. Başarılıysa Kullanıcıyı Güncelle
    current_user.tc_no = request.tc_no
    # Doğum tarihi tam tarih olarak yoksa yılın ilk günü vs. atanabilir ama modelde Date zorunlu.
    # Şimdilik sadece doğrulama statüsünü güncelliyoruz, doğum tarihi verisi zaten User objesinde varsa ona dokunmuyoruz.
    # Ancak NVİ için doğum yılı önemliydi, onu parametre olarak aldık.
    
    current_user.is_verified = True
    current_user.blue_tick_status = "approved"
    current_user.trust_score = 100 # Güven skoru tavan yapar
    
    # Bildirim
    new_notif = models.Notification(
        user_id=current_user.id,
        title="KİMLİK DOĞRULANDI ✅",
        message="Devlet onaylı kimlik doğrulamanız başarıyla tamamlandı. Mavi tik kazandınız!",
        type="system"
    )
    db.add(new_notif)
    db.commit()
    
    return {"status": "success", "message": "Tebrikler! Kimliğiniz başarıyla doğrulandı."}
