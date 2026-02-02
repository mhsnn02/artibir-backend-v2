import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Email Config
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# SMS Config
SMS_API_URL = os.getenv("SMS_API_URL")
SMS_API_KEY = os.getenv("SMS_API_KEY")
SMS_SENDER_TITLE = os.getenv("SMS_SENDER_TITLE", "ARTIBIR")

def send_email(to_email: str, subject: str, body: str, html_body: str = None) -> bool:
    """
    SMTP protokolü ile e-posta (HTML destekli) gönderir.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️ SMTP credentials not found. Skipping email sending.")
        return False

    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"ArtıBir Ekibi <{SMTP_USER}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Plain text versiyonu
        part1 = MIMEText(body, "plain")
        message.attach(part1)
        
        # HTML versiyonu (Eğer varsa)
        if html_body:
            part2 = MIMEText(html_body, "html")
            message.attach(part2)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, message.as_string())
        
        return True
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return False

def send_sms(to_phone: str, message: str) -> bool:
    """
    HTTP Post isteği ile SMS gönderir (Genel yapı).
    API Sağlayıcınıza göre payload (data) kısmını düzenlemeniz gerekebilir.
    """
    if not SMS_API_URL or not SMS_API_KEY:
        print("⚠️ SMS settings not found. Skipping SMS sending.")
        return False

    try:
        # Örnek Payload (Netgsm, IletiMerkezi vb. benzer yapılar kullanır)
        # Sağlayıcınızın dokümantasyonuna göre burayı düzenleyin.
        payload = {
            "apikey": SMS_API_KEY,
            "header": SMS_SENDER_TITLE,
            "message": message,
            "phones": [to_phone]
        }
        
        # Bazı sağlayıcılar XML ister, bazıları JSON. Bu örnek JSON içindir.
        response = requests.post(SMS_API_URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"SMS Sent Response: {response.text}")
            return True
        else:
            print(f"SMS Failed Status: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ SMS sending failed: {e}")
        return False
