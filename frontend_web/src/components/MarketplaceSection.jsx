import React, { useEffect, useState } from 'react';
import { marketplaceService } from '../services/api_service';
import { ShoppingBag, Plus, Tag, Search, Loader2, DollarSign, Trash2, Filter, X, ShoppingCart, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthProvider';
import MarketplaceCard from './MarketplaceCard';
import { mediaService } from '../services/api_service';

const MarketplaceSection = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', description: '', price: 0, category: 'Genel', image_url: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['All', 'Genel', 'Kitap', 'Elektronik', 'Ev', 'Giyim', 'Diğer'];

    const fetchItems = async () => {
        setLoading(true);
        try {
            // API currently filters by category if provided, but let's fetch all and filter client side for smoother experience 
            // or pass undefined if All.
            const catParam = selectedCategory === 'All' ? undefined : selectedCategory;
            const res = await marketplaceService.getItems(catParam); 
            setItems(res.data);
        } catch (err) {
            console.error("İlanlar alınamadı", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [selectedCategory]); // Refetch when category changes if server-side filtering is preferred

    const handleCreateItem = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            let finalImageUrl = newItem.image_url;
            
            // Eğer dosya seçildiyse önce onu yükle
            if (selectedFile) {
                const uploadRes = await mediaService.uploadImage(selectedFile);
                finalImageUrl = uploadRes.data.file_url;
            }

            if (!finalImageUrl) {
                alert("Lütfen bir görsel yükleyin veya URL girin.");
                setActionLoading(false);
                return;
            }

            await marketplaceService.createItem({ ...newItem, image_url: finalImageUrl });
            setShowCreateForm(false);
            setNewItem({ title: '', description: '', price: 0, category: 'Genel', image_url: '' });
            setSelectedFile(null);
            fetchItems();
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "İlan oluşturulamadı."));
        } finally {
            setActionLoading(false);
        }
    };

    const handleBuyItem = async (itemId, price, title) => {
        if (!window.confirm(`${price}₺ ödeyerek "${title}" ürününü satın almak istiyor musunuz?`)) return;
        
        setActionLoading(true);
        try {
            await marketplaceService.buyItem(itemId);
            alert("Satın alma başarılı! 🎉");
            fetchItems(); 
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "Satın alma başarısız."));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm("Bu ilanı silmek istediğinize emin misiniz?")) return;

        setActionLoading(true);
        try {
            await marketplaceService.deleteItem(itemId);
            fetchItems();
        } catch (err) {
            alert("Hata: " + (err.response?.data?.detail || "Silme işlemi başarısız."));
        } finally {
            setActionLoading(false);
        }
    };

    const glassInputStyle = {
        width: '100%', padding: '14px', borderRadius: '14px',
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'white', fontSize: '15px', outline: 'none', transition: 'all 0.2s'
    };

    // Client-side search filter
    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            
            {/* Header Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                         <h2 style={{ fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(to right, #fbbf24, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                             <ShoppingBag size={32} color="#fbbf24" style={{ WebkitTextFillColor: 'initial' }} /> Öğrenci Pazarı
                         </h2>
                         <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '16px' }}>Kampüs içi güvenli alım-satım platformu.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                         <div style={{ position: 'relative' }}>
                             <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
                             <input 
                                 placeholder="İlan ara..." 
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                                 style={{ ...glassInputStyle, width: '250px', paddingLeft: '40px', background: 'rgba(255,255,255,0.05)' }}
                             />
                         </div>
                         <motion.button 
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             onClick={() => setShowCreateForm(true)}
                             style={{ 
                                 padding: '12px 24px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                                 background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: 'white',
                                 fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px',
                                 boxShadow: '0 8px 20px rgba(251, 191, 36, 0.3)'
                             }}
                         >
                             <Plus size={20} /> İlan Ver
                         </motion.button>
                    </div>
                </div>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                background: selectedCategory === cat ? '#fbbf24' : 'rgba(255,255,255,0.03)',
                                color: selectedCategory === cat ? '#1e293b' : '#94a3b8',
                                fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }}
                        >
                            {cat === 'All' ? 'Tümü' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create Item Modal */}
            <AnimatePresence>
                {showCreateForm && (
                     <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                         <motion.div 
                             initial={{ scale: 0.9, opacity: 0 }}
                             animate={{ scale: 1, opacity: 1 }}
                             exit={{ scale: 0.9, opacity: 0 }}
                             style={{ width: '90%', maxWidth: '500px', background: '#1e293b', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', position: 'relative' }}
                         >
                             <button onClick={() => setShowCreateForm(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24}/></button>
                             
                             <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>Yeni İlan Oluştur</h3>
                             
                             <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                 <div>
                                     <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>BAŞLIK</label>
                                     <input 
                                         value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})}
                                         placeholder="Örn: Az kullanılmış Calculus Kitabı" required
                                         style={glassInputStyle}
                                     />
                                 </div>
                                 <div>
                                     <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>AÇIKLAMA</label>
                                     <textarea 
                                         value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
                                         placeholder="Ürün durumu, teslimat bilgisi vb." required rows="3"
                                         style={{ ...glassInputStyle, resize: 'none' }}
                                     />
                                 </div>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                     <div>
                                         <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>FİYAT (TL)</label>
                                         <input 
                                             type="number" 
                                             value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                                             placeholder="0.00" required
                                             style={glassInputStyle}
                                         />
                                     </div>
                                     <div>
                                         <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>KATEGORİ</label>
                                         <select 
                                             value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}
                                             style={{ ...glassInputStyle, cursor: 'pointer' }}
                                         >
                                             {categories.slice(1).map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                                         </select>
                                     </div>
                                 </div>
                                 <div>
                                     <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>ÜRÜN GÖRSELİ</label>
                                     <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                         <input 
                                             type="file" accept="image/*"
                                             onChange={e => setSelectedFile(e.target.files[0])}
                                             style={{ ...glassInputStyle, display: 'none' }}
                                             id="marketplace-file-upload"
                                         />
                                         <label 
                                            htmlFor="marketplace-file-upload"
                                            style={{ ...glassInputStyle, cursor: 'pointer', textAlign: 'center', border: selectedFile ? '1px solid #fbbf24' : '1px dashed rgba(255,255,255,0.2)', flex: 1 }}
                                         >
                                             {selectedFile ? `Seçildi: ${selectedFile.name}` : 'Dosya Seç veya Fotoğraf Çek'}
                                         </label>
                                     </div>
                                 </div>

                                 <motion.button 
                                     whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                     type="submit" disabled={actionLoading}
                                     style={{ 
                                         marginTop: '10px', padding: '16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                         background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: 'white',
                                         fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                     }}
                                 >
                                     {actionLoading ? <Loader2 className="animate-spin" /> : 'Yayınla'}
                                 </motion.button>
                             </form>
                         </motion.div>
                     </div>
                )}
            </AnimatePresence>

            {/* Content Area */}
            {loading ? (
                 <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
                     <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 20px' }}/>
                     <p>İlanlar yükleniyor...</p>
                 </div>
            ) : filteredItems.length === 0 ? (
                 <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                     <ShoppingBag size={50} style={{ opacity: 0.2, margin: '0 auto 20px', color: 'white' }} />
                     <p style={{ color: '#94a3b8' }}>Bu kategoride henüz ilan yok. İlk ilanı sen ver!</p>
                 </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {filteredItems.map((item, index) => (
                        <MarketplaceCard 
                            key={item.id}
                            item={item}
                            user={user}
                            onDelete={handleDeleteItem}
                            onBuy={handleBuyItem}
                            actionLoading={actionLoading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MarketplaceSection;
