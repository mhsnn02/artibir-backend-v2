import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import database, models, schemas, security
from typing import List

router = APIRouter(
    prefix="/support",
    tags=["Support & Help"]
)

@router.post("/tickets", response_model=schemas.SupportTicketOut)
def create_ticket(
    ticket_data: schemas.SupportTicketCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Yeni bir destek talebi (Hata bildirimi, şikayet vb.) oluşturur."""
    new_ticket = models.SupportTicket(
        user_id=current_user.id,
        subject=ticket_data.subject,
        message=ticket_data.message
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@router.get("/tickets", response_model=List[schemas.SupportTicketOut])
def get_my_tickets(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının geçmiş destek taleplerini listeler."""
    return db.query(models.SupportTicket).filter(models.SupportTicket.user_id == current_user.id).all()

@router.get("/rules")
def get_community_rules():
    """Topluluk ve disiplin kurallarını getirir."""
    return {
        "rules": [
            "Saygılı olun.",
            "Etkinliklere katılım sağlayın (No-Show yapmayın).",
            "Güven puanınızı yüksek tutun.",
            "Sahte belge yüklemeyin."
        ],
        "info": "Kurallara uymayan hesaplar geçici veya kalıcı olarak askıya alınabilir."
    }
