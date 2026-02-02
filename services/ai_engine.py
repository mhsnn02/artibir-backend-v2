from sqlalchemy.orm import Session
from typing import List
import models
from datetime import datetime, timezone

class AIEngine:
    @staticmethod
    def recommend_events(db: Session, user_id, limit: int = 5) -> List[models.Event]:
        """
        Kullanıcı için AI tabanlı etkinlik önerileri sunar.
        Şimdilik 'Popülerlik' ve 'Yakınlık' bazlı bir hibrit yaklaşım kullanır.
        """
        # 1. Kullanıcının şehri ve kampüsüne göre filtreleme
        user = db.query(models.User).filter(models.User.id == user_id).first()
        
        query = db.query(models.Event).filter(models.Event.status == models.EventStatus.AKTIF)
        
        if user and user.city:
            city_query = query.filter(models.Event.city == user.city)
            events = city_query.order_by(models.Event.date.asc()).limit(limit).all()
            
            # Fallback: Eğer şehirde etkinlik yoksa genel getir
            if not events:
                 events = query.order_by(models.Event.date.asc()).limit(limit).all()
        else:
            events = query.order_by(models.Event.date.asc()).limit(limit).all()
            
        return events

    @staticmethod
    def content_moderation(text: str) -> bool:
        """
        İçerik moderasyonu yapar.
        True dönerse içerik güvenli, False dönerse riskli.
        """
        banned_words = ["küfür1", "argo1", "şiddet", "hakaret"] # Basit placeholder liste
        
        if not text:
            return True
            
        text_lower = text.lower()
        for word in banned_words:
            if word in text_lower:
                return False
        return True

    @staticmethod
    def generate_icebreaker(event_title: str, category: str) -> dict:
        """
        Etkinlik bağlamına göre yapay zeka tarafından buz kırıcı (tanışma) sorusu üretir.
        Şimdilik geniş bir şablon havuzundan akıllı seçim yapar.
        """
        templates = {
            "Spor": [
                f"{event_title} için en sevdiğin sporcu kim?",
                "Spor yaparken dinlediğin favori şarkın nedir?",
                "Hangi spor dalında profesyonel olmak isterdin?"
            ],
            "Eğlence": [
                f"{event_title} denince aklına gelen ilk film nedir?",
                "En son hangi konserde çok eğlendin?",
                "Seni en çok güldüren komedyen kim?"
            ],
            "Eğitim": [
                "Favori çalışma ortamın nasıl olmalı?",
                "Ö öğrenmek istediğin en zor beceri nedir?",
                "Hangi ders senin için en ilham vericiydi?"
            ],
            "Genel": [
                "Buraya gelmeden önce en son ne izledin?",
                "Şu anki ruh halini bir emojiyle anlatır mısın?",
                "Kiminle kahve içip sohbet etmek isterdin? (Hayali veya gerçek)"
            ]
        }
        
        # Kategoriye göre veya genelden seç
        questions = templates.get(category, templates["Genel"])
        import random
        selected = random.choice(questions)
        
        return {
            "question": selected,
            "category": category,
            "is_ai_generated": True
        }
