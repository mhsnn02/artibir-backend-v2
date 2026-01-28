from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import sys
import os
from uuid import UUID

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security
from services import event_provider

router = APIRouter(tags=["Events"])
get_db = database.get_db

# --- 3. ETKİNLİKLERİ GETİR (GET /events) ---
@router.get("/events", response_model=List[schemas.EventOut])
def read_events(
    city: str = None, 
    category: str = None, 
    lat: float = None, 
    lon: float = None, 
    radius: float = 10.0,
    db: Session = Depends(get_db)
):
    """
    Etkinlikleri Listele (Konum Filtresi Destekli)
    """
    if lat is not None and lon is not None:
        return crud.get_nearby_events(db, lat=lat, lon=lon, radius_km=radius)
    
    return crud.get_events(db, city=city, category=category)

# --- 4. OTOMATİK VERİ ÇEK (POST /events/auto-fetch) ---
@router.post("/events/auto-fetch", response_model=List[schemas.EventOut])
def auto_fetch_events(count: int = 5, db: Session = Depends(get_db)):
    """
    Otomatik Etkinlik Çek (Simülasyon - Rastgele)
    """
    # 1. Servisten mock dataları al
    new_event_schemas = event_provider.generate_mock_events(count=count)
    
    # Host bul (Sistemden rastgele bir kullanıcı)
    # Gerçek senaryoda bu işlem admin token ile yapılmalı
    host_user = db.query(models.User).first()
    if not host_user:
        # Kullanıcı yoksa oluşturamayız (Mock user create eklenebilir ama şimdilik hata verelim)
        raise HTTPException(status_code=400, detail="Sistemde hiç kullanıcı yok, etkinlik oluşturulamaz.")

    created_events = []
    # 2. Hepsini veritabanına kaydet
    for event_schema in new_event_schemas:
        # host_id ataması
        db_event = crud.create_event(db, event_schema, host_id=host_user.id)
        created_events.append(db_event)
        
    return created_events

from services.scraper_service import ScraperService

# --- 5. INTERNETTEN ETKİNLİK BOTU ÇALIŞTIR (GET /events/fetch-external) ---
@router.get("/events/fetch-external", response_model=List[schemas.EventOut])
def fetch_external_events(location: str = "İstanbul", db: Session = Depends(get_db)):
    """
    Belirtilen konuma göre internetten etkinlikleri tarar ve veritabanına kaydeder.
    URL Parametresi: ?location=Antalya
    """
    # 1. Scraper Servisini Çağır
    found_event_schemas = ScraperService.scrape_events_by_location(location)
    
    # 2. Kaydetmek için 'Host' Kullanıcısı Belirle
    host_user = db.query(models.User).first() # İlk kullanıcıya ata
    if not host_user:
        raise HTTPException(status_code=400, detail="Etkinlikleri atayacak kullanıcı bulunamadı.")
        
    created_events = []
    for event_schema in found_event_schemas:
        # DB'ye kaydet
        db_event = crud.create_event(db, event_schema, host_id=host_user.id)
        created_events.append(db_event)
        
    return created_events

# --- 1. ETKİNLİK OLUŞTUR (POST /events) ---
@router.post("/events", response_model=schemas.EventOut)
def create_event(
    event: schemas.EventCreate, 
    current_user: models.User = Depends(security.get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Yeni Etkinlik Oluştur
    """
    return crud.create_event(db=db, event=event, host_id=current_user.id)


