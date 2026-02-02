import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, X } from 'lucide-react';

const VerificationAlert = ({ isOpen, onClose, onNavigate }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass-card"
                    style={{ 
                        maxWidth: '400px', width: '100%', padding: '30px', textAlign: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ 
                        width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'
                    }}>
                        <ShieldAlert size={32} color="#ef4444" />
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', color: 'white' }}>
                        Doğrulama Gerekli
                    </h2>
                    
                    <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '25px', fontSize: '15px' }}>
                        Bu işlemi gerçekleştirmek için <strong>TC Kimlik</strong> ve <strong>Öğrenci Belgesi</strong> doğrulamalarını tamamlamanız gerekmektedir.
                    </p>

                    <button 
                        onClick={() => {
                            onClose();
                            onNavigate();
                        }}
                        className="primary-btn"
                        style={{ 
                            background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
                            border: 'none', justifyContent: 'center'
                        }}
                    >
                        Doğrulama Merkezine Git <ArrowRight size={18} />
                    </button>
                    
                    <button 
                        onClick={onClose}
                        style={{ 
                            marginTop: '15px', background: 'transparent', border: 'none', 
                            color: '#94a3b8', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        Daha Sonra
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VerificationAlert;
