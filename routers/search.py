from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import database, models, schemas

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("/")
def global_search(
    q: str = Query(..., min_length=2, description="Arama sorgusu"),
    db: Session = Depends(database.get_db)
):
    """
    Kullanıcılar, etkinlikler ve kulüpler arasında arama yapar.
    """
    search_term = f"%{q}%"
    
    try:
        # 1. Kullanıcı Arama
        users = db.query(models.User).filter(
            models.User.full_name.ilike(search_term)
        ).limit(10).all()
        
        # 2. Etkinlik Arama
        events = db.query(models.Event).filter(
            models.Event.title.ilike(search_term)
        ).limit(10).all()
        
        # 3. Kulüp Arama
        clubs = db.query(models.Club).filter(
            models.Club.name.ilike(search_term)
        ).limit(10).all()
        
        return {
            "query": q,
            "results": {
                "users": [{"id": str(getattr(u, "id", "")), "name": getattr(u, "full_name", "")} for u in users],
                "events": [{"id": str(getattr(e, "id", "")), "title": getattr(e, "title", "")} for e in events],
                "clubs": [{"id": getattr(c, "id", ""), "name": getattr(c, "name", "")} for c in clubs]
            }
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}
