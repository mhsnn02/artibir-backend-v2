from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import (
    auth, events, chat, location, wallet, reports, 
    gamification, settings, activity, support,
    marketplace, reviews, payments, venues,
    interact, live_tracking, media, users, notifications,
    participants, security_management
)
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Veritabanı tablolarını oluştur (Yoksa)
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Uyarı: Tablo oluşturulurken hata oluştu (Muhtemelen SQLite ve PostGIS uyumsuzluğu): {e}")
    print("Not: Eğer PostgreSQL kullanmıyorsanız bu normaldir. Uygulama çalışmaya devam edecek.")

# 2. Uygulamayı Başlat
app = FastAPI(title="ArtıBir Backend V2")

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Sunucu hatası oluştu", "detail": str(exc)},
    )

# CORS Ayarları (Web/Mobil erişimi için geliştirme modu)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 3. Resim klasörünü dışarı aç (Görünür yap)
# Klasör yoksa hata vermemesi için oluşturuyoruz
os.makedirs("uploads/images", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
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
app.include_router(users.router)
app.include_router(notifications.router)
app.include_router(participants.router)
app.include_router(security_management.router)

import force_reset_db # DB Sıfırlama Modülü

# 5. Açılış Mesajı (Health Check İçin HEAD desteklemeli)
@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "ArtıBir Modüler Backend Çalışıyor! 🚀"}

# --- ACİL DURUM DB SIFIRLAMA (SHELL ERİŞİMİ OLMAYANLAR İÇİN) ---
@app.get("/sys-admin/force-reset-db")
def remote_db_reset():
    try:
        force_reset_db.reset_database()
        return {"status": "success", "message": "Veritabanı başarıyla sıfırlandı ve yeniden oluşturuldu. ♻️"}
    except Exception as e:
        return {"status": "error", "message": f"Hata: {str(e)}"}