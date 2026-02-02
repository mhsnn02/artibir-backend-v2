import React, { useState } from 'react';
import { X, Calendar, MapPin, AlignLeft, Globe, Loader2, Type, Hash, Users } from 'lucide-react';
import { eventService } from '../services/api_service';
import { motion } from 'framer-motion';

const CreateEventModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        city: '',
        location: '',
        capacity: 14,
        min_age_limit: 18,
        max_age_limit: 99,
        target_gender: 'HERKES',
        latitude: 0,
        longitude: 0,
        campus: '',
        category: 'Genel',
        deposit_amount: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Backend schema mapping
            const payload = {
                ...formData,
                location_name: formData.location, // UI'da 'location' -> API'de 'location_name'
                date: new Date(formData.date).toISOString(),
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                min_age_limit: parseInt(formData.min_age_limit),
                max_age_limit: parseInt(formData.max_age_limit),
                capacity: parseInt(formData.capacity || 10),
                deposit_amount: parseFloat(formData.deposit_amount || 0),
                price: parseFloat(formData.deposit_amount || 0) // Backend 'price' alanını da bekliyor olabilir
            };
            
            await eventService.createEvent(payload);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || "Etkinlik oluşturulurken hata oluştu!";
            if (typeof msg === 'object') {
                 // Validation error array
                 alert("Hata: " + JSON.stringify(msg));
            } else {
                 alert("Hata: " + msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={onClose}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card"
                style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', background: '#1e293b' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className="gradient-text">Yeni Etkinlik Oluştur</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="label-text">Etkinlik Başlığı</label>
                        <div className="input-wrapper">
                            <Type size={18} className="input-icon" />
                            <input name="title" value={formData.title} onChange={handleChange} required className="glass-input-field" placeholder="Örn: Kampüs Kahve Buluşması" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label-text">Kategori</label>
                        <div className="input-wrapper">
                            <Hash size={18} className="input-icon" />
                            <select name="category" value={formData.category} onChange={handleChange} className="glass-input-field">
                                <option value="Genel">Genel</option>
                                <option value="Eğlence">Eğlence & Parti</option>
                                <option value="Akademik">Akademik & Kariyer</option>
                                <option value="Spor">Spor</option>
                                <option value="Sanat">Sanat & Müzik</option>
                                <option value="Teknoloji">Teknoloji</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label-text">Açıklama</label>
                        <div className="input-wrapper">
                            <AlignLeft size={18} className="input-icon" />
                            <textarea name="description" value={formData.description} onChange={handleChange} required className="glass-input-field" placeholder="Detaylar..." rows="3" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="label-text">Tarih ve Saat</label>
                            <div className="input-wrapper">
                                <Calendar size={18} className="input-icon" />
                                <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required className="glass-input-field" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label-text">Şehir</label>
                            <div className="input-wrapper">
                                <MapPin size={18} className="input-icon" />
                                <input name="city" value={formData.city} onChange={handleChange} className="glass-input-field" placeholder="İstanbul" />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                         <label className="label-text">Konum (Açık Adres / Yer)</label>
                         <div className="input-wrapper">
                             <Globe size={18} className="input-icon" />
                             <input name="location" value={formData.location} onChange={handleChange} className="glass-input-field" placeholder="Kütüphane önü" />
                         </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                         <div className="form-group">
                            <label className="label-text">Kapasite</label>
                            <div className="input-wrapper">
                                <Users size={18} className="input-icon" />
                                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="glass-input-field" min="1" />
                            </div>
                         </div>
                         <div className="form-group">
                            <label className="label-text">Min. Yaş</label>
                            <div className="input-wrapper">
                                <Users size={18} className="input-icon" />
                                <input type="number" name="min_age_limit" value={formData.min_age_limit} onChange={handleChange} className="glass-input-field" min="16" />
                            </div>
                         </div>
                         <div className="form-group">
                             <label className="label-text">Hedef Kitle</label>
                             <div className="input-wrapper">
                                 <Users size={18} className="input-icon" />
                                 <select name="target_gender" value={formData.target_gender} onChange={handleChange} className="glass-input-field">
                                     <option value="HERKES">Herkes</option>
                                     <option value="SADECE_KIZLAR">Sadece Kızlar</option>
                                     <option value="SADECE_ERKEKLER">Sadece Erkekler</option>
                                 </select>
                             </div>
                         </div>
                    </div>

                    <div className="form-group">
                         <label className="label-text">Katılım Ücreti (₺) - Opsiyonel</label>
                         <div className="input-wrapper">
                             <span className="input-icon" style={{ fontSize: '16px', fontWeight: 'bold' }}>₺</span>
                             <input type="number" name="deposit_amount" value={formData.deposit_amount || ''} onChange={handleChange} className="glass-input-field" placeholder="0 - Ücretsiz" min="0" />
                         </div>
                         {formData.deposit_amount > 0 && (
                            <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255, 165, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 165, 0, 0.3)', color: '#fbbf24', fontSize: '13px' }}>
                                <strong style={{ display: 'block', marginBottom: '4px' }}>🔒 Güvenli Havuz Sistemi</strong>
                                Ödemeler etkinlik gerçekleşip QR kodlar okutulana kadar Artıbir havuzunda güvende tutulur.
                            </div>
                         )}
                    </div>

                    <button 
                        type="submit" 
                        className="primary-btn flex-center"
                        disabled={isSubmitting}
                        style={{ marginTop: '10px' }}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Oluştur"}
                    </button>
                </form>
            </motion.div>

            <style>{`
                .label-text { font-size: 14px; color: var(--text-secondary); margin-bottom: 6px; display: block; }
                .input-wrapper { position: relative; }
                .input-icon { position: absolute; left: 14px; top: 14px; color: var(--text-secondary); pointer-events: none; }
                .glass-input-field { 
                    width: 100%; padding: 12px 12px 12px 44px; 
                    border-radius: 12px; background: rgba(255,255,255,0.05); 
                    border: 1px solid var(--glass-border); color: white;
                }
                .glass-input-field option { background: #1e293b; color: white; }
            `}</style>
        </div>
    );
};

export default CreateEventModal;
