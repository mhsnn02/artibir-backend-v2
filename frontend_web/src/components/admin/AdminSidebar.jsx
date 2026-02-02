import React from 'react';
import { LayoutDashboard, Users, LogOut, Shield, ShieldCheck, Smartphone } from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, logout }) => {
    return (
        <div className="glass-card" style={{ 
            width: '260px', 
            borderRadius: '0 20px 20px 0', 
            padding: '30px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <div style={{ padding: '0 10px 30px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={32} color="#ef4444" />
                <div>
                    <h2 className="gradient-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>Admin Panel</h2>
                    <span style={{ fontSize: '10px', color: '#ef4444', letterSpacing: '2px', fontWeight: 'bold' }}>YÖNETİCİ</span>
                </div>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarLink 
                    icon={<LayoutDashboard size={20} />} 
                    label="Genel Bakış" 
                    active={activeTab === 'stats'} 
                    onClick={() => setActiveTab('stats')} 
                />
                <SidebarLink 
                    icon={<Users size={20} />} 
                    label="Kullanıcı Yönetimi" 
                    active={activeTab === 'users'} 
                    onClick={() => setActiveTab('users')} 
                />
                <SidebarLink 
                    icon={<ShieldCheck size={20} />} 
                    label="Şikayet Yönetimi" 
                    active={activeTab === 'reports'} 
                    onClick={() => setActiveTab('reports')} 
                />
                <SidebarLink 
                    icon={<ShieldCheck size={20} />} 
                    label="Doğrulama Talepleri" 
                    active={activeTab === 'verifications'} 
                    onClick={() => setActiveTab('verifications')} 
                />
                <SidebarLink 
                    icon={<Smartphone size={20} />} 
                    label="Mobil Önizleme" 
                    active={activeTab === 'mobile-hub'} 
                    onClick={() => setActiveTab('mobile-hub')} 
                />
            </nav>

            <button 
                onClick={logout}
                style={{ 
                    marginTop: 'auto', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', width: '100%', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    justifyContent: 'flex-start'
                }}
            >
                <LogOut size={20} />
                <span>Çıkış Yap</span>
            </button>
        </div>
    );
};

const SidebarLink = ({ icon, label, active = false, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      width: '100%',
      justifyContent: 'flex-start',
      background: active ? 'rgba(239, 68, 68, 0.1)' : 'none',
      color: active ? '#ef4444' : 'var(--text-secondary)',
      border: active ? '1px solid rgba(239, 68, 68, 0.2)' : 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
  }}>
    {icon}
    <span style={{ fontSize: '15px' }}>{label}</span>
  </button>
);

export default AdminSidebar;
