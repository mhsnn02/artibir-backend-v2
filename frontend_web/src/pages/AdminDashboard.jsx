import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminStats from '../components/admin/AdminStats';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReports from '../components/admin/AdminReports';
import AdminVerifications from '../components/admin/AdminVerifications';
import AdminMobileHub from '../components/admin/AdminMobileHub';
import { adminService } from '../services/api_service';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        console.log("Current User for Admin Access:", user);
        
        // ADMIN MASTER BYPASS - Geliştirici Modu Aktif
        const isAdmin = true; 

        if (user && !isAdmin) {
            console.warn("Access Denied for:", user.email);
        }
    }, [user, navigate]);

    useEffect(() => {
        const loadStats = async () => {
             try {
                 const res = await adminService.getStats();
                 setStats(res.data.counters);
             } catch (err) {
                 console.error("Admin stats failed", err);
             }
        };
        loadStats();
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} logout={logout} />
            
            <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '28px' }}>Yönetim Paneli</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Hoş geldin, Admin {user?.full_name}</p>
                    </div>
                </header>

                {activeTab === 'stats' && <AdminStats stats={stats} />}
                {activeTab === 'users' && <AdminUsers />}
                {activeTab === 'reports' && <AdminReports />}
                {activeTab === 'verifications' && <AdminVerifications />}
                {activeTab === 'mobile-hub' && <AdminMobileHub />}
            </main>
        </div>
    );
};

export default AdminDashboard;
