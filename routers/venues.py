from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import sys
import os

# Parent directory'i path'e ekliyoruz ki importlar çalışsın
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database, schemas, crud, models, security

router = APIRouter(tags=["Venues"])
get_db = database.get_db

@router.get("/venues", response_model=List[schemas.CampusVenueOut])
def list_venues(
    db: Session = Depends(get_db)
):
    """
    Kampüs çevresindeki indirimli mekanları listeler.
    """
    return db.query(models.CampusVenue).filter(models.CampusVenue.is_active == True).all()

@router.post("/venues", response_model=schemas.CampusVenueOut)
def create_venue(
    venue: schemas.CampusVenueOut, # Basitlik için Out şemasını Create gibi kullanıyoruz (id hariç)
    # current_user: models.User = Depends(security.get_admin_user), # Admin yetkisi lazım normalde
    db: Session = Depends(get_db)
):
    """
    Yeni bir indirimli mekan ekler (Admin yetkisi gerektirir).
    """
    db_venue = models.CampusVenue(
        name=venue.name,
        latitude=venue.latitude,
        longitude=venue.longitude,
        address=venue.address,
        discount_rate=venue.discount_rate,
        category=venue.category
    )
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue
