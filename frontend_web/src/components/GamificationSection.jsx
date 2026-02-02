import React, { useState, useEffect } from 'react';
import { gamificationService } from '../services/api_service';
import { Award, Star, Lock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const GamificationSection = () => {
    const [allBadges, setAllBadges] = useState([]);
    const [myBadges, setMyBadges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [badgesRes, myBadgesRes] = await Promise.all([
                gamificationService.getAllBadges(),
                gamificationService.getMyBadges()
            ]);
            setAllBadges(badgesRes.data);
            setMyBadges(myBadgesRes.data);
        } catch (err) {
            console.error("Rozetler yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCheckAchievements = async () => {
        setChecking(true);
        setMessage(null);
        try {
            const res = await gamificationService.checkAchievements();
            if (res.data.new_badges_earned && res.data.new_badges_earned.length > 0) {
                setMessage({ type: 'success', text: `Tebrikler! Yeni Rozet: ${res.data.new_badges_earned.join(', ')}` });
                fetchData(); // Refresh list to show new badges
            } else {
                setMessage({ type: 'info', text: 'Henüz yeni bir rozet kazanmadınız. Etkinliklere katılmaya devam!' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Kontrol sırasında hata oluştu.' });
        } finally {
            setChecking(false);
        }
    };

    const isEarned = (badgeId) => myBadges.some(b => b.id === badgeId);

    return (
        <div className="glass-card" style={{ padding: '30px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Award size={28} /> Rozetlerim & Başarılar
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Kampüsün yıldızı olmak için görevleri tamamla!</p>
                </div>
                
                <button 
                    onClick={handleCheckAchievements}
                    disabled={checking}
                    className="primary-btn flex-center"
                    style={{ gap: '8px' }}
                >
                    {checking ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    Check Achievements
                </button>
            </div>

            {message && (
                <div style={{ 
                    padding: '16px', marginBottom: '24px', borderRadius: '12px',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    color: message.type === 'success' ? 'var(--success)' : 'var(--accent-primary)',
                    display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500'
                }}>
                    {message.type === 'success' ? <CheckCircle2 /> : <Star />}
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="flex-center" style={{ padding: '40px' }}><Loader2 className="animate-spin" size={32} /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '24px' }}>
                    {allBadges.map(badge => {
                        const earned = isEarned(badge.id);
                        return (
                            <div key={badge.id} className="glass-card" style={{ 
                                padding: '20px', 
                                textAlign: 'center',
                                opacity: earned ? 1 : 0.6,
                                filter: earned ? 'none' : 'grayscale(100%)',
                                border: earned ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                                position: 'relative'
                            }}>
                                <div style={{ 
                                    width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 16px',
                                    background: earned ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px'
                                }}>
                                    {badge.icon_url ? <img src={badge.icon_url} alt="icon" style={{width:'100%'}}/> : "🏆"}
                                </div>
                                
                                <h4 style={{ marginBottom: '8px', color: earned ? 'white' : 'var(--text-secondary)' }}>{badge.name}</h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{badge.description}</p>
                                
                                {!earned && (
                                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                        <Lock size={16} color="var(--text-secondary)" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GamificationSection;
