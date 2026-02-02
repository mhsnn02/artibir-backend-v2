import React from 'react';
import { Users, Calendar, UserCheck, Activity } from 'lucide-react';

const AdminStats = ({ stats }) => {
    if (!stats) return <p>Yükleniyor...</p>;

    const cards = [
        { label: 'Toplam Kullanıcı', value: stats.users, icon: <Users color="#60a5fa" />, color: 'rgba(96, 165, 250, 0.1)' },
        { label: 'Toplam Etkinlik', value: stats.events, icon: <Calendar color="#c084fc" />, color: 'rgba(192, 132, 252, 0.1)' },
        { label: 'Toplam Kulüp', value: stats.clubs, icon: <Users color="#34d399" />, color: 'rgba(52, 211, 153, 0.1)' },
        { label: 'Sistem Durumu', value: stats.health === 'excellent' ? 'Mükemmel' : 'Normal', icon: <Activity color="#f472b6" />, color: 'rgba(244, 114, 182, 0.1)' },
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {cards.map((card, index) => (
                <div key={index} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', background: card.color }}>
                        {card.icon}
                    </div>
                    <div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{card.label}</p>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AdminStats;
