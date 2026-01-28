from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import sys
import os
from uuid import UUID

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security
from services import moderation, encryption

router = APIRouter(tags=["Chat"])
get_db = database.get_db

# --- 3. MESAJ GÖNDER (POST /chat/send) ---
# WebSocket yerine HTTP üzerinden mesaj atma (Güvenlik Botu Dahil)
@router.post("/chat/send", response_model=schemas.MessageOut)
async def send_message(
    message: schemas.MessageCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """
    HTTP üzerinden güvenli mesaj gönderme.
    "Yapay Zeka Koruması" (Security Guard) buradan sorumlu.
    """
    # 1. GÜVENLİK BOTU KONTROLÜ
    is_safe, reason = moderation.check_message(message.content, current_user.trust_score)

    if not is_safe:
        # Mesaj güvenli değilse 400 Hatası fırlat
        raise HTTPException(status_code=400, detail=f"Mesaj engellendi: {reason}")
    
    # 2. Veritabanına Kaydet
    saved_message = crud.create_message(db, message, sender_id=current_user.id)
    
    # 3. Eğer alıcı online ise WebSocket ile ilet (Opsiyonel ama şık olur)
    # Mesaj objesini hazırla
    response_data = {
        "id": saved_message.id,
        "sender_id": str(current_user.id),
        "content": message.content,
        "timestamp": str(saved_message.timestamp)
    }
    await manager.send_personal_message(json.dumps(response_data), message.receiver_id)
    
    return saved_message

# Bağlantı Yöneticisi
class ConnectionManager:
    def __init__(self):
        # user_id -> WebSocket bağlantısı eşleşmesi
        self.active_connections: Dict[UUID, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: UUID):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: UUID):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

manager = ConnectionManager()

# --- 1. WebSocket ile Gerçek Zamanlı Mesajlaşma ---
@router.websocket("/ws/chat/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """
    WebSocket üzerinden anlık mesajlaşma.
    Token URL parametresi olarak alınır çünkü WebSocket header desteklemez.
    """
    # 1. Kimlik Doğrulama
    try:
        payload = security.decode_access_token(token)
        email = payload.get("sub")
        if email is None:
            await websocket.close(code=1008)
            return
        user = crud.get_user_by_email(db, email=email)
        if user is None:
            await websocket.close(code=1008)
            return
        current_user_id = user.id
    except Exception:
        await websocket.close(code=1008)
        return

    # 2. Bağlantıyı Kabul Et
    await manager.connect(websocket, current_user_id)
    
    try:
        while True:
            # İstemciden mesaj bekle
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                # UUID conversion
                receiver_id_str = message_data.get("receiver_id")
                if not receiver_id_str:
                    continue
                receiver_id = UUID(receiver_id_str)
                
                raw_content = message_data.get("content")
                
                if not raw_content or not raw_content.strip():
                    continue

                # --- GÜVENLİK BOTU KONTROLÜ ---
                # Kullanıcı güven puanını al (İlerde DB'den çekilecek, şimdilik varsayılan 50 veya user objesinden)
                # user objesi connection sırasında alındı ama scope içinde değil, tekrar çekmek veya başta saklamak lazım.
                # Basitlik için user.trust_score'u connection sırasında saklayabiliriz ama 
                # şimdilik tekrar sorgulamak yerine varsayılan bir değer veya connection manager'a eklemek daha iyi.
                # Ancak burada DB session var, hızlıca user'ı tekrar çekebiliriz veya global user map tutabiliriz.
                # En temiz yöntem: WebSocket endpoint başında user'ı aldık, trust_score'u oradan alalım.
                # user değişkeni scope içinde duruyor.
                
                user_trust_score = user.trust_score
                
                is_safe, reason = moderation.check_message(raw_content, user_trust_score)
                
                if not is_safe:
                    # Hata mesajını gönder ve işlemi durdur
                    error_payload = {"type": "error", "message": reason}
                    await manager.send_personal_message(json.dumps(error_payload), current_user_id)
                    continue

                # Mesaj güvenli ise devam et (Sansürleme opsiyonel, check_message zaten blocked döndü)
                # İstenirse clean_content = moderation.filter_message(raw_content) yapılabilir.
                clean_content = raw_content 
                
                # 3. Veritabanına Kaydet (Otomatik Şifrelenir)
                msg_schema = schemas.MessageCreate(receiver_id=receiver_id, content=clean_content)
                saved_message = crud.create_message(db, msg_schema, sender_id=current_user_id)
                
                # Yanıt objesi hazırla
                response_data = {
                    "id": saved_message.id,
                    "sender_id": str(current_user_id),
                    "content": clean_content,
                    "timestamp": str(saved_message.timestamp)
                }
                
                # 4. Alıcıya Gönder
                await manager.send_personal_message(json.dumps(response_data), receiver_id)
                
                # Gönderene de onayı gönder
                await manager.send_personal_message(json.dumps(response_data), current_user_id)
                
            except Exception as e:
                # UUID error or other
                error_msg = {"error": str(e)}
                await manager.send_personal_message(json.dumps(error_msg), current_user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(current_user_id)


# --- 2. Mesaj Geçmişini Getir ---
@router.get("/chat/history/{other_user_id}", response_model=List[schemas.MessageOut])
def get_history(other_user_id: UUID, current_user: models.User = Depends(security.get_current_user), db: Session = Depends(get_db)):
    """
    Belirli bir kişiyle olan tüm mesaj geçmişini getirir.
    Mesajlar veritabanında şifreli saklanır ancak bu endpointte çözülerek (decrypted) gönderilir.
    """
    return crud.get_chat_history(db, current_user.id, other_user_id)
