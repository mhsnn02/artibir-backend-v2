import React, { useState, useEffect } from 'react';
import { activityService } from '../services/api_service';
import EventCard from './EventCard';
import { History, Heart, Loader2, CalendarClock } from 'lucide-react';

const ActivitySection = () => {
    const [history, setHistory] = useState([]);
    const [liked, setLiked] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('history');

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'history') {
                const res = await activityService.getHistory();
                setHistory(res.data);
            } else {
                const res = await activityService.getLikedEvents();
                setLiked(res.data);
            }
        } catch (err) {
            console.error("Aktivite verileri yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    return (
        <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button 
                    onClick={() => setActiveTab('history')}
                    className="glass-card"
                    style={{ 
                        flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        background: activeTab === 'history' ? 'var(--glass-bg)' : 'transparent',
                        borderColor: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--glass-border)',
                        color: activeTab === 'history' ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    <History size={20} /> Geçmiş Etkinlikler
                </button>
                <button 
                    onClick={() => setActiveTab('liked')}
                    className="glass-card"
                    style={{ 
                        flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        background: activeTab === 'liked' ? 'var(--glass-bg)' : 'transparent',
                        borderColor: activeTab === 'liked' ? 'var(--danger)' : 'var(--glass-border)',
                        color: activeTab === 'liked' ? 'white' : 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    <Heart size={20} fill={activeTab === 'liked' ? "currentColor" : "none"} /> Beğendiklerim
                </button>
            </div>

            {loading ? (
                <div className="flex-center" style={{ padding: '50px' }}><Loader2 className="animate-spin" size={32} /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {(activeTab === 'history' ? history : liked).length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <CalendarClock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p>{activeTab === 'history' ? "Henüz bir etkinliğe katılmamışsın." : "Henüz beğendiğin bir etkinlik yok."}</p>
                        </div>
                    ) : (
                        (activeTab === 'history' ? history : liked).map(event => (
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ActivitySection;
