import React, { useState, useEffect } from 'react';
import { adminService, userService } from '../../services/api_service';
import { useAuth } from '../../context/AuthProvider';
import { Search, ShieldCheck, Ban, CheckCircle2 } from 'lucide-react';

// NOTE: Since we don't have a dedicated "/admin-api/users" endpoint yet, 
// we will reuse userService.getUsers (if public) or assume /users is accessible.
// However, the router `users.py` has `read_users` which is public. Perfect!
import api from '../../services/api_service';

const AdminUsers = () => {
    const { refreshUser, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await adminService.getUsers(); 
            setUsers(res.data);
        } catch (err) {
            console.error("Kullanıcı listesi alınamadı", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);



    const handleVerify = async (userId) => {
        if (!window.confirm("Bu kullanıcıya Mavi Tik vermek istiyor musun?")) return;
        try {
            await adminService.verifyUser(userId);
            alert("Kullanıcı onaylandı!");
            fetchUsers();
            
            // Eğer kendimizi onayladıysak
            // ID karşılaştırmasını string'e çevirerek yapalım (UUID match garantilemek için)
            if (currentUser && String(currentUser.id) === String(userId)) {
                alert("Kendi hesabınızı onayladınız. Değişikliklerin geçerli olması için sayfa yenileniyor...");
                window.location.reload();
            } else {
                refreshUser(); // Başkasını onaylasak bile context'i tazeleyelim (Admin puanı vs değişmiş olabilir)
            }
        } catch (err) {
            alert("Onaylama başarısız: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleBan = async (userId) => {
        const reason = window.prompt("Yasaklama sebebi?");
        if (!reason) return;
        try {
            await adminService.banUser(userId, reason);
            alert("Kullanıcı yasaklandı!");
            fetchUsers();

             // Eğer kendimizi banladıysak (teorik olarak)
            if (currentUser && currentUser.id === userId) {
                refreshUser();
            }
        } catch (err) {
            alert("Yasaklama başarısız: " + (err.response?.data?.detail || err.message));
        }
    };

    const filteredUsers = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Kullanıcı Listesi ({filteredUsers.length})</h3>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '8px' }}>
                    <Search size={16} color="#9ca3af" />
                    <input 
                        type="text" 
                        placeholder="Ara..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'white', marginLeft: '10px', outline: 'none' }}
                    />
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Kullanıcı</th>
                            <th style={{ padding: '10px' }}>Email</th>
                            <th style={{ padding: '10px' }}>Güven Puanı</th>
                            <th style={{ padding: '10px' }}>Durum</th>
                            <th style={{ padding: '10px' }}>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', overflow: 'hidden' }}>
                                        {user.profile_image && <img src={user.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <span>{user.full_name}</span>
                                </td>
                                <td style={{ padding: '10px', color: '#9ca3af' }}>{user.email}</td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{ 
                                        color: user.trust_score > 80 ? '#34d399' : user.trust_score < 20 ? '#ef4444' : '#fbbf24',
                                        fontWeight: 'bold'
                                    }}>
                                        {user.trust_score}
                                    </span>
                                </td>
                                <td style={{ padding: '10px' }}>
                                    {user.is_verified ? (
                                        <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={14} /> Onaylı
                                        </span>
                                    ) : (
                                        <span style={{ color: '#9ca3af' }}>Standart</span>
                                    )}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <button 
                                        onClick={() => handleVerify(user.id)}
                                        title="Onayla (Mavi Tik)"
                                        style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', border: 'none', padding: '6px', borderRadius: '6px', marginRight: '8px', cursor: 'pointer' }}
                                    >
                                        <ShieldCheck size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleBan(user.id)}
                                        title="Yasakla"
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                                    >
                                        <Ban size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
