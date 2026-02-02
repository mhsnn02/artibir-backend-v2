import React, { useState, useEffect } from 'react';
import { reviewService } from '../services/api_service';
import { useAuth } from '../context/AuthProvider';
import { Star, MessageSquare, User, Loader2, Sparkles } from 'lucide-react';

const ReviewsSection = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ average_rating: 0, count: 0 });
    const [loading, setLoading] = useState(false);
    
    // Demo Review Form Stats
    const [showForm, setShowForm] = useState(false);
    const [targetId, setTargetId] = useState('');
    const [eventId, setEventId] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchReviews(user.id);
        }
    }, [user]);

    const fetchReviews = async (userId) => {
        setLoading(true);
        try {
            const [reviewsRes, statsRes] = await Promise.all([
                reviewService.getUserReviews(userId),
                reviewService.getAverageRating(userId)
            ]);
            setReviews(reviewsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Yorumlar yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Demo: Kendine review atamazsın hatası alabiliriz eğer targetId kendi ID'n ise.
            // Bu form demo amaçlıdır.
            await reviewService.createReview({
                reviewed_id: targetId,
                event_id: eventId || null, // Optional
                rating:  parseInt(rating),
                comment: comment
            });
            alert("Yorum gönderildi!");
            setShowForm(false);
            if (targetId === user.id) fetchReviews(user.id); // Refresh if commented on self (testing)
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "Bilinmeyen hata"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Star size={28} fill="orange" stroke="orange" /> Değerlendirmelerim
                </h2>
                
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="primary-btn"
                    style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                    {showForm ? 'Kapat' : '+ Yorum Yaz (Demo)'}
                </button>
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-card" style={{ flex: 1, padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'orange' }}>{stats.average_rating}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Ortalama Puan</div>
                </div>
                <div className="glass-card" style={{ flex: 1, padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>{stats.count}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Toplam Yorum</div>
                </div>
            </div>

            {/* Demo Form */}
            {showForm && (
                <form onSubmit={handleCreateReview} style={{ marginBottom: '30px', padding: '20px', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                    <h4>Yorum Yap (Test)</h4>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
                        * Normalde bu ekran, etkinlik bittiğinde otomatik açılır. Burada manuel test edebilirsin.
                        <br/>
                        * Kendi ID'ne yorum atamazsın. Başka bir User ID bulmalısın.
                    </p>
                    <input 
                        placeholder="Hedef Kullanıcı ID (UUID)" 
                        value={targetId} onChange={e => setTargetId(e.target.value)}
                        style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: 'none' }}
                        required
                    />
                    <select 
                        value={rating} onChange={e => setRating(e.target.value)}
                        style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: 'none' }}
                    >
                        <option value="5">5 Yıldız - Mükemmel</option>
                        <option value="4">4 Yıldız - İyi</option>
                        <option value="3">3 Yıldız - Orta</option>
                        <option value="2">2 Yıldız - Kötü</option>
                        <option value="1">1 Yıldız - Berbat</option>
                    </select>
                    <textarea 
                        placeholder="Yorumunuz..."
                        value={comment} onChange={e => setComment(e.target.value)}
                        style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: 'none' }}
                        required 
                    />
                    <button type="submit" className="primary-btn" disabled={submitting}>
                        {submitting ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                </form>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="flex-center" style={{ padding: '40px' }}><Loader2 className="animate-spin" /></div>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <MessageSquare size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                    <p>Henüz hakkında yapılmış bir yorum yok.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reviews.map(review => (
                        <div key={review.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={16} />
                                    </div>
                                    <span style={{ fontWeight: 'bold' }}>Kullanıcı (ID: {review.reviewer_id.slice(0, 5)}...)</span>
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < review.rating ? "orange" : "none"} color={i < review.rating ? "orange" : "#666"} />
                                    ))}
                                </div>
                            </div>
                            <p style={{ color: '#ddd', fontSize: '15px', lineHeight: '1.5' }}>
                                "{review.comment}"
                            </p>
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                {new Date(review.created_at).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewsSection;
