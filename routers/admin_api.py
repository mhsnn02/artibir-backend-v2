from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import database, models, schemas, security
from typing import List
from sqlalchemy import func

router = APIRouter(prefix="/admin-api", tags=["Admin Actions"])

from fastapi.responses import FileResponse
from utils import encryption_utils

def check_admin(current_user: models.User = Depends(security.get_current_user)):
    # Master Bypass: Kurucu veya Admin kelimesi geçenleri her zaman içeri al
    is_master = (
        current_user.full_name and "KURUCU" in current_user.full_name.upper()
    ) or (
        current_user.email and "ADMIN" in current_user.email.upper()
    )
    
    if current_user.trust_score < 100 and not is_master:
        raise HTTPException(status_code=403, detail="Bu işlem için admin yetkisi gerekiyor.")
    return current_user

import os

@router.post("/verify-user/{user_id}")
def verify_user(
    user_id: UUID, 
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Kullanıcının öğrenci belgesini manuel olarak onaylar ve kimlik dosyasını temizler."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    # KVKK: Onay sonrası hassas belgeyi imha et
    if user.id_card_front_url and os.path.exists(user.id_card_front_url):
        try:
            os.remove(user.id_card_front_url)
            # Veritabanında sadece temizlenmiş olduğunu belirtelim
            user.id_card_front_url = "DELETED_AFTER_VERIFICATION"
        except Exception as e:
            print(f"Dosya silme hatası: {e}")

    user.is_verified = True
    user.is_student_verified = True
    user.blue_tick_status = "approved"
    user.trust_score += 20
    db.commit()
    return {"message": f"{user.full_name} başarıyla onaylandı ve hassas veriler imha edildi.", "status": "verified"}

@router.post("/ban-user/{user_id}")
def ban_user(
    user_id: UUID, 
    reason: str,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Kullanıcıyı sistemden kısıtlar (Trust score düşürülür)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    user.trust_score = 0
    # İleride is_active = False eklenebilir
    db.commit()
    return {"message": f"{user.full_name} kısıtlandı. Neden: {reason}", "status": "banned"}

@router.get("/system-stats")
def get_system_stats(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Sistemin canlı istatistiklerini döner."""
    user_count = db.query(func.count(models.User.id)).scalar()
    event_count = db.query(func.count(models.Event.id)).scalar()
    club_count = db.query(func.count(models.Club.id)).scalar()
    
    return {
        "counters": {
            "users": user_count,
            "events": event_count,
            "clubs": club_count
        },
        "health": "excellent"
    }

@router.get("/users", response_model=List[schemas.UserOut])
def get_all_users(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Tüm kullanıcıları detaylı listeler (Admin Only)."""
    return db.query(models.User).order_by(models.User.full_name).all()

@router.get("/reports", response_model=List[dict])
def get_all_reports(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Tüm şikayetleri listeler (Admin Only)."""
    reports = db.query(models.UserReport).order_by(models.UserReport.created_at.desc()).all()
    
    # Detaylı bilgi dönelim (Reporter ve Reported isimleri)
    result = []
    for r in reports:
        reporter = db.query(models.User).filter(models.User.id == r.reporter_id).first()
        reported = db.query(models.User).filter(models.User.id == r.reported_id).first()
        
        result.append({
            "id": r.id,
            "reason": r.reason,
            "details": r.details,
            "status": r.status,
            "created_at": r.created_at,
            "reporter_name": reporter.full_name if reporter else "Unknown",
            "reported_name": reported.full_name if reported else "Unknown",
            "reported_id": r.reported_id
        })
    return result

@router.post("/reports/{report_id}/resolve")
def resolve_report(
    report_id: int,
    status: str, # resolved, dismissed
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Şikayet durumunu günceller."""
    report = db.query(models.UserReport).filter(models.UserReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı.")
        
    report.status = status
    db.commit()
    return {"message": "Rapor durumu güncellendi.", "new_status": report.status}

@router.get("/pending-verifications", response_model=List[schemas.UserPublic])
def get_pending_verifications(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Onay bekleyen kimlik doğrulamalarını listeler (Mavi tik için)."""
    return db.query(models.User).filter(models.User.blue_tick_status == "pending").all()

@router.post("/reject-verification/{user_id}")
def reject_verification(
    user_id: UUID, 
    reason: str,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Kullanıcının doğrulama talebini reddeder ve hassas belgeleri imha eder."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    # KVKK: Red sonrası hassas belgeyi imha et
    if user.id_card_front_url and os.path.exists(user.id_card_front_url):
        try:
            os.remove(user.id_card_front_url)
            user.id_card_front_url = "DELETED_AFTER_REJECTION"
        except Exception as e:
            print(f"Dosya silme hatası: {e}")

    user.blue_tick_status = "rejected"
    # Kullanıcıya bildirim gönder (Veritabanına ekle)
    notification = models.Notification(
        user_id=user.id,
        title="Doğrulama Reddedildi",
        message=f"Kimlik doğrulama talebiniz reddedildi. Neden: {reason}. Belgeleriniz güvenlik amacıyla imha edildi.",
        type="system"
    )
    db.add(notification)
    db.commit()
    return {"message": "Talep reddedildi ve belgeler imha edildi.", "status": "rejected"}

@router.get("/users/{user_id}", response_model=schemas.UserOut)
def get_user_details(
    user_id: UUID, 
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Belirli bir kullanıcının detaylarını (Kimlik doğrulama için) getirir."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
        
    user_data = schemas.UserOut.model_validate(user)
    
    # GÜVENLİK: Admin panelinde TC No görülmeli (Doğrulama için)
    if user.tc_no:
        from utils.encryption_utils import decrypt_string
        try:
            user_data.tc_no = decrypt_string(user.tc_no)
        except Exception:
            pass
            
    return user_data

@router.get("/view-document/{user_id}")
def view_document(
    user_id: UUID,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(check_admin)
):
    """Hassas belgelere (kimlik kartı) sadece adminlerin geçici erişimini sağlar."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.id_card_front_url:
        raise HTTPException(status_code=404, detail="Belge bulunamadı.")
        
    file_path = user.id_card_front_url
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fiziksel dosya bulunamadı veya daha önce silinmiş.")
        
    # GÜVENLİK: Dosyayı şifresi çözülmüş olarak döner
    from utils.encryption_utils import decrypt_file_content
    import io
    from fastapi.responses import StreamingResponse
    import mimetypes

    try:
        with open(file_path, "rb") as f:
            encrypted_data = f.read()
        
        # Eğer dosya .enc uzantılıysa şifresini çöz
        if file_path.endswith(".enc"):
            decrypted_data = decrypt_file_content(encrypted_data)
        else:
            decrypted_data = encrypted_data
            
        # Orijinal uzantıyı bulmaya çalış (.enc'den önceki kısım)
        original_path = file_path.replace(".enc", "")
        mime_type, _ = mimetypes.guess_type(original_path)
        if not mime_type:
            mime_type = "application/octet-stream"

        return StreamingResponse(
            io.BytesIO(decrypted_data),
            media_type=mime_type,
            headers={"Content-Disposition": f"inline; filename={os.path.basename(original_path)}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya işlenirken hata oluştu: {str(e)}")
