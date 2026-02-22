import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { History, Printer, Eye, Loader2, Package, User, MapPin, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContextDef';

const CashierMobileOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { settings } = useSettings();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/cashier/orders');
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching cashier orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = (sale) => {
        const printWindow = window.open('', '_blank');
        const itemsHtml = sale.items.map(item => `
            <tr>
                <td style="font-weight: bold;">${item.product?.name || 'Product'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">$${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${(item.unit_price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const logoHtml = settings.store_logo 
            ? `<img class="logo" src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'" />` 
            : '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>Order Receipt - ${sale.invoice_number}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 80mm; 
                            margin: 0; 
                            padding: 5mm; 
                            font-size: 12px;
                            line-height: 1.2;
                        }
                        .header { text-align: center; margin-bottom: 5mm; }
                        .logo { max-width: 40mm; height: auto; margin-bottom: 2mm; }
                        .store-name { font-size: 16px; font-weight: bold; margin: 0; }
                        .store-info { margin: 1mm 0; font-size: 11px; }
                        .receipt-title { 
                            border-top: 1px dashed #000; 
                            border-bottom: 1px dashed #000; 
                            padding: 1mm 0; 
                            margin: 2mm 0; 
                            font-weight: bold; 
                        }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
                        table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
                        th { border-bottom: 1px solid #000; text-align: left; }
                        .total-section { border-top: 1px dashed #000; padding-top: 2mm; }
                        .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 1mm; }
                        .footer { text-align: center; margin-top: 5mm; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${logoHtml}
                        <h2 class="store-name">${settings.store_name}</h2>
                        <p class="store-info">${settings.store_address || 'Mogadishu, Somalia'}</p>
                        <p class="store-info">TEL: ${settings.store_number || ''}</p>
                        <div class="receipt-title">CASHIER ORDER SLIP</div>
                    </div>

                    <div class="info-row">
                        <span>Invoice:</span>
                        <span>${sale.invoice_number}</span>
                    </div>
                    <div class="info-row">
                        <span>Date:</span>
                        <span>${new Date(sale.sale_date).toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span>Customer:</span>
                        <span>${sale.customer_name || 'Guest'}</span>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-row">
                            <span>TOTAL:</span>
                            <span>$${parseFloat(sale.total_amount).toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Customer Info:</p>
                        <p>${sale.customer_name} | ${sale.customer_phone}</p>
                        <p>${sale.customer_address}</p>
                        <p style="margin-top: 3mm;">***** THANK YOU *****</p>
                    </div>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 1000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                    <Package className="text-blue-500" />
                    Mobile Orders to Prepare
                </h1>
                <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/20 text-sm font-bold">
                    {orders.length} Ready for Prep
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                    <div key={order.sale_id} className="bg-secondary/40 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group">
                        <div className="p-5 border-b border-slate-700/50 bg-slate-800/20">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{order.invoice_number}</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase border border-emerald-500/20">
                                    Paid
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{order.customer_name}</h3>
                            <div className="flex items-center text-xs text-slate-400 gap-1.5">
                                <Phone size={12} />
                                {order.customer_phone}
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="flex items-start gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-700/30">
                                <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <address className="not-italic text-xs text-slate-300 leading-relaxed uppercase font-medium">
                                    {order.customer_address}
                                </address>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Order Items</p>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-800/10 p-2 rounded-lg text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold">
                                                {item.quantity}
                                            </span>
                                            <span className="text-slate-300 font-medium">{item.product?.name}</span>
                                        </div>
                                        <span className="text-white font-bold ml-2">${parseFloat(item.unit_price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-slate-700/50">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Grand Total</span>
                                    <span className="text-xl font-black text-white">${parseFloat(order.total_amount).toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => handlePrintReceipt(order)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                >
                                    <Printer size={18} />
                                    Print Order Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-slate-700">
                    <History size={64} className="text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No Orders to Prepare</h3>
                    <p className="text-slate-500 mt-1">Completed mobile orders will appear here automatically.</p>
                </div>
            )}
        </div>
    );
};

export default CashierMobileOrders;
