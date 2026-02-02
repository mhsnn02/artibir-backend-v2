import sys
import os
# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import database, models, schemas, security
from uuid import UUID
from datetime import datetime
from services import maps_service

router = APIRouter(
    prefix="/tracking",
    tags=["Live Tracking (Uber Mode)"]
)

# WebSocket Yöneticisi: Etkinlik bazlı odalar oluşturur
class TrackingConnectionManager:
    def __init__(self):
        # event_id -> List[WebSocket] (Her etkinlik için ayrı liste)
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, event_id: UUID):
        await websocket.accept()
        if event_id not in self.active_connections:
            self.active_connections[event_id] = []
        self.active_connections[event_id].append(websocket)

    def disconnect(self, websocket: WebSocket, event_id: UUID):
        if event_id in self.active_connections:
            if websocket in self.active_connections[event_id]:
                self.active_connections[event_id].remove(websocket)
            if not self.active_connections[event_id]:
                del self.active_connections[event_id]

    async def broadcast(self, message: str, event_id: UUID):
        if event_id in self.active_connections:
            for connection in self.active_connections[event_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass # Bağlantı kopmuşsa yoksay

manager = TrackingConnectionManager()

@router.post("/update-location", response_model=dict)
async def update_event_live_location(
    event_id: UUID,
    lat: float,
    lon: float,
    status: str = "on_way", # on_way, arrived
    transport_type: str = "walk",
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Kullanıcının etkinliğe giderken canlı konumunu günceller."""
    # Etkinliğe katılmış mı bak
    participant = db.query(models.EventParticipant).filter(
        models.EventParticipant.event_id == event_id,
        models.EventParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Canlı takip için etkinliğe kayıtlı olmalısınız.")
    
    # Mevcut takip verisi var mı bak
    tracking = db.query(models.LiveTracking).filter(
        models.LiveTracking.event_id == event_id,
        models.LiveTracking.user_id == current_user.id
    ).first()
    
    if tracking:
        tracking.latitude = lat
        tracking.longitude = lon
        tracking.status = status
        tracking.transport_type = transport_type
        tracking.last_updated = datetime.utcnow()
    else:
        tracking = models.LiveTracking(
            event_id=event_id,
            user_id=current_user.id,
            latitude=lat,
            longitude=lon,
            status=status,
            transport_type=transport_type
        )
        db.add(tracking)
    
    db.commit()
    
    # WebSocket üzerinden dinleyenlere anlık bildirim gönder
    update_data = {
        "type": "location_update",
        "user_id": str(current_user.id),
        "full_name": current_user.full_name,
        "latitude": lat,
        "longitude": lon,
        "status": status,
        "transport_type": transport_type,
        "last_updated": str(datetime.utcnow())
    }
    await manager.broadcast(json.dumps(update_data), event_id)
    
    return {"message": "Konumunuz güncellendi.", "status": status}

@router.get("/event-map/{event_id}", response_model=List[dict])
def get_event_live_map(
    event_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    """Etkinliğe giden tüm kullanıcıların canlı konumlarını getirir."""
    # Son 10 dakika içinde güncellenmiş konumları getir
    ten_minutes_ago = datetime.utcnow() - datetime.timedelta(minutes=10)
    
    # OPTİMİZASYON: N+1 Sorunu giderildi. User tablosu ile JOIN yapıldı.
    results = db.query(
        models.LiveTracking,
        models.User.full_name
    ).join(
        models.User,
        models.LiveTracking.user_id == models.User.id
    ).filter(
        models.LiveTracking.event_id == event_id,
        models.LiveTracking.last_updated >= ten_minutes_ago
    ).all()
    
    response_data = []
    for t, full_name in results:
        response_data.append({
            "user_id": t.user_id,
            "full_name": full_name if full_name else "Gizli Kullanıcı",
            "latitude": t.latitude,
            "longitude": t.longitude,
            "status": t.status,
            "transport_type": t.transport_type,
            "last_updated": t.last_updated
        })
        
    return response_data

@router.get("/directions", response_model=dict)
def get_route(
    origin_lat: float, 
    origin_lon: float, 
    dest_lat: float, 
    dest_lon: float, 
    mode: str = "walking",
    current_user: models.User = Depends(security.get_current_user)
):
    """
    Google Maps API kullanarak iki nokta arasındaki rotayı (polyline) getirir.
    """
    origin = f"{origin_lat},{origin_lon}"
    destination = f"{dest_lat},{dest_lon}"
    
    return maps_service.get_directions(origin, destination, mode)

@router.websocket("/ws/{event_id}/{token}")
async def websocket_tracking(
    websocket: WebSocket, 
    event_id: UUID, 
    token: str, 
    db: Session = Depends(database.get_db)
):
    """
    Canlı takip haritası için WebSocket bağlantısı.
    İstemciler bu sokete bağlanarak haritadaki hareketleri anlık izler.
    """
    # 1. Kimlik Doğrulama (Token URL parametresi olarak gelir)
    try:
        payload = security.decode_access_token(token)
        email = payload.get("sub")
        if email is None:
            await websocket.close(code=1008)
            return
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    # 2. Odaya Bağlan (Etkinlik ID'sine göre)
    await manager.connect(websocket, event_id)
    
    try:
        while True:
            # İstemciden veri bekle (Ping/Pong veya istemci konumu)
            # Şimdilik sadece dinleyici modunda çalışıyorlar ama
            # ilerde sürücü de buradan konum atabilir.
            data = await websocket.receive_text()
            # Gelen veriyi işle veya yoksay (Heartbeat vb.)
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, event_id)
