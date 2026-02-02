import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, X, Calendar, MapPin, User, CheckCircle, ShieldCheck } from 'lucide-react';
import { participantService } from '../services/api_service';

const TicketModal = ({ eventId, onClose }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await participantService.getTicket(eventId);
        setTicket(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Bilet bilgisi alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [eventId]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card"
        style={{ width: '90%', maxWidth: '380px', padding: '0', overflow: 'hidden', position: 'relative' }}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', zIndex: 10 }}
        >
          <X size={24} />
        </button>

        {loading ? (
             <div style={{ padding: '40px', textAlign: 'center' }}>Bilet Yükleniyor...</div>
        ) : error ? (
             <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Ticket Header */}
            <div style={{ 
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
                padding: '30px 20px', textAlign: 'center' 
            }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>ArtıBir Bilet</h3>
                <p style={{ opacity: 0.9, fontSize: '13px' }}>Etkinlik Giriş Kartı</p>
            </div>

            {/* Ticket Body */}
            <div style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'rgba(25, 25, 35, 0.9)' }}>
                
                <h2 style={{ fontSize: '18px', textAlign: 'center', lineHeight: '1.4' }}>{ticket.event_title}</h2>
                
                <div style={{ background: 'white', padding: '15px', borderRadius: '15px' }}>
                    {/* Simulated QR Code */}
                    <QrCode size={150} color="black" />
                </div>
                
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', fontFamily: 'monospace' }}>
                    {ticket.access_key}
                </div>

                <div style={{ width: '100%', borderTop: '1px dashed var(--glass-border)', margin: '10px 0' }}></div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Katılımcı:</span>
                        <span style={{ fontWeight: '600' }}>{ticket.user_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Durum:</span>
                        <span style={{ 
                            color: ticket.status === 'approved' ? 'var(--success)' : 'var(--warning)', 
                            fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' 
                        }}>
                            {ticket.status === 'approved' ? <CheckCircle size={14}/> : null}
                            {ticket.status === 'approved' ? 'Onaylandı' : ticket.status}
                        </span>
                    </div>
                </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TicketModal;
