import React, { useState } from 'react';
import { Calendar, MapPin, Users, Ticket, ArrowRight, User, Heart, Mic, MessageCircle, Volume2, X, Loader2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { activityService, interactionService, participantService } from '../services/api_service';
import EventDetailModal from './EventDetailModal';

const EventCard = ({ event, onNavigateToVerification }) => {
  const [liked, setLiked] = useState(false); 
  const [icebreaker, setIcebreaker] = useState(null);
  const [voiceRoom, setVoiceRoom] = useState(null);
  const [loadingInteract, setLoadingInteract] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  
  const formattedDate = new Date(event.date).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  });

  const handleLike = async (e) => {
      e.stopPropagation(); 
      try {
          setLiked(!liked);
          await activityService.likeEvent(event.id);
      } catch (err) {
          console.error("Beğeni işlemi başarısız", err);
          setLiked(!liked); 
      }
  };

  const handleJoin = async () => {
      if (isJoining) return;
      
      if (event.price > 0) {
          const confirmed = window.confirm(`Bu etkinliğe katılmak için cüzdanınızdan ${event.price}₺ çekilecektir. Onaylıyor musunuz?`);
          if (!confirmed) return;
      }

      setIsJoining(true);
      try {
          const res = await participantService.joinEvent(event.id);
          alert(res.data.message || "Etkinliğe katıldınız!");
      } catch (err) {
          alert(err.response?.data?.detail || "Katılım başarısız.");
      } finally {
          setIsJoining(false);
      }
  };

  const handleIcebreaker = async () => {
    setLoadingInteract(true);
    try {
        const res = await interactionService.getIcebreaker(event.id);
        setIcebreaker(res.data);
    } catch (err) {
        alert("Buz kırıcı sorusu alınamadı (Önce etkinliğe katılın!)");
    } finally {
        setLoadingInteract(false);
    }
  };

  const handleVoiceRoom = async () => {
    setLoadingInteract(true);
    try {
        const res = await interactionService.getVoiceRoom(event.id);
        setVoiceRoom(res.data);
    } catch (err) {
        alert("Sesli odaya erişilemedi (Önce etkinliğe katılın!)");
    } finally {
        setLoadingInteract(false);
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card" 
      style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      {event.image_url && (
        <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
          <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
        </div>
      )}

      
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
             <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginRight: '10px', flex: 1 }}>{event.title}</h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 {event.price > 0 && (
                     <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                         {event.price}₺
                     </span>
                 )}
                 <button 
                    onClick={handleLike}
                    style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <Heart size={16} fill={liked ? "#ef4444" : "none"} color={liked ? "#ef4444" : "var(--text-secondary)"} />
                </button>
             </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5', flex: 1 }}>
            {event.description?.slice(0, 80)}...
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="var(--accent-primary)" />
                {formattedDate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="var(--accent-primary)" />
                {event.location_name || event.city || "Konum Belirtilmemiş"}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} color="var(--accent-primary)" />
                Kapasite: {event.capacity || "Limitsiz"}
            </div>
        </div>

        {/* Interaction Features */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <button 
                onClick={handleJoin}
                disabled={isJoining}
                className="primary-btn flex-center" 
                style={{ flex: 2, padding: '10px', fontSize: '14px', borderRadius: '10px' }}
            >
                {isJoining ? <Loader2 className="animate-spin" size={16} /> : (
                    <>Katıl <ArrowRight size={16} style={{ marginLeft: '4px' }} /></>
                )}
            </button>

            <button 
                onClick={() => setShowDetail(true)}
                title="Detaylar"
                className="glass-card flex-center"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
            >
                <Eye size={18} />
            </button>
            
{/*             <button 
                onClick={handleIcebreaker}
                title="Buz Kırıcı Soru"
                className="glass-card flex-center"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
            >
                <MessageCircle size={18} />
            </button> */}
            <button 
                onClick={handleVoiceRoom}
                title="Sesli Odaya Katıl"
                className="glass-card flex-center"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
            >
                <Mic size={18} />
            </button>
        </div>

        {/* Interaction Results Overlay/Expansion */}
        {/* <AnimatePresence>
            {icebreaker && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: '12px', padding: '15px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', position: 'relative', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                >
                    <button onClick={() => setIcebreaker(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16}/></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ padding: '4px', background: 'var(--accent-primary)', borderRadius: '6px' }}>
                            <MessageCircle size={12} color="white" />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Buz Kırıcı ({icebreaker.category})
                        </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', lineHeight: '1.4' }}>{icebreaker.question}</div>
                    
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(icebreaker.question);
                                alert("Soru kopyalandı! Sohbet ekranında kullanabilirsin.");
                            }}
                            style={{ 
                                fontSize: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                                color: '#94a3b8', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer'
                            }}
                        >
                            Kopyala
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence> */}

        {voiceRoom && (
             <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', position: 'relative', border: '1px solid var(--success)' }}>
                  <button onClick={() => setVoiceRoom(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}><X size={14}/></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Volume2 size={16} color="var(--success)" />
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--success)' }}>Sesli Oda Aktif</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Token: {voiceRoom.room_token}</div>
             </div>
        )}
      </div>
    </motion.div>

    {showDetail && <EventDetailModal event={event} onClose={() => setShowDetail(false)} onNavigateToVerification={onNavigateToVerification} />}
    </>
  );
};

export default EventCard;
