import React, { useEffect, useState } from 'react';
import { clubService } from '../services/api_service';
import { Users, Plus, Star, MapPin, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ClubDetailModal from './ClubDetailModal';

const ClubsSection = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newClub, setNewClub] = useState({ name: '', description: '', category: 'General' });
    const [selectedClub, setSelectedClub] = useState(null);

    const fetchClubs = async () => {
        setLoading(true);
        try {
            const res = await clubService.getClubs();
            setClubs(res.data);
        } catch (err) {
            console.error("Kulüpler alınamadı", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClubs();
    }, []);

    const handleCreateClub = async (e) => {
        e.preventDefault();
        try {
            await clubService.createClub(newClub);
            setShowCreateForm(false);
            setNewClub({ name: '', description: '', category: 'General' });
            fetchClubs();
            alert("Kulüp başarıyla kuruldu! 🎉");
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "Kulüp oluşturulamadı."));
        }
    };

    const handleJoin = async (e, clubId) => {
        e.stopPropagation(); // Prevent card click opening modal
        try {
            await clubService.joinClub(clubId);
            alert("Kulübe katıldınız! 👏");
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "Katılım başarısız."));
        }
    };

    return (
        <div style={{ padding: '0 20px 40px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                   <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <Users color="var(--accent-primary)" /> Kulüpler & Topluluklar
                   </h2>
                   <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>İlgi alanına uygun toplulukları keşfet</p>
                </div>
                
                <button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="primary-btn flex-center" 
                  style={{ gap: '8px', padding: '10px 20px', borderRadius: '12px', width: 'auto' }}
                >
                    <Plus size={18} /> {showCreateForm ? 'Kapat' : 'Kulüp Kur'}
                </button>
            </div>

            {/* Create Club Form */}
            {showCreateForm && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="glass-card"
                    style={{ padding: '20px', marginBottom: '30px', border: '1px solid var(--accent-primary)' }}
                >
                    <h3 style={{ marginBottom: '15px' }}>Yeni Kulüp Oluştur</h3>
                    <form onSubmit={handleCreateClub} style={{ display: 'grid', gap: '15px' }}>
                         <input 
                            type="text" placeholder="Kulüp Adı" required
                            className="glass-input"
                            value={newClub.name} onChange={e => setNewClub({...newClub, name: e.target.value})}
                         />
                         <textarea 
                            placeholder="Kulüp Açıklaması ve Amacı..." required
                            className="glass-input" rows="3"
                            value={newClub.description} onChange={e => setNewClub({...newClub, description: e.target.value})}
                         />
                         <select 
                            className="glass-input"
                            value={newClub.category} onChange={e => setNewClub({...newClub, category: e.target.value})}
                         >
                             <option value="General">Genel</option>
                             <option value="Teknoloji">Teknoloji & Yazılım</option>
                             <option value="Sanat">Sanat & Müzik</option>
                             <option value="Spor">Spor & Outdoor</option>
                             <option value="Kariyer">Kariyer & Girişimcilik</option>
                         </select>
                         <button type="submit" className="primary-btn" style={{ marginTop: '10px' }}>Oluştur ve Yönetici Ol</button>
                    </form>
                </motion.div>
            )}

            {loading ? (
                 <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
            ) : clubs.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Users size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p>Henüz hiç kulüp yok. İlkini sen kur!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {clubs.map(club => (
                        <div 
                            key={club.id} 
                            onClick={() => setSelectedClub(club)}
                            className="glass-card" 
                            style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.02)' } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ 
                                    width: '50px', height: '50px', borderRadius: '12px', 
                                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold'
                                }}>
                                    {club.name[0]}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{club.name}</h3>
                                    <span style={{ fontSize: '12px', color: 'var(--accent-secondary)', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                        {club.category || 'Genel'}
                                    </span>
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                                {club.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <Users size={14} /> <span>Üyeler</span>
                                </div>
                                <button 
                                    onClick={(e) => handleJoin(e, club.id)}
                                    style={{ 
                                        padding: '8px 16px', borderRadius: '8px', 
                                        background: 'var(--accent-primary)', color: 'white',
                                        border: 'none', cursor: 'pointer', fontWeight: '600'
                                    }}
                                >
                                    Katıl
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {selectedClub && <ClubDetailModal club={selectedClub} onClose={() => setSelectedClub(null)} />}
        </div>
    );
};

export default ClubsSection;
