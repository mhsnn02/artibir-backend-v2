import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2, User, ShoppingCart, Loader2 } from 'lucide-react';
import { marketplaceService } from '../services/api_service'; // We might handle buy logic here or pass it down

const MarketplaceCard = ({ item, user, onDelete, onBuy, actionLoading }) => {
    const isOwner = user && user.id === item.owner_id;
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            style={{ 
                background: 'rgba(13, 13, 15, 0.7)', 
                borderRadius: '28px', 
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                flexDirection: 'column',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                height: '100%'
            }}
        >
            {/* Image Section */}
            <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
                {item.image_url ? (
                    <motion.img 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                        src={item.image_url} 
                        alt={item.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f172a', color: '#1e293b' }}>
                        <ShoppingBag size={64} opacity={0.2} />
                    </div>
                )}
                
                {/* Price Badge */}
                <div style={{ 
                    position: 'absolute', bottom: '16px', right: '16px', 
                    background: 'linear-gradient(135deg, #fbbf24, #d97706)', 
                    padding: '8px 16px', borderRadius: '14px',
                    fontWeight: '900', color: 'white', fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    {item.price} ₺
                </div>

                {/* Status/Category Overlay */}
                <div style={{ 
                    position: 'absolute', top: '16px', left: '16px', 
                    display: 'flex', gap: '8px'
                }}>
                    <span style={{ 
                        background: 'rgba(15, 23, 42, 0.7)', padding: '5px 12px', borderRadius: '10px',
                        fontWeight: '700', color: 'white', fontSize: '10px', backdropFilter: 'blur(8px)',
                        textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {item.category}
                    </span>
                    {item.status === 'sold' && (
                        <span style={{ 
                            background: 'rgba(239, 68, 68, 0.2)', padding: '5px 12px', borderRadius: '10px',
                            fontWeight: '700', color: '#f87171', fontSize: '10px', backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            SATILDI
                        </span>
                    )}
                </div>
            </div>
            
            {/* Info Section */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ 
                        fontSize: '20px', fontWeight: '800', color: 'white', margin: 0, 
                        lineHeight: '1.2', letterSpacing: '-0.5px' 
                    }}>
                        {item.title}
                    </h3>
                    {isOwner && onDelete && (
                        <motion.button 
                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                            onClick={() => onDelete(item.id)}
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}
                        >
                            <Trash2 size={16} />
                        </motion.button>
                    )}
                </div>
                
                <p style={{ 
                    fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', flex: 1, 
                    marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                }}>
                    {item.description}
                </p>

                <div style={{ marginTop: 'auto' }}>
                    <motion.button 
                        whileHover={!actionLoading && !isOwner ? { scale: 1.02, backgroundColor: 'rgba(251, 191, 36, 0.2)' } : {}}
                        whileTap={!actionLoading && !isOwner ? { scale: 0.98 } : {}}
                        onClick={() => onBuy && onBuy(item.id, item.price, item.title)}
                        disabled={actionLoading || isOwner || item.status === 'sold'}
                        style={{ 
                            width: '100%', padding: '16px', borderRadius: '18px', 
                            cursor: (isOwner || item.status === 'sold') ? 'default' : 'pointer',
                            background: isOwner ? 'rgba(255,255,255,0.03)' : 'rgba(251, 191, 36, 0.1)', 
                            color: isOwner ? '#64748b' : '#fbbf24',
                            fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', gap: '10px',
                            border: isOwner ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(251, 191, 36, 0.2)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {actionLoading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : isOwner ? (
                            <>
                                <User size={18} /> SENİN İLANIN
                            </>
                        ) : item.status === 'sold' ? (
                            'BU ÜRÜN SATILDI'
                        ) : (
                            <>
                                <ShoppingCart size={18} /> HEMEN SATIN AL
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default MarketplaceCard;
