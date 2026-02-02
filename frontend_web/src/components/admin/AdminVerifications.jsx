import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api_service';
import { CheckCircle2, XCircle, Clock, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminVerifications = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await adminService.getPendingVerifications();
            setRequests(res.data);
        } catch (err) {
            console.error("Doğrulama listesi alınamadı:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (userId) => {
        if (!window.confirm("Bu kullanıcıyı onaylamak istediğinize emin misiniz?")) return;
        
        setActionLoading(userId);
        try {
            await adminService.verifyUser(userId);
            setRequests(requests.filter(r => r.id !== userId));
            alert("Kullanıcı başarıyla onaylandı.");
        } catch (err) {
            alert("Onaylama sırasında hata oluştu.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId) => {
        const reason = prompt("Reddetme sebebini giriniz:", "Belgeler okunamıyor / Yetersiz");
        if (!reason) return;

        setActionLoading(userId);
        try {
            await adminService.rejectVerification(userId, reason);
            setRequests(requests.filter(r => r.id !== userId));
            alert("Kullanıcı başvurusu reddedildi.");
        } catch (err) {
            alert("Reddetme sırasında hata oluştu.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '300px' }}><Loader2 className="animate-spin" size={40} color="#6366f1" /></div>;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert color="#f59e0b" /> Bekleyen Kimlik Doğrulamaları
            </h2>

            {requests.length === 0 ? (
                <div className="glass-card flex-center" style={{ flexDirection: 'column', padding: '40px', color: '#94a3b8' }}>
                    <CheckCircle2 size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <p>Bekleyen doğrulama talebi yok.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {requests.map(user => (
                        <motion.div 
                            key={user.id} 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}
                        >
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden',
                                    background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {user.profile_image ? (
                                        <img src={user.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{user.full_name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px' }}>{user.full_name}</h4>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>{user.email}</p>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Başvuru: {new Date().toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => handleReject(user.id)}
                                    disabled={actionLoading === user.id}
                                    style={{ 
                                        padding: '10px 20px', borderRadius: '10px', border: '1px solid #ef4444', 
                                        color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    <XCircle size={18} /> Reddet
                                </button>
                                <button 
                                    onClick={() => handleApprove(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="primary-btn"
                                    style={{ width: 'auto', padding: '10px 25px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    {actionLoading === user.id ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18} />}
                                    Onayla
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminVerifications;
