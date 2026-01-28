import enum
import uuid
import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Enum as SAEnum, Numeric, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
# from geoalchemy2 import Geography # SQLite için kapattık

# Enums
class Gender(enum.Enum):
    E = "E"
    K = "K"

class TargetGender(enum.Enum):
    HERKES = "Herkes"
    SADECE_KIZLAR = "Sadece Kızlar"
    SADECE_ERKEKLER = "Sadece Erkekler"

class EventStatus(enum.Enum):
    AKTIF = "Aktif"
    DOLDU = "Doldu"
    IPTAL = "İptal"
    TAMAMLANDI = "Tamamlandı"

class ParticipantStatus(enum.Enum):
    APPROVED = "approved"
    BANNED = "banned"
    WAITLIST = "waitlist"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    full_name = Column(String)
    profile_image = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    city = Column(String, index=True, nullable=True)
    
    # Updated & New Fields
    is_verified = Column(Boolean, default=False)
    student_document_url = Column(String(255), nullable=True)
    birth_date = Column(Date, nullable=False)
    gender = Column(SAEnum(Gender), nullable=False)
    trust_score = Column(Integer, default=100) 
    wallet_balance = Column(Numeric(10, 2), default=0.00)
    department = Column(String, nullable=True)
    
    # --- AYARLAR VE AKTİVİTE MERKEZİ ALANLARI ---
    bio = Column(Text, nullable=True)
    favorite_music_url = Column(String(255), nullable=True)
    
    # Gizlilik
    is_private = Column(Boolean, default=False)
    ghost_mode = Column(Boolean, default=False)
    show_way_to_everyone = Column(Boolean, default=True) # "Yoldayım" modu kimlere görünsün?
    
    # Tercihler
    theme_preference = Column(String(20), default="dark") # dark, light
    language_preference = Column(String(10), default="tr") # tr, en
    data_saver_mode = Column(Boolean, default=False)
    
    # Bildirimler
    notify_event_reminders = Column(Boolean, default=True)
    notify_campus_announcements = Column(Boolean, default=True)
    notify_social = Column(Boolean, default=True)
    
    # --- KONUM TAKİBİ ---
    current_latitude = Column(Numeric(10, 8), nullable=True)
    current_longitude = Column(Numeric(11, 8), nullable=True)
    last_location_update = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # --- KİMLİK DOĞRULAMA VE MAVİ TİK ---
    tc_no = Column(String(11), nullable=True) # 11 haneli TC No
    id_card_front_url = Column(String(255), nullable=True)
    id_card_back_url = Column(String(255), nullable=True)
    blue_tick_status = Column(String(20), default="none") # none, pending, approved, rejected
    
    # Email & Phone Verification
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    email_verification_code = Column(String(6), nullable=True)
    phone_verification_code = Column(String(6), nullable=True)
    
    # Student Document Verification
    student_document_barcode = Column(String(50), nullable=True)
    is_student_verified = Column(Boolean, default=False)

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    title = Column(String, index=True)
    description = Column(String)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Location: Enlem/Boylam verisi
    # Location: Enlem/Boylam verisi
    # SQLite uyumluluğu için Geography yerine normal string (WKT formatında tutulabilir)
    # Veya sadece lat/lon ayrı kolonlarda tutulmalı.
    # Şimdilik hata vermemesi için bunu string yapıyoruz veya pass geçiyoruz (zaten lat/lon var mı?)
    # Modelde location var ama crud.py lat/lon kullanıyor ve WKT'ye çeviriyor.
    # SQLite hatasını önlemek için type'ı String yapıyoruz.
    location = Column(String, nullable=True)
    
    # SQLite ve Bounding Box sorguları için gerekli
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    
    min_age_limit = Column(Integer)
    max_age_limit = Column(Integer)
    target_gender = Column(SAEnum(TargetGender), default=TargetGender.HERKES)
    status = Column(SAEnum(EventStatus), default=EventStatus.AKTIF)
    
    # New Fields based on User's SQL
    campus_restriction = Column(String(100), nullable=True)
    gender_restriction = Column(String(10), nullable=True) # User requested 'mixed', 'female_only' etc.
    deposit_amount = Column(Numeric(10, 2), default=0.00)
    session_token = Column(String(255), nullable=True)

    city = Column(String, index=True, nullable=True)
    campus = Column(String, index=True, nullable=True)
    category = Column(String, index=True, nullable=True)
    image_url = Column(String, nullable=True)
    external_url = Column(String, nullable=True)
    
    # Eksik Kolonlar
    capacity = Column(Integer, default=10) # Maksimum katılımcı sayısı
    price = Column(Numeric(10, 2), default=0.00) # Ücretli etkinlikler için
    location_name = Column(String(255), nullable=True) # "Mecidiyeköy Starbucks" gibi açık adres

    host = relationship("User", foreign_keys=[host_id])

class EventParticipant(Base):
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(String(20), default="approved") # approved, banned, waitlist
    payment_status = Column(String(20), default="pending") # pending, paid, refunded
    qr_scanned = Column(Boolean, default=False)
    check_in_time = Column(DateTime, nullable=True)

    __table_args__ = (UniqueConstraint('event_id', 'user_id', name='_event_user_uc'),)

    event = relationship("Event")
    user = relationship("User")

class UserReport(Base):
    __tablename__ = "user_reports"

    id = Column(Integer, primary_key=True)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reported_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"))
    reason = Column(String(50)) # noshow, harassment, toxic
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LiveTracking(Base):
    __tablename__ = "event_live_tracking"

    id = Column(Integer, primary_key=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    status = Column(String(20), default="waiting") # on_way, arrived
    transport_type = Column(String(20), default="walk")
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class VoiceRoom(Base):
    __tablename__ = "voice_rooms"

    id = Column(Integer, primary_key=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), unique=True)
    room_token = Column(String(255))
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)

class IcebreakerQuestion(Base):
    __tablename__ = "icebreaker_questions"

    id = Column(Integer, primary_key=True)
    category = Column(String(50)) # Tanışma, Eğlence, Spor
    question_text = Column(Text)
    is_active = Column(Boolean, default=True)

class ChatLog(Base):
    __tablename__ = "activity_chat_logs"

    id = Column(Integer, primary_key=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"))
    question_id = Column(Integer, ForeignKey("icebreaker_questions.id"))
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    icon_url = Column(String(255))
    criteria_type = Column(String(50))
    threshold = Column(Integer)

class UserBadge(Base):
    __tablename__ = "user_badges"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    badge_id = Column(Integer, ForeignKey("badges.id"), primary_key=True)
    earned_at = Column(DateTime, default=datetime.datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class LoginDevice(Base):
    __tablename__ = "login_devices"
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    device_name = Column(String(100))
    last_login = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String(45))
    is_active = Column(Boolean, default=True)

class EventLike(Base):
    __tablename__ = "event_likes"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), primary_key=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SavedCard(Base):
    __tablename__ = "saved_cards"
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    card_holder = Column(String(100))
    last_four = Column(String(4))
    card_type = Column(String(20)) # visa, mastercard, troy
    card_token = Column(String(255), nullable=True) # Iyzico cardToken
    card_user_key = Column(String(255), nullable=True) # Iyzico cardUserKey
    expiry_date = Column(String(5), nullable=True) # MM/YY

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    subject = Column(String(100))
    message = Column(Text)
    status = Column(String(20), default="open") # open, closed, pending
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount = Column(Numeric(10, 2))
    payment_id = Column(String(50), nullable=True)
    conversation_id = Column(String(50), nullable=True) # Iyzico conversationId
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)
    transaction_type = Column(String(20)) # deposit, payment, refund
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")

class MarketplaceItem(Base):
    __tablename__ = "marketplace_items"
    id = Column(Integer, primary_key=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String(100), index=True)
    description = Column(Text)
    price = Column(Numeric(10, 2))
    category = Column(String(50), index=True) # Kitap, Eşya, Not vb.
    image_url = Column(String(255), nullable=True)
    status = Column(String(20), default="active") # active, sold, deleted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User")

class UserReview(Base):
    __tablename__ = "user_reviews"
    id = Column(Integer, primary_key=True)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=True)
    rating = Column(Integer) # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewed = relationship("User", foreign_keys=[reviewed_id])

class CampusVenue(Base):
    __tablename__ = "campus_venues"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), index=True)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    address = Column(String(255))
    discount_rate = Column(Integer) # Yüzde indirim
    category = Column(String(50)) # Kafe, Restoran, Kitabevi
    is_active = Column(Boolean, default=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String(100))
    message = Column(Text)
    type = Column(String(20)) # system, event, social
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
