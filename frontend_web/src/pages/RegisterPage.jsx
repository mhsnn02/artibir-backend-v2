import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { authService } from '../services/api_service';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Calendar, MapPin, GraduationCap, ArrowRight, Loader2, AlertCircle, Phone } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    phone_number: '',
    city: '',
    birth_date: '',
    gender: 'E',
    department: '',
    language_preference: 'tr',
    kvkk_accepted: false
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    
    if (typeof errorData.detail === 'string') return errorData.detail;
    
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map(item => `${item.loc[item.loc.length - 1]}: ${item.msg}`).join(' | ');
    }
    
    if (errorData.message && errorData.detail) return `${errorData.message}: ${errorData.detail}`;
    
    return errorData.message || 'Kayıt sırasında bir hata oluştu.';
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.kvkk_accepted) {
      setError('Lütfen KVKK Aydınlatma Metni\'ni onaylayın.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Backend'deki UserCreate şemasına uygun gönderim
      await authService.register(formData);
      navigate('/login', { state: { message: 'Kayıt başarılı! Lütfen giriş yapın.' } });
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card" 
        style={{ width: '100%', maxWidth: '600px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="gradient-text" style={{ fontSize: '32px', marginBottom: '8px' }}>Yeni Hesap Oluştur</h1>
          <p style={{ color: 'var(--text-secondary)' }}>ArtıBir topluluğuna katıl, kampüsü keşfet.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {error && (
            <div style={{ 
              gridColumn: '1 / -1',
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

          {/* Ad Soyad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Ad Soyad</label>
            <div style={{ position: 'relative' }}>
              <User size={18} className="input-icon" />
              <input 
                name="full_name"
                placeholder="Ahmet Yılmaz"
                value={formData.full_name}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {/* E-posta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Üniversite E-postası</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} className="input-icon" />
              <input 
                name="email"
                type="email"
                placeholder="ad.soyad@itü.edu.tr"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {/* Telefon Numarası */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Telefon Numarası</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} className="input-icon" />
              <input 
                name="phone_number"
                placeholder="+905551234567"
                value={formData.phone_number}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {/* Şifre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Şifre</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} className="input-icon" />
              <input 
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {/* Doğum Tarihi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Doğum Tarihi</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={18} className="input-icon" />
              <input 
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          {/* Üniversite ID (itü, odtü vb.) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Üniversite Kodu</label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={18} className="input-icon" />
              <input 
                name="university_id"
                placeholder="itü, odtü (küçük harf)"
                value={formData.university_id}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

           {/* Bölüm */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Bölüm</label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={18} className="input-icon" />
              <input 
                name="department"
                placeholder="Bilgisayar Müh."
                value={formData.department}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
              />
            </div>
          </div>

          {/* Şehir */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Şehir</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} className="input-icon" />
              <input 
                name="city"
                placeholder="İstanbul"
                value={formData.city}
                onChange={handleChange}
                style={{ width: '100%', paddingLeft: '44px' }}
              />
            </div>
          </div>

          {/* Cinsiyet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Cinsiyet</label>
            <select 
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
            >
              <option value="E" style={{background: '#222'}}>Erkek</option>
              <option value="K" style={{background: '#222'}}>Kadın</option>
            </select>
          </div>

          {/* KVKK Consent */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px' }}>
            <input 
              type="checkbox" 
              name="kvkk_accepted"
              id="kvkk_accepted"
              checked={formData.kvkk_accepted}
              onChange={handleChange}
              style={{ marginTop: '4px', cursor: 'pointer', width: '18px', height: '18px' }}
              required
            />
            <label htmlFor="kvkk_accepted" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: '1.4' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>KVKK Aydınlatma Metni</span>'ni okudum, kişisel verilerimin işlenmesini onaylıyorum.
            </label>
          </div>

          <button 
            type="submit" 
            className="primary-btn flex-center" 
            disabled={isSubmitting}
            style={{ gridColumn: '1 / -1', marginTop: '10px', gap: '10px' }}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            <span>{isSubmitting ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Zaten hesabın var mı? </span>
          <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>Giriş Yap</Link>
        </div>
      </motion.div>
      
      <style>{`
        .input-label { font-size: 14px; color: var(--text-secondary); margin-left: 4px; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; }
      `}</style>
    </div>
  );
};

export default RegisterPage;
