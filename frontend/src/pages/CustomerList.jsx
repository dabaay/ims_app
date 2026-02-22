import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Search, Filter, Edit2, Trash2, Users, Phone, MapPin, CreditCard, Save, X, TrendingUp, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    BarChart, 
    Bar, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import ChartCard from '../components/ChartCard';

const CustomerList = () => {
    const navigate = useNavigate();
    const { canDo } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [analytics, setAnalytics] = useState(null);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        credit_limit: 0,
        status: 'active'
    });

    useEffect(() => {
        fetchCustomers();
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/analytics/customers');
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching customer analytics:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentCustomer({
            full_name: '',
            phone: '',
            email: '',
            address: '',
            credit_limit: 0,
            status: 'active'
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (customer) => {
        setIsEditing(true);
        setCurrentCustomer(customer);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!currentCustomer.full_name || !currentCustomer.phone) {
            alert('Magaca iyo Taleefanka waa qasab.');
            return;
        }

        try {
            if (isEditing) {
                await api.put(`/customers/${currentCustomer.customer_id}`, currentCustomer);
            } else {
                await api.post('/customers', currentCustomer);
            }
            setIsModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error.response?.data || error.message);
            alert('Khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta aad gelisay'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ma hubtaa inaad tirtirto macmiilkan?')) return;
        try {
            await api.delete(`/customers/${id}`);
            fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.full_name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Macaamiisha (Customers)</h1>
                    <p className="text-slate-400">Maareynta iyo xogta macaamiisha.</p>
                </div>
                {canDo('record') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span>Ku dar Macmiil</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartCard 
                    title="Customer Growth" 
                    subtitle="New registrations by month" 
                    icon={TrendingUp}
                >
                    <LineChart data={analytics?.growthTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        />
                        <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ChartCard>

                <ChartCard 
                    title="Debt Distribution" 
                    subtitle="Customer balances by bucket" 
                    icon={AlertCircle}
                >
                    <BarChart data={analytics?.debtStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#f43f5e', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                            {analytics?.debtStatus?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.bucket === 'No Debt' ? '#10b981' : '#f43f5e'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartCard>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Raadi macmiil magaciisa ama taleefankiisa..."
                            className="w-full pl-12 pr-4 py-2.5 bg-primary/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Macmiilka</th>
                                <th className="px-6 py-4">Taleefanka</th>
                                <th className="px-6 py-4">Haraaga (Balance)</th>
                                <th className="px-6 py-4">Status</th>
                                {(canDo('edit') || canDo('delete')) && <th className="px-6 py-4">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-lg italic">
                                        Waa la soo rarayaa...
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-lg italic">
                                        Ma jiraan macaamiil la helay.
                                    </td>
                                </tr>
                            ) : filteredCustomers.map((customer) => (
                                <tr key={customer.customer_id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => navigate('/walpo', { state: { customerId: customer.customer_id } })}
                                            className="font-bold text-white hover:text-blue-400 hover:underline text-left transition-colors"
                                        >
                                            {customer.full_name}
                                        </button>
                                        <div className="flex items-center text-xs text-slate-500 mt-1">
                                            <MapPin size={12} className="mr-1" />
                                            {customer.address || 'Ma jiro cinwaan'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-slate-300 text-sm">
                                            <Phone size={14} className="mr-2 text-slate-500" />
                                            {customer.phone}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold ${parseFloat(customer.current_balance) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            ${customer.current_balance}
                                        </div>
                                        <div className="text-[10px] text-slate-500 flex items-center">
                                            <CreditCard size={10} className="mr-1" />
                                            Limit: ${customer.credit_limit}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                            customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                                            customer.status === 'blocked' ? 'bg-rose-500/10 text-rose-400' : 
                                            'bg-slate-500/10 text-slate-400'
                                        }`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    {(canDo('edit') || canDo('delete')) && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {canDo('edit') && (
                                                    <button 
                                                        onClick={() => handleOpenEditModal(customer)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {canDo('delete') && (
                                                    <button 
                                                        onClick={() => handleDelete(customer.customer_id)}
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
                    </table>
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Wax ka beddel Xogta Macmiilka' : 'Ku dar Macmiil Cusub'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Magaca oo Buuxa</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentCustomer.full_name}
                                onChange={(e) => setCurrentCustomer({...currentCustomer, full_name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Taleefanka</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentCustomer.phone}
                                onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Email (Optional)</label>
                            <input
                                type="email"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentCustomer.email}
                                onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Cinwaanka</label>
                            <input
                                type="text"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentCustomer.address}
                                onChange={(e) => setCurrentCustomer({...currentCustomer, address: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Xadka Daynta (Credit Limit)</label>
                            <input
                                type="number"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentCustomer.credit_limit}
                                onChange={(e) => setCurrentCustomer({...currentCustomer, credit_limit: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Status</label>
                            <select
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentCustomer.status}
                                onChange={(e) => setCurrentCustomer({...currentCustomer, status: e.target.value})}
                            >
                                <option value="active">Active (Shaqaynaya)</option>
                                <option value="blocked">Blocked (Xiran)</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-bold transition-all"
                        >
                            Ka noqo
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2"
                        >
                            <Save size={18} />
                            <span>Kaydi Macmiilka</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CustomerList;
