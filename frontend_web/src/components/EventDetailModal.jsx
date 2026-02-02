import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, User, Users, Clock, Share2, Loader2, ArrowRight, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { participantService } from '../services/api_service';
import { useAuth } from '../context/AuthProvider';
import VerificationAlert from './VerificationAlert';

const EventDetailModal = ({ event, onClose, onNavigateToVerification }) => {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showVerifyAlert, setShowVerifyAlert] = useState(false);

    const isHost = currentUser && event && currentUser.id === event.host_id;

    if (!event) return null;

    const formattedDate = new Date(event.date).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    const formattedTime = new Date(event.date).toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit'
    });

    const getGenderLabel = (g) => {
        const mapping = {
            'HERKES': 'Herkes Katılabilir',
            'SADECE_KIZLAR': 'Sadece Kızlar',
            'SADECE_ERKEKLER': 'Sadece Erkekler'
        };
        return mapping[g] || g;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.95 }}
                    className="glass-card"
                    style={{ 
                        width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', 
                        padding: '0', position: 'relative', background: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={onClose}
                        style={{ 
                            position: 'absolute', top: '15px', right: '15px', 
                            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', 
                            borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', 
                            zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Header Image */}
                    <div style={{ height: '280px', position: 'relative', background: '#1e293b' }}>
                        {event.image_url ? (
                            <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div className="flex-center" style={{ height: '100%', color: '#475569', flexDirection: 'column', gap: '10px' }}>
                                <Share2 size={48} opacity={0.2} />
                                <span>Görsel Eklenmemiş</span>
                            </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '100px', background: 'linear-gradient(to top, #0f172a, transparent)' }} />
                        
                        <div style={{ position: 'absolute', bottom: '20px', left: '30px' }}>
                            <span style={{ 
                                background: 'var(--accent-primary)', color: 'white', padding: '4px 12px', 
                                borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
                                letterSpacing: '1px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                            }}>
                                {event.category || "Genel"}
                            </span>
                        </div>
                    </div>

                    <div style={{ padding: '0 30px 30px 30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px', color: 'white', lineHeight: '1.1' }}>
                                {event.title}
                            </h2>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ 
                                    fontSize: '24px', fontWeight: '900', color: event.price > 0 ? 'var(--success)' : 'white'
                                }}>
                                    {event.price > 0 ? `${event.price}₺` : 'ÜCRETSİZ'}
                                </div>
                                {event.price > 0 && <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Güvenli Ödeme</div>}
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div style={{ 
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', 
                            background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <Calendar color="var(--accent-primary)" size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Tarih</div>
                                    <div style={{ fontSize: '14px', color: 'white' }}>{formattedDate}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <Clock color="var(--accent-primary)" size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Saat</div>
                                    <div style={{ fontSize: '14px', color: 'white' }}>{formattedTime}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <MapPin color="var(--accent-primary)" size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Konum</div>
                                    <div style={{ fontSize: '14px', color: 'white' }}>{event.location_name || event.city} {event.campus && `(${event.campus})`}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <Users color="var(--accent-primary)" size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Kontenjan</div>
                                    <div style={{ fontSize: '14px', color: 'white' }}>{event.capacity || "Sınırsız"} Katılımcı</div>
                                </div>
                            </div>
                            
                            {/* Ek Filtre Bilgileri */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <User color="#ec4899" size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Yaş Sınırı</div>
                                    <div style={{ fontSize: '14px', color: 'white' }}>{event.min_age_limit || 18} - {event.max_age_limit || 99} Yaş</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <Users color="var(--success)" size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Katılım</div>
                                    <div style={{ fontSize: '14px', color: 'white' }}>{getGenderLabel(event.target_gender)}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ fontSize: '16px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: '700' }}>Etkinlik Açıklaması</h3>
                            <p style={{ lineHeight: '1.7', color: '#cbd5e1', fontSize: '15px', whiteSpace: 'pre-line' }}>
                                {event.description}
                            </p>
                        </div>

                        {/* Escrow Badge */}
                        {event.price > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ 
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(217, 119, 6, 0.1))', 
                                    border: '1px solid rgba(251, 191, 36, 0.2)', padding: '18px', borderRadius: '20px', 
                                    marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center'
                                }}
                            >
                                <div style={{ 
                                    fontSize: '32px', background: 'white', borderRadius: '12px', width: '50px', height: '50px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)'
                                }}>🛡️</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: '#fbbf24', fontWeight: '800', marginBottom: '2px', fontSize: '14px' }}>ArtıBir Güvenli Havuz</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                                        Ödemeniz, etkinlik sonunda QR kodunuz onaylanana kadar güvence altındadır. 
                                        İptal durumunda anında iade yapılır.
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Host QR Section */}
                        {isHost && (
                            <div style={{ 
                                background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.3)',
                                padding: '25px', borderRadius: '24px', marginBottom: '30px', textAlign: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
                                    <QrCode color="var(--accent-primary)" size={24} />
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Giriş Kontrol QR Kodu</h3>
                                </div>
                                
                                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                                    Katılımcıların biletlerini onaylamak ve ödemeleri hesabınıza aktarmak için bu kodu gösterin.
                                </p>

                                {showQR ? (
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        style={{ background: 'white', padding: '15px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px' }}
                                    >
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${event.session_token || event.id}`} 
                                            alt="Event QR" 
                                            style={{ width: '180px', height: '180px' }}
                                        />
                                    </motion.div>
                                ) : (
                                    <button 
                                        onClick={() => setShowQR(true)}
                                        className="primary-btn"
                                        style={{ padding: '10px 24px', borderRadius: '12px' }}
                                    >
                                        Kodu Görüntüle
                                    </button>
                                )}

                                {showQR && (
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Manuel Onay Kodu</div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--accent-primary)', letterSpacing: '2px' }}>
                                            {event.session_token?.slice(0, 8).toUpperCase() || "KV39-RX2"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '15px' }}>
                             <button
                                style={{ 
                                    flex: 1, padding: '18px', borderRadius: '18px', border: 'none', 
                                    background: 'var(--primary-gradient)', color: 'white', fontWeight: '800', fontSize: '16px',
                                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                onClick={async () => {
                                    if (event.price > 0) {
                                        const confirmed = window.confirm(`Bu etkinliğe katılmak için cüzdanınızdan ${event.price}₺ çekilecektir. Onaylıyor musunuz?`);
                                        if (!confirmed) return;
                                    }
                                    setLoading(true);
                                    try {
                                        const res = await participantService.joinEvent(event.id);
                                        alert(res.data.message);
                                        onClose();
                                    } catch (err) {
                                        if (err.response?.status === 403 && err.response?.data?.detail?.includes('doğrulama')) {
                                            setShowVerifyAlert(true);
                                        } else {
                                            alert(err.response?.data?.detail || "Katılım başarısız.");
                                        }
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                             >
                                {loading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        {event.price > 0 ? `${event.price}₺ ile Yerinizi Ayırtın` : "Tamamen Ücretsiz Katıl"}
                                        <ArrowRight size={20} />
                                    </>
                                )}
                             </button>
                             
                             {/* <button 
                                onClick={async () => {
                                    setLoadingIcebreaker(true);
                                    try {
                                        const res = await interactionService.getIcebreaker(event.id);
                                        setIcebreaker(res.data);
                                    } catch (err) {
                                        alert("Soru alınamadı.");
                                    } finally {
                                        setLoadingIcebreaker(false);
                                    }
                                }}
                                title="Buz Kırıcı Soru Al"
                                style={{ 
                                    width: '60px', height: '60px', borderRadius: '18px', border: '1px solid rgba(16, 185, 129, 0.2)', 
                                    background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', cursor: 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    transition: 'all 0.2s'
                                }} 
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'} 
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                             >
                                {loadingIcebreaker ? <Loader2 className="animate-spin" size={24} /> : <MessageCircle size={24} />}
                             </button> */}

                             <button style={{ 
                                 width: '60px', height: '60px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', 
                                 background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer',
                                 display: 'flex', justifyContent: 'center', alignItems: 'center',
                                 transition: 'background 0.2s'
                             }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                                <Share2 size={24} />
                             </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            
            <VerificationAlert 
                isOpen={showVerifyAlert} 
                onClose={() => setShowVerifyAlert(false)}
                onNavigate={() => {
                    setShowVerifyAlert(false);
                    onClose();
                    if (onNavigateToVerification) onNavigateToVerification();
                }}
            />
        </AnimatePresence>
    );
};

export default EventDetailModal;
