import re
import json
import os

BAD_WORDS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tr_bad_words.json")

class SecurityGuard:
    def __init__(self):
        self.bad_words = self._load_bad_words()
        print("🛡️ Güvenlik Botu: Temel kurallar aktif (NLP devre dışı).")

    def _load_bad_words(self):
        """tr_bad_words.json dosyasından yasaklı kelimeleri yükler."""
        try:
            if os.path.exists(BAD_WORDS_FILE):
                with open(BAD_WORDS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"Bad words file load error: {e}")
        
        return [
            "aptal", "gerizekalı", "salak", "küfür1", "küfür2", 
            "taciz1", "şiddet1", "+18kelime", "şerefsiz"
        ]

    def check_message(self, message: str, user_trust_score: int):
        """Mesajı analiz eder."""
        clean_text = message.lower()
        
        # 1. Kendi listemizden küfür kontrolü
        for word in self.bad_words:
            if word in clean_text:
                return False, "Mesajınız topluluk kurallarına aykırı kelimeler içeriyor."

        # 2. Telefon numarası kontrolü (Güven puanı < 70 ise)
        if user_trust_score < 70:
            phone_pattern = r"(?:\+90|0)?5\d{2}[\s\.]?\d{3}[\s\.]?\d{2}[\s\.]?\d{2}"
            if re.search(phone_pattern, message):
                return False, "Güvenliğiniz için tanışmadan hemen telefon numarası paylaşamazsınız."

        # 3. Uzunluk kontrolü
        if len(message.strip()) < 2:
            return False, "Lütfen anlamlı bir cümle kurun."

        return True, "Onaylandı"

    def filter_message(self, content: str) -> str:
        """Mesajı sansürler."""
        filtered_content = content
        for word in self.bad_words:
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            filtered_content = pattern.sub("*" * len(word), filtered_content)
        return filtered_content

guard = SecurityGuard()

def filter_message(content: str) -> str:
    return guard.filter_message(content)

def check_message(message: str, user_trust_score: int = 50):
    return guard.check_message(message, user_trust_score)
