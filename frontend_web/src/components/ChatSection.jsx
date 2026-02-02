import React, { useState, useEffect, useRef } from 'react';
import { chatService, authService, interactionService } from '../services/api_service';
import { Send, User, MessageCircle, Loader2, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';
import api from '../services/api_service';

// Helper to get users list (Reusing the public endpoint for 'Discovery')
const getUsersList = () => api.get("/users/?limit=20"); 

const ChatSection = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [loadingIcebreaker, setLoadingIcebreaker] = useState(false);
    const messagesEndRef = useRef(null);
    const ws = useRef(null);

    // Load users list
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users/?limit=20"); 
                setUsersList(res.data.filter(u => u.id !== user.id));
            } catch (err) {
                console.error("Kullanıcı listesi alınamadı", err);
            }
        };
        fetchUsers();
    }, [user.id]);

    // WebSocket Setup
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // WebSocket URL
        const wsUrl = `ws://localhost:8000/ws/chat/${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'error') {
                alert("Uyarı: " + data.message);
                return;
            }

            // If message belongs to current chat or I am the sender
            setMessages(prev => {
                // Duplicate check
                if (prev.find(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
            // Reconnect after 3 seconds
            setTimeout(() => {
                if (localStorage.getItem('token')) {
                    // Trigger effect again or just manually connect
                }
            }, 3000);
        };

        return () => {
            if (ws.current) ws.current.close();
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load history when user changes
    useEffect(() => {
        if (selectedUser) {
            const loadHistory = async () => {
                try {
                    const res = await chatService.getHistory(selectedUser.id);
                    setMessages(res.data);
                } catch (err) {
                    console.error("Geçmiş yüklenemedi", err);
                }
            };
            loadHistory();
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const payload = {
            receiver_id: selectedUser.id,
            content: newMessage
        };

        ws.current.send(JSON.stringify(payload));
        setNewMessage('');
    };

    const filteredUsers = usersList.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="glass-card" style={{ 
            height: 'calc(100vh - 180px)', minHeight: '600px', padding: 0, overflow: 'hidden', 
            display: 'flex', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '24px'
        }}>
            {/* Sidebar: User List */}
            <div style={{ 
                width: '320px', borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
                display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' 
            }}>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Sohbetler</h3>
                        <div style={{ 
                            width: '10px', height: '10px', borderRadius: '50%', 
                            background: isConnected ? 'var(--success)' : '#ef4444',
                            boxShadow: isConnected ? '0 0 10px var(--success)' : 'none'
                        }} title={isConnected ? "Bağlı" : "Bağlantı Kesildi"} />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                        <input 
                            placeholder="Arkadaşlarını ara..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', padding: '12px 12px 12px 42px', borderRadius: '14px', 
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', 
                                color: 'white', fontSize: '14px'
                            }}
                        />
                    </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                    {filteredUsers.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Kullanıcı bulunamadı</div>
                    ) : filteredUsers.map(u => (
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            style={{ 
                                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                                borderRadius: '16px', marginBottom: '8px',
                                background: selectedUser?.id === u.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                border: selectedUser?.id === u.id ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#1e293b', overflow: 'hidden' }}>
                                     {u.profile_image ? (
                                         <img src={u.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                     ) : (
                                         <div className="flex-center" style={{ width: '100%', height: '100%', color: '#94a3b8', fontSize: '18px', fontWeight: 'bold' }}>
                                             {u.full_name[0]}
                                         </div>
                                     )}
                                </div>
                                <div style={{ 
                                    position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px',
                                    borderRadius: '50%', background: 'var(--success)', border: '2px solid #0f172a'
                                }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: selectedUser?.id === u.id ? 'white' : '#cbd5e1' }}>{u.full_name}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Mesajlaşmak için tıklayın
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.2)' }}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ 
                            padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.02)' 
                        }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#333', overflow: 'hidden' }}>
                                    {selectedUser.profile_image ? (
                                        <img src={selectedUser.profile_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="flex-center" style={{ width: '100%', height: '100%', color: '#94a3b8', fontWeight: 'bold' }}>{selectedUser.full_name[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{selectedUser.full_name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Çevrimiçi</span>
                                    </div>
                                </div>
                             </div>
                             <div style={{ display: 'flex', gap: '10px' }}>
                                 {/* Optional call buttons etc */}
                             </div>
                        </div>

                        {/* Messages */}
                        <div style={{ 
                            flex: 1, overflowY: 'auto', padding: '24px', 
                            display: 'flex', flexDirection: 'column', gap: '16px',
                            scrollBehavior: 'smooth'
                        }}>
                             {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#64748b', marginTop: '100px' }}>
                                    <div style={{ 
                                        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                                        margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <MessageCircle size={32} style={{ opacity: 0.3 }} />
                                    </div>
                                    <h3 style={{ color: '#94a3b8' }}>Sohbeti Başlatın</h3>
                                    <p style={{ fontSize: '14px' }}>{selectedUser.full_name} ile ilk mesajınızı gönderin.</p>
                                </div>
                             ) : (
                                messages.map((msg, index) => {
                                    const isMe = msg.sender_id === user.id;
                                    const showTime = true; // Can add logic for interval
                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            key={msg.id || index} 
                                            style={{ 
                                                alignSelf: isMe ? 'flex-end' : 'flex-start', 
                                                maxWidth: '75%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isMe ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div style={{ 
                                                padding: '12px 18px', 
                                                borderRadius: '20px', 
                                                background: isMe ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
                                                color: 'white',
                                                borderBottomRightRadius: isMe ? '4px' : '20px',
                                                borderBottomLeftRadius: isMe ? '20px' : '4px',
                                                boxShadow: isMe ? '0 4px 15px rgba(99, 102, 241, 0.2)' : 'none',
                                                fontSize: '15px',
                                                lineHeight: '1.5',
                                                border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)'
                                            }}>
                                                {msg.content}
                                            </div>
                                            {showTime && (
                                                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })
                             )}
                             <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div style={{ padding: '24px', background: 'rgba(0,0,0,0.1)' }}>
                            <form 
                                onSubmit={handleSendMessage} 
                                style={{ 
                                    display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.05)',
                                    padding: '8px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setLoadingIcebreaker(true);
                                        try {
                                            const res = await interactionService.getGeneralIcebreaker();
                                            setNewMessage(res.data.question);
                                        } catch (err) {
                                            console.error(err);
                                        } finally {
                                            setLoadingIcebreaker(false);
                                        }
                                    }}
                                    title="Buz Kırıcı Soru Üret ✨"
                                    style={{
                                        width: '40px', height: '48px', background: 'transparent',
                                        border: 'none', color: '#fbbf24', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {loadingIcebreaker ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                </button>
                                <input 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mesajınızı buraya yazın..."
                                    style={{ 
                                        flex: 1, padding: '12px 20px', borderRadius: '16px', 
                                        background: 'transparent', border: 'none', color: 'white',
                                        fontSize: '15px', outline: 'none'
                                    }}
                                />
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit" 
                                    style={{ 
                                        width: '48px', height: '48px', borderRadius: '16px', 
                                        background: 'var(--primary-gradient)', border: 'none', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                    }}
                                    disabled={!newMessage.trim() || !isConnected}
                                >
                                    {isConnected ? <Send size={20} /> : <Loader2 size={20} className="animate-spin" />}
                                </motion.button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-center" style={{ flex: 1, flexDirection: 'column', color: '#64748b', padding: '40px' }}>
                        <div style={{ 
                            width: '120px', height: '120px', borderRadius: '40px', background: 'rgba(255,255,255,0.02)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px'
                        }}>
                            <MessageCircle size={64} style={{ opacity: 0.1 }} />
                        </div>
                        <h2 style={{ color: 'white', marginBottom: '10px' }}>Sohbete Başla</h2>
                        <p style={{ textAlign: 'center', maxWidth: '300px', lineHeight: '1.6' }}>
                            Sol listeden bir arkadaşını seçerek anlık mesajlaşmaya başlayabilirsin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSection;
