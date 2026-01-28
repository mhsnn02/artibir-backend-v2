# ArtıBir Backend V2

Bu proje, ArtıBir uygulaması için geliştirilmiş, **FastAPI** tabanlı modern, güvenli ve modüler bir REST API servisidir.

## 🚀 Proje Hakkında

Bu backend servisi kullanıcı yönetimi, kimlik doğrulama (JWT), etkinlik yönetimi ve dosya yükleme işlemlerini sağlar. Son yapılan güncellemelerle birlikte güvenlik standartları yükseltilmiş ve kod yapısı ölçeklenebilir hale getirilmiştir.

### Kullanılan Teknolojiler
- **FastAPI**: Yüksek performanslı web framework'ü.
- **SQLite**: Hafif ve hızlı veri tabanı (Geliştirme aşaması için).
- **SQLAlchemy (ORM)**: Veritabanı işlemleri için.
- **Alembic**: Veritabanı şema değişikliklerini (migrations) yönetmek için.
- **Pydantic**: Veri doğrulama ve validasyon.
- **Python-Jose (JWT)**: Güvenli kimlik doğrulama.
- **Passlib (Bcrypt)**: Şifrelerin güvenli bir şekilde hashlenmesi.

## 📂 Proje Yapısı

```
Artibir_Backend_V2/
├── alembic/              # Veritabanı migrasyon dosyaları
├── routers/              # API Rotaları (Endpointler)
│   ├── auth.py           # Giriş (Login) işlemleri
│   ├── users.py          # Kayıt ve profil işlemleri
│   └── events.py         # Etkinlik işlemleri
├── uploads/              # Yüklenen kullanıcı resimleri
├── main.py               # Uygulamanın giriş noktası
├── models.py             # Veritabanı tablo modelleri
├── schemas.py            # Pydantic veri şemaları ve validasyon kuralları
├── crud.py               # Veritabanı CRUD işlemleri
├── security.py           # Şifreleme ve JWT fonksiyonları
├── database.py           # Veritabanı bağlantı ayarları
├── .env                  # Gizli ayarlar (Environment Variables)
└── alembic.ini           # Alembic konfigürasyonu
```

## ✨ Temel Özellikler

1.  **Güvenli Kimlik Doğrulama**:
    - Kullanıcılar e-posta ve şifre ile kayıt olur.
    - Şifreler `bcrypt` ile hashlenerek saklanır.
    - Giriş yapıldığında süreli (30dk) bir **JWT (JSON Web Token)** üretilir.
2.  **Gelişmiş Validasyon**:
    - **Telefon**: Sadece geçerli formatta (+90...) numaralar kabul edilir.
    - **Şifre**: En az 8 karakter, büyük/küçük harf ve rakam zorunluluğu vardır.
3.  **Hata Yönetimi**:
    - Sunucu hataları yakalanır ve kullanıcıya anlaşılır JSON formatında hata mesajı dönülür.
4.  **Veritabanı Yönetimi**:
    - `Alembic` ile veri tabanı değişiklikleri versiyonlanır.

## 🛠 Kurulum ve Çalıştırma

### 1. Hazırlık
Sanal ortam oluşturun ve gerekli paketleri yükleyin:
```bash
# Sanal ortam oluşturma
python -m venv .venv

# Aktif etme (Windows)
.venv\Scripts\activate

# Paketleri yükleme
pip install fastapi uvicorn sqlalchemy python-jose passlib bcrypt python-multipart python-dotenv alembic pydantic[email]
```

### 2. Yapılandırma
Proje ana dizininde `.env` dosyasının olduğundan emin olun:
```env
SECRET_KEY=super-secret-key...
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SQLALCHEMY_DATABASE_URL=sqlite:///./artibir.db
```

### 3. Çalıştırma
Uygulamayı geliştirme modunda başlatın:
```bash
uvicorn main:app --reload
```
Sunucu **http://127.0.0.1:8000** adresinde çalışacaktır.

### 4. Dokümantasyon
API'yi test etmek için tarayıcınızdan şu adrese gidin:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** (Swagger UI)

## 🔄 Son Değişiklikler (Change Log)

- **Phase 1**:
    - Router yapısı `routers/` klasörüne bölündü.
    - `.env` entegrasyonu yapıldı.
- **Phase 2**:
    - Kullanıcı şemalarına Regex ve şifre validasyonları eklendi.
    - Global Exception Handler eklendi.
    - Alembic migrasyon alt yapısı kuruldu.
