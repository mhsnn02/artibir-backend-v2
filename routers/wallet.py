import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import database, models, schemas, security
from uuid import UUID

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet & Payments"]
)

@router.get("/balance", response_model=dict)
def get_balance(current_user: models.User = Depends(security.get_current_user)):
    """Mevcut cüzdan bakiyesini getirir."""
    return {"wallet_balance": current_user.wallet_balance}

@router.post("/top-up", response_model=dict)
def top_up_wallet(
    amount: float, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Cüzdana bakiye yükler (Demo amaçlı doğrudan ekler)."""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Miktar 0'dan büyük olmalıdır.")
    
    current_user.wallet_balance += amount
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": f"{amount} TL başarıyla yüklendi.",
        "new_balance": current_user.wallet_balance
    }

@router.post("/withdraw", response_model=dict)
def withdraw_money(
    amount: float,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Cüzdandan para çeker."""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Miktar 0'dan büyük olmalıdır.")
    
    if current_user.wallet_balance < amount:
        raise HTTPException(status_code=400, detail="Yetersiz bakiye.")
    
    current_user.wallet_balance -= amount
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": f"{amount} TL çekildi.",
        "new_balance": current_user.wallet_balance
    }
