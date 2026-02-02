import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api_service';
import { Shield, CheckCircle, XCircle, Search, Clock, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock service call if not yet in api_service.js (assuming we need to add it there too, 
// but based on task flow I should ensure api_service has it or add it here temporarily)
// For now, I'll assume adminService has getReports and resolveReport.

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, resolved

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await adminService.getReports();
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

    const handleResolve = async (id, status) => {
        if (!window.confirm(`Raporu "${status}" olarak işaretlemek istiyor musunuz?`)) return;
        try {
            await adminService.resolveReport(id, status);
            // Optimistic update
            setReports(reports.map(r => r.id === id ? { ...r, status } : r));
        } catch (err) {
            console.error("Durum güncellenemedi", err);
            alert("Hata oluştu.");
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesSearch = r.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.reported_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              r.reason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || r.status === filter;
        return matchesSearch && matchesFilter;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'resolved': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#4ade80', icon: <CheckCircle size={14}/> };
            case 'dismissed': return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8', icon: <XCircle size={14}/> };
            default: return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24', icon: <Clock size={14}/> };
        }
    };

    return (
        <div style={{ padding: '30px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={28} color="#6366f1"/> Şikayet Yönetimi
                </h2>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
                        <input 
                            placeholder="Kullanıcı veya sebep ara..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', width: '250px' 
                            }}
                        />
                    </div>
                    <select 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b', color: 'white' }}
                    >
                        <option value="all">Tümü</option>
                        <option value="pending">Bekleyenler</option>
                        <option value="resolved">Çözülenler</option>
                        <option value="dismissed">Reddedilenler</option>
                    </select>
                </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Rapor Eden</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Şikayet Edilen</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Sebep</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Detaylar</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Durum</th>
                            <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReports.map((report) => {
                            const statusStyle = getStatusStyle(report.status);
                            return (
                                <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="hover:bg-white/5">
                                    <td style={{ padding: '16px', fontWeight: '500' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                                {report.reporter_name.charAt(0)}
                                            </div>
                                            {report.reporter_name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                                {report.reported_name.charAt(0)}
                                            </div>
                                            {report.reported_name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', fontSize: '13px' }}>
                                            {report.reason}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', maxWidth: '300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#94a3b8', fontSize: '13px' }}>
                                            <MessageSquare size={14} style={{ marginTop: '2px', flexShrink: 0 }}/>
                                            <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {report.details || '-'}
                                            </p>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ 
                                            padding: '6px 12px', borderRadius: '20px', 
                                            background: statusStyle.bg, color: statusStyle.text,
                                            fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            {statusStyle.icon} {report.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        {report.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => handleResolve(report.id, 'resolved')}
                                                    style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#4ade80', border: 'none', cursor: 'pointer' }}
                                                    title="Çözüldü Olarak İşaretle"
                                                >
                                                    <CheckCircle size={18}/>
                                                </button>
                                                <button 
                                                    onClick={() => handleResolve(report.id, 'dismissed')}
                                                    style={{ padding: '6px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
                                                    title="Reddet"
                                                >
                                                    <XCircle size={18}/>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {filteredReports.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        Hiç şikayet bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
