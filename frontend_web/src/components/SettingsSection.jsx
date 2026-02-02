import React, { useState } from 'react';
import VerificationCenter from './VerificationCenter';
import { securityService, userService } from '../services/api_service'; // userService for privacy toggles if needed separately
import { Lock, Shield, Smartphone, LogOut, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

const SettingsSection = () => {
    const { logout } = useAuth();
    const [passData, setPassData] = useState({ old_password: '', new_password: '' });
    const [devices, setDevices] = useState([]); // In real app, fetch this on mount
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await securityService.changePassword(passData);
            setMessage({ type: 'success', text: 'Şifreniz başarıyla değiştirildi.' });
            setPassData({ old_password: '', new_password: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Şifre değiştirilemedi.' });
        } finally {
            setLoading(false);
        }
    };

    const handleFetchDevices = async () => {
        try {
            const res = await securityService.getLoginDevices();
            setDevices(res.data); 
        } catch (err) {
             console.error("Cihazlar alınamadı");
        }
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            await userService.deleteAccount();
            logout(); // Silme sonrası oturumu kapat
        } catch (err) {
            setMessage({ type: 'error', text: 'Hesap silinemedi. Lütfen daha sonra tekrar deneyin.' });
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount
    React.useEffect(() => {
        handleFetchDevices();
    }, []);

    return (
        <div style={{ padding: '0 20px 40px 20px' }}>
            <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Shield color="var(--accent-primary)" /> Güvenlik ve Ayarlar
            </h2>

            <div style={{ marginBottom: '40px' }}>
                <VerificationCenter />
            </div>

            {/* Main Config Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                
                {/* Password Change */}
                <div className="glass-card" style={{ padding: '30px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={18} /> Şifre Değiştir
                    </h3>
                    
                    <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                         {message && (
                            <div style={{ 
                                padding: '10px', borderRadius: '8px',
                                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                                fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                {message.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                                {message.text}
                            </div>
                        )}

                        <input 
                            type="password" placeholder="Mevcut Şifre" required
                            className="glass-input"
                            value={passData.old_password}
                            onChange={e => setPassData({...passData, old_password: e.target.value})}
                        />
                         <input 
                            type="password" placeholder="Yeni Şifre" required
                            className="glass-input"
                            value={passData.new_password}
                            onChange={e => setPassData({...passData, new_password: e.target.value})}
                        />
                        <button type="submit" disabled={loading} className="primary-btn">
                            {loading ? <Loader2 className="animate-spin" /> : 'Güncelle'}
                        </button>
                    </form>
                </div>

                {/* Device Management (Mock/Real) */}
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Smartphone size={18} /> Aktif Cihazlar
                        </h3>
                        <button onClick={handleFetchDevices} style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                            Yenile
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {devices.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cihaz listesi için yenileye basınız.</p>}
                        {devices.map(dev => (
                            <div key={dev.id} style={{ 
                                padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <p style={{ fontWeight: '600', fontSize: '14px' }}>{dev.device}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{dev.ip} • {dev.last_active}</p>
                                </div>
                                <button style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                                    <LogOut size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logout Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '40px' }}>
                <button 
                    onClick={logout} 
                    className="glass-card"
                    style={{ 
                        width: '100%', padding: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white', fontSize: '16px', fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                    Güvenli Çıkış Yap
                </button>

                <button 
                    onClick={() => {
                        if (window.confirm("Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz (etkinlikler, mesajlar, bakiye) kalıcı olarak silinecektir.")) {
                            handleDeleteAccount();
                        }
                    }}
                    style={{ 
                        width: '100%', padding: '15px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171', fontSize: '14px', fontWeight: '500',
                        cursor: 'pointer', borderRadius: '12px'
                    }}
                >
                    <AlertCircle size={18} />
                    Hesabımı Kalıcı Olarak Sil (KVKK)
                </button>
            </div>
        </div>
    );
};

export default SettingsSection;
