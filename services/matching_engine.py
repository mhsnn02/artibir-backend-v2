import math
from typing import List, Set
from utils.security_bot import sanitize_input

class MatchingEngine:
    @staticmethod
    def calculate_match_score(user_interests: List[str], target_interests: List[str]) -> float:
        """
        İki kullanıcı arasındaki ilgi alanı uyumunu Cosine Similarity 
        mantığıyla hesaplayan akıllı fonksiyon.
        """
        # GÜVENLİK KONTROLÜ: İlgi alanları içinde zararlı karakter araması
        all_interests = user_interests + target_interests
        for interest in all_interests:
            if not sanitize_input(interest):
                return 0.0 # Güvenlik ihlali varsa uyum sıfırlanır
        
        set_a = set(user_interests)
        set_b = set(target_interests)
        
        # 1. Ortak küme kesişimi
        intersection = set_a.intersection(set_b)
        
        if not set_a or not set_b:
            return 0.0
        
        # 2. Cosine Similarity (Vektör Benzerliği) Formülü Uygulaması
        # Formül: |A ∩ B| / sqrt(|A| * |B|)
        score = len(intersection) / math.sqrt(len(set_a) * len(set_b))
        
        # Sonucu 100'lük sisteme çevirip yuvarlayalım
        return round(score * 100, 2)

    @staticmethod
    def artibir_matcher(user_a: dict, user_b: dict) -> dict:
        """
        Ana fonksiyon: Filtreleme yapar ve skor belirler.
        user_a ve user_b dictionary olmalı ve 'interests', 'university_id' içermeli.
        """
        # KATMAN 1: SERT FİLTRELER (Hard Filters)
        # Farklı üniversitedeki öğrenciler birbirini görmesin (Bootstrap kuralı)
        if user_a.get('university_id') != user_b.get('university_id'):
            return {
                "match": False, 
                "score": 0, 
                "reason": "Farklı üniversite"
            }

        # KATMAN 2: UYUM HESAPLAMA
        match_score = MatchingEngine.calculate_match_score(
            user_a.get('interests', []), 
            user_b.get('interests', [])
        )
        
        # KATMAN 3: KRİTİK EŞİK (Threshold)
        # %30'un altındaki uyumları 'eşleşme' saymıyoruz
        is_match = match_score >= 30.0
        
        common = list(set(user_a.get('interests', [])).intersection(user_b.get('interests', [])))
        
        return {
            "match": is_match,
            "score": match_score,
            "common_interests": common
        }
