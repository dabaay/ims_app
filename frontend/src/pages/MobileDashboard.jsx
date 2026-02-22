import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { LayoutDashboard, Users, ShoppingBag, MessageCircle, ArrowUpRight, ArrowDownRight, History, Wallet, ShieldAlert, Package, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/useLanguage';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MobileDashboard = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/mobile-manager/dashboard');
                setStats(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-white p-8">Loading...</div>;

    const cards = [
        { title: 'Registered Customers', value: stats?.total_customers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'Blocked Users', value: stats?.total_customers - stats?.active_customers, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-400/10' },
        { title: 'Pending Orders', value: stats?.pending_orders, icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        { title: 'Potential Revenue', value: `$${parseFloat(stats?.total_order_value || 0).toFixed(2)}`, icon: History, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { title: 'Unread Messages', value: stats?.total_unread_messages || 0, icon: MessageCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', path: '/mobile/chat' },
        { title: 'Payments Received', value: `$${parseFloat(stats?.app_revenue || 0).toFixed(2)}`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { title: t('active_promotions'), value: stats?.active_promotions || 0, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10', path: '/mobile/promotions' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-2 uppercase">Mobile App Dashboard</h1>
                    <p className="text-slate-400 font-medium">Manage your mobile customers and orders from here.</p>
                </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                <p className="text-blue-400 font-bold uppercase tracking-tight text-sm">
                    Bakhtii & Orders Tracking
                </p>
                <p className="text-slate-300 text-lg font-medium mt-1">
                    I can track all pending, completed and cancelled orders that are currently pending and past.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, i) => (
                    <div 
                        key={i} 
                        onClick={() => card.path && (window.location.href = card.path)}
                        className={`bg-secondary/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 hover:border-blue-500/30 transition-all group overflow-hidden relative ${card.path ? 'cursor-pointer active:scale-95' : ''}`}
                    >
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.bg} rounded-full blur-3xl group-hover:blur-2xl transition-all`}></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
                                    <card.icon size={24} />
                                </div>
                                <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                                    <ArrowUpRight size={14} />
                                    <span className="text-[10px] font-black uppercase">Active</span>
                                </div>
                            </div>
                            <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">{card.title}</h3>
                            <p className="text-4xl font-black text-white tracking-tighter">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Trend Chart */}
            <div className="bg-secondary/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="text-blue-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('revenue_trend')}</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('last_30_days')}</p>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.revenue_trend || []}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                fontVariant="bold"
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickFormatter={(val) => `$${val}`}
                                fontVariant="bold"
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '12px' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                stroke="#3b82f6" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                name={t('revenue')}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-secondary/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Recent Registrations</h3>
                    <div className="space-y-4">
                        {stats?.recent_registrations?.length === 0 ? (
                            <p className="text-slate-500 font-bold uppercase text-xs">No recent registrations.</p>
                        ) : stats?.recent_registrations?.map((user) => (
                            <div key={user.customer_id} className="flex items-center justify-between p-4 bg-primary/30 rounded-2xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                        {user.full_name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-bold truncate">{user.full_name}</p>
                                        <p className="text-slate-500 text-[10px] font-black">{user.phone}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap ml-2">{new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-secondary/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Recent Messages</h3>
                    <div className="space-y-4">
                        {stats?.recent_messages?.length === 0 ? (
                            <p className="text-slate-500 font-bold uppercase text-xs">No recent messages.</p>
                        ) : stats?.recent_messages?.map((msg) => (
                            <div key={msg.id} className="flex items-center justify-between p-4 bg-primary/30 rounded-2xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                 onClick={() => window.location.href = `/mobile/chat?customer=${msg.customer_id}`}>
                                <div className="flex items-center space-x-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold shrink-0">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-bold truncate group-hover:text-rose-400 transition-colors">{msg.customer?.full_name || 'Customer'}</p>
                                        <p className="text-slate-400 text-xs truncate italic">"{msg.message}"</p>
                                    </div>
                                </div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase ml-2 whitespace-nowrap">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-secondary/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Recent Orders</h3>
                    <div className="space-y-4">
                        {stats?.recent_orders?.length === 0 ? (
                            <p className="text-slate-500 font-bold uppercase text-xs">No recent orders.</p>
                        ) : stats?.recent_orders?.map((order) => (
                            <div key={order.sale_id} className="flex items-center justify-between p-4 bg-primary/30 rounded-2xl border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">{order.customer_app?.full_name || 'Anonymous'}</p>
                                        <p className="text-indigo-400 text-xs font-black">${order.total_amount}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
                                    order.payment_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    order.payment_status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                }`}>
                                    {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Promotions Section */}
            <div className="bg-secondary/40 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('recent_promotions')}</h3>
                    <a href="/mobile/promotions" className="text-blue-400 text-xs font-bold hover:underline flex items-center">
                        {t('see_all')} <ArrowUpRight size={14} className="ml-1" />
                    </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats?.recent_promotions?.length === 0 ? (
                        <p className="text-slate-500 font-bold uppercase text-xs">No promotions done yet.</p>
                    ) : stats?.recent_promotions?.map((promo) => (
                        <div key={promo.promotion_id} className="bg-primary/30 rounded-2xl border border-slate-700/50 overflow-hidden group hover:border-blue-500/30 transition-all">
                            {promo.image_url && (
                                <div className="h-32 w-full overflow-hidden">
                                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            )}
                            <div className="p-4">
                                <p className="text-white font-bold truncate">{promo.title}</p>
                                <p className="text-slate-500 text-xs line-clamp-2 mt-1">{promo.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${promo.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                                        {promo.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-bold">{new Date(promo.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileDashboard;
