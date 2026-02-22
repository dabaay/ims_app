import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { History, ShieldAlert, BadgeCheck, CreditCard, Search, Download, Terminal, Database, Loader2 } from 'lucide-react';

const LogsPage = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [backupLogs, setBackupLogs] = useState([]);
    const [paymentLogs, setPaymentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('audit');
    const [search, setSearch] = useState('');
    const [backingUp, setBackingUp] = useState(false);

    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'audit') endpoint = '/logs/audit';
            else if (activeTab === 'backups') endpoint = '/logs/backups';
            else if (activeTab === 'payments') endpoint = '/logs/payments';

            const response = await api.get(endpoint);
            const data = response.data.data || response.data || [];
            
            if (activeTab === 'audit') setAuditLogs(data);
            else if (activeTab === 'backups') setBackupLogs(data);
            else if (activeTab === 'payments') setPaymentLogs(data);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const currentLogs = activeTab === 'audit' ? auditLogs : activeTab === 'backups' ? backupLogs : paymentLogs;
    
    const filteredLogs = currentLogs.filter(log => {
        const str = JSON.stringify(log).toLowerCase();
        return str.includes(search.toLowerCase());
    });

    const handleBackup = async () => {
        if (!window.confirm('Ma hubtaa inaad rabto inaad sameyso backup cusub?')) return;
        
        setBackingUp(true);
        try {
            await api.post('/backups/run');
            alert('Backup-ka si guul leh ayaa loo sameeyay (Backup created successfully).');
            fetchLogs(); // Refresh list
        } catch (error) {
            console.error('Backup failed:', error);
            alert('Khalad ayaa dhacay intii lagu jiray backup-ka.');
        } finally {
            setBackingUp(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Diiwaanka Nidaamka (System Logs)</h1>
                    <p className="text-slate-400">Lasocodka dhaqdhaqaaqa iyo amniga nidaamka.</p>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    {[
                        { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
                        { id: 'backups', label: 'Backups', icon: History },
                        { id: 'payments', label: 'Payments', icon: CreditCard }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Raadi log gaar ah..." 
                            className="w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-bold hover:bg-slate-700 transition-all">
                        <Download size={20} />
                        <span>Download Logs</span>
                    </button>
                    
                    {activeTab === 'backups' && (
                        <button 
                            onClick={handleBackup}
                            disabled={backingUp}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white border border-blue-500 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {backingUp ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                            <span>{backingUp ? 'Backing up...' : 'Backup Data'}</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Taariikhda</th>
                                {activeTab === 'audit' && <>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Table</th>
                                    <th className="px-6 py-4">IP Address</th>
                                </>}
                                {activeTab === 'backups' && <>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">File Name</th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4">Status</th>
                                </>}
                                {activeTab === 'payments' && <>
                                    <th className="px-6 py-4">Gateway</th>
                                    <th className="px-6 py-4">Phone</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                </>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Log lama helin.</td></tr>
                            ) : filteredLogs.map((log, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                        {new Date(log.created_at || log.backup_date).toLocaleString()}
                                    </td>
                                    
                                    {activeTab === 'audit' && <>
                                        <td className="px-6 py-4 text-white font-medium">{log.user?.full_name || 'System'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                log.action === 'login' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                log.action === 'logout' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                                            }`}>{log.action}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.action === 'logout' && (
                                                <div className="flex flex-col space-y-1">
                                                    <span className="text-[10px] text-emerald-400 font-bold">Active: {log.active_hours} hrs</span>
                                                    <span className="text-[10px] text-slate-500 font-bold">Inactive: {log.inactive_hours} hrs</span>
                                                </div>
                                            )}
                                            {log.action !== 'logout' && log.table_name && (
                                                <span className="text-slate-400 italic text-sm">{log.table_name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{log.ip_address}</td>
                                    </>}

                                    {activeTab === 'backups' && <>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-bold uppercase">{log.backup_type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white">{log.file_name}</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{Math.round(log.file_size / 1024)} KB</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>{log.status}</span>
                                        </td>
                                    </>}

                                    {activeTab === 'payments' && <>
                                        <td className="px-6 py-4 text-blue-400 font-bold uppercase text-xs">{log.gateway}</td>
                                        <td className="px-6 py-4 text-white font-mono">{log.phone_number}</td>
                                        <td className="px-6 py-4 text-emerald-400 font-bold">${log.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                log.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>{log.status}</span>
                                        </td>
                                    </>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogsPage;
