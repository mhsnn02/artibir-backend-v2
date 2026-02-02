import React, { useState, useEffect } from 'react';
import { reportService, searchService } from '../services/api_service'; // Added searchService
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2, ChevronRight, History, XCircle, Info, Search, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReportsSection = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // New Report Form State
    const [reportedId, setReportedId] = useState('');
    const [selectedUser, setSelectedUser] = useState(null); // To store full user object
    const [reason, setReason] = useState('spam');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await reportService.getMyReports();
            setReports(res.data);
        } catch (err) {
            console.error("Raporlar yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await searchService.globalSearch(searchTerm);
                    // The API returns { results: { users: [...], events: [...], ... } }
                    // We only care about users here.
                    setSearchResults(res.data.results.users || []);
                } catch (err) {
                    console.error("Arama hatası", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500); // 500ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleSelectUser = (user) => {
        setReportedId(user.id);
        setSelectedUser(user);
        setSearchTerm('');
        setSearchResults([]);
    };

    const clearSelection = () => {
        setReportedId('');
        setSelectedUser(null);
        setSearchTerm('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reportedId.trim()) return;

        setIsSubmitting(true);
        setMessage(null);
        try {
            await reportService.reportUser(reportedId, reason, details);
            setMessage({ type: 'success', text: 'Rapor başarıyla iletildi.' });
            
            // Reset Form
            setReportedId('');
            setSelectedUser(null);
            setDetails('');
            setReason('spam');
            
            fetchReports();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Rapor gönderilemedi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'resolved':
                return <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12}/> ÇÖZÜLDÜ</span>;
            case 'dismissed':
                return <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>REDDEDİLDİ</span>;
            default:
                return <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Loader2 size={12} className="animate-spin"/> BEKLEMEDE</span>;
        }
    };

    const glassInputStyle = {
        width: '100%', padding: '16px', borderRadius: '16px',
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', fontSize: '15px', outline: 'none', transition: 'all 0.2s'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' }}>
                
                {/* Sol: Yeni Rapor Oluştur */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    style={{ background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))', borderRadius: '24px', padding: '40px', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <h2 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: '800', background: 'linear-gradient(to right, #f87171, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        <ShieldAlert size={32} color="#ef4444" style={{ WebkitTextFillColor: 'initial' }} /> Şikayet Bildir
                    </h2>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <AnimatePresence>
                            {message && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    style={{ 
                                        padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px',
                                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: message.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                    }}
                                >
                                    {message.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* --- USER SEARCH INPUT --- */}
                        <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
                            <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                <User size={14}/> Şikayet Edilen Kullanıcı
                            </label>
                            
                            {!selectedUser ? (
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Kullanıcı adı ara (örn: Ahmet)..."
                                        style={{ ...glassInputStyle, paddingLeft: '40px' }}
                                    />
                                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
                                    {isSearching && <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>}
                                    
                                    {/* Dropdown Results */}
                                    {/* Show dropdown only if there are results or user is typing somewhat */}
                                    {(searchResults.length > 0) && (
                                        <div style={{
                                            position: 'absolute', top: '105%', left: 0, width: '100%',
                                            background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                                            overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 20
                                        }}>
                                            {searchResults.map(user => (
                                                <div 
                                                    key={user.id}
                                                    onClick={() => handleSelectUser(user)}
                                                    style={{ 
                                                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                                        transition: 'background 0.2s', color: 'white'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <span>{user.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ 
                                    padding: '12px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>
                                            {selectedUser.name.charAt(0)}
                                        </div>
                                        <div style={{ color: 'white', fontWeight: '600' }}>{selectedUser.name}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={clearSelection}
                                        style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                    >
                                        <X size={14}/>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                <AlertTriangle size={14}/> Sebep
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                {['spam', 'harassment', 'noshow', 'fake', 'other'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setReason(r)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                            background: reason === r ? '#ef4444' : 'rgba(255,255,255,0.05)',
                                            color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s', textTransform: 'capitalize'
                                        }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Detaylar</label>
                            <textarea 
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Lütfen durumu detaylandırın..."
                                rows="4"
                                style={{ ...glassInputStyle, resize: 'none' }}
                            />
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isSubmitting || !reportedId}
                            style={{
                                width: '100%', padding: '18px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                background: isSubmitting || !reportedId ? '#334155' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: isSubmitting || !reportedId ? '#94a3b8' : 'white', fontWeight: 'bold', fontSize: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                opacity: isSubmitting || !reportedId ? 0.7 : 1, transition: 'all 0.2s',
                                boxShadow: isSubmitting || !reportedId ? 'none' : '0 10px 30px rgba(239, 68, 68, 0.3)'
                            }}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "Raporu Gönder"} <ChevronRight size={18}/>
                        </motion.button>
                    </form>
                </motion.div>

                {/* Sağ: Rapor Geçmişi */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    style={{ paddingLeft: '50px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
                >
                     <h3 style={{ marginBottom: '30px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}><History size={20}/></div>
                        Rapor Geçmişim
                     </h3>
                     
                     {loading ? (
                         <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}><Loader2 className="animate-spin" style={{ margin: '0 auto 10px' }}/> Yükleniyor...</div>
                     ) : reports.length === 0 ? (
                         <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', color: '#64748b' }}>
                             <ShieldAlert size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }}/>
                             <p>Henüz bir şikayet bildirmediniz.</p>
                         </div>
                     ) : (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
                             {reports.map((report) => (
                                 <motion.div 
                                     key={report.id} 
                                     whileHover={{ scale: 1.02 }}
                                     style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}
                                 >
                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                         <span style={{ fontWeight: '800', fontSize: '14px', color: 'white', textTransform: 'uppercase' }}>{report.reason}</span>
                                         {getStatusBadge(report.status)}
                                     </div>
                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                                         <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '6px' }}>ID: {report.reported_id.substring(0, 8)}...</span>
                                         <span>{new Date(report.created_at).toLocaleDateString('tr-TR')}</span>
                                     </div>
                                 </motion.div>
                             ))}
                         </div>
                     )}
                </motion.div>
            </div>
        </div>
    );
};

export default ReportsSection;
