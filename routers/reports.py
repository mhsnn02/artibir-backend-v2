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
    prefix="/reports",
    tags=["Discipline & Reporting"]
)

@router.post("/report-user", response_model=dict)
def report_user(
    reported_id: UUID,
    reason: str,
    event_id: UUID = None,
    details: str = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Bir kullanıcıyı şikayet eder. Şikayet edilenin güven puanını düşürür."""
    reported_user = db.query(models.User).filter(models.User.id == reported_id).first()
    if not reported_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    
    # Raporu kaydet
    report = models.UserReport(
        reporter_id=current_user.id,
        reported_id=reported_id,
        event_id=event_id,
        reason=reason,
        details=details
    )
    db.add(report)
    
    # Ceza Puanı (Trust Score Deduction)
    # Sebebe göre farklı puanlar düşülebilir
    deduction = 5
    if reason == "noshow": deduction = 10
    if reason == "harassment": deduction = 20
    
    reported_user.trust_score -= deduction
    if reported_user.trust_score < 0:
        reported_user.trust_score = 0
        
    db.commit()
    
    return {
        "message": "Şikayetiniz iletildi. Teşekkür ederiz.",
        "reported_user_trust_score": reported_user.trust_score
    }

@router.get("/my-reports", response_model=List[dict])
def get_my_reports(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının yaptığı şikayetleri listeler."""
    reports = db.query(models.UserReport).filter(models.UserReport.reporter_id == current_user.id).all()
    return [{
        "id": r.id, 
        "reason": r.reason, 
        "reported_id": r.reported_id, 
        "created_at": r.created_at,
        "status": r.status
    } for r in reports]
