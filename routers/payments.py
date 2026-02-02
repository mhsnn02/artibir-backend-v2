from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List
import sys
import os
import json
import hmac
import hashlib

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security
from services.payment_service import PaymentService

router = APIRouter(tags=["Payments"])
get_db = database.get_db

@router.post("/payments/initialize-3ds", response_model=dict)
def initialize_3ds(
    payment_data: schemas.PaymentInitialize,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    3D Secure ödemeyi başlatır ve banka onay sayfasına yönelecek olan HTML/Form verisini döner.
    """
    try:
        # 1. Iyzico Checkout Form / 3DS Başlat
        result_json = PaymentService.initialize_3ds_payment(
            user=current_user,
            card_info=payment_data.model_dump(),
            amount=payment_data.amount
        )
        result = json.loads(result_json)

        if result.get("status") != "success":
            raise HTTPException(status_code=400, detail=result.get("errorMessage", "Ödeme başlatılamadı."))

        # 2. İşlemi PENDING olarak kaydet
        crud_transaction = models.Transaction(
            user_id=current_user.id,
            amount=payment_data.amount,
            conversation_id=result.get("conversationId"),
            status=models.PaymentStatus.PENDING,
            transaction_type="deposit",
            description="Cüzdan Yükleme (3DS Başlatıldı)"
        )
        db.add(crud_transaction)
        db.commit()

        # 3DS HTML içeriğini dön
        return {
            "status": "success",
            "three_d_sh_html_content": result.get("threeDSHTMLContent")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payments/callback")
async def payment_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Iyzico 3DS doğrulama sonrası bu endpoint'e POST atar.
    Flutter WebView bu adresi dinler.
    """
    form_data = await request.form()
    # status, paymentId, conversationId, mdStatus vb. gelir
    
    payment_id = form_data.get("paymentId")
    conversation_id = form_data.get("conversationId")
    status = form_data.get("status")
    
    # GÜVENLİK: HMAC İmza Kontrolü
    # URL'den gelen imza ile bizim hesapladığımız imza eşleşmeli.
    incoming_signature = request.query_params.get("signature")
    if not incoming_signature or not conversation_id:
        return HTMLResponse("<html><body><h1>Güvenlik Hatası: Geçersiz İstek.</h1></body></html>")

    api_secret = os.getenv("IYZICO_SECRET_KEY", "").encode()
    expected_signature = hmac.new(api_secret, conversation_id.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(incoming_signature, expected_signature):
        return HTMLResponse("<html><body><h1>Güvenlik Hatası: İmza Doğrulanamadı.</h1></body></html>")

    # İşlemi bul
    transaction = db.query(models.Transaction).filter(models.Transaction.conversation_id == conversation_id).first()
    if not transaction:
        return HTMLResponse("<html><body><h1>İşlem bulunamadı.</h1></body></html>")

    if status == "success":
        # Iyzico'dan ödemeyi tamamla (ThreedsPayment)
        completion_json = PaymentService.retrieve_3ds_result(payment_id, conversation_id)
        completion = json.loads(completion_json)
        
        if completion.get("status") == "success":
            # 1. İşlemi onayla
            transaction.status = models.PaymentStatus.PAID
            transaction.payment_id = payment_id
            transaction.description = "Cüzdan Yükleme Başarılı"
            
            # 2. Kullanıcının bakiyesini güncelle
            user = db.query(models.User).filter(models.User.id == transaction.user_id).first()
            user.wallet_balance += float(transaction.amount)
            
            db.commit()
            return HTMLResponse("<html><body><h1>Ödeme Başarılı!</h1><script>window.parent.postMessage('success', '*');</script></body></html>")
        else:
            transaction.status = models.PaymentStatus.PENDING # Hata durumunda beklemede bırak veya fail et
            db.commit()
            return HTMLResponse(f"<html><body><h1>Ödeme Hatası: {completion.get('errorMessage')}</h1></body></html>")
    else:
        transaction.status = models.PaymentStatus.PENDING
        db.commit()
        return HTMLResponse("<html><body><h1>Ödeme başarısız veya iptal edildi.</h1></body></html>")

@router.get("/payments/transactions", response_model=List[schemas.TransactionOut])
def get_transactions(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Kullanıcının işlem geçmişini getirir.
    """
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.created_at.desc()).all()
