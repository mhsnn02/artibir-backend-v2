from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import shutil
import os
import sys

# Parent directory for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.image_processor import process_and_compress_image

router = APIRouter(tags=["Media"])

# Resimlerin kaydedileceği yer (Sunucu içinde)
UPLOAD_DIR = "uploads/images"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Sunucu adresi production'da değişeceği için relative path kullanıyoruz.

@router.post("/api/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Kullanıcı profili veya etkinlik için resim yükleme servisi.
    Otomatik sıkıştırma ve güvenlik önlemi içerir.
    """
    # 1. Sadece resim dosyası mı kontrol et
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Sadece resim dosyası yükleyebilirsiniz.")

    try:
        # 2. Resmi işleme motoruna gönder (Sıkıştırma & Format Değiştirme)
        # file.file file-like objesidir
        processed_data = process_and_compress_image(file.file)
        
        if not processed_data:
            raise HTTPException(status_code=500, detail="Resim işlenirken hata oluştu.")

        # 3. Dosyayı diske kaydet
        file_path = os.path.join(UPLOAD_DIR, processed_data["filename"])
        
        with open(file_path, "wb") as f:
            f.write(processed_data["file"].read())

        return JSONResponse(content={
            "status": "success",
            "file_url": f"/images/{processed_data['filename']}",
            "original_name": file.filename,
            "width": processed_data["width"],
            "height": processed_data["height"]
        })

    except Exception as e:
        # Hata logu
        print(f"Upload Hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sunucu hatası: {str(e)}")
