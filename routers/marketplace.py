from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import sys
import os

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security

router = APIRouter(tags=["Marketplace"])
get_db = database.get_db

@router.post("/marketplace/items", response_model=schemas.MarketplaceItemOut)
def create_item(
    item: schemas.MarketplaceItemCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Yeni bir pazaryeri ilanı (eşya, kitap vb.) oluşturur.
    """
    db_item = models.MarketplaceItem(
        owner_id=current_user.id,
        title=item.title,
        description=item.description,
        price=item.price,
        category=item.category,
        image_url=item.image_url,
        status="active"
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/marketplace/items", response_model=List[schemas.MarketplaceItemOut])
def list_items(
    category: str = None,
    db: Session = Depends(get_db)
):
    """
    Tüm aktif ilanları listeler. Kategori filtresi eklenebilir.
    """
    query = db.query(models.MarketplaceItem).filter(models.MarketplaceItem.status == "active")
    if category:
        query = query.filter(models.MarketplaceItem.category == category)
    return query.order_by(models.MarketplaceItem.created_at.desc()).all()

@router.delete("/marketplace/items/{item_id}")
def delete_item(
    item_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    İlanı siler (Sahibi silebilir).
    """
    db_item = db.query(models.MarketplaceItem).filter(models.MarketplaceItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="İlan bulunamadı.")
    if db_item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu ilanı silme yetkiniz yok.")
    
    db_item.status = "deleted"
    db.commit()
    return {"status": "success", "message": "İlan başarıyla silindi."}

@router.get("/marketplace/my-items", response_model=List[schemas.MarketplaceItemOut])
def get_my_items(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının kendi verdiği ilanları listeler.
    """
    return db.query(models.MarketplaceItem).filter(
        models.MarketplaceItem.owner_id == current_user.id
    ).order_by(models.MarketplaceItem.created_at.desc()).all()

@router.get("/marketplace/my-purchases", response_model=List[schemas.TransactionOut])
def get_my_purchases(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının satın aldığı ürünlerin transaction geçmişini listeler.
    """
    purchases = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.transaction_type == "payment",
        models.Transaction.description.like("Pazar Alımı:%")
    ).order_by(models.Transaction.created_at.desc()).all()
    
    return purchases

@router.post("/marketplace/items/{item_id}/buy")
def buy_item(
    item_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    İlanı satın alır (Cüzdan bakiyesi ile).
    """
    # CONCURRENCY FIX: Veritabanı kilitleme (Row-Level Locking)
    # with_for_update() kullanarak, işlem bitene kadar bu ürünün başkası tarafından seçilmesini/değiştirilmesini engelliyoruz.
    db_item = db.query(models.MarketplaceItem).filter(models.MarketplaceItem.id == item_id).with_for_update().first()
    if not db_item or db_item.status != "active":
        raise HTTPException(status_code=404, detail="İlan aktif değil veya bulunamadı.")
    
    if current_user.wallet_balance < db_item.price:
        raise HTTPException(status_code=400, detail="Cüzdan bakiyeniz yetersiz.")

    # İşlem: Alıcıdan düş, satıcıya ekle
    owner = db.query(models.User).filter(models.User.id == db_item.owner_id).first()
    
    current_user.wallet_balance -= float(db_item.price)
    owner.wallet_balance += float(db_item.price)
    db_item.status = "sold"

    # Transaction log
    db.add(models.Transaction(user_id=current_user.id, amount=db_item.price, status="paid", transaction_type="payment", description=f"Pazar Alımı: {db_item.title}"))
    db.add(models.Transaction(user_id=owner.id, amount=db_item.price, status="paid", transaction_type="deposit", description=f"Pazar Satışı: {db_item.title}"))

    db.commit()
    return {"status": "success", "message": "Satın alma işlemi başarılı!"}
