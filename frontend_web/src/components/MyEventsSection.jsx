import React, { useEffect, useState } from 'react';
import { participantService, authService, eventService } from '../services/api_service'; // Added authService & eventService
import EventCard from './EventCard';
import TicketModal from './TicketModal';
import { Ticket, Calendar, Loader2, User, Trash2, Edit } from 'lucide-react';

const MyEventsSection = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('attending'); // 'attending' | 'hosting'

    const fetchData = async () => {
        try {
            const [userRes, eventsRes] = await Promise.all([
                authService.getMe(),
                participantService.getMyEvents()
            ]);
            setCurrentUserId(userRes.data.id);
            setEvents(eventsRes.data);
        } catch (err) {
            console.error("Veriler alınamadı", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (e, eventId) => {
        e.stopPropagation();
        if (window.confirm("Bu etkinliği iptal etmek/silmek istediğinize emin misiniz? (Ücretli katılımcı varsa iade yapılır)")) {
            try {
                await eventService.deleteEvent(eventId);
                alert("Etkinlik iptal edildi.");
                fetchData(); // Refresh list
            } catch (err) {
                alert("Silme işlemi başarısız: " + (err.response?.data?.detail || err.message));
            }
        }
    };

    // Filter Lists (İptal edilmiş etkinlikleri gizle)
    const activeEvents = events.filter(ev => ev.status !== 'IPTAL');
    const attendingEvents = activeEvents.filter(ev => ev.host_id !== currentUserId);
    const hostingEvents = activeEvents.filter(ev => ev.host_id === currentUserId);
    
    const displayEvents = activeTab === 'attending' ? attendingEvents : hostingEvents;

    return (
        <div style={{ padding: '0 20px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Ticket color="var(--accent-primary)" /> Etkinliklerim
            </h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('attending')}
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                        background: activeTab === 'attending' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                        color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                >
                    Katıldıklarım ({attendingEvents.length})
                </button>
                <button 
                    onClick={() => setActiveTab('hosting')}
                    style={{
                        flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                        background: activeTab === 'hosting' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                        color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                >
                    Düzenlediklerim ({hostingEvents.length})
                </button>
            </div>

            {loading ? (
                 <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
            ) : displayEvents.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Calendar size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <p>{activeTab === 'attending' ? "Henüz kayıtlı olduğun bir etkinlik yok." : "Henüz bir etkinlik düzenlemedin."}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {displayEvents.map(event => {
                        const isPast = new Date(event.date) < new Date();
                        return (
                            <div key={event.id} style={{ position: 'relative', opacity: isPast ? 0.7 : 1 }}>
                                <EventCard event={event} />
                                
                                {isPast && (
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#e11d48', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', zIndex: 20 }}>
                                        GEÇMİŞ
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '8px', zIndex: 20 }}>
                                    {activeTab === 'attending' ? (
                                        <button 
                                            onClick={() => setSelectedEventId(event.id)}
                                            style={{
                                                background: 'var(--accent-primary)', color: 'white',
                                                border: 'none', borderRadius: '8px', padding: '8px 16px',
                                                fontWeight: '600', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                            }}
                                        >
                                            <Ticket size={16} /> Bilet
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={(e) => handleDelete(e, event.id)}
                                                className="glossy-btn-danger" // Assuming global css or defined style below
                                                style={{
                                                    background: '#e11d48', color: 'white',
                                                    border: 'none', borderRadius: '8px', padding: '8px 12px',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                                }}
                                            >
                                                <Trash2 size={16} /> İptal
                                            </button>
                                            {/* Edit button could go here */}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedEventId && (
                <TicketModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
            )}
        </div>
    );
};

export default MyEventsSection;
