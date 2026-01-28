# 🚀 ArtıBir Backend V2: Modern Sosyal Etkinlik Platformu

Bu proje, üniversite öğrencileri ve topluluklar için geliştirilmiş, **Güven Değişkeni (Trust Score)** odaklı, yüksek performanslı bir **FastAPI** backend servisidir. ArtıBir V2, simülasyonları bir kenara bırakıp **Gerçek Dünya Doğrulama** sistemlerini (TCKN, SMS, Email) çekirdeğine entegre eder.

---

## ✨ Öne Çıkan Özellikler

### 🛡️ Gerçek Dünya Doğrulama Katmanları

- **NVİ Kimlik Doğrulaması:** TCKN, ad, soyad ve doğum yılı verilerini doğrudan devlet kanalları (NVİ SOAP API) üzerinden doğrular.
- **SMS & Telefon Onayı:** Gerçek SMS gateway entegrasyonu ile telefon numarası sahipliğini doğrular.
- **E-posta Doğrulaması:** SMTP üzerinden gönderilen OTP kodları ile kurumsal/kişisel e-posta onayı.
- **Mavi Tik Sistemi:** Tüm doğrulama adımlarını tamamlayan kullanıcılara "Onaylı Profil" statüsü verilir.

### 📊 Güven Skorlama (Trust Score)

Kullanıcıların platformdaki güvenilirliği, tamamladıkları doğrulamalara göre dinamik olarak hesaplanır.

### 🏙️ Akıllı Etkinlik Yönetimi

- **Konum Odaklı Keşif:** Kullanıcıların etrafındaki etkinlikleri enlem/boylam bazlı (Bounding Box) filtreleme.
- **Modüler Yapı:** Her özellik (Chat, Cüzdan, Etkinlik, Kimlik vb.) bağımsız router'lar ile yönetilir.

---

## 🏗️ Proje Mimarisi

```text
Artibir_Backend_V2/
├── routers/              # Modüler API Servisleri (Auth, Chat, Events, Verification vb.)
├── services/             # İş Mantığı Katmanı (Görüntü İşleme, Ödeme, Bildirim)
├── utils/                # Harici API Entegrasyonları (NVİ Verifier, SMS Gateway)
├── models.py             # SQLAlchemy Veritabanı Modelleri
├── schemas.py            # Pydantic Veri Doğrulama Şemaları
├── security.py           # JWT & Bcrypt Güvenlik Katmanı
├── database.py           # PostgreSQL & SQLite Hibrit Bağlantı Mantığı
├── main.py               # Uygulama Giriş Noktası & Global Hata Yönetimi
└── requirements.txt      # Bağımlılık Listesi
```

---

## 🛠️ Teknoloji Yığını

- **Framework:** FastAPI (Asynchronous Python)
- **Database:** PostgreSQL (Production) / SQLite (Local)
- **ORM:** SQLAlchemy 2.0
- **Authentication:** JWT (JSON Web Token)
- **Integration:** NVİ SOAP Service, SMS/SMTP Gateways
- **Deployment:** Railway.app / Docker Ready

---

## 🚀 Hızlı Başlangıç

### 1. Yerel Kurulum

```bash
# Depoyu klonlayın
git clone https://github.com/mhsnn02/artibir-backend-v2.git
cd artibir-backend-v2

# Sanal ortam oluşturun ve aktif edin
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt
```

### 2. Yapılandırma (.env)

```env
SQLALCHEMY_DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=yoursupersecretkey
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 3. Çalıştırma

```bash
uvicorn main:app --reload
```

API dökümantasyonuna şu adresten ulaşabilirsiniz: `http://localhost:8000/docs`

---

## 🚢 Deployment (Railway.app)

Bu proje Railway üzerinde sıfır konfigürasyon ile çalışacak şekilde optimize edilmiştir.

- `Procfile` dosyası hazır.
- PostgreSQL bağlantısı otomatik algılanır.
- `/sys-admin/force-reset-db` endpoint'i ile uzaktan şema kurulumu desteklenir.

---

## 👨‍💻 Geliştirici

**mhsnn02** - [GitHub](https://github.com/mhsnn02) tarafından ArtıBir projesi için geliştirilmiştir.
