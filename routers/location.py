from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import schemas
from services import location_service

router = APIRouter(tags=["Location"])

@router.post("/api/location/update")
def update_location(data: schemas.LocationUpdate):
    """
    Kullanıcı konumu güncelleme veya gizleme endpointi.
    """
    try:
        result = location_service.update_location(
            user_id=data.user_id,
            latitude=data.latitude,
            longitude=data.longitude,
            is_ghost_mode=data.is_ghost_mode
        )
        return result
    except Exception as e:
        print(f"Location Error: {e}")
        raise HTTPException(status_code=500, detail="Konum güncellenemedi (Redis hatası olabilir)")

@router.get("/api/location/nearby")
def get_nearby_users(
    user_id: str, 
    lat: float, 
    lon: float, 
    radius_km: float = 5.0,
    limit: int = 50
):
    """
    Belirli bir konumun etrafındaki kullanıcıları getirir (Radar).
    """
    try:
        return location_service.get_nearby_users(
            user_id=user_id,
            latitude=lat,
            longitude=lon,
            radius_km=radius_km,
            limit=limit
        )
    except Exception as e:
        print(f"Location Error: {e}")
        raise HTTPException(status_code=500, detail="Çevresel arama yapılamadı")
