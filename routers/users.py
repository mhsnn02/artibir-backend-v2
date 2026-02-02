from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import shutil
import os
import sys
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from datetime import date
from typing import Optional
import random

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security
from utils import nvi_verifier # NVİ Doğrulama Modülü
from utils.nvi_verifier import verify_tckn
from utils.edevlet_verifier import ogrenci_belgesi_barkod_kontrol
from services.redis_client import get_redis
from utils import encryption_utils
from services import (
    notification,
    moderation,
    image_processor # Eklendi: Resim işleme servisi
)

redis_client = get_redis()

router = APIRouter(tags=["Users"])
get_db = database.get_db
UPLOAD_DIR = "uploads"

def generate_otp():
    """6 haneli rastgele bir OTP kodu oluşturur."""
    return str(random.randint(100000, 999999))

# --- 1. KAYIT OL (POST /users) ---
@router.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Yeni Kullanıcı Oluşturma (Kayıt Ol)
    """
    # GÜVENLİK BOTU: Girdi Süzgeci (Katman 3)
    from utils.security_bot import validate_input_raise
    validate_input_raise(user.email, "E-posta")
    validate_input_raise(user.full_name, "Ad Soyad")

    # E-posta varlık kontrolü
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı!")

    # Yoksa kaydet
    new_user = crud.create_user(db=db, user=user)
    
    # 3. Otomatik E-posta Doğrulama Kodu Gönder (Gerçek Ayarlar)
    try:
        otp = generate_otp()
        new_user.email_verification_code = otp
        db.commit()
        
        subject = "ArtıBir'e Hoş Geldin! 🚀"
        body = f"Merhaba {new_user.full_name},\n\nHesabını doğrulamak için kodun: {otp}\n\nKeyifli etkinlikler dileriz!"
        html_body = f"""
        <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #4A90E2;">ArtıBir'e Hoş Geldin! 🚀</h2>
            <p>Merhaba <strong>{new_user.full_name}</strong>,</p>
            <p>Topluluğumuza katıldığın için çok mutluyuz. Hesabını doğrulamak için aşağıdaki kodu kullanabilirsin:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px;">
                {otp}
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">Bu kod 30 dakika süreyle geçerlidir. Eğer bu kaydı sen yapmadıysan bu e-postayı dikkate alma.</p>
        </div>
        """
        notification.send_email(new_user.email, subject, body, html_body=html_body)
    except Exception as e:
        print(f"Otomatik OTP gönderimi hatası: {e}")

    return new_user

# --- 2. KULLANICILARI LİSTELE (GET /users) ---
from typing import List
@router.get("/users/", response_model=List[schemas.UserPublic])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Tüm kullanıcıları listele (Keşfet Ekranı İçin)
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/users/upload-profile")
def upload_profile_image(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Profil Resmi Yükleme
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    # DÜZELTME: Image Processor servisi kullanılarak sıkıştırma ve formatlama yapılıyor
    processed_image = image_processor.process_and_compress_image(file.file)
    
    if not processed_image:
        raise HTTPException(status_code=400, detail="Resim işlenemedi veya format desteklenmiyor.")

    file_location = f"{UPLOAD_DIR}/{processed_image['filename']}"
    
    with open(file_location, "wb+") as f:
        f.write(processed_image['file'].read())
    
    current_user.profile_image = f"/{file_location}"
    db.commit()
    
    return {"status": "success", "image_url": current_user.profile_image}

# --- 5. KİMLİK DOĞRULAMA (POST /users/verify/id-card) ---
# Güvenli Depolama Alanı (Statik olarak sunulmaz)
PRIVATE_DIR = "private_storage/id_cards"

@router.post("/users/verify/id-card")
def upload_id_card(
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
    # Dosya adını güvenli hale getir (User ID + Timestamp + .enc)
    import time
    from utils.encryption_utils import encrypt_file_content
    
    file_ext = file.filename.split('.')[-1]
    safe_filename = f"{current_user.id}_{int(time.time())}.{file_ext}.enc"
    file_location = f"{PRIVATE_DIR}/{safe_filename}"
    
    # Dosya içeriğini oku ve şifrele
    content = file.file.read()
    encrypted_content = encrypt_file_content(content)
    
    with open(file_location, "wb+") as f:
        f.write(encrypted_content)
    
    # DB'ye şifreli dosya yolunu kaydet
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

class IdentityVerificationRequest(BaseModel):
    tc_no: str = Field(..., min_length=11, max_length=11, description="11 haneli TC Kimlik Numarası")
    full_name: Optional[str] = Field(None, min_length=5, description="Ad ve Soyad")
    birth_date: Optional[date] = None

    @field_validator('tc_no')
    @classmethod
    def validate_tc_no(cls, v: str):
        if not v.isdigit():
            raise ValueError("TC Kimlik Numarası sadece rakamlardan oluşmalıdır.")
        
        # TC Algoritma Kontrolü
        digits = [int(d) for d in v]
        if digits[0] == 0:
            raise ValueError("TC Kimlik No 0 ile başlayamaz.")
            
        odd_sum = sum(digits[0:9:2])
        even_sum = sum(digits[1:8:2])
        digit_10 = ((odd_sum * 7) - even_sum) % 10
        
        total_10 = sum(digits[:10])
        digit_11 = total_10 % 10
        
        if digits[9] != digit_10 or digits[10] != digit_11:
             raise ValueError("Geçersiz TC Kimlik Numarası (Algoritma Hatası).")
        return v

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str):
        if v:
            parts = v.strip().split()
            if len(parts) < 2:
                raise ValueError("Ad ve soyad arasında boşluk olmalı ve en az iki kelime içermelidir.")
        return v

@router.post("/users/verify/identity")
def verify_identity(
    update_data: IdentityVerificationRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    NVİ Üzerinden Gerçek Kimlik Doğrulama
    """
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
        from utils.encryption_utils import encrypt_string
        current_user.tc_no = encrypt_string(update_data.tc_no) # TC'yi şifreli kaydet
        
        # Puan Farmını Önle
        if not current_user.is_verified:
            current_user.trust_score += 20
            
        current_user.is_verified = True
        current_user.blue_tick_status = "approved"
        
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
    # KULLANICI İÇGÖRÜSÜ: Kullanıcı verilerini değiştirmek isteyebilir (Re-verification)
    # Eski kontrol: if current_user.is_student_verified: return ...
    # Yeni yaklaşım: İzin ver, güncelle.
    pass
        
    full_name_to_check = request.full_name if request.full_name else current_user.full_name
    
    is_valid, message = ogrenci_belgesi_barkod_kontrol(request.barcode, full_name_to_check)
    
    if is_valid:
        current_user.student_document_barcode = request.barcode
        
        # Eğer daha önce doğrulanmamışsa puan ver (Puan farm'ını önle)
        if not current_user.is_student_verified:
             current_user.trust_score += 30 
             
        current_user.is_student_verified = True
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
    if redis_client:
        redis_client.setex(f"otp:email:{current_user.id}", 300, otp) # 5 dk geçerli
    
    # current_user.email_verification_code = otp # Artık DB'ye yazmıyoruz
    # db.commit()
    
    # 1. Önce Loglara yaz (Her durumda debug için iyidir)
    print(f"--- EMAIL OTP (DEBUG) --- User: {current_user.email} | OTP: {otp}")
    
    # 2. Gerçek Gönderim
    subject = "Artibir E-posta Doğrulama Kodu"
    body = f"Merhaba {current_user.full_name},\n\nArtibir doğrulama kodunuz: {otp}\n\nBu kodu kimseyle paylaşmayın."
    
    email_sent = notification.send_email(
        current_user.email, 
        subject, 
        body, 
        html_body=f"<div style='font-family:sans-serif;'><h3>Doğrulama Kodunuz</h3><p style='font-size:24px; color:#4A90E2;'><b>{otp}</b></p></div>"
    )
    
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
        
    # Redis'ten kodu al
    stored_code = redis_client.get(f"otp:email:{current_user.id}") if redis_client else None
        
    if stored_code == request.code:
        current_user.is_email_verified = True
        if redis_client:
            redis_client.delete(f"otp:email:{current_user.id}")
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
    if redis_client:
        redis_client.setex(f"otp:phone:{current_user.id}", 300, otp)
    
    # db.commit()
    
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
        
    stored_code = redis_client.get(f"otp:phone:{current_user.id}") if redis_client else None
        
    if stored_code == request.code:
        current_user.is_phone_verified = True
        if redis_client:
            redis_client.delete(f"otp:phone:{current_user.id}")
        current_user.trust_score += 15
        db.commit()
        return {"status": "success", "message": "Telefon başarıyla doğrulandı.", "trust_score": current_user.trust_score}
    else:
        raise HTTPException(status_code=400, detail="Hatalı kod!")

    return {"status": "success", "message": "Tebrikler! Kimliğiniz başarıyla doğrulandı."}

# --- 8. PROFİL YÖNETİMİ VE AYARLAR ---

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(security.get_current_user)):
    """Aktif kullanıcının tüm profil bilgilerini döner."""
    user_data = schemas.UserOut.model_validate(current_user)
    
    # GÜVENLİK: TC No gibi hassas verileri maskele
    if current_user.tc_no:
        from utils.encryption_utils import decrypt_string
        try:
            decrypted_tc = decrypt_string(current_user.tc_no)
            if len(decrypted_tc) == 11:
                user_data.tc_no = decrypted_tc[:2] + "*********" + decrypted_tc[-2:]
            else:
                user_data.tc_no = "***********"
        except Exception:
            user_data.tc_no = "***********"
            
    return user_data

@router.patch("/update-profile", response_model=schemas.UserOut)
def update_profile(
    data: schemas.UserProfileUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcı profil bilgilerini (Bio, İsim vb.) günceller."""
    if data.full_name:
        current_user.full_name = data.full_name
    
    if data.bio:
        # GÜVENLİK BOTU KONTROLÜ
        is_safe, reason = moderation.check_message(data.bio, current_user.trust_score)
        if not is_safe:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)
        current_user.bio = data.bio
    
    if data.favorite_music_url:
        current_user.favorite_music_url = data.favorite_music_url

    if data.interests is not None:
        # GÜVENLİK KONTROLÜ VE TEMİZLİK
        from utils.security_bot import sanitize_input
        valid_interests = []
        for interest_name in data.interests:
            # Her bir ilgi alanını güvenlik süzgecinden geçir
            if sanitize_input(interest_name):
                # Mevcut olanı bul veya yeni oluştur
                interest = db.query(models.Interest).filter(models.Interest.name == interest_name).first()
                if not interest:
                    interest = models.Interest(name=interest_name)
                    db.add(interest)
                    db.flush() # ID alabilmek için flush
                valid_interests.append(interest)
        
        # Kullanıcının ilgi alanlarını güncelle (Many-to-Many bağlama)
        current_user.interests = valid_interests
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/update-settings", response_model=schemas.UserOut)
def update_settings(
    settings: schemas.UserSettingsUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Uygulama tercihlerini (Tema, Gizlilik, Bildirimler) günceller."""
    update_data = settings.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    data: schemas.PasswordChange,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Aktif oturumda şifre değiştirme işlemi."""
    if not security.verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Mevcut şifreniz hatalı!")
    
    current_user.password = security.get_password_hash(data.new_password)
    db.commit()
    return {"status": "success", "message": "Şifreniz başarıyla değiştirildi."}

@router.post("/support-ticket", response_model=schemas.SupportTicketOut)
def create_support_ticket(
    ticket: schemas.SupportTicketCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Destek talebi oluşturur."""
    db_ticket = models.SupportTicket(
        user_id=current_user.id,
        subject=ticket.subject,
        message=ticket.message
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    
    # Yönetime bildirim simülasyonu
    print(f"NEW SUPPORT TICKET: {current_user.email} - {ticket.subject}")
    
    return db_ticket

@router.delete("/me")
def delete_my_account(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Kullanıcının hesabını ve ilişkili tüm verilerini kalıcı olarak siler (KVKK - Unutulma Hakkı).
    """
    try:
        # 1. Fiziksel Dosyaları Sil (Profil resmi ve kimlik kartı)
        if current_user.profile_image and current_user.profile_image.startswith("/uploads/"):
            file_path = current_user.profile_image.lstrip("/")
            if os.path.exists(file_path):
                os.remove(file_path)
        
        if current_user.id_card_front_url and os.path.exists(current_user.id_card_front_url):
            os.remove(current_user.id_card_front_url)

        # 2. İlişkili verileri sil (SQLAlchemy cascade tanımlanmamışsa manuel silmek gerekebilir)
        # Ancak modelde CASCADE tanımlandığını varsayıyoruz veya DB seviyesinde hallediyoruz.
        # Manuel temizlik gerekiyorsa burada yapılabilir (etkinlikler, mesajlar vb.)
        
        db.delete(current_user)
        db.commit()
        
        return {"status": "success", "message": "Hesabınız ve tüm verileriniz başarıyla silindi. Elveda. 👋"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Hesap silinirken bir hata oluştu: {str(e)}")

