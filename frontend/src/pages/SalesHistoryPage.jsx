import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import config from '../config';
import { Search, Printer, Receipt, Calendar, FileText, ChevronRight, User, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const SalesHistoryPage = () => {
    const { user, canDo } = useAuth();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [settings, setSettings] = useState({
        store_name: "So'Mali Store",
        store_address: "Main Street, Mogadishu",
        store_number: "Somali Government",
        store_logo: null,
        tiktok_handle: "@somali_store",
        tiktok_show: true,
        facebook_handle: "somali.store",
        facebook_show: true,
        instagram_handle: "somali_store",
        instagram_show: true,
        whatsapp_number: "+252 61XXXXXXX",
        whatsapp_show: true,
        show_social_labels: true
    });

    useEffect(() => {
        fetchSales();
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

    const fetchSales = async () => {
        try {
            const response = await api.get('/sales');
            setSales(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        setIsModalOpen(true);
    };

    const handlePrintAll = () => {
        if (filteredSales.length === 0) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Diiwaanka Iibka - Print All</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; font-size: 12px; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                        .logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; }
                        .store-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; color: #1e3a8a; }
                        .total-summary { margin-top: 30px; text-align: right; font-weight: 900; font-size: 16px; color: #1e3a8a; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${settings.store_logo ? `<img class="logo" src="${config.storageUrl}/${settings.store_logo}" onerror="this.style.display='none'" />` : ''}
                        <h1 class="store-name">${settings.store_name}</h1>
                        <p style="margin: 5px 0;">${settings.store_address || 'Mogadishu, Somalia'}</p>
                        <p style="margin: 0; font-weight: bold;">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                        <h2 style="margin-top: 20px; color: #333; text-transform: uppercase; letter-spacing: 1px;">Diiwaanka Iibka (Sales History)</h2>
                        <p style="margin: 0; font-size: 11px; color: #64748b;">Taariikhda: ${new Date().toLocaleDateString()} | Printed: ${new Date().toLocaleTimeString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice No</th>
                                <th>Macmiilka</th>
                                <th>Taariikhda</th>
                                <th>Guud</th>
                                <th>Bixiyay</th>
                                <th>Haray</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(filteredSales || []).map(s => `
                                <tr>
                                    <td style="font-family: monospace; font-weight: bold; color: #2563eb;">${s.invoice_number || 'N/A'}</td>
                                    <td>${s.customer?.full_name || 'Macmiilka Guud'}</td>
                                    <td>${s.sale_date ? new Date(s.sale_date).toLocaleDateString() : 'N/A'}</td>
                                    <td style="font-weight: bold;">$${parseFloat(s.total_amount || 0).toFixed(2)}</td>
                                    <td style="color: #10b981;">$${parseFloat(s.amount_paid || 0).toFixed(2)}</td>
                                    <td style="color: #ef4444;">$${parseFloat(s.balance_due || 0).toFixed(2)}</td>
                                    <td style="text-transform: uppercase; font-size: 9px; font-weight: 900;">${s.payment_status || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total-summary">
                        Wadarta Natiijada: $${filteredSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0).toFixed(2)}
                    </div>
                    <div style="margin-top: 50px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 11px; color: #64748b;">
                        <p style="margin: 5px 0; font-weight: bold; color: #1e3a8a;">Mahadsanid - Official Sales Report</p>
                        <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${settings.store_name} Management System</p>
                    </div>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintReceipt = (sale) => {
        const printWindow = window.open('', '_blank');

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
                        .socials { display: flex; justify-content: center; gap: 8px; margin-top: 5px; font-weight: bold; flex-wrap: wrap; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${settings.store_logo ? `<img class="logo" src="${config.storageUrl}/${settings.store_logo}" onerror="this.style.display='none'" />` : ''}
                        <h2 class="store-name">${settings.store_name}</h2>
                        <p class="store-info">${settings.store_address || 'Mogadishu, Somalia'}</p>
                        <p class="store-info">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                        <div class="receipt-title">OFFICIAL RECEIPT</div>
                    </div>

                    <div class="info">
                        <div class="row"><span>INVOICE:</span> <span>${sale.invoice_number || 'N/A'}</span></div>
                        <div class="row"><span>DATE:</span> <span>${new Date(sale.sale_date).toLocaleString()}</span></div>
                        <div class="row"><span>CUSTOMER:</span> <span>${sale.customer?.full_name || 'Macmiilka Guud'}</span></div>
                        <div class="row"><span>CASHIER:</span> <span>${sale.cashier?.full_name || 'System'}</span></div>
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
                            ${(sale.items || []).map(item => `
                                <tr>
                                    <td>${item.product?.name || 'Product'}<br/>$${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                                    <td style="text-align: center;">${item.quantity || 0}</td>
                                    <td style="text-align: right;">$${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-row">
                            <span>SUBTOTAL:</span>
                            <span>$${parseFloat(sale.subtotal || 0).toFixed(2)}</span>
                        </div>
                        ${parseFloat(sale.discount_amount || 0) > 0 ? `
                        <div class="total-row">
                            <span>DISCOUNT:</span>
                            <span>-$${parseFloat(sale.discount_amount).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row grand-total">
                            <span>GRAND TOTAL:</span>
                            <span>$${parseFloat(sale.total_amount || 0).toFixed(2)}</span>
                        </div>
                        <div class="total-row" style="font-size: 11px;">
                            <span>PAID:</span>
                            <span>$${parseFloat(sale.amount_paid || 0).toFixed(2)}</span>
                        </div>
                        ${parseFloat(sale.balance_due || 0) > 0 ? `
                        <div class="total-row" style="font-size: 11px; color: #000;">
                            <span>BALANCE DUE:</span>
                            <span>$${parseFloat(sale.balance_due).toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="footer">
                        <div class="thank-you">MAHADSANID</div>
                        <p style="margin: 0;">Waad ku mahadsantahay iibkaaga, mar walba nasoo booqo.</p>
                        
                        <div class="disclaimer">
                            ALAABTA AAN CILLADDA LAHAYN DIB LOOMA CELIYO.
                        </div>

                        <div class="socials">
                            ${settings.facebook_show ? `<span>FB: ${settings.facebook_handle}</span>` : ''}
                            ${settings.instagram_show ? `<span>IG: ${settings.instagram_handle}</span>` : ''}
                            ${settings.tiktok_show ? `<span>TIKTOK: ${settings.tiktok_handle}</span>` : ''}
                            ${settings.whatsapp_show ? `<span>WA: ${settings.whatsapp_number}</span>` : ''}
                        </div>
                        
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

    const handlePrintA4 = (sale) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Invoice #${sale.invoice_number}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
                        .company-info { display: flex; align-items: center; gap: 20px; }
                        .logo { width: 100px; height: 100px; object-fit: contain; }
                        .company-info h1 { margin: 0; color: #1e3a8a; text-transform: uppercase; font-size: 28px; font-weight: 900; }
                        .company-info p { margin: 2px 0; color: #64748b; font-weight: bold; }
                        
                        .invoice-info { text-align: right; }
                        .invoice-info h2 { margin: 0; color: #1e3a8a; font-size: 32px; font-weight: 900; }
                        
                        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .details-box h3 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #1e3a8a; text-transform: uppercase; font-size: 14px; margin-bottom: 12px; }
                        .details-box p { margin: 4px 0; font-size: 14px; }
                        
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background: #f8fafc; padding: 15px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
                        td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                        
                        .totals { width: 320px; margin-left: auto; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
                        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
                        .grand-total { border-top: 2px solid #1e3a8a; margin-top: 8px; font-weight: 800; font-size: 16px; color: #1e3a8a; padding-top: 12px; }
                        
                        .footer { margin-top: 60px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 30px; }
                        .footer p { margin: 5px 0; color: #64748b; }
                        .socials { display: flex; justify-content: center; gap: 20px; margin-top: 15px; font-size: 12px; font-weight: bold; color: #1e3a8a; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-info">
                            ${settings.store_logo ? `<img class="logo" src="${config.storageUrl}/${settings.store_logo}" onerror="this.style.display='none'" />` : ''}
                            <div>
                                <h1>${settings.store_name}</h1>
                                <p>${settings.store_address || 'Mogadishu, Somalia'}</p>
                                <p>TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                            </div>
                        </div>
                        <div class="invoice-info">
                            <h2>INVOICE</h2>
                            <p><strong>NO:</strong> ${sale.invoice_number}</p>
                            <p><strong>DATE:</strong> ${new Date(sale.sale_date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="details">
                        <div class="details-box">
                            <h3>BILL TO:</h3>
                            <p><strong>Customer:</strong> ${sale.customer?.full_name || 'Macmiilka Guud'}</p>
                            <p><strong>Phone:</strong> ${sale.customer?.phone || '-'}</p>
                            <p><strong>Address:</strong> ${sale.customer?.address || '-'}</p>
                        </div>
                        <div class="details-box">
                            <h3>TRANSACTION:</h3>
                            <p><strong>Cashier:</strong> ${sale.cashier?.full_name || 'System'}</p>
                            <p><strong>Method:</strong> <span style="text-transform: uppercase;">${sale.payment_method?.replace('_', ' ')}</span></p>
                            <p><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${sale.payment_status === 'paid' ? '#10b981' : '#f59e0b'};">${sale.payment_status}</span></p>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>DESCRIPTION</th>
                                <th style="text-align: center;">QTY</th>
                                <th style="text-align: right;">UNIT PRICE</th>
                                <th style="text-align: right;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sale.items || []).map(item => `
                                <tr>
                                    <td style="font-weight: bold;">${item.product?.name || 'Product'}</td>
                                    <td style="text-align: center;">${item.quantity || 0}</td>
                                    <td style="text-align: right;">$${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                                    <td style="text-align: right; font-weight: bold;">$${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="total-row"><span>SUBTOTAL:</span> <span>$${parseFloat(sale.subtotal).toFixed(2)}</span></div>
                        ${parseFloat(sale.discount_amount) > 0 ? `<div class="total-row"><span>DISCOUNT:</span> <span>-$${parseFloat(sale.discount_amount).toFixed(2)}</span></div>` : ''}
                        <div class="total-row grand-total"><span>TOTAL AMOUNT:</span> <span>$${parseFloat(sale.total_amount).toFixed(2)}</span></div>
                        <div class="total-row" style="color: #10b981; font-weight: bold;"><span>AMOUNT PAID:</span> <span>$${parseFloat(sale.amount_paid).toFixed(2)}</span></div>
                        ${parseFloat(sale.balance_due) > 0 ? `<div class="total-row" style="color: #ef4444; font-weight: bold;"><span>BALANCE DUE:</span> <span>$${parseFloat(sale.balance_due).toFixed(2)}</span></div>` : ''}
                    </div>

                    <div class="footer">
                        <p style="font-weight: bold; color: #1e3a8a; font-size: 16px;">Mahadsanid - Waad ku mahadsantahay iibkaaga!</p>
                        <p>Alaabta aan cilladda lahayn dib looma celiyo (Goods not returnable).</p>
                        <div class="socials">
                            ${settings.facebook_show ? `<span>FB: ${settings.facebook_handle}</span>` : ''}
                            ${settings.instagram_show ? `<span>IG: ${settings.instagram_handle}</span>` : ''}
                            ${settings.whatsapp_show ? `<span>WA: ${settings.whatsapp_number}</span>` : ''}
                        </div>
                        <p style="font-size: 10px; margin-top: 20px;">&copy; ${new Date().getFullYear()} ${settings.store_name} Management System</p>
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

    const filteredSales = (sales || []).filter(s => 
        (s.invoice_number || "").toLowerCase().includes(search.toLowerCase()) || 
        (s.customer?.full_name || "").toLowerCase().includes(search.toLowerCase())
    );

    const totals = filteredSales.reduce((acc, sale) => {
        acc.total += parseFloat(sale.total_amount || 0);
        acc.paid += parseFloat(sale.amount_paid || 0);
        acc.due += parseFloat(sale.balance_due || 0);
        return acc;
    }, { total: 0, paid: 0, due: 0 });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Diiwaanka Iibka (Sales History)</h1>
                    <p className="text-slate-400">Eeg iibkii hore oo soo saar riskidhada.</p>
                </div>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Raadi Invoice No ama Macmiil..." 
                            className="w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {canDo('view') && (
                        <button 
                            onClick={handlePrintAll}
                            disabled={filteredSales.length === 0}
                            className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all border border-slate-700"
                        >
                            <Printer size={20} />
                            <span>Print Results (${filteredSales.length})</span>
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Invoice No</th>
                                <th className="px-6 py-4">Macmiilka</th>
                                <th className="px-6 py-4">Taariikhda</th>
                                <th className="px-6 py-4">Guud / Bixiyay / Haray</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td>
                                </tr>
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Ma jiro iib la helay.</td>
                                </tr>
                            ) : filteredSales.map((sale) => (
                                <tr key={sale.sale_id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs text-blue-400 font-bold">{sale.invoice_number}</td>
                                    <td className="px-6 py-4 text-white font-medium">{sale.customer?.full_name || 'Macmiilka Guud'}</td>
                                    <td className="px-6 py-4 text-slate-400 text-sm">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-bold">${parseFloat(sale.total_amount).toFixed(2)}</div>
                                        <div className="flex items-center space-x-2 text-[10px] mb-1">
                                            <span className="text-emerald-400 font-bold">Paid: ${parseFloat(sale.amount_paid || 0).toFixed(2)}</span>
                                            <span className="text-amber-400 font-bold">Due: ${parseFloat(sale.balance_due || 0).toFixed(2)}</span>
                                        </div>
                                        {sale.debt?.payments?.length > 0 && (
                                            <div className="text-[9px] text-slate-500 italic">
                                                Last: {new Date(Math.max(...sale.debt.payments.map(p => new Date(p.payment_date)))).toLocaleDateString()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            sale.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {sale.payment_status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {(canDo('view') || (Number(sale.cashier_id) === Number(user?.user_id))) ? (
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleViewDetails(sale)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 transition-all"
                                                    title="View Details"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handlePrintReceipt(sale)}
                                                    className="p-2 text-slate-400 hover:text-emerald-400 transition-all"
                                                    title="Print Receipt"
                                                >
                                                    <Receipt size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handlePrintA4(sale)}
                                                    className="p-2 text-slate-400 hover:text-blue-500 transition-all"
                                                    title="Print A4"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-600 font-bold uppercase italic">Restricted</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {filteredSales.length > 0 && (
                            <tfoot className="bg-slate-800/80 sticky bottom-0 backdrop-blur-md border-t-2 border-slate-700">
                                <tr className="text-white font-black uppercase text-xs">
                                    <td colSpan="3" className="px-6 py-5 text-right text-slate-400 tracking-widest">
                                        Wadarta Natiijada (Grand Total):
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-black text-blue-400 mb-1">
                                            Guud: ${totals.total.toFixed(2)}
                                        </div>
                                        <div className="flex items-center space-x-3 text-[10px]">
                                            <span className="text-emerald-400">Bixiyay: ${totals.paid.toFixed(2)}</span>
                                            <span className="text-amber-400">Haray: ${totals.due.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td colSpan="2"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Sale Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Faahfaahinta Iibka"
            >
                {selectedSale && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-700">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Invoice Number</p>
                                <p className="text-white font-bold">{selectedSale.invoice_number}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Taariikhda</p>
                                <p className="text-white font-bold">{new Date(selectedSale.sale_date).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Macmiilka</p>
                                <p className="text-white font-bold">{selectedSale.customer?.full_name || 'Macmiilka Guud'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Cashier</p>
                                <p className="text-white font-bold">{selectedSale.cashier?.full_name || 'System'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest px-1">Alaabta la iibiyay</p>
                            <div className="bg-primary/30 rounded-2xl overflow-hidden border border-slate-700">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-2 text-slate-400">Alaabta</th>
                                            <th className="px-4 py-2 text-center text-slate-400">Qty</th>
                                            <th className="px-4 py-2 text-right text-slate-400">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {(selectedSale.items || []).map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-white">{item.product?.name || 'Alaab'}</td>
                                                <td className="px-4 py-3 text-center text-slate-400">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-emerald-400 font-bold">${(item.unit_price * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-600/10 p-4 rounded-2xl border border-emerald-500/20">
                                <span className="text-emerald-400 font-bold text-xs uppercase block mb-1">Total Paid</span>
                                <span className="text-xl font-black text-white">${parseFloat(selectedSale.amount_paid || 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-amber-600/10 p-4 rounded-2xl border border-amber-500/20">
                                <span className="text-amber-400 font-bold text-xs uppercase block mb-1">Balance Due</span>
                                <span className="text-xl font-black text-white">${parseFloat(selectedSale.balance_due || 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {selectedSale.debt?.payments?.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest px-1">Payment History</p>
                                <div className="bg-primary/30 rounded-2xl overflow-hidden border border-slate-700">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-500">
                                            <tr>
                                                <th className="px-4 py-2">Date</th>
                                                <th className="px-4 py-2">Method</th>
                                                <th className="px-4 py-2 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {selectedSale.debt.payments.map((p, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.payment_date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-white font-medium capitalize">{p.payment_method}</td>
                                                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">${parseFloat(p.amount_paid || p.amount || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                            <span className="text-blue-400 font-bold">Wadarta Guud (Total)</span>
                            <span className="text-2xl font-black text-white">${parseFloat(selectedSale.total_amount).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 rounded-xl bg-slate-800 text-slate-400 font-bold hover:text-white transition-all"
                            >
                                xir
                            </button>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => handlePrintReceipt(selectedSale)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all flex items-center space-x-2"
                                >
                                    <Receipt size={18} />
                                    <span>Receipt</span>
                                </button>
                                <button 
                                    onClick={() => handlePrintA4(selectedSale)}
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all flex items-center space-x-2"
                                >
                                    <Printer size={18} />
                                    <span>Printer (A4)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SalesHistoryPage;
