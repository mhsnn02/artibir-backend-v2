import React, { useEffect, useState } from 'react';
import { X, Users, Star, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clubService } from '../services/api_service';

const ClubDetailModal = ({ clubId, onClose }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null); // Assuming we might fetch more details later if specialized endpoint exists.

    // Using club object passed would be faster for display, but let's assume we pass ID to fetch fresh members
    // Ideally we should pass the club details object too to avoid layout shift.
    // Let's rely on props for basic info, but here I only asked for ID.
    // I will refactor to accept 'club' prop as well if possible, 
    // but the caller might just know the ID (though usually they click a card).
    // Let's stick to fetching members for now.
    
    // Actually, getting the CLUB object from the parent is better.
    // But since I defined signature as clubId, let's fetch members.
    
    useEffect(() => {
        const loadMembers = async () => {
            try {
                const res = await clubService.getMembers(clubId);
                setMembers(res.data);
            } catch (err) {
                console.error("Üyeler yüklenemedi", err);
            } finally {
                setLoading(false);
            }
        };
        loadMembers();
    }, [clubId]);

    // Note: We need the club name/desc. 
    // I should probably have asked for the 'club' object as a prop.
    // I will modify the usage in ClubsSection to pass the whole club object.
    
    return (
        <div style={{color: 'white'}}>Loading...</div> // Placeholder wrapper, real logic will be better if I change prop to 'club'
    );
};

// Re-writing content to accept 'club' prop instead of just ID
const RealClubDetailModal = ({ club, onClose }) => {
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    useEffect(() => {
        const loadMembers = async () => {
             try {
                 const res = await clubService.getMembers(club.id);
                 setMembers(res.data);
             } catch (err) {
                 console.error("Member fetch failed", err);
             } finally {
                 setLoadingMembers(false);
             }
        };
        if (club) loadMembers();
    }, [club]);

    if (!club) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass-card"
                    style={{ 
                        width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', 
                        padding: '30px', position: 'relative', background: '#1e293b',
                        display: 'flex', flexDirection: 'column', gap: '20px'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={onClose}
                        style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                         <div style={{ 
                            width: '80px', height: '80px', borderRadius: '20px', 
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: 'white'
                        }}>
                            {club.name[0]}
                        </div>
                        <div>
                            <span style={{ fontSize: '13px', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                {club.category || 'Genel'}
                            </span>
                            <h2 style={{ fontSize: '24px', margin: '5px 0' }}>{club.name}</h2>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>Hakkında</h4>
                        <p style={{ lineHeight: '1.6', fontSize: '15px' }}>{club.description}</p>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h4 style={{ color: '#94a3b8', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} /> Üyeler ({members.length})
                        </h4>
                        
                        {loadingMembers ? (
                            <div className="flex-center" style={{ padding: '20px' }}><Loader2 className="animate-spin" /></div>
                        ) : members.length === 0 ? (
                             <p style={{ color: '#64748b', fontSize: '14px' }}>Henüz üye yok.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {members.map((member, idx) => (
                                    <div key={idx} title={member.role} style={{ 
                                        padding: '5px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', 
                                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px'
                                    }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#333' }}>
                                            {/* Avatar logic would go here if member object has profile_image */}
                                        </div>
                                        <span>User {member.user_id?.substring(0,6)}...</span>
                                        {member.role === 'admin' && <Star size={12} color="#fbbf24" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                         <button className="primary-btn" onClick={() => alert("Etkinlik listesi yakında!")} style={{ width: '100%' }}>
                            Etkinlik Takvimi 📅
                         </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RealClubDetailModal;
