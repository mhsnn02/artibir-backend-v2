import requests
from bs4 import BeautifulSoup

def ogrenci_belgesi_barkod_kontrol(barkod_kodu: str, kullanici_adi_soyadi: str) -> tuple[bool, str]:
    """
    Kullanıcı e-devletten aldığı belgenin barkodunu girer.
    Sistem arka planda turkiye.gov.tr'ye gider ve belge sahibini kontrol eder.
    
    Args:
        barkod_kodu (str): E-Devlet belge barkodu
        kullanici_adi_soyadi (str): Kontrol edilecek kişinin adı soyadı
        
    Returns:
        tuple[bool, str]: (Başarılı mı, Mesaj)
    """
    # Barkod genelde 2 kısımdan oluşur ama link tek parça kabul eder veya kullanıcıdan tam link istenir.
    # Burada sadece barkod kodu (örn: "ABC123XYZ") varsayıyoruz.
    # Turkiye.gov.tr link yapısı: https://www.turkiye.gov.tr/belge-dogrulama?belge=true&barkod=<KOD>
    
    url = f"https://www.turkiye.gov.tr/belge-dogrulama?belge=true&barkod={barkod_kodu}"
    
    try:
        # User-Agent eklemek iyi bir pratik olabilir, bazı siteler botsuz isteği reddeder.
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            # Sayfa içeriğinde isim arama
            soup = BeautifulSoup(response.content, 'html.parser')
            sayfa_metni = soup.get_text().upper()
            
            # Türkçe karakter dönüşümleri
            tr_map = {
                "i": "İ", "ı": "I", "ş": "Ş", "ğ": "Ğ", 
                "ü": "Ü", "ö": "Ö", "ç": "Ç"
            }
            
            def to_upper_tr(text):
                text = text.replace("i", "İ") 
                text = text.upper()
                return text

            kullanici_adi_upper = to_upper_tr(kullanici_adi_soyadi)
            
            # "ÖĞRENCİ BELGESİ" veya benzeri anahtar kelimeler belgenin türünü doğrular
            # Ancak en kritiği isim eşleşmesidir.
            
            # E-Devlet genelde hatalı barkodda "Belge Bulunamadı" der.
            if "BELGE BULUNAMADI" in sayfa_metni or "HATA" in sayfa_metni:
                 return False, "Geçersiz Barkod veya Belge Bulunamadı."

            if kullanici_adi_upper in sayfa_metni:
                return True, "Belge ve İsim Doğrulandı"
            else:
                return False, "Belge geçerli ancak isim sistemdeki isimle uyuşmuyor."
        else:
            return False, f"E-Devlet Erişim Hatası: {response.status_code}"
            
    except Exception as e:
        return False, f"Doğrulama Hatası: {str(e)}"
