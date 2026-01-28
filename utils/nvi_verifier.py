import requests

def verify_tckn(tc_no: int, ad: str, soyad: str, dogum_yili: int) -> bool:
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
    
    # Türkçe karakter sorunu ve büyük harf dönüşümü için basit bir düzeltme
    # Not: Daha kapsamlı bir Türkçe uppercase fonksiyonu gerekebilir ama şimdilik basic upper.
    ad_upper = ad.upper().replace('i', 'İ').replace('ı', 'I')
    soyad_upper = soyad.upper().replace('i', 'İ').replace('ı', 'I')
    
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
        return "<TCKimlikNoDogrulaResult>true</TCKimlikNoDogrulaResult>" in response.text
    except Exception as e:
        print(f"NVI Error: {e}")
        return False
