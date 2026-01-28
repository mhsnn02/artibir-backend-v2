from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
import enum
import re

# Enums
class Gender(str, enum.Enum):
    E = "E"
    K = "K"

class TargetGender(str, enum.Enum):
    HERKES = "Herkes"
    SADECE_KIZLAR = "Sadece Kızlar"
    SADECE_ERKEKLER = "Sadece Erkekler"

class EventStatus(str, enum.Enum):
    AKTIF = "Aktif"
    DOLDU = "Doldu"
    IPTAL = "İptal"
    TAMAMLANDI = "Tamamlandı"

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    city: Optional[str] = None
    
    # New Fields
    birth_date: date
    gender: Gender
    department: Optional[str] = None

    @field_validator('phone_number')
    def validate_phone_number(cls, v):
        if v is None: return v
        pattern = r"^\+?[1-9]\d{1,14}$"
        if not re.match(pattern, v):
            raise ValueError('Telefon numarası geçersiz. Örnek: +905551234567')
        return v

    @field_validator('email')
    def validate_edu_email(cls, v):
        if not v.endswith('.edu.tr'):
            raise ValueError('Sadece üniversite e-postaları (.edu.tr) kabul edilmektedir.')
        return v

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8: raise ValueError('Şifre en az 8 karakter olmalıdır.')
        if not re.search(r"[A-Z]", v): raise ValueError('Şifre en az bir büyük harf içermelidir.')
        if not re.search(r"[a-z]", v): raise ValueError('Şifre en az bir küçük harf içermelidir.')
        if not re.search(r"\d", v): raise ValueError('Şifre en az bir rakam içermelidir.')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator('email')
    def validate_edu_email(cls, v):
        if not v.endswith('.edu.tr'):
            raise ValueError('Giriş yapmak için .edu.tr uzantılı e-posta adresinizi kullanmalısınız.')
        return v

class UserOut(UserBase):
    id: UUID
    profile_image: Optional[str] = None
    is_verified: bool
    student_document_url: Optional[str] = None
    trust_score: int
    wallet_balance: float
    
    # Settings & Verification
    bio: Optional[str] = None
    favorite_music_url: Optional[str] = None
    is_private: bool
    ghost_mode: bool
    theme_preference: str
    language_preference: str
    
    # Verification Info
    blue_tick_status: str
    is_verified: bool

    # Current Location
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    favorite_music_url: Optional[str] = None
    profile_image: Optional[str] = None
    tc_no: Optional[str] = None
    birth_date: Optional[date] = None
    id_card_front_url: Optional[str] = None
    id_card_front_url: Optional[str] = None
    id_card_back_url: Optional[str] = None

class StudentVerifyRequest(BaseModel):
    barcode: str
    full_name: Optional[str] = None # Eğer boşsa mevcut kullanıcı adı kullanılır

class UserSettingsUpdate(BaseModel):
    is_private: Optional[bool] = None
    ghost_mode: Optional[bool] = None
    show_way_to_everyone: Optional[bool] = None
    theme_preference: Optional[str] = None
    language_preference: Optional[str] = None
    data_saver_mode: Optional[bool] = None
    notify_event_reminders: Optional[bool] = None
    notify_campus_announcements: Optional[bool] = None
    notify_social: Optional[bool] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class LoginDeviceOut(BaseModel):
    id: int
    device_name: str
    last_login: datetime
    ip_address: Optional[str]
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)

class SavedCardOut(BaseModel):
    id: int
    card_holder: str
    last_four: str
    card_type: str
    expiry_date: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class SupportTicketCreate(BaseModel):
    subject: str
    message: str

class SupportTicketOut(BaseModel):
    id: int
    subject: str
    message: str
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Event Schemas ---
class EventBase(BaseModel):
    title: str
    description: str
    date: datetime
    
    # Location updates
    latitude: float
    longitude: float

    min_age_limit: int
    max_age_limit: int
    target_gender: TargetGender = TargetGender.HERKES
    status: EventStatus = EventStatus.AKTIF

    # New Fields from SQL
    campus_restriction: Optional[str] = None
    gender_restriction: Optional[str] = None
    deposit_amount: float = 0.00
    session_token: Optional[str] = None

    city: Optional[str] = None
    campus: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    external_url: Optional[str] = None
    
    # Eksik Kolonlar
    capacity: int = 10
    price: float = 0.00
    location_name: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventOut(EventBase):
    id: UUID
    host_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# --- Message Schemas ---
class MessageCreate(BaseModel):
    receiver_id: UUID
    content: str
    
    @field_validator('content')
    def validate_content(cls, v):
        if not v.strip(): raise ValueError('Mesaj boş olamaz.')
        if len(v) > 1000: raise ValueError('Mesaj çok uzun.')
        return v

class MessageOut(BaseModel):
    id: int
    sender_id: UUID
    receiver_id: UUID
    content: str
    timestamp: datetime
    is_read: bool

    model_config = ConfigDict(from_attributes=True)

# --- Marketplace Schemas ---
class MarketplaceItemBase(BaseModel):
    title: str
    description: str
    price: float
    category: str # Kitap, Eşya, Not
    image_url: Optional[str] = None

class MarketplaceItemCreate(MarketplaceItemBase):
    pass

class MarketplaceItemOut(MarketplaceItemBase):
    id: int
    owner_id: UUID
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Review Schemas ---
class UserReviewCreate(BaseModel):
    reviewed_id: UUID
    event_id: Optional[UUID] = None
    rating: int 
    comment: Optional[str] = None

    @field_validator('rating')
    def validate_rating(cls, v):
        if not 1 <= v <= 5: raise ValueError('Puan 1 ile 5 arasında olmalıdır.')
        return v

class UserReviewOut(BaseModel):
    id: int
    reviewer_id: UUID
    reviewed_id: UUID
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Venue (Discount Map) Schemas ---
class CampusVenueOut(BaseModel):
    id: Optional[int] = None
    name: str
    latitude: float
    longitude: float
    address: str
    discount_rate: int
    category: str
    
    model_config = ConfigDict(from_attributes=True)

# --- Payment & Iyzico Schemas ---
class PaymentInitialize(BaseModel):
    card_holder_name: str
    card_number: str
    expire_month: str
    expire_year: str
    cvc: str
    amount: float
    register_card: bool = False

class Payment3DSResult(BaseModel):
    status: str
    paymentId: Optional[str] = None
    conversationId: Optional[str] = None
    mdStatus: Optional[str] = None # 3DS Status

class TransactionOut(BaseModel):
    id: int
    amount: float
    status: str
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Location Schemas ---
class LocationUpdate(BaseModel):
    user_id: UUID
    latitude: float
    longitude: float
    is_ghost_mode: bool = False

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
