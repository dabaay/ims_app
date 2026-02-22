import React, { useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Package, 
    Users, 
    ShoppingCart, 
    TrendingUp, 
    Settings,
    CreditCard,
    Truck,
    ChevronRight,
    Search,
    UserPlus,
    FileBarChart,
    History
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/useLanguage';
import { useSettings } from '../context/SettingsContextDef';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
    const { user, hasPermission } = useContext(AuthContext);
    const { t } = useLanguage();
    const { settings } = useSettings();
    const [promotions, setPromotions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const res = await api.get('/mobile-manager/promotions');
                if (res.data.success) {
                    const activePromos = res.data.data.filter(p => p.is_active);
                    setPromotions(activePromos);
                }
            } catch (err) {
                console.error('Error fetching promotions in sidebar:', err);
            }
        };
        fetchPromos();
    }, []);

    useEffect(() => {
        if (promotions.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % promotions.length);
        }, 15000); // 15 seconds rotation

        return () => clearInterval(interval);
    }, [promotions]);

    const currentPromo = promotions[currentIndex];

    const menuItems = [
        { key: 'dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'cashier'] },
        { key: 'products', icon: Package, path: '/products', roles: ['admin'] },
        { key: 'customers', icon: Users, path: '/customers', roles: ['admin', 'cashier'] },
        { key: 'pos', icon: ShoppingCart, path: '/pos', roles: ['admin', 'cashier'] },
        { key: 'sales_history', icon: History, path: '/sales-history', roles: ['admin', 'cashier'] },
        { key: 'expenses', icon: CreditCard, path: '/expenses', roles: ['admin', 'cashier'] },
        { key: 'suppliers', icon: Truck, path: '/suppliers', roles: ['admin'] },
        { key: 'accounting', icon: FileBarChart, path: '/accounting', roles: ['admin'] },
        { key: 'purchases', icon: Truck, path: '/purchases', roles: ['admin'] },
        { key: 'walpo', icon: CreditCard, path: '/walpo', roles: ['admin', 'cashier'] },
        { key: 'reports', icon: TrendingUp, path: '/reports', roles: ['admin', 'cashier'] },
        { key: 'financial_reports', icon: FileBarChart, path: '/reports/financial', roles: ['admin'] },
        { key: 'users', icon: UserPlus, path: '/users', roles: ['admin'] },
        { key: 'logs', icon: History, path: '/logs', roles: ['admin'] },
        { key: 'settings', icon: Settings, path: '/settings', roles: ['admin'] },
        
        // Mobile App Management (for App Manager)
        { key: 'mobile_dashboard', icon: LayoutDashboard, path: '/mobile/dashboard', roles: ['app_manager'] },
        { key: 'mobile_customers', icon: Users, path: '/mobile/customers', roles: ['app_manager'] },
        { key: 'mobile_orders', icon: History, path: '/mobile/orders', roles: ['app_manager'] },
        { key: 'mobile_chat', icon: Search, path: '/mobile/chat', roles: ['app_manager'] },
        { key: 'mobile_promotions', icon: Package, path: '/mobile/promotions', roles: ['admin', 'app_manager'] },
        
        // Cashier Mobile Integration
        { key: 'cashier_orders', icon: History, path: '/cashier/mobile-orders', roles: ['cashier'] },
        { key: 'deliveries', icon: Truck, path: '/cashier/deliveries', roles: ['cashier', 'admin'] },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (user?.role === 'app_manager' && item.key === 'users') return false;
        return item.roles.includes(user?.role || 'cashier') || hasPermission(item.key);
    });

    return (
        <div className="w-72 h-screen sticky top-0 bg-secondary/50 border-r border-slate-700 flex flex-col p-6 backdrop-blur-xl">
            <div className="flex items-center space-x-3 mb-12 px-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                    <span className="text-xl font-bold tracking-tight text-white block">{settings.store_name}</span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                        {user?.role ? t(user.role) : ''}
                    </span>
                </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {filteredMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl group",
                            isActive 
                                ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner" 
                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                        )}
                    >
                        <div className="flex items-center space-x-3">
                            <item.icon size={20} />
                            <span className="font-medium">{t(item.key)}</span>
                        </div>
                        <ChevronRight size={16} className="opacity-0 group-hover:opacity-100" />
                    </NavLink>
                ))}
            </nav>

            {/* Rotating Promotion Banner */}
            {promotions.length > 0 && (
                <div className="my-6 relative group cursor-pointer overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-600/5 backdrop-blur-md transition-all hover:border-blue-500/40"
                     onClick={() => window.location.href = '/mobile/promotions'}>
                    <div className="absolute top-0 right-0 p-2 z-10">
                        <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                            {t('promo') || 'PROMO'}
                        </span>
                    </div>
                    
                    <div className="flex h-24 w-full">
                        {currentPromo?.image_url ? (
                            <div className="w-24 h-full shrink-0 overflow-hidden relative">
                                <img src={currentPromo.image_url} alt={currentPromo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-2000" />
                                <div className="absolute inset-0 bg-linear-to-r from-transparent to-slate-900/80"></div>
                            </div>
                        ) : (
                            <div className="w-24 h-full bg-blue-600/20 flex items-center justify-center shrink-0">
                                <Package size={24} className="text-blue-400 opacity-20" />
                            </div>
                        )}
                        <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                            <h4 className="text-white text-xs font-bold truncate mb-1 uppercase tracking-tight">{currentPromo?.title}</h4>
                            <p className="text-slate-400 text-[10px] line-clamp-2 leading-tight font-medium">{currentPromo?.description}</p>
                        </div>
                    </div>

                    {/* Rotation Indicators */}
                    {promotions.length > 1 && (
                        <div className="absolute bottom-1 right-2 flex space-x-1">
                            {promotions.map((_, idx) => (
                                <div key={idx} className={cn(
                                    "w-1 h-1 rounded-full transition-all duration-500",
                                    idx === currentIndex ? "w-3 bg-blue-500" : "bg-slate-700"
                                )}></div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-auto p-4 bg-slate-800/30 rounded-2xl border border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">{settings.store_name}</p>
                <div className="flex items-center justify-between">
                    <NavLink to="/profile" className="flex items-center space-x-3 group flex-1">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {user?.full_name?.[0] || 'A'}
                        </div>
                        <div>
                            <p className="text-sm text-white font-bold group-hover:text-blue-400 transition-colors">{user?.full_name || user?.username}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {user?.role ? t(user.role) : ''}
                            </p>
                        </div>
                    </NavLink>
                    <button 
                        onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="flex p-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-lg transition-all border border-slate-700"
                    title={t('logout')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                </button>
            </div>
        </div>
        </div>
    );
};

export default Sidebar;
