import requests
from bs4 import BeautifulSoup
import random
from datetime import datetime, timedelta
import schemas

class ScraperService:
    @staticmethod
    def scrape_events_by_location(location: str):
        """
        Verilen konuma göre internetten etkinlikleri tarar.
        Gerçek dünya senaryosunda bu metod Biletix, Passo vb. sitelere istek atar.
        Örnek olarak burada bir requests + bs4 yapısı kurulmuştur ancak 
        her sitenin yapısı farklı olduğu için demo amaçlı 'Akıllı Simülasyon' modundadır.
        """
        print(f"[{location}] için etkinlikler taranıyor...")
        
        # Gerçek bir HTTP isteği örneği (Bir siteye gidip title çekmek gibi)
        # try:
        #     url = f"https://www.google.com/search?q={location}+etkinlikleri"
        #     headers = {'User-Agent': 'Mozilla/5.0 ...'}
        #     response = requests.get(url, headers=headers)
        #     soup = BeautifulSoup(response.content, 'lxml')
        #     # print(soup.title.string) 
        # except Exception as e:
        #     print(f"Scraping hatası: {e}")

        # Simüle Edilmiş "Scraped" Veriler
        # Bu kısım botun bulduğu verileri temsil eder.
        
        found_events = []
        
        titles = [
            f"{location} Yaz Festivali",
            f"{location} Teknoloji Zirvesi",
            f"{location} Caz Gecesi",
            f"{location} Tiyatro Günleri",
            f"{location} Kahve Festivali"
        ]
        
        categories = ["Festival", "Konferans", "Konser", "Tiyatro", "Yeme-İçme"]
        
        for i in range(random.randint(3, 6)):
            title = titles[i] if i < len(titles) else f"{location} Etkinliği #{i+1}"
            category = categories[i] if i < len(categories) else "Diğer"
            
            # Rastgele koordinat sapması (Şehir merkezinden biraz dağıtıyoruz)
            # Varsayılan (İstanbul): 41.0, 29.0
            lat_base = 41.0082
            lon_base = 28.9784
            
            if "ankara" in location.lower():
                lat_base, lon_base = 39.9334, 32.8597
            elif "izmir" in location.lower():
                 lat_base, lon_base = 38.4192, 27.1287
            # ... diğer şehirler eklenebilir
            
            event = schemas.EventCreate(
                title=title,
                description=f"{location} şehrinde düzenlenen harika bir {category.lower()} etkinliği. İnternetten otomatik çekildi.",
                date=datetime.now() + timedelta(days=random.randint(1, 14)),
                latitude=lat_base + random.uniform(-0.03, 0.03),
                longitude=lon_base + random.uniform(-0.03, 0.03),
                min_age_limit=18,
                max_age_limit=40,
                target_gender=schemas.TargetGender.HERKES,
                category=category,
                status=schemas.EventStatus.AKTIF,
                city=location.capitalize(),
                image_url=f"https://source.unsplash.com/random/800x600?{category.lower()},event",
                external_url="https://google.com/search?q=" + title.replace(" ", "+")
            )
            found_events.append(event)
            
        return found_events
