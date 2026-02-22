import React from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/useLanguage';
import { 
    TrendingUp, 
    Users, 
    AlertTriangle, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight,
    BarChart3,
    Activity,
    PieChart as PieIcon,
    LineChart as LineIcon,
    TrendingDown,
    Package,
    ShoppingCart
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar,
    LineChart,
    Line,
    Legend,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts';
import ChartCard from '../components/ChartCard';

const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    emerald: '#10b981',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const StatCard = (props) => {
    const { label, value, trend, color, icon: Icon } = props;
    const colorClasses = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    };

    return (
        <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl hover:border-slate-500/50 transition-all group relative overflow-hidden backdrop-blur-sm">
            <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${colorClasses[color]} opacity-20 group-hover:opacity-100 transition-opacity`}>
                <Icon size={24} />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
            <div className="flex items-end justify-between">
                <div>
                    <h4 className="text-3xl font-bold text-white tracking-tight mb-2">{value}</h4>
                    {trend && (
                        <div className="flex items-center space-x-1">
                            {trend.startsWith('+') ? (
                                <ArrowUpRight size={14} className="text-emerald-400" />
                            ) : trend.startsWith('-') ? (
                                <ArrowDownRight size={14} className="text-rose-400" />
                            ) : null}
                            <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-400' : trend.startsWith('-') ? 'text-rose-400' : 'text-slate-400'}`}>
                                {trend}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, isAdmin, hasPermission } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await api.get('/stats');
                setStats(statsRes.data);
            } catch (error) {
                console.error('Error fetching stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <Activity className="animate-spin text-blue-500" size={48} />
            <p className="text-slate-400 font-medium">{t('loading_stats')}</p>
        </div>
    );

    const summaryStats = [
        { label: t('today_sales'), value: `$${stats?.summary?.today_sales?.toLocaleString() || '0.00'}`, trend: stats?.summary?.today_sales >= (stats?.summary?.yesterday_sales || 0) ? '+10%' : '-5%', color: 'blue', icon: DollarSign },
        { label: t('new_customers'), value: stats?.summary?.new_customers?.toString() || '0', trend: '+100%', color: 'emerald', icon: Users },
        { label: t('low_stock'), value: stats?.summary?.low_stock_count?.toString() || '0', trend: 'Alert', color: 'rose', icon: AlertTriangle },
        { label: t('total_customers'), value: stats?.summary?.total_customers?.toString() || '0', trend: 'Total', color: 'amber', icon: TrendingUp },
    ];

    const modules = [
        { name: t('products'), count: stats?.module_counts?.products || 0, icon: BarChart3, color: 'text-blue-400' },
        { name: t('pos'), count: stats?.module_counts?.sales || 0, icon: DollarSign, color: 'text-emerald-400' },
        { name: t('customers'), count: stats?.module_counts?.customers || 0, icon: Users, color: 'text-indigo-400' },
        { name: t('expenses'), count: stats?.module_counts?.expenses || 0, icon: Activity, color: 'text-rose-400' },
        { name: t('suppliers'), count: stats?.module_counts?.suppliers || 0, icon: Users, color: 'text-amber-400' },
        { name: t('users'), count: stats?.module_counts?.users || 0, icon: Users, color: 'text-slate-400' },
        { name: t('purchases'), count: stats?.module_counts?.purchases || 0, icon: TrendingUp, color: 'text-blue-400' },
        { name: t('walpo'), count: stats?.module_counts?.debts || 0, icon: AlertTriangle, color: 'text-rose-400' },
    ];

    return (
        <div className="w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-secondary/20 p-8 rounded-3xl border border-slate-700 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{t('dashboard_title')}</h1>
                    <p className="text-slate-400 text-lg">{t('welcome')} <span className="text-blue-400 font-bold">{user?.full_name}</span>. {t('dashboard_subtitle')}</p>
                </div>
                <div className="flex items-center space-x-3 bg-secondary/50 p-1.5 rounded-xl border border-slate-700 relative z-10">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20">{t('today')}</button>
                    <button className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-sm font-bold transition-colors">{t('this_week')}</button>
                </div>
            </div>

            {/* Dashboard Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(isAdmin || hasPermission('accounting')) && (
                    <>
                        <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-blue-400 text-xs font-bold uppercase mb-1">{t('total_revenue')}</p>
                            <h4 className="text-2xl font-black text-white">${stats?.system_overview?.total_revenue?.toLocaleString()}</h4>
                        </div>
                        <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-emerald-400 text-xs font-bold uppercase mb-1">{t('estimated_profit')}</p>
                            <h4 className="text-2xl font-black text-white">${stats?.system_overview?.estimated_profit?.toLocaleString()}</h4>
                        </div>
                        <div className="bg-amber-600/10 border border-amber-500/20 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-amber-400 text-xs font-bold uppercase mb-1">{t('inventory_value')}</p>
                            <h4 className="text-2xl font-black text-white">${stats?.system_overview?.inventory_value?.toLocaleString()}</h4>
                        </div>
                    </>
                )}
                
                {(isAdmin || (user?.role === 'cashier' && hasPermission('pos'))) && (
                    <div className="bg-emerald-600/10 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-sm cursor-pointer hover:bg-emerald-600/20 transition-all group relative overflow-hidden"
                         onClick={() => window.location.href = '/pos'}>
                        <div className="absolute top-0 right-0 p-3 text-emerald-400 opacity-20 group-hover:opacity-100 transition-opacity">
                            <ShoppingCart size={24} />
                        </div>
                        <p className="text-emerald-400 text-xs font-bold uppercase mb-1">POS System</p>
                        <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">Launch POS</h4>
                        <p className="text-[10px] text-slate-500 font-bold mt-2">START NEW TRANSACTION • RECENT SALES</p>
                    </div>
                )}

                {(isAdmin || hasPermission('accounting')) && (
                    <>
                        <div 
                            className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-2xl backdrop-blur-sm cursor-pointer hover:bg-purple-600/20 transition-all group relative overflow-hidden"
                            onClick={() => window.location.href = '/reports/financial?type=comprehensive'}
                        >
                            <div className="absolute top-0 right-0 p-3 text-purple-400 opacity-20 group-hover:opacity-100 transition-opacity">
                                <BarChart3 size={24} />
                            </div>
                            <p className="text-purple-400 text-xs font-bold uppercase mb-1">Executive Summary</p>
                            <h4 className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">Generate Report</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-2">DOWNLOAD PDF • EXCEL • WORD</p>
                        </div>
                        <div className="bg-rose-600/10 border border-rose-500/20 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-rose-400 text-xs font-bold uppercase mb-1">{t('outstanding_debt')}</p>
                            <h4 className="text-2xl font-black text-white">${stats?.system_overview?.total_outstanding_debt?.toLocaleString()}</h4>
                        </div>
                    </>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryStats.map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Financial Analytics Section */}
            {(isAdmin || hasPermission('accounting')) && (
                <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <DollarSign className="text-blue-500" size={18} />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Financial Analytics</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Revenue Trend */}
                        <ChartCard 
                            title={t('revenue_trend')} 
                            subtitle={t('last_30_days')} 
                            icon={TrendingUp}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={stats?.salesTrend || []}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#94a3b8" 
                                        fontSize={12} 
                                        tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Sales vs Expenses */}
                        <ChartCard 
                            title={t('sales_vs_expenses')} 
                            subtitle={t('last_30_days')} 
                            icon={BarChart3}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats?.salesVsExpenses || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#94a3b8" 
                                        fontSize={12}
                                        tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="sales" stroke={COLORS.success} strokeWidth={3} name={t('sales')} />
                                    <Line type="monotone" dataKey="expenses" stroke={COLORS.danger} strokeWidth={3} name={t('expenses_label')} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Profit Margin Trend */}
                        <ChartCard 
                            title={t('profit_margin')} 
                            subtitle={t('last_30_days')} 
                            icon={TrendingUp}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={stats?.profitTrend || []}>
                                    <defs>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#94a3b8" 
                                        fontSize={12}
                                        tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="margin" stroke={COLORS.success} strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name={t('margin')} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Monthly Revenue Comparison */}
                        <ChartCard 
                            title={t('monthly_revenue')} 
                            subtitle="Last 6 Months" 
                            icon={BarChart3}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats?.monthlyRevenue || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                    />
                                    <Bar dataKey="revenue" fill={COLORS.primary} radius={[8, 8, 0, 0]} name={t('revenue')} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>
            )}

            {/* Expense & Payment Analytics */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
                        <TrendingDown className="text-rose-500" size={18} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Expense & Payment Analytics</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Expense Breakdown */}
                    <ChartCard 
                        title={t('expense_breakdown')} 
                        subtitle="By Category" 
                        icon={PieIcon}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.expenseBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => entry.name}
                                >
                                    {stats?.expenseBreakdown?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Payment Distribution */}
                    <ChartCard 
                        title={t('payment_distribution')} 
                        subtitle="Transactions by method" 
                        icon={PieIcon}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.paymentMethods || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {stats?.paymentMethods?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Debt Status */}
                    <ChartCard 
                        title={t('debt_status')} 
                        subtitle="Overview" 
                        icon={AlertTriangle}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.debtStatus || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {stats?.debtStatus?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            {/* Customer & Inventory Analytics */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Users className="text-emerald-500" size={18} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Customer & Inventory Analytics</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Customer Growth */}
                    <ChartCard 
                        title={t('customer_growth')} 
                        subtitle={t('last_90_days')} 
                        icon={Users}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats?.customerGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#94a3b8" 
                                    fontSize={12}
                                    tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Line type="monotone" dataKey="count" stroke={COLORS.emerald} strokeWidth={3} name={t('customers_count')} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Top Customers */}
                    <ChartCard 
                        title={t('top_customers')} 
                        subtitle="By Revenue" 
                        icon={Users}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.topCustomers || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="total" fill={COLORS.purple} radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Inventory Status */}
                    <ChartCard 
                        title={t('inventory_status')} 
                        subtitle="Stock Distribution" 
                        icon={Package}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats?.inventoryStatus || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {stats?.inventoryStatus?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Category Sales */}
                    <ChartCard 
                        title={t('category_sales')} 
                        subtitle="Top Categories" 
                        icon={BarChart3}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats?.categorySales || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" fill={COLORS.cyan} radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            {/* Activities Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-secondary/40 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <Activity className="text-blue-400" />
                            <h2 className="text-xl font-bold text-white">{t('recent_activity')}</h2>
                        </div>
                        <button className="text-sm font-bold text-blue-400 hover:underline">{t('see_all')}</button>
                    </div>
                    
                    <div className="space-y-6">
                        {stats?.recent_activity?.length > 0 ? stats.recent_activity.map((item, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        {item.customer?.full_name?.[0] || 'G'}
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-sm">
                                            {item.customer?.full_name || 'Walk-in'} <span className="text-slate-500 font-normal">purchased</span> {item.invoice_number}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(item.sale_date).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-emerald-400">
                                    +${item.total_amount}
                                </span>
                            </div>
                        )) : (
                            <p className="text-slate-500 text-sm italic">No recent activity.</p>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-secondary/40 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 mb-8">
                        <BarChart3 className="text-emerald-400" />
                        <h2 className="text-xl font-bold text-white">{t('best_sellers')}</h2>
                    </div>
                    
                    <div className="space-y-6">
                        {stats?.top_products?.length > 0 ? stats.top_products.map((product, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end text-sm">
                                    <div>
                                        <span className="text-white font-bold block">{product.name}</span>
                                        <span className="text-[10px] text-slate-500 uppercase font-black">{product.total_sold} units sold</span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-1 rounded bg-slate-800 ${product.current_stock < 10 ? 'text-rose-400' : 'text-slate-400'}`}>
                                        Stock: {product.current_stock}
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                                        style={{ width: `${Math.min((product.total_sold / 50) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-500 text-sm italic text-center py-8">No product data.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Module Overview (Counters) */}
            <div className="space-y-6">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <PieIcon className="text-blue-500" size={18} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t('system_summary')}</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {modules.map((mod, i) => {
                        const Icon = mod.icon;
                        return (
                            <div key={i} className="bg-secondary/20 border border-slate-700/50 p-6 rounded-2xl hover:border-blue-500/30 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700 ${mod.color}`}>
                                        <Icon size={18} />
                                    </div>
                                    <span className="text-3xl font-black text-white group-hover:text-blue-500 transition-colors">
                                        {mod.count}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{mod.name}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
