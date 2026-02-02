import React, { useEffect, useState } from 'react';
import { feedService, marketplaceService } from '../services/api_service'; // Maybe handle specific actions if needed
import { Loader2, Plus, ShoppingBag, Calendar, Users, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import EventCard from './EventCard';
import MarketplaceCard from './MarketplaceCard';
import { useAuth } from '../context/AuthProvider';

const FeedSection = ({ onNavigateToVerification }) => {
    const { user } = useAuth();
    const [feedData, setFeedData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);
            try {
                const res = await feedService.getHomeFeed();
                setFeedData(res.data);
            } catch (err) {
                console.error("Feed yüklenemedi", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
    }, []);

    const handleBuyItem = async (itemId, price, title) => {
        if (!window.confirm(`${price}₺ ödeyerek "${title}" ürününü satın almak istiyor musunuz?`)) return;
        
        try {
            await marketplaceService.buyItem(itemId);
            alert("Satın alma başarılı! 🎉");
            // Optional: Refresh feed
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "Satın alma başarısız."));
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>
                 <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 10px' }} />
                 Akış yenileniyor...
            </div>
        );
    }

    if (!feedData) return null;

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Sections */}
            {feedData.sections.map((section, index) => {
                if (!section.data || section.data.length === 0) return null;

                return (
                    <div key={index} style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                             <h2 style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                 {section.type === 'moments' && <Heart color="#f472b6" />}
                                 {section.type === 'marketplace' && <ShoppingBag color="#fbbf24" />}
                                 {section.type === 'recommendations' && <Calendar color="#6366f1" />}
                                 {section.type === 'club_events' && <Users color="#10b981" />}
                                 {section.title}
                             </h2>
                        </div>

                        {/* Renders based on type */}
                        {section.type === 'moments' ? (
                            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px' }}>
                                {section.data.map(moment => (
                                    <div key={moment.id} style={{ textAlign: 'center', minWidth: '80px' }}>
                                       <div style={{ 
                                           width: '70px', height: '70px', borderRadius: '50%', padding: '3px',
                                           background: 'linear-gradient(45deg, #f472b6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                       }}>
                                           <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0f172a', overflow: 'hidden', border: '3px solid #0f172a' }}>
                                                {/* Moment logic usually requires more complexity (image etc), placeholder for now */}
                                                <div style={{ width: '100%', height: '100%', background: '#334155' }}></div>
                                           </div>
                                       </div>
                                       <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>User</span>
                                    </div>
                                ))}
                            </div>
                        ) : section.type === 'marketplace' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                                {section.data.map(item => (
                                    <MarketplaceCard 
                                        key={item.id} 
                                        item={item} 
                                        user={user}
                                        onBuy={handleBuyItem}
                                    />
                                ))}
                            </div>
                        ) : (
                            // Recommendations & Club Events are both Events
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                {section.data.map(event => (
                                    <EventCard 
                                        key={event.id} 
                                        event={event} 
                                        onNavigateToVerification={onNavigateToVerification}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default FeedSection;
