import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api/axios';
import { CreditCard, Plus, Search, Filter, TrendingDown, Edit2, Trash2, Save, X, Calendar, DollarSign, FileText, Upload, Link as LinkIcon, Shield, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import ChartCard from '../components/ChartCard';

const ExpensesPage = () => {
    const { isAdmin, canDo } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [analytics, setAnalytics] = useState({});
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        expense_category: 'other',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        cashier_note: '',
        admin_note: '',
        is_admin_present: false
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const fetchExpenses = useCallback(async () => {
        try {
            const response = await api.get('/expenses');
            setExpenses(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/analytics/expenses');
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching expense analytics:', error);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchAnalytics();
    }, [fetchExpenses]);

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setExpenseForm({
            expense_category: 'other',
            amount: '',
            description: '',
            expense_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            cashier_note: '',
            is_admin_present: false
        });
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (expense) => {
        setIsEditing(false); // Force creating a new one or just edit text
        // Note: For simplicity in this demo, we'll keep it as is, but document handling 
        // usually requires POST for file uploads in many setups.
        setIsEditing(true);
        setExpenseForm({
            ...expense,
            expense_date: expense.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.keys(expenseForm).forEach(key => {
            if (expenseForm[key] !== null) {
                formData.append(key, expenseForm[key]);
            }
        });
        
        if (selectedFile) {
            formData.append('document', selectedFile);
        }

        try {
            if (isEditing) {
                formData.append('_method', 'PUT');
                await api.post(`/expenses/${expenseForm.expense_id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/expenses', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error.response?.data || error.message);
            alert('Waan ka xunnahay, khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta aad gelisay'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ma hubtaa inaad tirtirto kharashkan?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalThisMonth = expenses
        .filter(e => e.expense_date?.startsWith(currentMonth))
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const pendingCount = expenses.filter(e => e.status === 'pending').length;

    const totalToday = expenses
        .filter(e => e.expense_date?.startsWith(new Date().toISOString().split('T')[0]))
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const filteredExpenses = expenses.filter(e => 
        (e.description || '').toLowerCase().includes(search.toLowerCase()) || 
        (e.expense_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.expense_category || '').toLowerCase().includes(search.toLowerCase())
    );

    const categories = [
        { value: 'rent', label: 'Rent (Kiro)' },
        { value: 'electricity', label: 'Electricity (Laydh)' },
        { value: 'water', label: 'Water (Biyo)' },
        { value: 'tax', label: 'Tax (Canshuur)' },
        { value: 'salary', label: 'Salary (Mushaar)' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'office', label: 'Office Supplies' },
        { value: 'other', label: 'Other (Kale)' },
        { value: 'purchase', label: 'Purchase (Iib)' },
        { value: 'transport', label: 'Transport (Gadiid)' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Kharashaadka (Expenses)</h1>
                    <p className="text-slate-400">Maareynta kharashaadka guud ee ganacsiga.</p>
                </div>
                {canDo('record') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span>Ku dar Kharash</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Bishaan (Month)</p>
                        <h3 className="text-2xl font-black text-white">${totalThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                            <FileText size={24} />
                        </div>
                        {pendingCount > 0 && (
                            <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black rounded-lg animate-pulse">
                                {pendingCount} Pending
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Sugitaan (Pending)</p>
                        <h3 className="text-2xl font-black text-white">{pendingCount}</h3>
                    </div>
                </div>
                <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Maanta (Today)</p>
                        <h3 className="text-2xl font-black text-white">${totalToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartCard 
                    title="Monthly Burn" 
                    subtitle="Spending trend (past months)" 
                    icon={BarChart3}
                >
                    <BarChart data={analytics?.monthlyBurn}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="total" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartCard>

                <ChartCard 
                    title="Category Breakdown" 
                    subtitle="Expenses by category" 
                    icon={PieIcon}
                >
                    <PieChart>
                        <Pie
                            data={analytics?.categoryBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {analytics?.categoryBreakdown?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'][index % 7]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                </ChartCard>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Raadi kharash..." 
                            className="w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Number</th>
                                <th className="px-6 py-4">Qaybta</th>
                                <th className="px-6 py-4">Faahfaahin</th>
                                <th className="px-6 py-4">Requested By</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Taariikhda</th>
                                <th className="px-6 py-4 text-right">Cadadka</th>
                                <th className="px-6 py-4">Doc</th>
                                <th className="px-6 py-4">Status</th>
                                {(canDo('edit') || canDo('delete')) && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">Ma jiraan kharashaad la helay.</td>
                                </tr>
                            ) : filteredExpenses.map((e) => (
                                <tr key={e.expense_id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs text-blue-400 font-bold">{e.expense_number}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                            {e.expense_category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white text-sm font-medium">{e.description}</div>
                                        {e.cashier_note && <div className="text-[10px] text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded mt-1">Note: {e.cashier_note}</div>}
                                        {e.admin_note && <div className="text-[10px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded mt-1">Reply: {e.admin_note}</div>}
                                        {e.is_admin_present && <div className="inline-flex items-center text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded mt-1 font-bold uppercase tracking-tighter border border-blue-500/20"><Shield size={10} className="mr-1" /> Admin Present</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                                {e.requester?.full_name?.[0] || 'U'}
                                            </div>
                                            <span className="text-slate-300 text-xs font-medium">{e.requester?.full_name || 'System'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase border border-slate-700">
                                            {e.payment_method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">{e.expense_date?.split('T')[0]}</td>
                                    <td className="px-6 py-4">
                                        {e.document_url ? (
                                            (!isAdmin && e.status !== 'approved' && e.source === 'expenses') ? (
                                                <span className="text-slate-600 text-[10px] italic">Wuxuu sugayaa oggolaansho</span>
                                            ) : (
                                                <a 
                                                    href={e.document_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    <LinkIcon size={12} />
                                                    <span>View</span>
                                                </a>
                                            )
                                        ) : (
                                            <span className="text-slate-600 text-[10px]">Ma jirto</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            e.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 
                                            e.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 
                                            'bg-rose-500/10 text-rose-400'
                                        }`}>
                                            {e.status.toUpperCase()}
                                        </span>
                                    </td>
                                    {(canDo('edit') || canDo('delete')) && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                {(canDo('edit') && e.source === 'expenses' && (isAdmin || e.status === 'pending')) && (
                                                    <button 
                                                        onClick={() => handleOpenEditModal(e)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {(canDo('delete') && e.source === 'expenses') && (
                                                    <button 
                                                        onClick={() => handleDelete(e.expense_id)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                        {filteredExpenses.length > 0 && (
                            <tfoot className="bg-slate-800/80 sticky bottom-0 backdrop-blur-md border-t-2 border-slate-700">
                                <tr className="text-white font-black uppercase text-xs">
                                    <td colSpan="6" className="px-6 py-5 text-right text-slate-400 tracking-widest">
                                        Wadarta Guud (Grand Total):
                                    </td>
                                    <td className="px-6 py-5 text-right text-rose-400 text-sm">
                                        ${filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    {(canDo('edit') || canDo('delete')) && <td colSpan="3"></td>}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Wax ka beddel Kharashka' : 'Ku dar Kharash Cusub'}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Qaybta (Category)</label>
                            <select 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={expenseForm.expense_category}
                                onChange={(e) => setExpenseForm({...expenseForm, expense_category: e.target.value})}
                            >
                                {categories.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Cadadka (Amount)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    required
                                    type="number" 
                                    step="0.01"
                                    className="w-full bg-primary/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="col-span-full flex items-center space-x-3 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                            <input 
                                type="checkbox" 
                                id="admin_present"
                                className="w-5 h-5 rounded bg-primary/50 border-slate-700 text-blue-600 focus:ring-0 disabled:opacity-50"
                                checked={expenseForm.is_admin_present}
                                onChange={(e) => setExpenseForm({...expenseForm, is_admin_present: e.target.checked})}
                                disabled={!isAdmin}
                            />
                            <label htmlFor="admin_present" className="text-sm text-slate-300 font-medium cursor-pointer flex items-center">
                                <Shield size={16} className="mr-2 text-blue-400" />
                                Admin-ka ayaa jooga (Admin is present)
                            </label>
                        </div>

                        <div className="col-span-full space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Faahfaahin (Description)</label>
                            <textarea 
                                required
                                rows="3"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={expenseForm.description}
                                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                                placeholder="Maxaa loo kharash gareeyay?"
                            ></textarea>
                        </div>
                        <div className="col-span-full space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Cashier Note (Fariintaada)</label>
                            <textarea 
                                rows="2"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={expenseForm.cashier_note}
                                onChange={(e) => setExpenseForm({...expenseForm, cashier_note: e.target.value})}
                                placeholder="Fariin dheeraad ah oo ku saabsan dukumentiga ama kharashka..."
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Taariikhda</label>
                            <input 
                                required
                                type="date" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={expenseForm.expense_date}
                                onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Payment Method</label>
                            <select 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={expenseForm.payment_method}
                                onChange={(e) => setExpenseForm({...expenseForm, payment_method: e.target.value})}
                            >
                                <option value="cash">Cash (Lacag Cadaan)</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="evc_plus">EVC Plus</option>
                            </select>
                        </div>
                        {isAdmin && isEditing && (
                            <div className="col-span-full space-y-4 pt-4 border-t border-slate-700">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Admin Response (Fariinta Admin-ka)</label>
                                    <textarea 
                                        rows="2"
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={expenseForm.admin_note || ''}
                                        onChange={(e) => setExpenseForm({...expenseForm, admin_note: e.target.value})}
                                        placeholder="U jawaab fariintii markii aad aqbalayso ama diidayso..."
                                    ></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Status (Go'aanka)</label>
                                    <select 
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        value={expenseForm.status}
                                        onChange={(e) => setExpenseForm({...expenseForm, status: e.target.value})}
                                    >
                                        <option value="pending">Pending (Sugitaan)</option>
                                        <option value="approved">Approved (La aqbalay)</option>
                                        <option value="rejected">Rejected (La diiday)</option>
                                    </select>
                                </div>
                                {expenseForm.status === 'rejected' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Reason for Rejection (Sababta loo diiday)</label>
                                        <textarea 
                                            rows="2"
                                            className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                            value={expenseForm.rejection_reason || ''}
                                            onChange={(e) => setExpenseForm({...expenseForm, rejection_reason: e.target.value})}
                                            placeholder="Maxaa loo diiday kharashkan?"
                                        ></textarea>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Document Upload */}
                        <div className="col-span-full space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Warqadda (Document Upload)</label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    id="expense-doc" 
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                />
                                <label 
                                    htmlFor="expense-doc"
                                    className="flex items-center justify-center space-x-3 w-full py-6 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-slate-400 group-hover:text-blue-400"
                                >
                                    <Upload size={24} />
                                    <span className="font-medium">{selectedFile ? selectedFile.name : 'Dooro feyl (PDF ama Image)'}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
                        >
                            Ka noqo
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2"
                        >
                            <Save size={20} />
                            <span>Kaydi Kharashka</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ExpensesPage;
