import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, security
from uuid import UUID
from datetime import datetime

router = APIRouter(
    prefix="/participants",
    tags=["Event Participation"]
)

@router.post("/join/{event_id}", response_model=dict)
def join_event(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Etkinliğe katılım isteği oluşturur ve varsa kapora ücretini çeker."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")
    
    # Zaten katılmış mı kontrol et
    existing_participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    if existing_participant:
        raise HTTPException(status_code=400, detail="Zaten bu etkinliğe katıldınız.")
    
    # Kapora Kontrolü
    if event.deposit_amount > 0:
        if current_user.wallet_balance < event.deposit_amount:
            raise HTTPException(status_code=400, detail="Yetersiz bakiye. Katılım için kapora ödenmelidir.")
        
        current_user.wallet_balance -= event.deposit_amount
        payment_status = "paid"
    else:
        payment_status = "pending"
    
    # Katılımcı ekle
    participant = models.EventParticipant(
        event_id=event_id,
        user_id=current_user.id,
        status="approved",
        payment_status=payment_status
    )
    
    db.add(participant)
    db.commit()
    
    return {
        "message": "Etkinliğe başarıyla katıldınız.",
        "payment_status": payment_status,
        "remaining_balance": current_user.wallet_balance
    }

@router.post("/scan-qr/{event_id}", response_model=dict)
def scan_qr_code(
    event_id: UUID,
    session_token: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Etkinlik alanındaki QR kodu okutarak katılımı doğrular (Turnike)."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")
    
    if event.session_token != session_token:
        raise HTTPException(status_code=400, detail="Geçersiz QR kod veya oturum anahtarı.")
    
    participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Bu etkinlik için kaydınız bulunamadı.")
    
    if participant.qr_scanned:
        return {"message": "Zaten giriş yaptınız."}
    
    participant.qr_scanned = True
    participant.check_in_time = datetime.utcnow()
    
    # Güven puanını artır (Etkinliğe geldiği için)
    current_user.trust_score += 5
    if current_user.trust_score > 100:
        current_user.trust_score = 100
        
    db.commit()
    
    return {
        "message": "Giriş başarılı! Etkinliğe hoş geldiniz.",
        "trust_score": current_user.trust_score
    }

@router.get("/my-events", response_model=List[schemas.EventOut])
def get_my_events(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının katıldığı veya oluşturduğu etkinlikleri getirir."""
    # Katıldığı etkinliklerin ID'lerini al
    participated_event_ids = db.query(models.EventParticipant.event_id).filter(
        models.EventParticipant.user_id == current_user.id
    ).all()
    event_ids = [eid[0] for eid in participated_event_ids]
    
    # Katıldığı veya sahibi olduğu etkinlikleri getir
    events = db.query(models.Event).filter(
        (models.Event.id.in_(event_ids)) | (models.Event.host_id == current_user.id)
    ).all()
    
    return events

# --- 4. BİLET AL (GET /participants/ticket/{event_id}) ---
@router.get("/ticket/{event_id}", response_model=dict)
def get_event_ticket(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcıya özel, tek kullanımlık bilet token'ı (Access Key) oluşturur."""
    participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Bu etkinlik için biletiniz bulunmuyor.")
    
    # Güvenlik için: Bilet içeriği = event_id + user_id + secret_salt (Simüle)
    # Gerçekte burası imzalı bir JWT veya tek kullanımlık hash olmalı.
    access_key = f"ARTIBIR_KEY_{str(event_id)[:8]}_{str(current_user.id)[:8]}"
    
    return {
        "access_key": access_key,
        "event_title": participant.event.title,
        "user_name": current_user.full_name,
        "status": participant.status
    }

# --- 5. BİLET DOĞRULA (POST /participants/validate-ticket) ---
@router.post("/validate-ticket", response_model=dict)
def validate_participant_ticket(
    event_id: UUID,
    access_key: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Organizatörün (Host), katılımcı biletini tarayıp onaylamasını sağlar."""
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Etkinlik bulunamadı.")
        
    if event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece etkinlik sahibi bilet doğrulayabilir.")
    
    # Access Key'den user_id çıkarımı (Simülasyon gereği basitleştirildi)
    # Normalde access_key çözülüp içindeki user_id kontrol edilmeli.
    user_id_part = access_key.split("_")[-1]
    
    participant = db.query(models.EventParticipant).join(models.User).filter(
        models.EventParticipant.event_id == event_id,
        models.User.id.cast(models.String).like(f"{user_id_part}%")
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Geçersiz bilet veya katılımcı bulunamadı.")
    
    if participant.qr_scanned:
        raise HTTPException(status_code=400, detail="Bu bilet zaten kullanılmış.")
        
    participant.qr_scanned = True
    participant.check_in_time = datetime.utcnow()
    
    # Katılımcının güven puanını artır
    participant.user.trust_score += 5
    if participant.user.trust_score > 100:
        participant.user.trust_score = 100
        
    db.commit()
    
    return {
        "status": "success",
        "message": f"{participant.user.full_name} için giriş onaylandı.",
        "new_trust_score": participant.user.trust_score
    }

# --- 6. ETKİNLİKTEN AYRIL (DELETE /participants/leave/{event_id}) ---
@router.delete("/leave/{event_id}", response_model=dict)
def leave_event(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının etkinlikten ayrılmasını sağlar (Ceza Protokolü dahil)."""
    participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Bu etkinlikte kaydınız bulunmuyor.")
    
    event = participant.event
    time_diff = event.event_date - datetime.utcnow()
    hours_left = time_diff.total_seconds() / 3600
    
    penalty = 0
    message = "Etkinlikten başarıyla ayrıldınız."
    
    # Ceza Hesaplama
    if hours_left < 2:
        penalty = 10
        message = "SON_DAKİKA_AYRILMA: Güven puanınız 10 birim düşürüldü."
    elif hours_left < 12:
        penalty = 5
        message = "KRİTİK_ZAMAN_AYRILMA: Güven puanınız 5 birim düşürüldü."
    
    if penalty > 0:
        current_user.trust_score -= penalty
        if current_user.trust_score < 0:
            current_user.trust_score = 0
            
        # Sistem bildirimi oluştur
        new_notif = models.Notification(
            user_id=current_user.id,
            title="GÜVEN_PUANI_DÜŞÜŞÜ",
            message=f"{event.title} etkinliğinden geç ayrıldığınız için -{penalty} puan aldınız.",
            type="system"
        )
        db.add(new_notif)

    # İade Mantığı (Opsiyonel)
    if participant.payment_status == "paid" and hours_left > 24:
        current_user.wallet_balance += event.deposit_amount
        message += f" {event.deposit_amount} kredi iade edildi."

    db.delete(participant)
    db.commit()
    
    return {
        "status": "success",
        "message": message,
        "new_trust_score": current_user.trust_score
    }
