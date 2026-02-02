import requests

def verify_tckn(tc_no: int, ad: str, soyad: str, dogum_yili: int) -> tuple[bool, str]:
    """
    NVİ (Nüfus ve Vatandaşlık İşleri) Public API üzerinden TCKN doğrulaması yapar.
    
    Args:
        tc_no (int): 11 haneli TC Kimlik Numarası
        ad (str): Kişinin adı (Büyük harfle gönderilmeli, ancak fonksiyon içinde çevrilecek)
        soyad (str): Kişinin soyadı
        dogum_yili (int): Doğum yılı (Örn: 2003)
        
    Returns:
        bool: Doğrulama başarılıysa True, değilse False
    """
    url = "https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx"
    
    # Türkçe karakter sorunu ve büyük harf dönüşümü
    # Önce küçük i'leri büyük İ yap, sonra diğerlerini çevir.
    tr_map = {
        "i": "İ", "ı": "I", "ş": "Ş", "ğ": "Ğ", 
        "ü": "Ü", "ö": "Ö", "ç": "Ç"
    }
    
    def to_upper_tr(text):
        text = text.replace("i", "İ") # Öncelikli kritik dönüşüm
        text = text.upper()
        # Diğerleri zaten upper ile düzgün gelir ama garanti olsun diye map check yapılabilir
        # Ancak Python upper() unicode destekli olduğu için ş/Ş gibi karakterleri genelde doğru yapar.
        # Sadece i/I karışıklığı boldur.
        return text

    ad_upper = to_upper_tr(ad)
    soyad_upper = to_upper_tr(soyad)
    
    body = f"""
    <?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">
          <TCKimlikNo>{tc_no}</TCKimlikNo>
          <Ad>{ad_upper}</Ad>
          <Soyad>{soyad_upper}</Soyad>
          <DogumYili>{dogum_yili}</DogumYili>
        </TCKimlikNoDogrula>
      </soap:Body>
    </soap:Envelope>
    """
    headers = {'Content-Type': 'text/xml; charset=utf-8'}
    
    try:
        response = requests.post(url, data=body.encode('utf-8'), headers=headers)
        # Yanıt kontrolü
        result = "<TCKimlikNoDogrulaResult>true</TCKimlikNoDogrulaResult>" in response.text
        if result:
            return True, "TC Kimlik doğrulama başarılı."
        else:
            return False, "Bilgiler Nüfus Müdürlüğü kayıtlarıyla eşleşmedi."
    except Exception as e:
        print(f"NVI Error: {e}")
        return False, "NVİ Servisine erişilemedi."
