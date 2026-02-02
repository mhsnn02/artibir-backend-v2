import React, { useState } from 'react';
import { Shield, BookOpen, Bell, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SafetyGuideModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('community_rules');

    const content = {
        community_rules: {
            title: "Topluluk Kuralları",
            icon: <Shield size={24} color="#60a5fa" />,
            items: [
                "Topluluk kurallarına saygı gösterin. Taciz, nefret söylemi ve hakaret kesinlikle yasaktır.",
                "Etkinliklere katılırken dakik olmaya özen gösterin.",
                "Profil bilgilerinizin (Üni, Bölüm) güncel ve doğru olduğundan emin olun.",
                "Diğer kullanıcıların gizliliğine saygı duyun."
            ]
        },
        kvkk_rules: {
            title: "KVKK & Gizlilik",
            icon: <BookOpen size={24} color="#f472b6" />,
            items: [
                "Kişisel verileriniz 6698 sayılı KVKK kapsamında korunmaktadır.",
                "Verileriniz sadece hizmetin sağlanması amacıyla işlenir.",
                "Konum verisi sadece siz onay verirseniz anlık olarak paylaşılır.",
                "Diğer kullanıcılar kişisel bilgilerinizi (Telefon, Email) açıkça paylaşmadığınız sürece göremez.",
                "Veri güvenliğiniz için uçtan uca şifreleme yöntemleri kullanılmaktadır."
            ]
        },
        security: {
            title: "Güvenlik & Bildirimler",
            icon: <Bell size={24} color="#34d399" />,
            items: [
                "UYARI: 'Mavi Tik' ✅ olmayan kullanıcılarla iletişime geçerken dikkatli olun.",
                "Etkinliklere giderken konumunuzu güvendiğiniz bir arkadaşınızla paylaşın.",
                "Şüpheli bir durum fark ederseniz anında 'Şikayet Et' butonunu kullanın.",
                "Admin duyurularını düzenli olarak takip edin."
            ]
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{
                    width: '90%', maxWidth: '600px',
                    padding: '0', overflow: 'hidden',
                    background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '20px', background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 className="gradient-text" style={{ fontSize: '24px', margin: 0, textAlign: 'center' }}>
                        Hoş Geldiniz! 👋
                    </h2>
                    <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '5px', fontSize: '14px' }}>
                        Güvenliğiniz ve huzurunuz için lütfen okuyun.
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {Object.keys(content).map(key => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            style={{
                                flex: 1, padding: '15px', background: 'none', border: 'none',
                                color: activeTab === key ? 'white' : '#64748b',
                                borderBottom: activeTab === key ? '2px solid #60a5fa' : '2px solid transparent',
                                cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s'
                            }}
                        >
                            {content[key].title.split(' ')[0]}...
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                            {content[activeTab].icon}
                        </div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>{content[activeTab].title}</h3>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {content[activeTab].items.map((item, index) => (
                            <li key={index} style={{ 
                                display: 'flex', gap: '12px', marginBottom: '15px',
                                color: '#cbd5e1', lineHeight: '1.5'
                            }}>
                                <div style={{ marginTop: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#60a5fa' }}></div>
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center' }}>
                    <button 
                        onClick={onClose}
                        className="primary-btn"
                        style={{ padding: '12px 40px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    >
                        <CheckCircle2 size={18} />
                        Okudum ve Anladım
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default SafetyGuideModal;
