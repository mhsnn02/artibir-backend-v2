from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

# Şifreleme anahtarı .env'den gelir veya yoksa oluşturulur.
# Gerçek production ortamında bu key SAKLANMALIDIR! Kaybolursa veriler ÇÖZÜLEMEZ.
KEY = os.getenv("ENCRYPTION_KEY")

if not KEY:
    # Key yoksa geçici bir key oluşturuyoruz (Demo amaçlı).
    # Normalde bu key .env dosyasına yazılmalıdır.
    KEY = Fernet.generate_key()
    # print(f"UYARI: Şifreleme anahtarı (ENCRYPTION_KEY) .env içinde bulunamadı. Geçici key: {KEY.decode()}")

cipher_suite = Fernet(KEY)

def encrypt_message(message: str) -> str:
    """Mesajı şifreler ve string olarak döner."""
    return cipher_suite.encrypt(message.encode()).decode()

def decrypt_message(encrypted_message: str) -> str:
    """Şifreli mesajı çözer ve string olarak döner."""
    try:
        return cipher_suite.decrypt(encrypted_message.encode()).decode()
    except Exception:
        return "[Şifre Çözülemedi]"
