import React, { useState } from 'react';
import { searchService } from '../services/api_service';
import { Search, User, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';

const SearchSection = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await searchService.globalSearch(query);
            setResults(res.data.results);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '0 20px 40px 20px' }}>
             <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Search color="var(--accent-primary)" /> Global Arama
            </h2>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <input 
                    type="text" 
                    placeholder="Etkinlik, Kulüp veya Kişi ara..." 
                    className="glass-input" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: 1 }}
                />
                <button type="submit" className="primary-btn" disabled={loading} style={{ width: 'auto', padding: '0 24px' }}>
                    {loading ? <Loader2 className="animate-spin" /> : <Search />}
                </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* Users Results */}
                {results?.users?.length > 0 && (
                    <div className="glass-card">
                         <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} /> Kullanıcılar
                         </h3>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                             {results.users.map(u => (
                                 <div key={u.id} style={{ 
                                     background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px',
                                     display: 'flex', alignItems: 'center', gap: '10px'
                                 }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333' }}></div>
                                    <span>{u.name}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                 {/* Events Results */}
                 {results?.events?.length > 0 && (
                    <div className="glass-card">
                         <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} /> Etkinlikler
                         </h3>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                             {results.events.map(e => (
                                 <div key={e.id} style={{ 
                                     background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px',
                                     display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                 }}>
                                    <span style={{ fontWeight: '600' }}>{e.title}</span>
                                    <ArrowRight size={16} style={{ opacity: 0.5 }} />
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                 {/* Clubs Results */}
                 {results?.clubs?.length > 0 && (
                    <div className="glass-card">
                         <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} /> Kulüpler
                         </h3>
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                             {results.clubs.map(c => (
                                 <div key={c.id} style={{ 
                                     background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px',
                                     textAlign: 'center'
                                 }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{c.name}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
                
                {results && Object.values(results).every(arr => arr.length === 0) && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                        Sonuç bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchSection;
