import React, { useState, useEffect } from 'react';
import { supportService } from '../services/api_service';
import { HelpCircle, FileText, Send, CheckCircle2, AlertTriangle, Loader2, Shield } from 'lucide-react';

const SupportSection = ({ onOpenGuide }) => {
    const [activeTab, setActiveTab] = useState('tickets'); // tickets, new-ticket, rules
    const [tickets, setTickets] = useState([]);
    const [rules, setRules] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // New Ticket Form
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await supportService.getMyTickets();
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await supportService.getRules();
            setRules(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'tickets') fetchTickets();
        if (activeTab === 'rules' && !rules) fetchRules();
    }, [activeTab]);

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);
        try {
            await supportService.createTicket(subject, message);
            setSubmitResult({ type: 'success', text: 'Destek talebiniz başarıyla oluşturuldu.' });
            setSubject('');
            setMessage('');
            // Switch to tickets tab after short delay
            setTimeout(() => {
                setActiveTab('tickets');
                fetchTickets();
            }, 1500);
        } catch (err) {
            setSubmitResult({ type: 'error', text: 'Talep oluşturulamadı.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-card" style={{ padding: '30px', minHeight: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HelpCircle size={28} /> Yardım & Destek
                </h2>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                     <button 
                        onClick={() => setActiveTab('tickets')}
                        style={{ 
                            padding: '8px 16px', borderRadius: '8px', 
                            background: activeTab === 'tickets' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', cursor: 'pointer'
                        }}
                    >
                        Taleplerim
                    </button>
                    <button 
                        onClick={() => setActiveTab('new-ticket')}
                        style={{ 
                            padding: '8px 16px', borderRadius: '8px', 
                            background: activeTab === 'new-ticket' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', cursor: 'pointer'
                        }}
                    >
                        Yeni Talep
                    </button>
                    <button 
                        onClick={() => setActiveTab('rules')}
                        style={{ 
                            padding: '8px 16px', borderRadius: '8px', 
                            background: activeTab === 'rules' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', cursor: 'pointer'
                        }}
                    >
                        Topluluk Kuralları
                    </button>
                    <button 
                        onClick={onOpenGuide}
                        style={{ 
                            padding: '8px 16px', borderRadius: '8px', 
                            background: 'rgba(99, 102, 241, 0.1)', 
                            color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Shield size={16} />
                        Güvenlik Rehberi
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'tickets' && (
                <div>
                     {loading ? <div className="flex-center"><Loader2 className="animate-spin" /></div> : (
                         tickets.length === 0 ? (
                             <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                 <CheckCircle2 size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                 <p>Herhangi bir açık destek talebiniz bulunmuyor.</p>
                             </div>
                         ) : (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                 {tickets.map(ticket => (
                                     <div key={ticket.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                             <h4 style={{ margin: 0 }}>{ticket.subject}</h4>
                                             <span style={{ 
                                                 background: ticket.status === 'open' ? 'var(--accent-primary)' : '#333',
                                                 padding: '2px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase'
                                             }}>
                                                 {ticket.status}
                                             </span>
                                         </div>
                                         <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{ticket.message}</p>
                                         <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                             {new Date(ticket.created_at).toLocaleString()}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )
                     )}
                </div>
            )}

            {activeTab === 'new-ticket' && (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h3 style={{ marginBottom: '20px' }}>Yeni Destek Talebi</h3>
                    <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {submitResult && (
                            <div style={{ 
                                padding: '12px', borderRadius: '8px',
                                background: submitResult.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: submitResult.type === 'success' ? 'var(--success)' : 'var(--danger)'
                            }}>
                                {submitResult.text}
                            </div>
                        )}
                        <input 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Konu (Örn: Ödeme Hatası)"
                            className="glass-input"
                            style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                            required
                        />
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Sorununuzu detaylıca açıklayın..."
                            className="glass-input"
                            rows="5"
                            style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                            required
                        />
                        <button 
                            type="submit" 
                            className="primary-btn flex-center"
                            disabled={isSubmitting}
                            style={{ gap: '8px' }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                            Gönder
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'rules' && (
                <div>
                    {loading ? <div className="flex-center"><Loader2 className="animate-spin" /></div> : (
                        rules && (
                             <div>
                                 <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                     <AlertTriangle color="var(--accent-primary)" /> Davranış Kuralları
                                 </h3>
                                 <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                     {rules.rules.map((rule, idx) => (
                                         <li key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                                             <div style={{ minWidth: '24px', height: '24px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                                 {idx + 1}
                                             </div>
                                             {rule}
                                         </li>
                                     ))}
                                 </ul>
                                 <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
                                     <h4 style={{ margin: '0 0 10px 0' }}>Bilgilendirme</h4>
                                     <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{rules.info}</p>
                                 </div>
                             </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default SupportSection;
