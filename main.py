import os
import logging
import json
from dotenv import load_dotenv

# 1. Kritik Ayarları Yükle (Importlardan Önce!)
load_dotenv()

import models
from database import engine
from routers import (
    auth, events, location, wallet, marketplace, media, chat, notifications, gamification, settings, activity, support, reports,
    reviews, payments, venues,
    interact, live_tracking, users,
    participants, security_management,
    clubs, social, intelligence, search, feed, admin_api
)
from utils import tracking

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# 1. Veritabanı ve Kritik Ayar Kontrolleri
if os.getenv("SECRET_KEY") == "super-secret-key-change-this-in-production-random-string":
    logger.warning("⚠️ UYARI: Varsayılan SECRET_KEY kullanılıyor! Lütfen .env dosyasında bunu güncelleyin.")

try:
    # NOT: Production ortamında bu satır yorum satırı yapılmalı ve Alembic kullanılmalıdır.
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.error(f"Uyarı: Tablo oluşturulurken hata oluştu: {e}")

# 2. Uygulamayı Başlat
# Rate Limiter Tanımlama (IP bazlı)
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="ArtıBir Backend V2")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Sunucu hatası oluştu", "detail": str(exc)},
    )

# CORS Ayarları (Web/Mobil erişimi için geliştirme modu)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173", # Vite default
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 2.5 JSON Tracking Middleware
@app.middleware("http")
async def json_tracking_middleware(request: Request, call_next):
    # İsteği işle
    response = await call_next(request)
    
    # Sadece belli metodları ve hatalı durumları logla (Gereksiz şişmeyi önlemek için)
    if request.method in ["POST", "PUT", "DELETE", "PATCH"] or response.status_code >= 400:
        client_ip = request.client.host if request.client else "unknown"
        tracking.log_api_request(
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            client_ip=client_ip
        )
    return response

# 2.6 Güvenlik Başlıkları Middleware (Katman 2)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # XSS saldırılarını önlemek için tarayıcı filtresini açar
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Sitenin bir iframe içinde açılmasını engeller (Clickjacking koruması)
    response.headers["X-Frame-Options"] = "DENY"
    # Dosya tipi taklidini engeller
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

# 3. Resim klasörünü dışarı aç (Görünür yap)
# Klasör yoksa hata vermemesi için oluşturuyoruz
os.makedirs("uploads/images", exist_ok=True)
os.makedirs("data", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/data", StaticFiles(directory="data"), name="data")
# Özel /images path'i (Routerdaki BASE_URL ile uyumlu olması için)
app.mount("/images", StaticFiles(directory="uploads/images"), name="images")

# 4. Rotaları (Endpointleri) Dahil Et
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(chat.router)
app.include_router(location.router)
app.include_router(wallet.router)
app.include_router(reports.router)
app.include_router(gamification.router)
app.include_router(settings.router)
app.include_router(activity.router)
app.include_router(support.router)
app.include_router(marketplace.router)
app.include_router(reviews.router)
app.include_router(payments.router)
app.include_router(venues.router)
app.include_router(interact.router)
app.include_router(live_tracking.router)
app.include_router(media.router)
app.include_router(chat.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(gamification.router, prefix="/api")
app.include_router(users.router)
app.include_router(participants.router)
app.include_router(security_management.router)
app.include_router(clubs.router)
app.include_router(social.router)
app.include_router(intelligence.router)
app.include_router(search.router)
app.include_router(feed.router)
app.include_router(admin_api.router)

# 5. Açılış Mesajı (Health Check İçin HEAD desteklemeli)
@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
def read_root():
    return {"message": "ArtıBir Modüler Backend Çalışıyor! 🚀"}

@app.get("/dashboard", include_in_schema=False)
def get_dashboard():
    from fastapi.responses import FileResponse
    return FileResponse("dashboard.html")

@app.get("/admin", include_in_schema=False)
def get_admin():
    from fastapi.responses import FileResponse
    return FileResponse("admin.html")

@app.on_event("startup")
async def startup_event():
    logger.info("="*60)
    logger.info("🚀 ArtıBir Backend Hazır!")
    logger.info("📄 Swagger UI (Dokümantasyon): http://127.0.0.1:8000/docs")
    logger.info("="*60)