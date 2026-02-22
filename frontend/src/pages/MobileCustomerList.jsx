import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, ShieldAlert, ShieldCheck, Edit, Search, Loader2 } from 'lucide-react';

const MobileCustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/mobile-manager/customers');
            setCustomers(res.data.data.data || res.data.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlock = async (id) => {
        setToggling(id);
        try {
            await api.post(`/mobile-manager/customers/${id}/toggle-block`);
            fetchCustomers();
        } catch (error) {
            alert('Fashil: ' + (error.response?.data?.message || 'Khalad ayaa dhacay'));
        } finally {
            setToggling(null);
        }
    };

    const filtered = customers.filter(c => 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    if (loading) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mobile Customers</h1>
                <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or phone..."
                        className="w-full pl-12 pr-4 py-3 bg-secondary/50 border border-slate-700 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-secondary/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/20">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Username</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Address</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {filtered.map((customer) => (
                            <tr key={customer.customer_id} className="hover:bg-slate-800/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                                            {customer.full_name[0]}
                                        </div>
                                        <span className="text-white font-bold">{customer.full_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-bold">{customer.username}</td>
                                <td className="px-6 py-4 text-slate-400 font-medium">{customer.phone}</td>
                                <td className="px-6 py-4 text-slate-400 text-xs">{customer.address || 'N/A'}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs uppercase font-bold">
                                    {new Date(customer.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    {customer.is_blocked ? (
                                        <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-red-500/20">Blocked</span>
                                    ) : (
                                        <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-emerald-500/20">Active</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        disabled={toggling === customer.customer_id}
                                        onClick={() => toggleBlock(customer.customer_id)}
                                        className={`p-2 rounded-lg border transition-all disabled:opacity-50 ${customer.is_blocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                        title={customer.is_blocked ? "Unblock / Unlock" : "Block / Lock"}
                                    >
                                        {toggling === customer.customer_id ? <Loader2 className="animate-spin" size={18} /> : (customer.is_blocked ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />)}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MobileCustomerList;
