import React, { useState, useEffect } from 'react';
import { walletService, paymentService } from '../services/api_service';
import { Wallet, TrendingUp, TrendingDown, Loader2, ArrowRight, CreditCard, History, X, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

const WalletSection = () => {
    const { user } = useAuth(); 
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [showBalance, setShowBalance] = useState(true);
    
    // Form & Tabs
    const [activeTab, setActiveTab] = useState('deposit'); // deposit, withdraw
    const [amount, setAmount] = useState('');
    const [cardInfo, setCardInfo] = useState({
        card_holder_name: '',
        card_number: '',
        expire_month: '',
        expire_year: '',
        cvc: ''
    });
    
    // UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [htmlContent, setHtmlContent] = useState(null); // For 3DS Iframe

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balRes, transRes] = await Promise.all([
                walletService.getBalance(),
                paymentService.getTransactions()
            ]);
            setBalance(balRes.data.wallet_balance);
            setTransactions(transRes.data);
        } catch (err) {
            console.error("Cüzdan verileri yüklenemedi", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const handler = (event) => {
             if (event.data === 'success') {
                 setHtmlContent(null);
                 setMessage({ type: 'success', text: 'Ödeme başarıyla gerçekleşti!' });
                 fetchData();
             }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const handleCardChange = (e) => {
        let val = e.target.value;
        if (e.target.name === 'card_number') {
            val = val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        }
        setCardInfo({ ...cardInfo, [e.target.name]: val });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsSubmitting(true);
        
        const val = parseFloat(amount);
        if (!val || val <= 0) {
            setMessage({ type: 'error', text: 'Geçerli bir miktar girin.' });
            setIsSubmitting(false);
            return;
        }

        try {
            if (activeTab === 'deposit') {
                const res = await paymentService.initialize3DS(val, cardInfo);
                if (res.data.status === 'success' && res.data.three_d_sh_html_content) {
                    setHtmlContent(res.data.three_d_sh_html_content);
                } else {
                     setMessage({ type: 'error', text: 'Ödeme başlatılamadı.' });
                }
            } else {
                await walletService.withdraw(val);
                setMessage({ type: 'success', text: `${val} TL çekim talebi oluşturuldu.` });
                setAmount('');
                fetchData();
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.detail || 'İşlem başarısız.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const glassInputStyle = {
        width: '100%', padding: '16px', borderRadius: '16px',
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', fontSize: '15px', outline: 'none', transition: 'all 0.2s'
    };

    return (
        <div style={{ paddingBottom: '100px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* 3DS Modal / Overlay */}
            <AnimatePresence>
                {htmlContent && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ width: '90%', maxWidth: '500px', height: '80%', background: 'white', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
                        >
                            <button 
                                onClick={() => setHtmlContent(null)}
                                style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: '#111', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <X size={20} />
                            </button>
                            <iframe 
                                title="3DS Payment"
                                srcDoc={htmlContent}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
                
                {/* Sol Kolon: Bakiye Kartı & İşlemler */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    
                    {/* Premium Digital Card UI */}
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        style={{ 
                            position: 'relative', overflow: 'hidden', borderRadius: '32px', padding: '32px', color: 'white',
                            background: 'linear-gradient(110deg, #0f172a 0%, #334155 100%)', // Dark Platinum
                            minHeight: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                        }}
                    >
                        {/* Background Shapes */}
                        <div style={{ position: 'absolute', top: '-50%', right: '-50%', width: '400px', height: '400px', background: '#6366f1', opacity: 0.15, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', bottom: '-20%', left: '-20%', width: '300px', height: '300px', background: '#a855f7', opacity: 0.1, borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
                        
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                             <div style={{ width: '50px', height: '36px', borderRadius: '6px', background: 'linear-gradient(135deg, #fcd34d, #d97706)', opacity: 0.9, position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)' }}>
                                 <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                                 <div style={{ position: 'absolute', top: 0, left: '33%', height: '100%', width: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                                 <div style={{ position: 'absolute', top: 0, right: '33%', height: '100%', width: '1px', background: 'rgba(0,0,0,0.2)' }}></div>
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                                 <div style={{ textAlign: 'right' }}>
                                     <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>WALLET</div>
                                     <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px' }}>PLATINUM</div>
                                 </div>
                                 <Wallet size={24} />
                             </div>
                        </div>

                        {/* Balance */}
                        <div style={{ zIndex: 10, marginTop: '20px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', opacity: 0.6 }}>
                                 <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Mevcut Bakiye</span>
                                 <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                     {showBalance ? <Eye size={14}/> : <EyeOff size={14}/>}
                                 </button>
                             </div>
                             <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px' }}>
                                {loading ? <Loader2 className="animate-spin" size={32}/> : (showBalance ? `${balance.toLocaleString()} ₺` : '••••••')}
                             </div>
                        </div>

                        {/* Footer */}
                        <div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                             <div>
                                 <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.4, marginBottom: '4px' }}>KART SAHİBİ</div>
                                 <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>{user?.full_name || 'Misafir'}</div>
                             </div>
                             <div style={{ fontFamily: 'monospace', fontSize: '18px', opacity: 0.7, letterSpacing: '2px' }}>
                                 •••• 8842
                             </div>
                        </div>
                    </motion.div>

                    {/* Action Area */}
                    <div className="glass-card" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', marginBottom: '24px' }}>
                            <button 
                                onClick={() => setActiveTab('deposit')}
                                style={{ 
                                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'deposit' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: activeTab === 'deposit' ? 'white' : '#94a3b8',
                                    fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <TrendingUp size={16} color={activeTab === 'deposit' ? '#4ade80' : 'currentColor'} /> Para Yükle
                            </button>
                            <button 
                                onClick={() => setActiveTab('withdraw')}
                                style={{ 
                                    flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                    background: activeTab === 'withdraw' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: activeTab === 'withdraw' ? 'white' : '#94a3b8',
                                    fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <TrendingDown size={16} color={activeTab === 'withdraw' ? '#f87171' : 'currentColor'} /> Para Çek
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Miktar Belirle</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                    {[50, 100, 250, 500].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(val.toString())}
                                            style={{
                                                padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                                background: amount === val.toString() ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                                color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s'
                                            }}
                                        >
                                            {val}₺
                                        </button>
                                    ))}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '20px' }}>₺</span>
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00" 
                                        style={{ ...glassInputStyle, paddingLeft: '40px', fontSize: '24px', fontWeight: 'bold' }}
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {activeTab === 'deposit' && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                                <CreditCard size={14}/> Kart Bilgileri
                                            </div>
                                            <input name="card_holder_name" placeholder="Kart Üzerindeki İsim" value={cardInfo.card_holder_name} onChange={handleCardChange} style={glassInputStyle} />
                                            <input name="card_number" placeholder="0000 0000 0000 0000" maxLength={19} value={cardInfo.card_number} onChange={handleCardChange} style={{ ...glassInputStyle, fontFamily: 'monospace' }} />
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input name="expire_month" placeholder="AA" maxLength={2} value={cardInfo.expire_month} onChange={handleCardChange} style={{ ...glassInputStyle, textAlign: 'center' }} />
                                                <input name="expire_year" placeholder="YY" maxLength={2} value={cardInfo.expire_year} onChange={handleCardChange} style={{ ...glassInputStyle, textAlign: 'center' }} />
                                                <input name="cvc" placeholder="CVC" maxLength={3} value={cardInfo.cvc} onChange={handleCardChange} style={{ ...glassInputStyle, textAlign: 'center' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {message && (
                                <div style={{ 
                                    padding: '16px', borderRadius: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500',
                                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: message.type === 'success' ? '#4ade80' : '#f87171', border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                }}>
                                    {message.text}
                                </div>
                            )}

                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit" 
                                disabled={isSubmitting || !amount}
                                style={{
                                    width: '100%', padding: '18px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                    background: isSubmitting || !amount ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: isSubmitting || !amount ? '#94a3b8' : 'white', fontWeight: 'bold', fontSize: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    opacity: isSubmitting || !amount ? 0.7 : 1, transition: 'all 0.2s',
                                    boxShadow: isSubmitting || !amount ? 'none' : '0 10px 30px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : (activeTab === 'deposit' ? 'Ödemeyi Tamamla' : 'Çekim Talebi Oluştur')} <ChevronRight size={18}/>
                            </motion.button>
                        </form>
                    </div>
                </div>

                {/* Sağ Kolon: Geçmiş İşlemler */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     <div className="glass-card" style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', color: '#818cf8' }}>
                                    <History size={20}/>
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Son Hareketler</h3>
                             </div>
                             <button style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase' }}>Tümünü Gör</button>
                         </div>

                         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '700px', overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                    <Loader2 className="animate-spin" style={{ margin: '0 auto 10px' }} size={30}/> Yükleniyor...
                                </div>
                            ) : transactions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', color: '#64748b', background: 'rgba(255,255,255,0.02)' }}>
                                    <History size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }}/>
                                    <p style={{ margin: 0, fontSize: '14px' }}>Henüz bir işlem yapmadınız.</p>
                                </div>
                            ) : (
                                transactions.map((tx, i) => (
                                    <motion.div 
                                        key={tx.id}
                                        initial={{ x: 20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ 
                                            padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                                            background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '16px'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: tx.transaction_type === 'deposit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: tx.transaction_type === 'deposit' ? '#4ade80' : '#f87171'
                                        }}>
                                            {tx.transaction_type === 'deposit' ? <ArrowRight className="rotate-45" size={20}/> : <ArrowRight className="-rotate-45" size={20}/>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>
                                                {tx.description || (tx.transaction_type === 'deposit' ? 'Bakiye Yükleme' : 'Para Çekim Talebi')}
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '12px' }}>
                                                {new Date(tx.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '16px', color: tx.transaction_type === 'deposit' ? '#4ade80' : 'white' }}>
                                            {tx.transaction_type === 'deposit' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} ₺
                                        </div>
                                    </motion.div>
                                ))
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletSection;
