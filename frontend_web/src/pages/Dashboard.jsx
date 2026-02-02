import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { LogOut, User, Search, Calendar, Users, Settings, ShieldCheck, Wallet, Plus, RefreshCw, Globe, Loader2, MessageCircle, CreditCard, ShieldAlert, Award, Activity, HelpCircle, Star, MapPin, Bell, Ticket, ShoppingBag } from 'lucide-react';
import ProfileSection from '../components/ProfileSection';
import ChatSection from '../components/ChatSection';
import WalletSection from '../components/WalletSection';
import ReportsSection from '../components/ReportsSection';
import GamificationSection from '../components/GamificationSection';
import ActivitySection from '../components/ActivitySection';
import SupportSection from '../components/SupportSection';
import ReviewsSection from '../components/ReviewsSection';
import VenuesSection from '../components/VenuesSection';
import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';
import MyEventsSection from '../components/MyEventsSection';
import ClubsSection from '../components/ClubsSection';
import MarketplaceSection from '../components/MarketplaceSection';
import SearchSection from '../components/SearchSection';
import SettingsSection from '../components/SettingsSection';
import FeedSection from '../components/FeedSection'; // Imported
import VerificationAlert from '../components/VerificationAlert';
import { eventService, notificationService } from '../services/api_service';

import SafetyGuideModal from '../components/SafetyGuideModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('kesfet'); 
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); 
  const [showSafetyGuide, setShowSafetyGuide] = useState(false); // [NEW]

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);

  useEffect(() => {
    // Check if user has seen the guide
    const hasSeenGuide = localStorage.getItem('hasSeenSafetyGuide_v1');
    if (!hasSeenGuide) {
        setShowSafetyGuide(true);
    }
  }, []);

  const handleCloseGuide = () => {
      setShowSafetyGuide(false);
      localStorage.setItem('hasSeenSafetyGuide_v1', 'true');
  };

  const handleCreateClick = () => {
      // Pre-check for faster feedback, though backend is ultimate source of truth
      if (!user.is_verified || !user.is_student_verified) {
          setShowVerifyAlert(true);
      } else {
          setShowCreateModal(true);
      }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await eventService.getEvents();
      setEvents(res.data);
    } catch (err) {
        console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
      try {
          const res = await notificationService.getNotifications();
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.is_read).length);
      } catch (err) {
          console.error("Bildirimler alınamadı", err);
      }
  };

  useEffect(() => {
    if (activeTab === 'kesfet') {
      fetchEvents();
    }
    fetchNotifications(); // Initial fetch
    
    // Poll notifications every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleAutoFetch = async () => {
    setActionLoading(true);
    try {
        await eventService.autoFetch(5);
        fetchEvents();
    } catch (err) {
        console.error(err);
        alert("Oto veri çekme başarısız.");
    } finally {
        setActionLoading(false);
    }
  };

  const handleExternalFetch = async () => {
    setActionLoading(true);
    try {
        await eventService.fetchExternal("İstanbul");
        fetchEvents();
    } catch (err) {
        console.error(err);
        alert("Dış veri çekme başarısız.");
    } finally {
        setActionLoading(false);
    }
  };

  const markAsRead = async (id) => {
      try {
          await notificationService.markAsRead(id);
          setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
          console.error(err);
      }
  };

  const renderContent = () => {
    if (showNotifications) {
        return (
            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Bell size={24} /> Bildirimler
                    </h2>
                    <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>Kapat</button>
                </div>
                {notifications.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Henüz bildirim yok.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {notifications.map(notif => (
                            <div 
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id)}
                                style={{ 
                                    padding: '16px', borderRadius: '12px',
                                    background: notif.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(16, 185, 129, 0.1)',
                                    border: notif.is_read ? '1px solid transparent' : '1px solid var(--success)',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{notif.title}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(notif.created_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{notif.message}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'profile') {
      return <ProfileSection />;
    }
  // ... rest of the renderContent logic remains (existing tabs)


    if (activeTab === 'chat') {
      return <ChatSection />;
    }
    if (activeTab === 'clubs') {
        return <ClubsSection />;
    }
    if (activeTab === 'search') {
        return <SearchSection />;
    }
    if (activeTab === 'settings') {
        return <SettingsSection />;
    }
    if (activeTab === 'marketplace') {
        return <MarketplaceSection />;
    }
    if (activeTab === 'my-events') {
        return <MyEventsSection />;
    }
    if (activeTab === 'wallet') {
      return <WalletSection />;
    }
    if (activeTab === 'reports') {
      return <ReportsSection />;
    }
    if (activeTab === 'gamification') {
      return <GamificationSection />;
    }
    if (activeTab === 'activity') {
      return <ActivitySection />;
    }
    if (activeTab === 'support') {
      return <SupportSection onOpenGuide={() => setShowSafetyGuide(true)} />;
    }
    if (activeTab === 'reviews') {
      return <ReviewsSection />;
    }
    if (activeTab === 'venues') {
      return <VenuesSection />;
    }
    
    // Default: Keşfet (Feed)
    if (activeTab === 'kesfet') {
        return (
            <div>
                 {/* Action Bar */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                    <button 
                      onClick={handleCreateClick}
                      className="primary-btn flex-center" 
                      style={{ gap: '8px', padding: '10px 20px', borderRadius: '12px', width: 'auto' }}
                    >
                        <Plus size={18} /> Etkinlik Oluştur
                    </button>
                 </div>
                 <FeedSection 
                    onNavigateToVerification={() => setActiveTab('settings')}
                 />
                 
                 <VerificationAlert 
                    isOpen={showVerifyAlert}
                    onClose={() => setShowVerifyAlert(false)}
                    onNavigate={() => { setShowVerifyAlert(false); setActiveTab('settings'); }}
                 />
            </div>
        );
    }
    
    return null;

  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {showCreateModal && (
        <CreateEventModal 
            onClose={() => setShowCreateModal(false)} 
            onSuccess={() => {
                fetchEvents();
                // Opsiyonel: Toast mesajı göster
            }}
        />
      )}

      {showSafetyGuide && (
          <SafetyGuideModal onClose={handleCloseGuide} />
      )}

      {/* Sidebar */}
      <div className="glass-card" style={{ 
        width: '260px', 
        borderRadius: '0 20px 20px 0', 
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ padding: '0 10px 30px 10px' }}>
          <h2 className="gradient-text" style={{ fontSize: '24px' }}>ArtıBir V2</h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarLink 
            icon={<Calendar size={20} />} 
            label="Keşfet" 
            active={activeTab === 'kesfet'} 
            onClick={() => setActiveTab('kesfet')} 
          />
          <SidebarLink 
            icon={<Search size={20} />} 
            label="Global Arama" 
            active={activeTab === 'search'}
            onClick={() => setActiveTab('search')}
          />
          <SidebarLink 
            icon={<MessageCircle size={20} />} 
            label="Mesajlar" 
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          <SidebarLink 
            icon={<CreditCard size={20} />} 
            label="Cüzdan" 
            active={activeTab === 'wallet'}
            onClick={() => setActiveTab('wallet')}
          />
          <SidebarLink 
            icon={<Award size={20} />} 
            label="Rozetler" 
            active={activeTab === 'gamification'}
            onClick={() => setActiveTab('gamification')}
          />
          <SidebarLink 
            icon={<Users size={20} />} 
            label="Kulüpler" 
            active={activeTab === 'clubs'}
            onClick={() => setActiveTab('clubs')}
          />
          <SidebarLink 
            icon={<ShoppingBag size={20} />} 
            label="Pazar Yeri" 
            active={activeTab === 'marketplace'}
            onClick={() => setActiveTab('marketplace')}
          />
          <SidebarLink 
             icon={<Activity size={20} />} 
             label="Aktivitelerim" 
             active={activeTab === 'activity'}
             onClick={() => setActiveTab('activity')}
          />
          <SidebarLink 
             icon={<Ticket size={20} />} 
             label="Biletlerim" 
             active={activeTab === 'my-events'}
             onClick={() => setActiveTab('my-events')}
          />
          <SidebarLink 
             icon={<MapPin size={20} />} 
             label="Mekanlar" 
             active={activeTab === 'venues'}
             onClick={() => setActiveTab('venues')}
          />
          <SidebarLink 
             icon={<Star size={20} />} 
             label="Değerlendirmeler" 
             active={activeTab === 'reviews'}
             onClick={() => setActiveTab('reviews')}
          />
          <SidebarLink 
             icon={<ShieldAlert size={20} />} 
             label="Şikayet/Rapor" 
             active={activeTab === 'reports'}
             onClick={() => setActiveTab('reports')}
          />
          <SidebarLink 
             icon={<HelpCircle size={20} />} 
             label="Yardım & Destek" 
             active={activeTab === 'support'}
             onClick={() => setActiveTab('support')}
          />
          <SidebarLink 
            icon={<User size={20} />} 
            label="Profilim" 
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
          <SidebarLink 
            icon={<Settings size={20} />} 
            label="Ayarlar" 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <button 
          onClick={logout}
          style={{ 
            marginTop: 'auto', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            width: '100%',
            justifyContent: 'flex-start'
          }}
        >
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '4px' }}>Merhaba, {user?.full_name?.split(' ')[0]} 👋</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Bugün senin için harika etkinlikler var!</p>
          </div>
          
          <div className="flex-center" style={{ gap: '20px' }}>
             {/* Stats */}
             <div style={{ display: 'flex', gap: '15px' }}>
                 <div className="flex-center" style={{ gap: '6px', background: 'rgba(99, 102, 241, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <ShieldCheck size={18} color="var(--accent-primary)" />
                    <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{user?.trust_score ?? 0}</span>
                 </div>
                 <div className="flex-center" style={{ gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <Wallet size={18} color="var(--success)" />
                    <span style={{ fontWeight: '600', color: 'var(--success)' }}>{user?.wallet_balance ?? 0}₺</span>
                 </div>
             </div>

             {/* Notification Bell */}
             <button 
                onClick={() => setShowNotifications(true)}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer' }}
             >
                <Bell size={24} color="var(--text-primary)" />
                {unreadCount > 0 && (
                    <span style={{ 
                        position: 'absolute', top: -5, right: -5, 
                        background: '#ef4444', color: 'white', 
                        fontSize: '10px', width: '16px', height: '16px', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                        {unreadCount}
                    </span>
                )}
             </button>

             <div className="flex-center" style={{ gap: '12px', paddingLeft: '20px', borderLeft: '1px solid var(--glass-border)' }}>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ fontSize: '14px', fontWeight: '600' }}>{user?.full_name}</p>
                   <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.university_id?.toUpperCase()}</p>
                </div>
                <img 
                  src={user?.profile_image || "https://via.placeholder.com/45"} 
                  alt="profil" 
                  style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                />
             </div>
          </div>
        </header>

        {renderContent()}

      </main>
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
      background: active ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))' : 'none',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      border: active ? '1px solid rgba(99, 102, 241, 0.2)' : 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
  }}>
    {icon}
    <span style={{ fontSize: '15px' }}>{label}</span>
  </button>
);

export default Dashboard;
