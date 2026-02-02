from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import database, models, schemas, security

router = APIRouter(prefix="/clubs", tags=["Clubs & Societies"])

@router.post("/", response_model=schemas.ClubOut)
def create_club(
    club: schemas.ClubCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Sadece sistem yöneticileri (veya authorized kullanıcılar) kulüp kurabilir."""
    # Basit bir yetki kontrolü mekanizması eklenebilir.
    db_club = models.Club(**club.model_dump())
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    
    # Kurucuyu admin olarak ekle
    member = models.ClubMember(club_id=db_club.id, user_id=current_user.id, role="admin")
    db.add(member)
    db.commit()
    
    return db_club

@router.get("/", response_model=List[schemas.ClubOut])
def list_clubs(db: Session = Depends(database.get_db)):
    return db.query(models.Club).all()

@router.post("/{club_id}/join")
def join_club(
    club_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    exists = db.query(models.ClubMember).filter(
        models.ClubMember.club_id == club_id,
        models.ClubMember.user_id == current_user.id
    ).first()
    
    if exists:
        raise HTTPException(status_code=400, detail="Zaten bu kulübün üyesisiniz.")
        
    member = models.ClubMember(club_id=club_id, user_id=current_user.id, role="member")
    db.add(member)
    db.commit()
    return {"status": "success", "message": "Kulübe başarıyla katıldınız."}

@router.get("/{club_id}/members", response_model=List[schemas.ClubMemberOut])
def get_club_members(club_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.ClubMember).filter(models.ClubMember.club_id == club_id).all()
