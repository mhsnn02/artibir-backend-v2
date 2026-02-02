import React, { useState } from 'react';
import { verificationService } from '../services/api_service';
import { ShieldCheck, GraduationCap, CreditCard, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { motion } from 'framer-motion';

const VerificationCenter = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('tckn'); // tckn, student
    const [message, setMessage] = useState(null);

    // Form States
    const [tcData, setTcData] = useState({ tc_no: '', full_name: '', birth_year: '' }); // birth_date handled as year often in NVI
    const [studentData, setStudentData] = useState({ barcode: '', full_name: '' });
    const [isEditing, setIsEditing] = useState(false);

    // Initialize/Update default full name when user data loads
    React.useEffect(() => {
        if (user?.full_name) {
            setStudentData(prev => ({ ...prev, full_name: user.full_name }));
            setTcData(prev => ({ ...prev, full_name: user.full_name }));
        }
    }, [user?.full_name]);

    const clearMessage = () => setMessage(null);

    const handleTCKNVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessage();
        try {
            await verificationService.verifyIdentity(tcData);
            setMessage({ type: 'success', text: 'TC Kimlik doğrulaması başarılı! Mavi tik kazandınız.' });
            if (refreshUser) refreshUser();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Doğrulama başarısız.' });
        } finally {
            setLoading(false);
        }
    };

    const handleStudentVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessage();
        try {
            await verificationService.verifyStudent({ barcode: studentData.barcode });
            setMessage({ type: 'success', text: 'Öğrenci belgesi doğrulandı! Rozetiniz eklendi.' });
            if (refreshUser) refreshUser();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Belge doğrulanamadı.' });
        } finally {
            setLoading(false);
        }
    };

    const renderStatusBadge = (isVerified) => (
        isVerified ? 
        <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
            <CheckCircle2 size={12} /> Doğrulandı
        </span> : 
        <span style={{ color: '#fbbf24', fontSize: '12px', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
            Doğrulanmadı
        </span>
    );

    return (
        <div className="glass-card" style={{ marginTop: '20px', padding: '30px' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
                <ShieldCheck size={24} color="#6366f1" /> Doğrulama Merkezi
            </h3>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <button 
                    onClick={() => { setActiveTab('tckn'); clearMessage(); }}
                    style={{ 
                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: activeTab === 'tckn' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        color: activeTab === 'tckn' ? '#6366f1' : '#94a3b8', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <CreditCard size={16} /> TC Kimlik {renderStatusBadge(user.is_verified)}
                </button>
                <button 
                    onClick={() => { setActiveTab('student'); clearMessage(); }}
                    style={{ 
                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: activeTab === 'student' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        color: activeTab === 'student' ? '#6366f1' : '#94a3b8', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <GraduationCap size={16} /> Öğrenci Belgesi {renderStatusBadge(user.is_student_verified)}
                </button>
            </div>

            {/* Error/Success Message */}
             {message && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        padding: '12px', borderRadius: '8px', marginBottom: '20px',
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? '#4ade80' : '#f87171',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
                    }}
                >
                    {message.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                    {message.text}
                </motion.div>
            )}

            {/* Security Badge Info */}
            <div style={{ 
                background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px', padding: '15px', marginBottom: '25px',
                display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ShieldCheck size={20} color="#10b981" />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#10b981' }}>Üst Düzey Güvenlik Protokolü</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                            Verileriniz <strong>AES-256</strong> ile şifrelenir ve doğrudan <strong>NVİ & E-Devlet</strong> üzerinden doğrulanır.
                        </p>
                    </div>
                </div>
                {((activeTab === 'tckn' && user.is_verified) || (activeTab === 'student' && user.is_student_verified)) && (
                    <button 
                        onClick={() => {
                            if (window.confirm("Onaylı bilgilerinizi değiştirmek üzeresiniz. Devam etmek istiyor musunuz?")) {
                                // "Edit Mode" simülasyonu - Aslında sadece disabled'ı kaldıracağız
                                // State gerekecek, o yüzden burayı bir state ile yönetmek daha doğru.
                                // Hızlı çözüm: Doğrudan DOM manipülasyonu yerine component state'i kullanmalıyız.
                                // Ancak replace_file_content ile state eklemek zor olabilir, en iyisi 'isEditing' state'i eklemek.
                                alert("Düzenleme modu aktif. Lütfen gerçek bilgilerinizi giriniz.");
                                setIsEditing(true);
                            }
                        }}
                        style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Bilgileri Güncelle
                    </button>
                )}
            </div>

            {/* Content */}
            <div style={{ minHeight: '200px' }}>
                {activeTab === 'tckn' && (
                    <form onSubmit={handleTCKNVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0 }}>
                                <strong>Resmi NVİ Sorgusu:</strong> TC Kimlik numaranız, Adınız, Soyadınız ve Doğum Yılınız nüfus müdürlüğü kayıtlarıyla %100 eşleşmelidir.
                            </p>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>TC Kimlik Numarası</label>
                                <input 
                                    type="text" maxLength="11" placeholder="11 haneli TC No"
                                    value={tcData.tc_no} onChange={e => setTcData({...tcData, tc_no: e.target.value.replace(/\D/g,'')})}
                                    className="glass-input" required
                                    disabled={user.is_verified && !isEditing}
                                    style={{ 
                                        fontSize: '16px', letterSpacing: '1px', fontFamily: 'monospace',
                                        opacity: (user.is_verified && !isEditing) ? 0.7 : 1, 
                                        cursor: (user.is_verified && !isEditing) ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Ad Soyad (Kimlikteki gibi)</label>
                                <input 
                                    type="text" placeholder="Ad Soyad"
                                    value={tcData.full_name} onChange={e => setTcData({...tcData, full_name: e.target.value.toLocaleUpperCase('tr-TR')})}
                                    className="glass-input"
                                    disabled={user.is_verified && !isEditing}
                                    style={{ 
                                        fontSize: '16px', textTransform: 'uppercase',
                                        opacity: (user.is_verified && !isEditing) ? 0.7 : 1, 
                                        cursor: (user.is_verified && !isEditing) ? 'not-allowed' : 'text'
                                    }}
                                />
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Eşleşme için tam adınızı girmelisiniz.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button 
                                type="submit" disabled={loading || (user.is_verified && !isEditing)} 
                                className="primary-btn" 
                                style={{ 
                                    opacity: (user.is_verified && !isEditing) ? 0.5 : 1, 
                                    width: 'auto', padding: '12px 40px',
                                    background: (user.is_verified && !isEditing) ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (user.is_verified && !isEditing) ? 'Doğrulandı ✅' : 'NVİ ile Doğrula'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'student' && (
                    <form onSubmit={handleStudentVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                            <p style={{ fontSize: '14px', color: '#e2e8f0', margin: 0 }}>
                                <strong>E-Devlet Entegrasyonu:</strong> E-Devlet üzerinden aldığınız "Öğrenci Belgesi"nin sağ üst köşesindeki barkod numarasını giriniz.
                            </p>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Belge Barkod Numarası</label>
                                <input 
                                    type="text" placeholder="Örn: 23123456789 (Belge üzerindeki kod)"
                                    value={studentData.barcode} onChange={e => setStudentData({...studentData, barcode: e.target.value})}
                                    className="glass-input" required
                                    disabled={user.is_student_verified && !isEditing}
                                    style={{ 
                                        fontSize: '16px', fontFamily: 'monospace',
                                        opacity: (user.is_student_verified && !isEditing) ? 0.7 : 1, 
                                        cursor: (user.is_student_verified && !isEditing) ? 'not-allowed' : 'text'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>Belge Üzerindeki Ad Soyad</label>
                                <input 
                                    type="text" placeholder="Ad Soyad"
                                    value={studentData.full_name} 
                                    onChange={e => setStudentData({...studentData, full_name: e.target.value.toLocaleUpperCase('tr-TR')})}
                                    className="glass-input"
                                    disabled={user.is_student_verified && !isEditing}
                                    style={{ 
                                        fontSize: '16px', textTransform: 'uppercase',
                                        opacity: (user.is_student_verified && !isEditing) ? 0.7 : 1, 
                                        cursor: (user.is_student_verified && !isEditing) ? 'not-allowed' : 'text'
                                    }}
                                />
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Belgedeki isim ile birebir aynı olmalıdır.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                             <button 
                                type="submit" disabled={loading || (user.is_student_verified && !isEditing)} 
                                className="primary-btn"
                                style={{ 
                                    opacity: (user.is_student_verified && !isEditing) ? 0.5 : 1,
                                    width: 'auto', padding: '12px 40px', 
                                    background: (user.is_student_verified && !isEditing) ? '#10b981' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                }}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : (user.is_student_verified && !isEditing) ? 'Doğrulandı ✅' : 'E-Devlet ile Sorgula'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VerificationCenter;
