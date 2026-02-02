import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { userService } from '../services/api_service';
import { 
    User, Mail, MapPin, Music, Shield, Ghost, Save, Loader2, 
    AlertCircle, CheckCircle2, Camera, Trophy, Star, Award, ChevronRight,
    Search, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileSection = () => {
    const { user, refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        bio: user?.bio || '',
        interests: user?.interests ? user.interests.map(i => i.name).join(', ') : '',
        favorite_music_url: user?.favorite_music_url || '',
        is_private: user?.is_private || false,
        ghost_mode: user?.ghost_mode || false
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const interestList = formData.interests.split(',').map(i => i.trim()).filter(i => i);
            
            await userService.updateProfile({
                bio: formData.bio,
                favorite_music_url: formData.favorite_music_url,
                interests: interestList
            });

            await userService.updateSettings({
                is_private: formData.is_private,
                ghost_mode: formData.ghost_mode
            });
            
            await refreshUser();
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
            
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Güncelleme sırasında hata oluştu.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getTrustColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 50) return '#6366f1';
        return '#f59e0b';
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card" 
            style={{ 
                padding: '40px', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px'
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
                
                {/* Sol Taraf: Profil Özeti & Güven Puanı */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            style={{ 
                                width: '160px', height: '160px', borderRadius: '48px', 
                                overflow: 'hidden', border: '4px solid rgba(255,255,255,0.1)',
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                            }}
                        >
                            {user?.profile_image ? (
                                <img src={user.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '64px', fontWeight: 'bold', color: 'white' }}>{user?.full_name?.[0]}</span>
                            )}
                        </motion.div>
                        
                        <label 
                            htmlFor="profile-upload"
                            style={{ 
                                position: 'absolute', bottom: '-10px', right: '-10px',
                                background: 'var(--primary-gradient)', width: '44px', height: '44px',
                                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', border: '4px solid #0f172a', transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Camera size={20} color="white" />}
                        </label>
                        <input 
                            id="profile-upload" 
                            type="file" 
                            accept="image/*" 
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setIsSubmitting(true);
                                try {
                                    await userService.uploadProfileImage(file);
                                    await refreshUser();
                                    setMessage({ type: 'success', text: 'Profil resmi güncellendi!' });
                                } catch (err) {
                                    setMessage({ type: 'error', text: 'Resim yüklenemedi.' });
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>{user?.full_name}</h2>
                            {user?.is_verified && (
                                <div title="Doğrulanmış Hesap" style={{ background: '#3b82f6', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                                    <CheckCircle2 size={14} color="white" />
                                </div>
                            )}
                            {user?.is_student_verified && (
                                <div title="Öğrenci Hesabı" style={{ background: '#10b981', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                                    <Award size={14} color="white" />
                                </div>
                            )}
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '15px' }}>@{user?.username || 'kullanici'}</p>
                    </div>

                    <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={18} color={getTrustColor(user?.trust_score)} />
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>Güven Puanı</span>
                            </div>
                            <span style={{ fontSize: '24px', fontWeight: '800', color: getTrustColor(user?.trust_score) }}>
                                {user?.trust_score || 0}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${user?.trust_score || 0}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                style={{ height: '100%', background: getTrustColor(user?.trust_score) }} 
                            />
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', lineHeight: '1.4' }}>
                           {user?.trust_score > 70 ? 'Mükemmel bir topluluk üyesisin!' : 'Doğrulamaları tamamlayarak puanını artırabilirsin.'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ 
                            padding: '10px 16px', borderRadius: '14px', background: user?.is_email_verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px'
                        }}>
                            <Mail size={14} color={user?.is_email_verified ? '#10b981' : '#64748b'} />
                            <span style={{ color: user?.is_email_verified ? '#10b981' : '#94a3b8' }}>E-posta</span>
                        </div>
                        <div style={{ 
                            padding: '10px 16px', borderRadius: '14px', background: user?.is_phone_verified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px'
                        }}>
                            <Shield size={14} color={user?.is_phone_verified ? '#10b981' : '#64748b'} />
                            <span style={{ color: user?.is_phone_verified ? '#10b981' : '#94a3b8' }}>Telefon</span>
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Profil Düzenleme Formu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <AnimatePresence>
                        {message && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ 
                                    padding: '16px', borderRadius: '16px', marginBottom: '10px',
                                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                                    display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500',
                                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}
                            >
                                {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                                <User size={18} /> Biyografi
                            </label>
                            <textarea 
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Kendinden biraz bahset..."
                                rows="3"
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '16px', 
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                                    color: 'white', resize: 'none', fontSize: '15px', outline: 'none'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                                <Music size={18} /> Spotify Favori Parça
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    name="favorite_music_url"
                                    value={formData.favorite_music_url}
                                    onChange={handleChange}
                                    placeholder="https://open.spotify.com/track/..."
                                    style={{ 
                                        width: '100%', padding: '14px 16px', borderRadius: '16px', 
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                                        color: 'white', fontSize: '15px'
                                    }}
                                />
                                <ExternalLink size={16} style={{ position: 'absolute', right: '16px', top: '16px', opacity: 0.3 }} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                                <Star size={18} /> İlgi Alanları
                            </label>
                            <input 
                                name="interests"
                                value={formData.interests}
                                onChange={handleChange}
                                placeholder="Müzik, Teknoloji, Seyahat..."
                                style={{ 
                                    width: '100%', padding: '14px 16px', borderRadius: '16px', 
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                                    color: 'white', fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ 
                            display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', 
                            padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                             <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                <input 
                                    type="checkbox" 
                                    name="is_private"
                                    checked={formData.is_private}
                                    onChange={handleChange}
                                    style={{ width: '20px', height: '20px', accentColor: '#6366f1' }}
                                />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>Gizli Profil</span>
                            </label>
                            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                <input 
                                    type="checkbox" 
                                    name="ghost_mode"
                                    checked={formData.ghost_mode}
                                    onChange={handleChange}
                                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                                />
                                <span style={{ fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Ghost size={16} /> Hayalet Modu
                                </span>
                            </label>
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isSubmitting}
                            style={{ 
                                marginTop: '10px', background: 'var(--primary-gradient)', 
                                border: 'none', borderRadius: '16px', padding: '16px 32px',
                                color: 'white', fontWeight: 'bold', fontSize: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                cursor: 'pointer', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                            }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Değişiklikleri Kaydet
                        </motion.button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfileSection;
