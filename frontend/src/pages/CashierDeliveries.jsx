import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Truck, Search, Loader2, MapPin, Phone, User, Save } from 'lucide-react';

const CashierDeliveries = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updating, setUpdating] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/cashier/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching delivery orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDelivery = async (id, deliveryType, deliveryPrice) => {
        setUpdating(id);
        try {
            await api.post(`/cashier/orders/${id}/delivery`, {
                delivery_type: deliveryType,
                delivery_price: parseFloat(deliveryPrice || 0)
            });
            await fetchOrders();
        } catch (error) {
            console.error('Error updating delivery:', error);
            alert('Failed to update delivery info');
        } finally {
            setUpdating(null);
        }
    };

    const filteredOrders = orders.filter(order => 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                    <Truck className="text-blue-500" />
                    Delivery Management
                </h1>
                
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or invoice..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-secondary/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-800/40 text-left border-b border-slate-700">
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Order Info</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer Details</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Delivery Type</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Delivery Price</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <DeliveryRow 
                                    key={order.sale_id} 
                                    order={order} 
                                    onUpdate={handleUpdateDelivery}
                                    isUpdating={updating === order.sale_id}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-slate-700">
                    <Search size={64} className="text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No deliveries found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your search or check again later.</p>
                </div>
            )}
        </div>
    );
};

const DeliveryRow = ({ order, onUpdate, isUpdating }) => {
    const [delType, setDelType] = useState(order.delivery_type || 'none');
    const [delPrice, setDelPrice] = useState(order.delivery_price || '0.00');

    return (
        <tr className="border-b border-slate-700/50 hover:bg-slate-700/10 transition-colors group">
            <td className="p-4">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-blue-400 uppercase tracking-widest mb-0.5">{order.invoice_number}</span>
                    <span className="text-xs text-slate-400">{new Date(order.sale_date).toLocaleDateString()}</span>
                </div>
            </td>
            <td className="p-4">
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-white uppercase">
                        <User size={14} className="text-slate-500" />
                        {order.customer_name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone size={12} />
                        {order.customer_phone}
                    </div>
                    <div className="hidden group-hover:flex items-start gap-2 text-[10px] text-slate-500 mt-1">
                        <MapPin size={10} className="mt-0.5" />
                        <span className="uppercase">{order.customer_address}</span>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <select 
                    className="bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-hidden focus:border-blue-500"
                    value={delType}
                    onChange={(e) => setDelType(e.target.value)}
                >
                    <option value="none">None</option>
                    <option value="bajaj">Bajaj (Bajaaj)</option>
                    <option value="vekon">Vekon (Vekoon)</option>
                    <option value="plane">Plane (Diyaarad)</option>
                </select>
            </td>
            <td className="p-4">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">$</span>
                    <input
                        type="number"
                        step="0.01"
                        className="bg-slate-800 border border-slate-700 rounded-lg py-1.5 pl-6 pr-3 text-xs text-white w-24 focus:outline-hidden focus:border-blue-500"
                        value={delPrice}
                        onChange={(e) => setDelPrice(e.target.value)}
                    />
                </div>
            </td>
            <td className="p-4 text-right">
                <button
                    onClick={() => onUpdate(order.sale_id, delType, delPrice)}
                    disabled={isUpdating}
                    className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white p-2.5 rounded-xl border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
            </td>
        </tr>
    );
}

export default CashierDeliveries;
