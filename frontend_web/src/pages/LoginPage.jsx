import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const formatError = (err) => {
    console.error("API Error Detailed:", err);
    
    if (!err.response) {
      if (err.request) {
        return 'Sunucuya ulaşıldı fakat yanıt alınamadı. Backend çalışıyor mu kontrol edin.';
      } else {
        return 'İstek oluşturulamadı. Ağ hatası veya yanlış URL.';
      }
    }

    const errorData = err.response.data;
    if (!errorData) return `Sunucudan boş yanıt döndü (HTTP ${err.response.status})`;
    
    // 1. Standart detail formatı (String)
    if (typeof errorData.detail === 'string') return errorData.detail;
    
    // 2. FastAPI Validation Error (Array)
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map(item => `${item.loc[item.loc.length - 1]}: ${item.msg}`).join(' | ');
    }
    
    // 3. Bizim özel 500 hatası formatımız (message + detail)
    if (errorData.message && errorData.detail) return `${errorData.message}: ${errorData.detail}`;
    
    return errorData.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card fade-in" 
        style={{ width: '100%', maxWidth: '420px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="gradient-text" style={{ fontSize: '32px', marginBottom: '8px' }}>ArtıBir V2</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Kampüsün en sosyal dünyasına giriş yap.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {successMessage && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--success)', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>E-posta</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                placeholder="ogrenci@universite.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>Şifre</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="primary-btn flex-center" 
            disabled={isSubmitting}
            style={{ marginTop: '12px', gap: '10px' }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>{isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Henüz hesabın yok mu? </span>
          <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Kayıt Ol</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
