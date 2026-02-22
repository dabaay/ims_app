import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ScrollText, Calendar, Search, Download, FileText, Filter } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AccountingPage = () => {
    const { isAdmin, canDo, hasPermission } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ledger');
    const [search, setSearch] = useState('');
    const [settings, setSettings] = useState({
        store_name: "So'Mali Store",
        store_address: "Main Street, Mogadishu",
        store_number: "Somali Government",
        store_logo: null,
    });

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'ledger') {
                const response = await api.get('/accounting/transactions');
                setTransactions(response.data.data || response.data || []);
            } else {
                const response = await api.get('/accounting/daily-summaries');
                setSummaries(response.data.data || response.data || []);
            }
        } catch (error) {
            console.error('Error fetching accounting data:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, [fetchData]);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const filteredTransactions = transactions.filter(t => 
        t.description?.toLowerCase().includes(search.toLowerCase()) || 
        t.transaction_type.toLowerCase().includes(search.toLowerCase())
    );

    const exportToExcel = () => {
        const headers = ['Taariikhda', 'Nooca', 'Description', 'Debit (-)', 'Credit (+)', 'Balance'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(t => [
                new Date(t.transaction_date).toLocaleString(),
                t.transaction_type,
                `"${t.description.replace(/"/g, '""')}"`,
                t.debit > 0 ? t.debit : 0,
                t.credit > 0 ? t.credit : 0,
                parseFloat(t.balance || 0).toFixed(2)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ledger_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const totals = filteredTransactions.reduce((acc, t) => {
            acc.debit += parseFloat(t.debit || 0);
            acc.credit += parseFloat(t.credit || 0);
            return acc;
        }, { debit: 0, credit: 0 });

        printWindow.document.write(`
            <html>
                <head>
                    <title>Ledger-ka Guud - Print</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f8f9fa; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .text-right { text-align: right; }
                        .footer { margin-top: 20px; font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 10px; }
                        .debit { color: #e11d48; }
                        .credit { color: #10b981; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
                            ${settings.store_logo ? (
                                `<img src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="height: 80px; max-width: 200px; object-fit: contain; margin-bottom: 10px;" />`
                            ) : null}
                            <div style="width: 80px; height: 80px; background: #1e3a8a; color: white; border-radius: 50%; display: ${settings.store_logo ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; margin: 0 auto 10px auto;">
                                ${settings.store_name?.[0] || 'S'}
                             </div>
                            <h1 style="margin: 0; color: #1e3a8a; text-transform: uppercase; font-size: 28px; font-weight: 900;">${settings.store_name}</h1>
                            <p style="margin: 5px 0; font-size: 12px; font-weight: bold; color: #64748b;">${settings.store_address || 'Mogadishu, Somalia'}</p>
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                        </div>
                        <div style="text-align: center; margin-top: 10px;">
                            <h2 style="margin: 0; color: #333; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Warbixinta Xisaabaadka (Accounting Report)</h2>
                            <p style="margin: 5px 0; font-size: 11px; color: #666; font-weight: bold;">Taariikhda: ${new Date().toLocaleDateString()} | Printed: ${new Date().toLocaleTimeString()}</p>
                            <div style="display: inline-block; background: #eef2ff; border: 1px solid #c7d2fe; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 900; color: #4338ca; margin-top: 5px; text-transform: uppercase;">
                                SECTION: GENERAL_LEDGER
                            </div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Taariikhda</th>
                                <th>Nooca</th>
                                <th>Description</th>
                                <th class="text-right">Debit (-)</th>
                                <th class="text-right">Credit (+)</th>
                                <th class="text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTransactions.map(t => `
                                <tr>
                                    <td>${new Date(t.transaction_date).toLocaleString()}</td>
                                    <td>${t.transaction_type.toUpperCase()}</td>
                                    <td>${t.description}</td>
                                    <td class="text-right debit">${t.debit > 0 ? `$${parseFloat(t.debit).toFixed(2)}` : '-'}</td>
                                    <td class="text-right credit">${t.credit > 0 ? `$${parseFloat(t.credit).toFixed(2)}` : '-'}</td>
                                    <td class="text-right">$${parseFloat(t.balance || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8f9fa; font-weight: bold;">
                                <td colspan="3" class="text-right">TOTAL:</td>
                                <td class="text-right debit">$${totals.debit.toFixed(2)}</td>
                                <td class="text-right credit">$${totals.credit.toFixed(2)}</td>
                                <td class="text-right">$${(totals.credit - totals.debit).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div style="margin-top: 30px; text-align: center; border-top: 2px solid #eee; padding-top: 15px;">
                        <p style="margin: 5px 0; font-weight: bold;">Thank you for your business</p>
                        <div style="display: flex; justify-content: center; gap: 20px; margin: 10px 0; font-size: 11px;">
                            ${settings.facebook_show ? `<span><strong>FB:</strong> ${settings.facebook_handle}</span>` : ''}
                            ${settings.instagram_show ? `<span><strong>IG:</strong> ${settings.instagram_handle}</span>` : ''}
                            ${settings.tiktok_show ? `<span><strong>TikTok:</strong> ${settings.tiktok_handle}</span>` : ''}
                            ${settings.whatsapp_show ? `<span><strong>WA:</strong> ${settings.whatsapp_number}</span>` : ''}
                        </div>
                        <p style="margin: 0; font-size: 10px; color: #666;">&copy; ${new Date().getFullYear()} ${settings.store_name}</p>
                    </div>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const ledgerTotals = filteredTransactions.reduce((acc, t) => {
        acc.debit += parseFloat(t.debit || 0);
        acc.credit += parseFloat(t.credit || 0);
        return acc;
    }, { debit: 0, credit: 0 });

    if (!isAdmin && !hasPermission('accounting')) {
        return <div className="text-white p-8 text-center bg-secondary/40 rounded-3xl border border-slate-700">Access Restricted</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Xisaabaadka (Accounting)</h1>
                    <p className="text-slate-400">Ledger-ka guud iyo warbixinada dakhliga.</p>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    <button 
                        onClick={() => setActiveTab('ledger')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'ledger' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Ledger-ka Guud
                    </button>
                    <button 
                        onClick={() => setActiveTab('summaries')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'summaries' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Daily Summaries
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Income (Sales)</p>
                    <h3 className="text-2xl font-black text-emerald-400">
                        ${summaries.reduce((sum, s) => sum + parseFloat(s.total_sales), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Cash:</span> <span>${summaries.reduce((sum, s) => sum + parseFloat(s.total_cash_sales || 0), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>EVC:</span> <span>${summaries.reduce((sum, s) => sum + parseFloat(s.total_evc_sales || 0), 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Shilin:</span> <span>${summaries.reduce((sum, s) => sum + parseFloat(s.total_shilin_sales || 0), 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm shadow-lg shadow-rose-500/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Expenses</p>
                    <h3 className="text-2xl font-black text-white mb-4">
                        ${(summaries.reduce((sum, s) => sum + (parseFloat(s.total_expenses || 0) + parseFloat(s.total_purchases || 0) + parseFloat(s.total_transportation || 0)), 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="space-y-1 pt-3 border-t border-slate-700">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">GENERAL:</span>
                            <span className="text-rose-400">${summaries.reduce((sum, s) => sum + parseFloat(s.total_expenses || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">PURCHASES:</span>
                            <span className="text-rose-400">${summaries.reduce((sum, s) => sum + parseFloat(s.total_purchases || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500">TRANSPORT:</span>
                            <span className="text-rose-400">${summaries.reduce((sum, s) => sum + parseFloat(s.total_transportation || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm shadow-lg shadow-blue-500/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Debt Collected</p>
                    <h3 className="text-2xl font-black text-white">
                        ${summaries.reduce((sum, s) => sum + parseFloat(s.total_debt_collected || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm shadow-lg shadow-white/5">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Net Profit</p>
                    <h3 className="text-2xl font-black text-white">
                        ${summaries.reduce((sum, s) => sum + parseFloat(s.total_profit || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                </div>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Raadi dhaqdhaqaaq..." 
                            className="w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        {canDo('view') && (
                            <button 
                                onClick={exportToExcel}
                                className="flex items-center space-x-2 px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold hover:text-white transition-all shadow-lg"
                            >
                                <Download size={20} />
                                <span>Export Excel</span>
                            </button>
                        )}
                        {canDo('view') && (
                            <button 
                                onClick={handlePrint}
                                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                <FileText size={20} />
                                <span>Print PDF</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'ledger' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                    <th className="px-6 py-4">Taariikhda</th>
                                    <th className="px-6 py-4">Nooca</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Debit / Bixid (-)</th>
                                    <th className="px-6 py-4 text-right">Credit / Dakhli (+)</th>
                                    <th className="px-6 py-4 text-right">Balance (Haraaga)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td></tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Ma jiraan wax dhaqdhaqaaq ah.</td></tr>
                                ) : filteredTransactions.map((t) => (
                                    <tr key={t.transaction_id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                                            {new Date(t.transaction_date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                t.transaction_type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' :
                                                ['expense', 'purchase', 'transportation'].includes(t.transaction_type) ? 'bg-rose-500/10 text-rose-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                                {t.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white">{t.description}</td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-400">
                                            {t.debit > 0 ? `-$${t.debit}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400">
                                            {t.credit > 0 ? `+$${t.credit}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-white">
                                            ${parseFloat(t.balance || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {!loading && filteredTransactions.length > 0 && (
                                <tfoot className="bg-slate-800/80 sticky bottom-0 backdrop-blur-md border-t-2 border-slate-700">
                                    <tr className="text-white font-black uppercase text-xs">
                                        <td colSpan="3" className="px-6 py-5 text-right text-slate-400 tracking-widest">
                                            Wadarta (Total):
                                        </td>
                                        <td className="px-6 py-5 text-right text-rose-400 text-sm font-black">
                                            -${ledgerTotals.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5 text-right text-emerald-400 text-sm font-black">
                                            +${ledgerTotals.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-5 text-right text-white text-sm font-black">
                                            ${(ledgerTotals.credit - ledgerTotals.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Credit / Income (+)</th>
                                    <th className="px-6 py-4 text-right">Expenses (-)</th>
                                    <th className="px-6 py-4 text-right">Debt Collected</th>
                                    <th className="px-6 py-4 text-right">Debt Created</th>
                                    <th className="px-6 py-4 text-right">Net Profit</th>
                                    <th className="px-6 py-4 text-right">Balance (Residual)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {loading ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td></tr>
                                ) : summaries.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Ma jiraan xog kooban.</td></tr>
                                ) : summaries.map((s) => {
                                    const totalOutflow = parseFloat(s.total_expenses) + parseFloat(s.total_purchases) + parseFloat(s.total_transportation);
                                    const totalInflow = parseFloat(s.total_cash_sales || 0) + parseFloat(s.total_evc_sales || 0) + parseFloat(s.total_shilin_sales || 0) + parseFloat(s.total_debt_collected || 0);
                                    const residual = totalInflow - totalOutflow;

                                    return (
                                        <tr key={s.summary_id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-white font-bold">{s.summary_date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-emerald-400 font-bold">${s.total_sales}</div>
                                                <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                                                    <div className="flex justify-end gap-2"><span>Cash:</span> <span>${parseFloat(s.total_cash_sales || 0).toFixed(2)}</span></div>
                                                    <div className="flex justify-end gap-2"><span>EVC:</span> <span>${parseFloat(s.total_evc_sales || 0).toFixed(2)}</span></div>
                                                    <div className="flex justify-end gap-2"><span>Shilin:</span> <span>${parseFloat(s.total_shilin_sales || 0).toFixed(2)}</span></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-rose-400 font-bold">${totalOutflow.toFixed(2)}</div>
                                                <div className="text-[10px] text-slate-500 space-y-0.5 mt-1 font-mono uppercase">
                                                    <div className="flex justify-end gap-2"><span>General:</span> <span>${parseFloat(s.total_expenses || 0).toFixed(2)}</span></div>
                                                    <div className="flex justify-end gap-2"><span>Purchases:</span> <span>${parseFloat(s.total_purchases || 0).toFixed(2)}</span></div>
                                                    <div className="flex justify-end gap-2"><span>Transport:</span> <span>${parseFloat(s.total_transportation || 0).toFixed(2)}</span></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-blue-400 font-bold">${s.total_debt_collected}</div>
                                                <div className="text-[10px] text-slate-500 italic mt-1">
                                                    {parseFloat(s.total_debt_collected) > 0 ? 'Amount Paid' : 'No payments'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-amber-400 font-medium">${s.total_debt_created}</td>
                                            <td className="px-6 py-4 text-right text-white font-black">${s.total_profit}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`font-black text-lg ${residual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    ${residual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Net Cash Flow</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountingPage;
