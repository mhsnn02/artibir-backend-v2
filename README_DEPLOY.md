# ArtıBir Backend Dağıtım Rehberi (GitHub & Render.com)

Bu rehber, backend servisinizi GitHub'a yüklemek ve Render.com üzerinde canlıya almak için yapmanız gereken adımları içerir.

## 1. Hazırlıklar

Gerekli tüm dosyalar (`Procfile`, `render.yaml`, `requirements.txt`) oluşturuldu ve `database.py` güncellendi.

## 2. GitHub'a Yükleme (Manuel Adımlar)

Eğer projeniz henüz GitHub'da değilse:

1. GitHub üzerinde yeni bir repository oluşturun.
2. Bilgisayarınızda terminal açın ve şu komutları sırayla çalıştırın:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for deployment"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git
   git push -u origin main
   ```

## 3. Render.com Kurulumu

1. [Render.com](https://render.com) adresine gidin ve GitHub hesabınızla giriş yapın.
2. **"New +"** butonuna basın ve **"Blueprint"** seçeneğini seçin.
3. GitHub deponuzu (repository) seçin.
4. Render, `render.yaml` dosyasını otomatik okuyacak ve:
   - Bir **PostgreSQL** veritabanı oluşturacak.
   - Bir **Web Service** (FastAPI) oluşturacak.
5. **"Approve"** butonuna basarak kurulumu başlatın.

## 4. Önemli Notlar

- **Environment Variables**: `.env` dosyanızdaki gizli anahtarları (örneğin `JWT_SECRET`) Render Dashboard üzerinden "Environment Variables" kısmına eklemeyi unutmayın. `DATABASE_URL` otomatik olarak ayarlanacaktır.
- **Port**: Render, portu otomatik olarak yönetir (`$PORT` değişkeni üzerinden).

🚀 Başarılar!
