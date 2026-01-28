import re
import json
import os

BAD_WORDS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "tr_bad_words.json")

class SecurityGuard:
    def __init__(self):
        self.bad_words = self._load_bad_words()

    def _load_bad_words(self):
        """
        tr_bad_words.json dosyasından yasaklı kelimeleri yükler.
        Dosya yoksa default listeyi kullanır.
        """
        try:
            if os.path.exists(BAD_WORDS_FILE):
                with open(BAD_WORDS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"Bad words file load error: {e}")
        
        # Fallback list
        return [
            "aptal", "gerizekalı", "salak", "küfür1", "küfür2", 
            "taciz1", "şiddet1", "+18kelime", "şerefsiz"
        ]

    def check_message(self, message: str, user_trust_score: int):
        """
        Mesajı analiz eder. 
        Dönüş: (is_safe: bool, reason: str)
        """
        
        # A. Metni Temizle (Büyük küçük harf)
        clean_text = message.lower()
        
        # -----------------------------------------------------------
        # KURAL 1: KÜFÜR VE HAKARET KONTROLÜ
        # -----------------------------------------------------------
        for word in self.bad_words:
            # Kelimenin kendisi var mı? 
            # (Basit kontrol, regex ile geliştirilebilir)
            if word in clean_text:
                return False, "Mesajınız topluluk kurallarına aykırı kelimeler içeriyor."

        # -----------------------------------------------------------
        # KURAL 2: TELEFON NUMARASI PAYLAŞIMI (GÜVENLİK İÇİN)
        # -----------------------------------------------------------
        # Eğer kullanıcının güven puanı düşükse (yeni üyeyse) numara veremez.
        # Varsayılan limit 70 puan.
        if user_trust_score < 70:
            # Regex: 05xxxxxxxxx veya 5xxxxxxxxx formatını yakalar
            # \s* boşluk karakterlerini yakalar
            phone_pattern = r"(?:\+90|0)?5\d{2}[\s\.]?\d{3}[\s\.]?\d{2}[\s\.]?\d{2}"
            if re.search(phone_pattern, message):
                return False, "Güvenliğiniz için tanışmadan hemen telefon numarası paylaşamazsınız."

        # -----------------------------------------------------------
        # KURAL 3: AGRESİF TANIŞMA (Basit NLP)
        # -----------------------------------------------------------
        # Tek kelimelik veya çok kısa, spam vari mesajlar
        # Ancak "Selam" gibi tek kelime olabilir, o yüzden < 2 çok kısa.
        if len(message.strip()) < 2:
            return False, "Lütfen anlamlı bir cümle kurun."

        # Her şey temizse onayı ver
        return True, "Onaylandı"

    def filter_message(self, content: str) -> str:
        """
        (Opsiyonel) Mesajı sansürleyerek döndürür.
        Eski sistemde kullanıldığı için uyumluluk adına eklendi.
        Eğer check_message False dönerse mesaj hiç gönderilmeyebilir,
        ama gönderilecekse sansürlenebilir.
        """
        filtered_content = content
        for word in self.bad_words:
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            filtered_content = pattern.sub("*" * len(word), filtered_content)
        return filtered_content

# Singleton instance
guard = SecurityGuard()

# Eski fonksiyonların yeni sınıfa yönlendirilmesi (Geriye dönük uyumluluk)
def filter_message(content: str) -> str:
    return guard.filter_message(content)

def check_message(message: str, user_trust_score: int = 50):
    return guard.check_message(message, user_trust_score)
