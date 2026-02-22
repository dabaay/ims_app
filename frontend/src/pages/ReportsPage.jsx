import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useSettings } from '../context/SettingsContextDef';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    Legend, Cell, PieChart, Pie 
} from 'recharts';

const ReportsPage = () => {
    const { settings } = useSettings();
    // Initialize with dummy data to ensure render
    const [stats, setStats] = useState({
        system_overview: { total_revenue: 0 },
        summary: { total_customers: 0, today_sales: 0, low_stock_count: 0 }
    });
    const [analytics, setAnalytics] = useState({
        dashboard: { salesTrend: [], paymentMethods: [] },
        products: { stockByCategory: [] },
        customers: { debtStatus: [] },
        walpo: [],
        expenses: { categoryBreakdown: [] },
        comprehensive: { mostPurchased: [], stagnantStock: [], mostExpensive: [], supplierVolume: [], writtenOff: [], financialFlow: [], posIncome: { cash: 0, evc: 0, shilin: 0 } }
    });

    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(null); // 'pdf' or 'excel'
    const reportRef = useRef(null);

    const setTodayFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    };

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = { start_date: startDate, end_date: endDate };
            const [
                statsRes, 
                dashboardAn, 
                productsAn, 
                customersAn, 
                walpoAn, 
                expensesAn,
                comprehensiveAn
            ] = await Promise.all([
                api.get('/stats', { params }),
                api.get('/analytics/dashboard', { params }),
                api.get('/analytics/products', { params }),
                api.get('/analytics/customers', { params }),
                api.get('/analytics/walpo', { params }),
                api.get('/analytics/expenses', { params }),
                api.get('/analytics/comprehensive', { params })
            ]);

            setStats(statsRes.data);
            setAnalytics({
                dashboard: dashboardAn.data,
                products: productsAn.data,
                customers: customersAn.data,
                walpo: walpoAn.data,
                expenses: expensesAn.data,
                comprehensive: comprehensiveAn.data
            });
        } catch (error) {
            console.error('Error fetching reporting data:', error);
            setError('Failed to load live data. Showing cached/empty view.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setExporting('pdf');
        try {
            await new Promise(r => setTimeout(r, 1000)); // Wait for charts to be ready
            
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                letterRendering: true,
                windowWidth: 1200,
                onclone: (doc) => {
                    const clone = doc.getElementById('report-container');
                    if (clone) {
                        clone.style.padding = '40px';
                        clone.style.background = 'white';
                        // Fix for Tailwind v4 colors
                        // html2canvas fails on oklch/oklab as of v1.4.1
                        const colorFixer = (node) => {
                            if (node.nodeType === 1) {
                                const style = window.getComputedStyle(node);
                                const props = [
                                    'color', 'backgroundColor', 'borderColor', 
                                    'outlineColor', 'fill', 'stroke', 'boxShadow'
                                ];

                                props.forEach(prop => {
                                    const val = style[prop];
                                    if (val && (val.includes('oklch') || val.includes('oklab'))) {
                                        if (prop.includes('borderColor')) node.style[prop] = '#cbd5e1';
                                        else if (prop === 'backgroundColor') node.style[prop] = 'transparent';
                                        else if (prop === 'color') node.style[prop] = '#1e293b';
                                        else if (prop === 'boxShadow') node.style[prop] = 'none';
                                        else node.style[prop] = 'inherit';
                                    }
                                });
                                node.childNodes.forEach(colorFixer);
                            }
                        };
                        colorFixer(clone);
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            pdf.save(`Operational_Report_${startDate}_to_${endDate}.pdf`);
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setExporting(null);
        }
    };

    const handleDownloadExcel = () => {
        setExporting('excel');
        try {
            const wb = XLSX.utils.book_new();

            // 1. Dashboard Summary
            const dashboardData = [
                ['Category', 'Metric', 'Value'],
                ['Overview', 'Total Revenue', stats.system_overview.total_revenue],
                ['Summary', 'Total Customers', stats.summary.total_customers],
                ['Summary', "Today's Sales", stats.summary.today_sales],
                ['Summary', 'Low Stock Count', stats.summary.low_stock_count]
            ];
            const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
            XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard Summary');

            // 2. Sales Trend
            if (analytics.dashboard.salesTrend.length > 0) {
                const wsSales = XLSX.utils.json_to_sheet(analytics.dashboard.salesTrend);
                XLSX.utils.book_append_sheet(wb, wsSales, 'Sales Trend');
            }

            // 3. Walpo / Debt History
            if (analytics.walpo.length > 0) {
                const wsWalpo = XLSX.utils.json_to_sheet(analytics.walpo);
                XLSX.utils.book_append_sheet(wb, wsWalpo, 'Debt History (Walpo)');
            }

            // 4. Products Stock
            if (analytics.products.stockByCategory.length > 0) {
                const wsStock = XLSX.utils.json_to_sheet(analytics.products.stockByCategory);
                XLSX.utils.book_append_sheet(wb, wsStock, 'Stock by Category');
            }

            // 5. Expenses
            if (analytics.expenses.categoryBreakdown.length > 0) {
                const wsExpenses = XLSX.utils.json_to_sheet(analytics.expenses.categoryBreakdown);
                XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses');
            }

            XLSX.writeFile(wb, `IMS_Operational_Data_${startDate}_to_${endDate}.xlsx`);
        } catch (err) {
            console.error('Excel Export Error:', err);
            alert('Failed to generate Excel file.');
        } finally {
            setExporting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4 text-white">
                <p className="text-xl font-bold">Loading Reports...</p>
                <p className="text-sm text-slate-400">Please wait...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-3xl border border-slate-700 relative overflow-hidden print:bg-white print:border-gray-300">
                <div className="relative z-10 print:hidden">
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Xarunta <span className="text-blue-500">Warbixinada</span></h1>
                    <p className="text-slate-400 text-lg">Warbixin Buuxa - Liiska Dhammays</p>
                </div>
                <div className="relative z-10 flex flex-wrap md:flex-row md:items-end gap-3 print:hidden">
                    <button 
                        onClick={setTodayFilter}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-600 mb-0.5"
                    >
                        Today
                    </button>
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">End Date</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs"
                        />
                    </div>
                    <button 
                        onClick={fetchAllData}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all border border-blue-500 shadow-lg shadow-blue-500/20"
                    >
                        Refresh
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={!!exporting}
                            className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            <span>{exporting === 'pdf' ? '⌛ Processing...' : '📄 PDF'}</span>
                        </button>
                        <button 
                            onClick={handleDownloadExcel}
                            disabled={!!exporting}
                            className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            <span>{exporting === 'excel' ? '⌛ Processing...' : '📊 Excel'}</span>
                        </button>
                        <button 
                            onClick={() => window.print()} 
                            className="flex items-center space-x-2 px-5 py-2 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xl active:scale-95 group"
                        >
                            <span>🖨️ Print</span>
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-2">
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Report Content for Capture */}
            <div id="report-container" ref={reportRef} className="space-y-8">
                {/* Print Header */}
                <div className="hidden print:block border-b-2 border-slate-300 pb-6 mb-8 text-slate-800">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm border border-slate-200">
                                {settings.store_logo ? (
                                    <img 
                                        src={`http://localhost:8000/storage/${settings.store_logo}`} 
                                        alt="Store Logo" 
                                        className="w-full h-full object-contain p-2 bg-white" 
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerText = settings.store_name?.[0] || 'S';
                                        }}
                                    />
                                ) : (
                                    settings.store_name?.[0] || 'S'
                                )}
                            </div>
                        </div>
                        <h1 className="text-3xl font-black uppercase tracking-tight mb-1">{settings.store_name}</h1>
                        <p className="text-sm font-bold opacity-80">{settings.store_address || 'Mogadishu, Somalia'}</p>
                        <p className="text-sm font-bold opacity-80 mb-4">{settings.store_number || '+252 xxx xxx xxx'}</p>
                        
                        <div className="py-2 border-y border-slate-100 mt-4">
                            <h2 className="text-xl font-black uppercase tracking-extra-wide text-blue-600">Operational Report</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comprehensive Summary</p>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <div>
                            <p>Muddo: {startDate} - {endDate}</p>
                        </div>
                        <div className="text-right">
                            <p>Printed: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* 0. DAILY OPERATIONAL SUMMARY (WALPO FOCUS) */}
                <section className="bg-blue-600 p-8 rounded-2xl shadow-2xl border border-blue-400 relative overflow-hidden print:bg-white print:border-gray-300 print:shadow-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-3xl text-white">📋</span>
                            <h2 className="text-2xl font-black text-white print:text-gray-900">XOGTA MAALINKA - Daily Summary</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Walpo Recovery Today */}
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 print:bg-gray-50 print:border-gray-200">
                                <p className="text-xs font-bold text-blue-100 print:text-gray-500 uppercase tracking-widest mb-1">Deynta la Helay (Walpo Recovery)</p>
                                <p className="text-3xl font-black text-white print:text-gray-900">
                                    ${Number((analytics?.walpo || [])
                                        .filter(item => item.date === new Date().toISOString().split('T')[0])
                                        .reduce((acc, curr) => acc + curr.recovered, 0))
                                        .toFixed(2)}
                                </p>
                            </div>

                            {/* New Debts Issued Today */}
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 print:bg-gray-50 print:border-gray-200">
                                <p className="text-xs font-bold text-blue-100 print:text-gray-500 uppercase tracking-widest mb-1">Deynta Cusub (Credit Issued)</p>
                                <p className="text-3xl font-black text-white print:text-gray-900">
                                    ${Number((analytics?.walpo || [])
                                        .filter(item => item.date === new Date().toISOString().split('T')[0])
                                        .reduce((acc, curr) => acc + curr.issued, 0))
                                        .toFixed(2)}
                                </p>
                            </div>

                            {/* Net Cash Flow Today */}
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 print:bg-gray-50 print:border-gray-200">
                                <p className="text-xs font-bold text-blue-100 print:text-gray-500 uppercase tracking-widest mb-1">Iibka Maanta (Today's Sales)</p>
                                <p className="text-3xl font-black text-white print:text-gray-900">${Number(stats?.summary?.today_sales || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Cashier Specific Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-blue-200 uppercase">Cash (Kaash)</p>
                                <p className="text-xl font-bold text-white">${Number(analytics.comprehensive?.posIncome?.cash || 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-blue-200 uppercase">EVC Plus</p>
                                <p className="text-xl font-bold text-white">${Number(analytics.comprehensive?.posIncome?.evc || 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <p className="text-[10px] font-bold text-blue-200 uppercase">Shilin Somali</p>
                                <p className="text-xl font-bold text-white">${Number(analytics.comprehensive?.posIncome?.shilin || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-white/10 bg-emerald-500/10">
                                <p className="text-[10px] font-bold text-emerald-200 uppercase">Grand Total</p>
                                <p className="text-xl font-bold text-emerald-400">
                                    ${Number(
                                        (analytics.comprehensive?.posIncome?.cash || 0) + 
                                        (analytics.comprehensive?.posIncome?.evc || 0) + 
                                        (analytics.comprehensive?.posIncome?.shilin || 0)
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 1. DASHBOARD SECTION */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 print:bg-white print:border-gray-300 print:shadow-none">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700 print:border-gray-300">
                    <span className="text-2xl">📊</span>
                    <h2 className="text-2xl font-bold text-white print:text-gray-900">DASHBOARD - Koobka Guud</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 print:bg-gray-50 print:border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-blue-400">💲</span>
                            <p className="text-xs text-slate-400 print:text-gray-600 font-bold uppercase">Total Revenue</p>
                        </div>
                        <p className="text-2xl font-black text-white print:text-gray-900">${Number(stats?.system_overview?.total_revenue || 0).toFixed(2)}</p>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 print:bg-gray-50 print:border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-emerald-400">👥</span>
                            <p className="text-xs text-slate-400 print:text-gray-600 font-bold uppercase">Total Customers</p>
                        </div>
                        <p className="text-2xl font-black text-white print:text-gray-900">{stats?.summary?.total_customers || 0}</p>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 print:bg-gray-50 print:border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-amber-400">🛒</span>
                            <p className="text-xs text-slate-400 print:text-gray-600 font-bold uppercase">Today's Sales</p>
                        </div>
                        <p className="text-2xl font-black text-white print:text-gray-900">{stats?.summary?.today_sales || 0}</p>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 print:bg-gray-50 print:border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-rose-400">⚠️</span>
                            <p className="text-xs text-slate-400 print:text-gray-600 font-bold uppercase">Low Stock Items</p>
                        </div>
                        <p className="text-2xl font-black text-white print:text-gray-900">{stats?.summary?.low_stock_count || 0}</p>
                    </div>
                </div>
            </section>

            {/* 2. SALES SECTION */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 print:bg-white print:border-gray-300 print:shadow-none print:page-break-before-always">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700 print:border-gray-300">
                    <span className="text-2xl">📈</span>
                    <h2 className="text-2xl font-bold text-white print:text-gray-900">SALES - Iibka</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Payment Methods (Transactions)</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-700/50 print:bg-gray-100">
                                        <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Method</th>
                                        <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Count</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(analytics.dashboard?.paymentMethods || []).map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                            <td className="p-3 text-white print:text-gray-900 capitalize">{item.name}</td>
                                            <td className="p-3 text-right text-white print:text-gray-900 font-bold">{item.value}</td>
                                        </tr>
                                    ))}
                                    {(!analytics.dashboard?.paymentMethods || analytics.dashboard.paymentMethods.length === 0) && (
                                        <tr>
                                            <td colSpan="2" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* POS Income Breakdown */}
                    <div>
                        <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Income by Method (Amount)</h3>
                         <div className="space-y-3">
                            <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700 print:border-gray-200 print:bg-gray-50">
                                <span className="text-slate-300 print:text-gray-700">💵 Cash</span>
                                <span className="font-bold text-white print:text-gray-900">${Number(analytics.comprehensive?.posIncome?.cash || 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700 print:border-gray-200 print:bg-gray-50">
                                <span className="text-slate-300 print:text-gray-700">📲 EVC Plus</span>
                                <span className="font-bold text-white print:text-gray-900">${Number(analytics.comprehensive?.posIncome?.evc || 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-lg flex justify-between items-center border border-slate-700 print:border-gray-200 print:bg-gray-50">
                                <span className="text-slate-300 print:text-gray-700">🇸🇴 Shilin</span>
                                <span className="font-bold text-white print:text-gray-900">${Number(analytics.comprehensive?.posIncome?.shilin || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Trend Table */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Sales Trend (Last 30 Days)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Date</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Total Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.dashboard?.salesTrend || []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{item.date}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${Number(item.total || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!analytics.dashboard?.salesTrend || analytics.dashboard.salesTrend.length === 0) && (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No sales data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products */}
                <div>
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Top Selling Products</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Product Name</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Quantity Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.comprehensive?.mostPurchased || []).slice(0, 10).map((product, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{product.name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">{product.total_qty}</td>
                                    </tr>
                                ))}
                                {(!analytics.comprehensive?.mostPurchased || analytics.comprehensive.mostPurchased.length === 0) && (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No product data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Most Expensive Products */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Most Expensive Products</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Product Name</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.comprehensive?.mostExpensive || []).map((product, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{product.name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${Number(product.selling_price || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 3. STOCK SECTION */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 print:bg-white print:border-gray-300 print:shadow-none print:page-break-before-always">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700 print:border-gray-300">
                    <span className="text-2xl">📦</span>
                    <h2 className="text-2xl font-bold text-white print:text-gray-900">STOCK - Alaabta</h2>
                </div>
                
                {/* Stock by Category */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Stock by Category</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Category</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.products?.stockByCategory || []).map((cat, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{cat.name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">{cat.value}</td>
                                    </tr>
                                ))}
                                {(!analytics.products?.stockByCategory || analytics.products.stockByCategory.length === 0) && (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No stock data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stagnant Stock */}
                <div className="mt-8 break-inside-avoid">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Stagnant Stock (No Sales)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Product</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Stock</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.comprehensive?.stagnantStock || []).slice(0, 10).map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{item.name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">{item.current_stock}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${Number(item.selling_price || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!analytics.comprehensive?.stagnantStock || analytics.comprehensive.stagnantStock.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No stagnant stock found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Supplier Volume */}
                <div className="mt-8 break-inside-avoid">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Supplier Purchase Volume</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Supplier</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Total Purchased</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.comprehensive?.supplierVolume || []).map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{item.name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${Number(item.value || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 4. FINANCE SECTION */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 print:bg-white print:border-gray-300 print:shadow-none print:page-break-before-always">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700 print:border-gray-300">
                    <span className="text-2xl">💵</span>
                    <h2 className="text-2xl font-bold text-white print:text-gray-900">FINANCE - Maaliyadda</h2>
                </div>
                
                {/* Financial Flow */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Monthly Financial Flow</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Month</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Money In</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Money Out</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.comprehensive?.financialFlow || []).map((flow, idx) => (
                                     <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{flow.month}</td>
                                        <td className="p-3 text-right text-emerald-400 print:text-emerald-600 font-bold">${Number(flow.in || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-rose-400 print:text-rose-600 font-bold">${Number(flow.out || 0).toFixed(2)}</td>
                                        <td className={`p-3 text-right font-black ${flow.profit >= 0 ? 'text-emerald-400 print:text-emerald-600' : 'text-rose-400 print:text-rose-600'}`}>
                                            ${Number(flow.profit || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {(!analytics.comprehensive?.financialFlow || analytics.comprehensive.financialFlow.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No financial data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Expenses Breakdown */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Expenses by Category</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Category</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.expenses?.categoryBreakdown || []).map((expense, idx) => (
                                     <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{expense.name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${Number(expense.value || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!analytics.expenses?.categoryBreakdown || analytics.expenses.categoryBreakdown.length === 0) && (
                                    <tr>
                                        <td colSpan="2" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No expense data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 5. DEBT SECTION */}
            <section className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 print:bg-white print:border-gray-300 print:shadow-none print:page-break-before-always">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700 print:border-gray-300">
                    <span className="text-2xl">💳</span>
                    <h2 className="text-2xl font-bold text-white print:text-gray-900">DEBT - Deynta (Walpo)</h2>
                </div>
                
                {/* Credit vs Recovery */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Credit Issued vs Recovered</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Date</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Credit Issued</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Recovered</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.walpo || []).map((item, idx) => (
                                     <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{item.date}</td>
                                        <td className="p-3 text-right text-rose-400 print:text-rose-600 font-bold">${Number(item.issued || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-emerald-400 print:text-emerald-600 font-bold">${Number(item.recovered || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${(Number(item.issued || 0) - Number(item.recovered || 0)).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!analytics.walpo || analytics.walpo.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No debt data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Written Off Debts */}
                <div className="mt-8 break-inside-avoid">
                    <h3 className="text-lg font-bold text-white print:text-gray-900 mb-3">Written Off Debts</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/50 print:bg-gray-100">
                                    <th className="text-left p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Customer</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Calculated Debt</th>
                                    <th className="text-right p-3 text-slate-300 print:text-gray-700 font-bold border-b border-slate-600 print:border-gray-300">Written Off</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(analytics.comprehensive?.writtenOff || []).map((item, idx) => (
                                     <tr key={idx} className="border-b border-slate-700/30 print:border-gray-200">
                                        <td className="p-3 text-white print:text-gray-900">{item.full_name}</td>
                                        <td className="p-3 text-right text-white print:text-gray-900 font-bold">${Number(item.original_amount || 0).toFixed(2)}</td>
                                        <td className="p-3 text-right text-rose-400 print:text-rose-600 font-bold">${Number(item.remaining_amount || 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!analytics.comprehensive?.writtenOff || analytics.comprehensive.writtenOff.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="p-4 text-center text-slate-500 print:text-gray-500 italic">No write-offs recorded</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

                {/* Print Footer */}
                <div className="hidden print:block text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
                    <p>End of Report - Generated by Somali POS System</p>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
