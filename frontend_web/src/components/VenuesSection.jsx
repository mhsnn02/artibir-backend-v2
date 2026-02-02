import React, { useState, useEffect } from 'react';
import { venueService } from '../services/api_service';
import { MapPin, Coffee, Utensils, Percent, Plus, Loader2 } from 'lucide-react';

const VenuesSection = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Add Venue Form
    const [newVenue, setNewVenue] = useState({
        name: '',
        address: '',
        discount_rate: '',
        category: 'Cafe',
        latitude: 41.0082, // Default Istanbul
        longitude: 28.9784
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchVenues = async () => {
        setLoading(true);
        try {
            const res = await venueService.getVenues();
            setVenues(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVenues();
    }, []);

    const handleAddVenue = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
             await venueService.createVenue({
                 ...newVenue,
                 discount_rate: isNaN(newVenue.discount_rate) ? 0 : parseFloat(newVenue.discount_rate)
             });
             setShowAddForm(false);
             fetchVenues();
             // Reset form
             setNewVenue({ name: '', address: '', discount_rate: '', category: 'Cafe', latitude: 41.0082, longitude: 28.9784 });
        } catch (err) {
            console.error(err);
            alert("Mekan eklenirken hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 className="gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={28} /> Kampüs Mekanları
                </h2>
                 <button 
                    onClick={() => setShowAddForm(!showAddForm)} 
                    className="primary-btn flex-center"
                    style={{ gap: '8px', padding: '10px 20px' }}
                >
                    <Plus size={18} /> Mekan Ekle
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="glass-card" style={{ padding: '24px', marginBottom: '30px', border: '1px solid var(--accent-primary)' }}>
                    <h3 style={{ marginBottom: '16px' }}>Yeni Mekan Ekle</h3>
                    <form onSubmit={handleAddVenue} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                         <input 
                            placeholder="Mekan Adı" 
                            value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})}
                            className="glass-input" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                            required
                        />
                         <select 
                            value={newVenue.category} onChange={e => setNewVenue({...newVenue, category: e.target.value})}
                            className="glass-input" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                        >
                            <option value="Cafe">Kafe</option>
                            <option value="Restaurant">Restoran</option>
                            <option value="Library">Kütüphane</option>
                            <option value="Gym">Spor Salonu</option>
                            <option value="Other">Diğer</option>
                        </select>
                        <input 
                            placeholder="Adres / Konum" 
                            value={newVenue.address} onChange={e => setNewVenue({...newVenue, address: e.target.value})}
                            className="glass-input" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', gridColumn: 'span 2' }}
                        />
                         <input 
                            placeholder="İndirim Oranı (%)" 
                            type="number"
                            value={newVenue.discount_rate} onChange={e => setNewVenue({...newVenue, discount_rate: e.target.value})}
                            className="glass-input" style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                        />
                         <button 
                            type="submit" 
                            className="primary-btn flex-center" 
                            style={{ gridColumn: 'span 2' }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Kaydet'}
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                 <div className="flex-center" style={{ padding: '40px' }}><Loader2 className="animate-spin" size={32} /></div>
            ) : venues.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                     <Coffee size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                     <p>Henüz mekan eklenmemiş.</p>
                 </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {venues.map(venue => (
                        <div key={venue.id} className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--accent-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                                %{venue.discount_rate} İndirim
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '10px', 
                                    background: venue.category === 'Food' ? 'orange' : 'var(--glass-bg)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {venue.category === 'Restaurant' ? <Utensils size={20}/> : <Coffee size={20}/>}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{venue.name}</h3>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{venue.category}</span>
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '14px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} /> {venue.address || 'Adres bilgisi yok'}
                            </p>
                            
                            <button style={{ 
                                width: '100%', marginTop: '16px', padding: '10px', borderRadius: '8px', 
                                border: '1px solid var(--glass-border)', background: 'transparent', color: 'white',
                                cursor: 'pointer'
                            }}>
                                Yol Tarifi Al
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VenuesSection;
