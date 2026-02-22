import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { History, CheckCircle, XCircle, Eye, Loader2, Printer, FileText } from 'lucide-react';

const MobileOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending
    const [settings, setSettings] = useState({
        store_name: "So'Mali Store",
        store_address: "Main Street, Mogadishu",
        store_number: "Somali Government",
        store_logo: null,
    });

    useEffect(() => {
        fetchOrders();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await api.get('/mobile-manager/orders');
            setOrders(res.data.data.data || res.data.data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = statusFilter === 'all' 
        ? orders 
        : orders.filter(o => o.payment_status === statusFilter);

    const handlePrintReceipt = (sale) => {
        const printWindow = window.open('', '_blank');
        
        const logoHtml = settings.store_logo ? `<img class="logo" src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'" />` : '';
        
        const itemsHtml = (sale.items || []).map(item => `
            <tr>
                <td>${item.product?.name || 'Product'}<br/>$${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                <td style="text-align: center;">${item.quantity || 0}</td>
                <td style="text-align: right;">$${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}</td>
            </tr>
        `).join('');

        const cancelFeeHtml = sale.cancellation_fee > 0 ? `
            <div class="total-row" style="color: red;">
                <span>CANCEL FEE:</span>
                <span>$${parseFloat(sale.cancellation_fee).toFixed(2)}</span>
            </div>
        ` : '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Riskidha Iibka - ${settings.store_name}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 72mm; 
                            padding: 4mm; 
                            margin: 0; 
                            color: #000;
                            background: #fff;
                        }
                        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 5px; }
                        .store-name { font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .store-info { font-size: 11px; font-weight: bold; margin: 2px 0; }
                        
                        .receipt-title { 
                            font-size: 12px; 
                            font-weight: 900; 
                            border: 1px solid #000; 
                            display: inline-block; 
                            padding: 2px 10px; 
                            margin-top: 5px;
                        }

                        .info { font-size: 11px; margin: 10px 0; line-height: 1.4; }
                        .row { display: flex; justify-content: space-between; }
                        
                        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
                        th { border-bottom: 1px solid #000; padding: 5px 0; text-align: left; }
                        td { padding: 5px 0; vertical-align: top; }
                        
                        .total-section { border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
                        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; margin: 2px 0; }
                        .grand-total { font-size: 16px; border-top: 1px double #000; padding-top: 3px; margin-top: 3px; }

                        .footer { 
                            margin-top: 20px; 
                            text-align: center; 
                            font-size: 10px; 
                            border-top: 1px dashed #000; 
                            padding-top: 10px;
                        }
                        .thank-you { font-size: 14px; font-weight: 900; margin-bottom: 5px; }
                        .disclaimer { font-style: italic; font-weight: bold; margin-top: 8px; font-size: 9px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${logoHtml}
                        <h2 class="store-name">${settings.store_name}</h2>
                        <p class="store-info">${settings.store_address || 'Mogadishu, Somalia'}</p>
                        <p class="store-info">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                        <div class="receipt-title">MOBILE ORDER RECEIPT</div>
                    </div>

                    <div class="info">
                        <div class="row"><span>INVOICE:</span> <span>${sale.invoice_number || sale.sale_id}</span></div>
                        <div class="row"><span>DATE:</span> <span>${new Date(sale.sale_date).toLocaleString()}</span></div>
                        <div class="row"><span>CUSTOMER:</span> <span>${sale.customer_name || sale.customer_app?.full_name || 'Macmiil'}</span></div>
                        <div class="row"><span>TYPE:</span> <span>${(sale.payment_status || '').toUpperCase()} ORDER</span></div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>DESCRIPTION</th>
                                <th style="text-align: center;">QTY</th>
                                <th style="text-align: right;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-row grand-total">
                            <span>TOTAL:</span>
                            <span>$${parseFloat(sale.total_amount || 0).toFixed(2)}</span>
                        </div>
                        ${cancelFeeHtml}
                        <div class="total-row">
                            <span>PAID:</span>
                            <span>$${parseFloat(sale.amount_paid || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="thank-you">MAHADSANID</div>
                        <p style="margin: 0;">Waad ku mahadsantahay dalabkaaga Mobile-ka.</p>
                        <p style="margin-top: 10px; font-weight: 900; font-size: 11px;">${settings.store_name}</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const updateStatus = async (id, status) => {
        setUpdating(id);
        try {
            await api.post(`/mobile-manager/orders/${id}/status`, { status });
            fetchOrders();
        } catch (error) {
            alert('Fashil: ' + (error.response?.data?.message || 'Khalad ayaa dhacay'));
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mobile Orders</h1>
                
                {/* Tabs */}
                <div className="flex bg-slate-800/50 p-1 rounded-2xl border border-slate-700">
                    {['pending', 'paid', 'cancelled', 'all'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                statusFilter === status 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {status === 'pending' ? 'Bakhtii' : 
                             status === 'paid' ? 'Dhamaaday' : 
                             status === 'cancelled' ? 'La Baajiyay' : 'Dhammaan'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="bg-secondary/20 border border-slate-700/50 p-12 rounded-3xl text-center text-slate-500 font-bold uppercase tracking-widest">
                        Ma jiraan dalabaad halkan yaala.
                    </div>
                ) : filteredOrders.map((order) => (
                    <div key={order.sale_id} className="bg-secondary/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-secondary/50">
                        <div className="flex items-center space-x-6">
                            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400">
                                <History size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white leading-none mb-1">Order #{order.sale_id}</h3>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
                                    {order.customer_name || order.customer_app?.full_name || 'Macmiil aan la aqoon'}
                                </p>
                                <div className="flex items-center space-x-3 mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span>{order.customer_phone || order.customer_app?.phone || '-'}</span>
                                    <span>•</span>
                                    <span>{new Date(order.sale_date).toLocaleDateString()}</span>
                                </div>
                                {order.customer_address && (
                                    <p className="text-[11px] text-blue-400 font-bold mt-1 uppercase tracking-tight">
                                        Cinwaanka: {order.customer_address}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-12">
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Amount</p>
                                <p className="text-xl font-black text-white">${order.total_amount}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                                    order.payment_status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                    order.payment_status === 'cancelled' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                }`}>
                                    {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {order.payment_status !== 'pending' && (
                                <button 
                                    onClick={() => handlePrintReceipt(order)}
                                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all font-bold border border-slate-700"
                                >
                                    <Printer size={18} />
                                    <span>Print Receipt</span>
                                </button>
                            )}
                            {order.payment_status === 'pending' && (
                                <>
                                    <button 
                                        disabled={updating === order.sale_id}
                                        onClick={() => updateStatus(order.sale_id, 'paid')}
                                        className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-xl transition-all font-bold disabled:opacity-50"
                                    >
                                        {updating === order.sale_id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                        <span>Paid</span>
                                    </button>
                                    <button 
                                        disabled={updating === order.sale_id}
                                        onClick={() => updateStatus(order.sale_id, 'cancelled')}
                                        className="flex items-center space-x-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-xl transition-all font-bold disabled:opacity-50"
                                    >
                                        {updating === order.sale_id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                                        <span>Cancel</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileOrders;
