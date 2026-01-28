from PIL import Image
import io
import os
import uuid
from fastapi import UploadFile

# Desteklenen formatlar ve maksimum boyutlar
MAX_IMAGE_SIZE = (1920, 1080)
QUALITY = 85

def process_and_compress_image(file_object):
    """
    Bir resim dosyasını alır, boyutlandırır, sıkıştırır ve 
    kaydedilmeye hazır (filename, file_content) formatında döner.
    """
    try:
        # 1. Resmi Pillow ile aç
        image = Image.open(file_object)
        
        # 2. Oryantasyon bilgisini düzelt (EXIF)
        # Bazı telefon fotoğrafları yan dönük çıkabilir, bunu düzeltmek gerekir.
        try:
            from PIL import ImageOps
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass

        # 3. Format Kontrolü (RGB'ye çevir - örn: PNG alpha kanalı için)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # 4. Yeniden Boyutlandırma (Gerekirse)
        # En boy oranını koruyarak küçültür
        image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
        
        # 5. Çıktı için bellek içi dosya (Buffer)
        output_buffer = io.BytesIO()
        
        # 6. Sıkıştırma ve Kaydetme (WebP veya JPEG)
        # WebP modern ve hafiftir, JPEG uyumluluk için.
        # Burada modern olması için WebP tercih ediyoruz ama istenirse JPEG de olur.
        # Kullanıcı "Artibir" diyor, modern bir şey olsun: WebP
        extension = ".webp"
        image.save(output_buffer, format="WEBP", quality=QUALITY, optimize=True)
        
        output_buffer.seek(0)
        
        # 7. Benzersiz Dosya İsmi
        filename = f"{uuid.uuid4()}{extension}"
        
        return {
            "filename": filename,
            "file": output_buffer,
            "width": image.width,
            "height": image.height
        }

    except Exception as e:
        print(f"Resim işleme hatası: {e}")
        return None
