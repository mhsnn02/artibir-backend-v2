import re
from fastapi import HTTPException

def sanitize_input(text: str):
    """
    Zararlı olabilecek SQL ve HTML kalıplarını kontrol eder.
    True dönerse temiz, False dönerse tehlikeli.
    """
    if not text or not isinstance(text, str):
        return True
        
    danger_zone = [
        r"<script.*?>.*?</script>", # XSS
        r"UNION SELECT",             # SQL Injection
        r"OR 1=1",                   # Klasik SQL Atlatma
        r"drop table",               # Veri silme girişimi
        r"exec\(",                   # Kod çalıştırma
        r"javascript:",               # JS Protocol
    ]
    
    for pattern in danger_zone:
        if re.search(pattern, text, re.IGNORECASE):
            return False
    return True

def validate_input_raise(text: str, field_name: str = "Input"):
    """
    Sanitize kontrolü yapar ve başarısız olursa HTTP 400 döner.
    """
    if not sanitize_input(text):
        raise HTTPException(
            status_code=400, 
            detail=f"Güvenlik Botu: '{field_name}' alanında şüpheli karakterler tespit edildi!"
        )
    return True
