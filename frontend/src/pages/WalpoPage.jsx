import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Search, User, Package, Trash2, Save, X, Edit2, Check, Printer, FileText, Download, DollarSign, Clock, Calendar, ChevronLeft, ArrowLeft, Phone, MapPin, TrendingUp, ShieldCheck, ShoppingCart } from 'lucide-react';
import Modal from '../components/Modal';
import { 
    ComposedChart, 
    Area, 
    Line, 
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

const WalpoPage = () => {
    const { isAdmin, canDo, hasPermission } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const location = useLocation();
    const [analytics, setAnalytics] = useState([]);
    const [settings, setSettings] = useState({
        store_name: "So'Mali Store",
        store_address: "Main Street, Mogadishu",
        store_number: "Somali Government",
        store_logo: null,
    });
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'list' or 'detail'
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [customerDetail, setCustomerDetail] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: '',
        payment_method: 'cash',
        notes: ''
    });
    
    // Form state
    const [walpoForm, setWalpoForm] = useState({
        customer_id: '',
        items: [],
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
    });

    const [currentItem, setCurrentItem] = useState({
        product_id: '',
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
    });



    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            const data = response.data.data || response.data;
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            const data = response.data.data || response.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/analytics/walpo');
            setAnalytics(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching walpo analytics:', error);
        }
    };

    const fetchCustomerHistory = async (customerId) => {
        if (!customerId) return;
        try {
            const response = await api.get(`/walpo/customer/${customerId}`);
            if (response.data) {
                setCustomerDetail(response.data);
                setActiveView('detail');
            } else {
                alert('No data found for this customer.');
            }
        } catch (error) {
            console.error('Error fetching customer history:', error);
            alert('Fadlan isku day markale. Khalad ayaa dhacay: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        if (isAdmin || hasPermission('walpo')) {
            const initializeData = async () => {
                await Promise.all([
                    fetchCustomers(),
                    fetchProducts(),
                    fetchAnalytics(),
                    fetchSettings()
                ]);
            };
            initializeData();
        }
    }, [isAdmin, hasPermission]);

    useEffect(() => {
        const loadCustomerData = async () => {
            if ((isAdmin || hasPermission('walpo')) && location.state?.customerId) {
                await fetchCustomerHistory(location.state.customerId);
            }
        };
        loadCustomerData();
    }, [location.state, isAdmin, hasPermission]);

    if (!isAdmin && !hasPermission('walpo')) {
        return <div className="text-white p-8 text-center bg-secondary/40 rounded-3xl border border-slate-700">Access Restricted</div>;
    }

    const handleOpenAddModal = () => {
        setWalpoForm({
            customer_id: '',
            items: [],
            subtotal: 0,
            discount_amount: 0,
            tax_amount: 0,
            total_amount: 0,
        });
        setIsModalOpen(true);
    };

    const handleProductSelect = (e) => {
        const productId = e.target.value;
        const product = products.find(p => p.product_id == productId);
        if (product) {
            setCurrentItem({
                product_id: productId,
                product_name: product.name,
                quantity: 1,
                unit_price: parseFloat(product.selling_price),
                subtotal: parseFloat(product.selling_price),
            });
        }
    };

    const handleQuantityChange = (qty) => {
        const quantity = parseInt(qty) || 0;
        setCurrentItem({
            ...currentItem,
            quantity,
            subtotal: quantity * currentItem.unit_price,
        });
    };

    const handlePriceChange = (price) => {
        const unit_price = parseFloat(price) || 0;
        setCurrentItem({
            ...currentItem,
            unit_price,
            subtotal: currentItem.quantity * unit_price,
        });
    };

    const addItemToList = () => {
        if (!currentItem.product_id || currentItem.quantity <= 0) {
            alert('Dooro alaabta iyo tirada!');
            return;
        }

        const newItems = [...walpoForm.items, currentItem];
        const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        setWalpoForm({
            ...walpoForm,
            items: newItems,
            subtotal,
            total_amount: subtotal - walpoForm.discount_amount + walpoForm.tax_amount,
        });

        setCurrentItem({
            product_id: '',
            quantity: 1,
            unit_price: 0,
            subtotal: 0,
        });
    };

    const removeItem = (index) => {
        const newItems = walpoForm.items.filter((_, i) => i !== index);
        const subtotal = newItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        setWalpoForm({
            ...walpoForm,
            items: newItems,
            subtotal,
            total_amount: subtotal - walpoForm.discount_amount + walpoForm.tax_amount,
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!walpoForm.customer_id) {
            alert('Dooro macmiilka!');
            return;
        }
        if (walpoForm.items.length === 0) {
            alert('Ku dar ugu yaraan hal alaab!');
            return;
        }

        try {
            await api.post('/walpo', walpoForm);
            setIsModalOpen(false);
            await fetchCustomers();
            await fetchAnalytics();
            if (customerDetail?.customer?.customer_id) {
                await fetchCustomerHistory(customerDetail.customer.customer_id);
            }
        } catch (error) {
            console.error('Error saving walpo:', error.response?.data || error.message);
            alert('Khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta'));
        }
    };

    const handleOpenDeliveryModal = (sale) => {
        setSelectedSale(sale);
        setIsDeliveryModalOpen(true);
    };

    const handleDeliveryUpdate = async (e) => {
        e.preventDefault();
        try {
            const items = selectedSale.items.map(item => ({
                sale_item_id: item.sale_item_id,
                taken_quantity: item.taken_quantity || 0,
            }));

            await api.post(`/walpo/${selectedSale.sale_id}/delivery`, { items });
            setIsDeliveryModalOpen(false);
            await fetchCustomers();
            if (customerDetail?.customer?.customer_id) {
                await fetchCustomerHistory(customerDetail.customer.customer_id);
            }
        } catch (error) {
            console.error('Error updating delivery:', error);
            alert('Khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta'));
        }
    };

    const updateTakenQuantity = (itemIndex, value) => {
        const updatedItems = [...selectedSale.items];
        updatedItems[itemIndex].taken_quantity = parseInt(value) || 0;
        setSelectedSale({ ...selectedSale, items: updatedItems });
    };

    const selectedCustomer = customers.find(c => c.customer_id == walpoForm.customer_id);

    // Filter customers for Walpo view: Only show those with outstanding debt
    const activeCustomers = customers.filter(c => 
        (parseFloat(c.current_balance || 0) > 0) &&
        (c.full_name?.toLowerCase().includes(search.toLowerCase()) || 
         c.phone?.includes(search))
    );

    const handleOpenPaymentModal = (sale) => {
        if (!sale.debt) {
            alert('DEEN lagama hayo Invoice-kan.');
            return;
        }
        setSelectedSale(sale);
        setPaymentForm({
            amount_paid: '',
            payment_method: 'cash',
            notes: ''
        });
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            const debtId = selectedSale.debt?.debt_id;
            if (!debtId) {
                alert('Xogta daynta lama helin.');
                return;
            }

            await api.post('/accounting/debt-payments', {
                debt_id: debtId,
                amount_paid: parseFloat(paymentForm.amount_paid),
                payment_method: paymentForm.payment_method,
                notes: paymentForm.notes
            });

            setIsPaymentModalOpen(false);
            await fetchCustomers(); // Refresh main list
            await fetchAnalytics(); // Refresh analytics
            
            // Crucial: Refresh the current detail view if the user is in it
            if (customerDetail?.customer?.customer_id) {
                await fetchCustomerHistory(customerDetail.customer.customer_id);
            }
            
            alert('Lacag bixinta waa la diiwaangeliyay.');
        } catch (error) {
            console.error('Error processing payment:', error);
            alert('Khalad: ' + (error.response?.data?.message || 'Hubi xogta'));
        }
    };

    const handleExportMainExcel = () => {
        let csvContent = "Customer,Phone,Balance,Total Purchase,Status,Last Purchase\n";
        
        activeCustomers.forEach(c => {
            const row = [
                `"${c.full_name}"`,
                `"${c.phone}"`,
                parseFloat(c.current_balance).toFixed(2),
                parseFloat(c.total_purchases).toFixed(2),
                c.status,
                c.last_purchase_date ? new Date(c.last_purchase_date).toLocaleDateString() : '-'
            ].join(",");
            csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Walpo_Customers_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
        link.click();
    };

    const handlePrintMainView = () => {
        const printWindow = window.open('', '_blank');
        const rowsHtml = activeCustomers.map(c => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.full_name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.phone}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: ${c.current_balance > 0 ? 'red' : 'black'}; font-weight: bold;">$${parseFloat(c.current_balance).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(c.total_purchases).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${c.status}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${c.last_purchase_date ? new Date(c.last_purchase_date).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Walpo Customers Report</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th { background-color: #f8f9fa; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
                        .header { margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
                            ${settings.store_logo ? (
                                `<img src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="height: 80px; max-width: 200px; object-fit: contain; margin-bottom: 10px;" />`
                            ) : null}
                            <div style="width: 80px; height: 80px; background: #1e3a8a; color: white; border-radius: 50%; display: ${settings.store_logo ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; margin: 0 auto 10px auto;">
                                ${settings.store_name?.[0] || 'S'}
                             </div>
                            <h1 style="margin: 0; color: #1e3a8a; text-transform: uppercase; font-size: 28px; font-weight: 900;">${settings.store_name}</h1>
                            <p style="margin: 5px 0; font-size: 12px; font-weight: bold; color: #64748b;">${settings.store_address || 'Mogadishu, Somalia'}</p>
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                            <h2 style="margin: 10px 0; color: #333; font-weight: 900; text-transform: uppercase;">Diiwaanka Daymaha (Debt Ledger)</h2>
                            <p style="margin: 0; font-size: 11px; color: #666;">Taariikhda: ${new Date().toLocaleDateString()} | Printed: ${new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th style="text-align: right;">Balance</th>
                                <th style="text-align: right;">Total Purchase</th>
                                <th style="text-align: center;">Status</th>
                                <th style="text-align: right;">Last Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <script>window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };


    // Filter sales to show only unpaid/debt items (or partial)
    const unpaidSales = customerDetail?.sales?.filter(sale => sale.payment_status !== 'paid' && parseFloat(sale.balance_due) > 0) || [];
    
    // Flatten items for the table view
    const itemizedDebts = unpaidSales.flatMap(sale => 
        sale.items.map(item => ({
            ...item,
            invoice_number: sale.invoice_number,
            sale_date: sale.sale_date,
            sale_id: sale.sale_id
        }))
    );

    const totalDebtAmount = itemizedDebts.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    const handlePrintStatement = () => {
        if (!customerDetail) return;
        
        // Combine sales and payments into a ledger
        const sales = customerDetail.sales || [];
        const payments = sales.flatMap(s => (s.debt?.payments || []).map(p => ({ ...p, invoice_number: s.invoice_number, type: 'payment' }))) || [];
        
        const ledger = [];
        sales.forEach(s => {
            // Add the total sale/invoice
            ledger.push({ ...s, type: 'sale', date: s.sale_date, amount: s.total_amount });
            // Add initial payment if any (Downpayment)
            if (parseFloat(s.amount_paid) > 0) {
                ledger.push({ 
                    ...s, 
                    type: 'payment', 
                    date: s.sale_date, 
                    amount: s.amount_paid,
                    is_downpayment: true 
                });
            }
        });
        
        // Add subsequent debt payments
        payments.forEach(p => {
            ledger.push({ ...p, type: 'payment', date: p.payment_date, amount: p.amount_paid || p.amount });
        });

        ledger.sort((a, b) => {
            const dateA = new Date(a.date || a.payment_date || a.sale_date);
            const dateB = new Date(b.date || b.payment_date || b.sale_date);
            if (dateA - dateB !== 0) return dateA - dateB;
            // If same date, ensure sale comes before payment for that sale
            if (a.type === 'sale' && b.type === 'payment') return -1;
            if (a.type === 'payment' && b.type === 'sale') return 1;
            return 0;
        });

        const printWindow = window.open('', '_blank');
        let runningBalance = 0;

        const rowsHtml = ledger.map(entry => {
            if (entry.type === 'sale') runningBalance += parseFloat(entry.amount);
            else runningBalance -= parseFloat(entry.amount);

            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(entry.date).toLocaleDateString()}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                        <strong>${entry.type === 'sale' ? 'Sale / Invoice' : (entry.is_downpayment ? 'Initial Downpayment' : 'Payment Received')}</strong>
                        <div style="font-size: 10px; color: #666;">
                            ${entry.type === 'sale' ? (entry.items?.map(i => i.product?.name).join(', ') || 'Invoice') : ((entry.payment_method || 'Cash') + (entry.notes ? `: ${entry.notes}` : ''))}
                        </div>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${entry.invoice_number}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: ${entry.type === 'sale' ? 'black' : 'green'};">
                        ${entry.type === 'sale' ? `$${parseFloat(entry.amount).toFixed(2)}` : ''}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: ${entry.type === 'payment' ? 'green' : 'black'};">
                        ${entry.type === 'payment' ? `-$${parseFloat(entry.amount).toFixed(2)}` : ''}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">
                        $${runningBalance.toFixed(2)}
                    </td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Customer Ledger - ${customerDetail.customer.full_name}</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                        th { background-color: #f8f9fa; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div style="text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px;">
                            ${settings.store_logo ? (
                                `<img src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="height: 80px; max-width: 200px; object-fit: contain; margin-bottom: 10px;" />`
                            ) : null}
                            <div style="width: 80px; height: 80px; background: #1e3a8a; color: white; border-radius: 50%; display: ${settings.store_logo ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; margin: 0 auto 10px auto;">
                                ${settings.store_name?.[0] || 'S'}
                             </div>
                            <h1 style="margin: 0; color: #1e3a8a; text-transform: uppercase; font-size: 28px; font-weight: 900;">${settings.store_name}</h1>
                            <p style="margin: 5px 0; font-size: 12px; font-weight: bold; color: #64748b;">${settings.store_address || 'Mogadishu, Somalia'}</p>
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                            <p style="margin-top: 10px; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 2px; font-size: 14px;">Customer Ledger Statement</p>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                            <div style="text-align: left;">
                                <strong>Customer:</strong> ${customerDetail.customer.full_name}<br/>
                                <strong>Phone:</strong> ${customerDetail.customer.phone}
                            </div>
                            <div style="text-align: right;">
                                <strong>Date:</strong> ${new Date().toLocaleString()}<br/>
                                <strong>Final Balance:</strong> $${parseFloat(customerDetail.customer.current_balance).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th style="text-align: center;">Invoice #</th>
                                <th style="text-align: right;">Debit (Iibka)</th>
                                <th style="text-align: right;">Credit (Bixin)</th>
                                <th style="text-align: right;">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>Thank you for your business. Please contact us if you have any questions about this statement.</p>
                        <div style="display: flex; justify-content: center; gap: 20px; margin: 10px 0;">
                            ${settings.facebook_show ? `<span>FB: ${settings.facebook_handle}</span>` : ''}
                            ${settings.whatsapp_show ? `<span>WA: ${settings.whatsapp_number}</span>` : ''}
                        </div>
                        <p>&copy; ${new Date().getFullYear()} ${settings.store_name} POS System</p>
                    </div>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleExportExcel = () => {
        if (!customerDetail) return;
        
        let csvContent = "Item Name,Qty,Price,Total Amount,Date,Time,Invoice Number\n";
        
        itemizedDebts.forEach(item => {
            const date = new Date(item.sale_date);
            const row = [
                `"${item.product?.name || item.product?.product_name || 'Product'}"`,
                item.quantity,
                parseFloat(item.unit_price).toFixed(2),
                parseFloat(item.subtotal).toFixed(2),
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                item.invoice_number
            ].join(",");
            csvContent += row + "\n";
        });
        
        // Add Grand Total row
        csvContent += `,,,"Grand Total: $${totalDebtAmount.toFixed(2)}",,,\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Debt_Statement_${customerDetail.customer.full_name.replace(/\s+/g, '_')}.csv`;
        link.click();
    };



    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Walpo (DEEN)</h1>
                    <p className="text-slate-400">Maaraynta iibka DEEN ah ee macaamiisha.</p>
                </div>
                {canDo('record') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span>Walpo Cusub</span>
                    </button>
                )}
            </div>

            {activeView === 'list' ? (
                <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <ChartCard 
                        title="Credit vs Recovery" 
                        subtitle="Last 30 days performance" 
                        icon={TrendingUp}
                    >
                        <ComposedChart data={analytics || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Area type="monotone" name="Credit Issued" dataKey="issued" fill="#f43f5e" fillOpacity={0.1} stroke="#f43f5e" strokeWidth={2} />
                            <Line type="monotone" name="Debt Recovered" dataKey="recovered" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                        </ComposedChart>
                    </ChartCard>

                    <ChartCard 
                        title="Recovery Efficiency" 
                        subtitle="Total recovered vs Issued" 
                        icon={ShieldCheck}
                    >
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Recovered', value: (Array.isArray(analytics) ? analytics : []).reduce((acc, curr) => acc + (curr.recovered || 0), 0) || 0 },
                                    { name: 'Pending Balance', value: Math.max(0, ((Array.isArray(analytics) ? analytics : []).reduce((acc, curr) => acc + (curr.issued || 0), 0) || 0) - ((Array.isArray(analytics) ? analytics : []).reduce((acc, curr) => acc + (curr.recovered || 0), 0) || 0)) }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell fill="#10b981" />
                                <Cell fill="#334155" />
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ChartCard>
                </div>
                <div className="bg-secondary/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <Search className="text-slate-500" size={20} />
                        <input 
                            type="text"
                            placeholder="Raadi macmiil ama invoice..."
                            className="flex-1 bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="flex space-x-2">
                             <button 
                                onClick={handlePrintMainView}
                                className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-xl transition-colors"
                                title="Print Report"
                            >
                                <Printer size={20} />
                            </button>
                            <button 
                                onClick={handleExportMainExcel}
                                className="bg-green-700 hover:bg-green-600 text-white p-2 rounded-xl transition-colors"
                                title="Export Excel"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Macmiil</th>
                                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Taleefan</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Balance (Deyn)</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase">Date (Taariikh)</th>
                                    <th className="text-center py-3 px-4 text-xs font-bold text-slate-400 uppercase">Actions (Actions)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeCustomers.map((customer) => (
                                    <tr key={customer.customer_id} className="border-b border-slate-700/50 hover:bg-primary/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => fetchCustomerHistory(customer.customer_id)}
                                                className="text-blue-400 hover:text-blue-300 hover:underline font-extrabold transition-colors text-left flex items-center group/name"
                                                title="View Detail History"
                                            >
                                                <User size={14} className="mr-1.5 opacity-50 group-hover/name:opacity-100 transition-opacity" />
                                                {customer.full_name}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-slate-400 text-sm">{customer.phone}</td>
                                        <td className="px-4 py-4 text-right">
                                            <span className={`font-bold ${parseFloat(customer.current_balance) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                ${parseFloat(customer.current_balance || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${customer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                    {customer.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right text-xs text-slate-400">
                                                {customer.last_payment_date ? new Date(customer.last_payment_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => fetchCustomerHistory(customer.customer_id)}
                                                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all font-medium text-xs"
                                                title="View History & Pay"
                                            >
                                                <FileText size={16} />
                                                <span>Actions</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {activeCustomers.length > 0 && (
                                <tfoot className="bg-slate-800/80 backdrop-blur-md sticky bottom-0 border-t-2 border-slate-700 z-10">
                                    <tr>
                                        <td colSpan="2" className="px-6 py-5 text-right text-slate-400 text-xs font-black uppercase tracking-widest">
                                            Wadarta Deynka Macmiisha:
                                        </td>
                                        <td className="px-6 py-5 text-right text-orange-400 text-sm font-black whitespace-nowrap">
                                            ${activeCustomers.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td colSpan="3"></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
                </>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Detail View UI */}
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setActiveView('list')}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700"
                        >
                            <ArrowLeft size={18} />
                            <span>Gall Back (Back to List)</span>
                        </button>
                        <div className="flex items-center space-x-4">
                             <button 
                                onClick={handlePrintStatement}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/10 text-blue-400 rounded-xl font-bold border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                            >
                                <Printer size={18} />
                                <span>Statement (PDF)</span>
                            </button>
                             <button 
                                onClick={handleExportExcel}
                                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600/10 text-emerald-400 rounded-xl font-bold border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all shadow-lg"
                            >
                                <Download size={18} />
                                <span>Excel (CSV)</span>
                            </button>
                        </div>
                    </div>

                    {/* Customer Header */}
                    <div className="bg-linear-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                            <div className="flex items-center space-x-6">
                                <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/40">
                                    {customerDetail?.customer?.full_name?.[0]}
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white mb-2">{customerDetail?.customer?.full_name}</h2>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        <div className="flex items-center text-slate-400"><User size={16} className="mr-2 text-blue-400" /> Macmiil ID: {customerDetail?.customer?.customer_id}</div>
                                        <div className="flex items-center text-slate-300 font-bold"><FileText size={16} className="mr-2 text-blue-400" /> {customerDetail?.customer?.phone}</div>
                                        {customerDetail?.customer?.address && (
                                            <div className="flex items-center text-slate-400"><MapPin size={16} className="mr-2 text-blue-400" /> {customerDetail?.customer?.address}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1">Deynka Hada (Balance Due)</p>
                                <div className="flex items-center justify-end space-x-4">
                                    <p className="text-6xl font-black text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.4)]">
                                        ${parseFloat(customerDetail?.customer?.current_balance || 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Debt Taken</p>
                            <h3 className="text-3xl font-black text-white">${parseFloat(customerDetail?.summary?.total_amount || 0).toFixed(2)}</h3>
                        </div>
                        <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Paid Back</p>
                            <h3 className="text-3xl font-black text-emerald-400">${parseFloat(customerDetail?.summary?.total_paid || 0).toFixed(2)}</h3>
                        </div>
                        <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Items</p>
                            <h3 className="text-3xl font-black text-blue-400">{customerDetail?.summary?.total_items_ordered}</h3>
                        </div>
                        <div className="bg-secondary/40 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Total Invoices</p>
                            <h3 className="text-3xl font-black text-purple-400">{customerDetail?.summary?.total_sales}</h3>
                        </div>
                    </div>

                     {/* Itemized Detail Page Table */}
                    <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/30">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <ShoppingCart size={24} className="text-blue-500" />
                                Itemized List (Diiwaanka Alaabta Deynka)
                            </h3>
                        </div>
                        <div className="overflow-x-auto min-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-black sticky top-0 z-10 backdrop-blur-md">
                                        <th className="px-6 py-5">Item Name</th>
                                        <th className="px-6 py-5 text-right">Qty</th>
                                        <th className="px-6 py-5 text-right">Price</th>
                                        <th className="px-6 py-5 text-right">Total Guud</th>
                                        <th className="px-6 py-5 text-right">Date & Time</th>
                                        <th className="px-6 py-5 text-center">Invoice Number</th>
                                        <th className="px-6 py-5 text-center">Actions</th>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {itemizedDebts.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-slate-500 italic">No unpaid items found.</td>
                                        </tr>
                                    ) : (
                                        itemizedDebts.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="text-white font-bold">{item.product?.name || item.product?.product_name || 'Product'}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">ID: {item.product_id}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-slate-300 font-bold">{item.quantity}</span>
                                                    <span className="text-[10px] text-slate-500 ml-1 italic">{item.product?.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-400 font-mono text-sm">${parseFloat(item.unit_price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-orange-400 font-black">${parseFloat(item.subtotal).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-white text-xs font-bold">{new Date(item.sale_date).toLocaleDateString()}</div>
                                                    <div className="text-[10px] text-slate-500">{new Date(item.sale_date).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-xs text-blue-400 font-bold">#{item.invoice_number}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => handleOpenPaymentModal(unpaidSales.find(s => s.sale_id === item.sale_id))}
                                                        className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all uppercase"
                                                    >
                                                        Pay Item
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {itemizedDebts.length > 0 && (
                                    <tfoot className="bg-slate-800/80 backdrop-blur-md sticky bottom-0 border-t-2 border-slate-700 z-10">
                                        <tr>
                                            <td colSpan="3" className="px-6 py-5 text-right text-slate-400 text-xs font-black uppercase tracking-widest">
                                                Wadarta Alaabta (Itemized Total):
                                            </td>
                                            <td className="px-6 py-5 text-right text-orange-400 text-sm font-black whitespace-nowrap">
                                                ${totalDebtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td colSpan="3"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                         {/* Debts Summary List */}
                         <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-700 bg-slate-800/30 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white flex items-center gap-3">
                                    <DollarSign size={20} className="text-orange-400" />
                                    Active Credit Invoices
                                </h3>
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-700">
                                        {customerDetail?.sales?.filter(s => parseFloat(s.balance_due) > 0).map((sale) => (
                                            <tr key={sale.sale_id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-xs text-slate-500 mb-1">{new Date(sale.sale_date).toLocaleDateString()}</div>
                                                    <div className="text-white font-bold">{sale.invoice_number}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total</div>
                                                    <div className="text-slate-300 font-bold">${parseFloat(sale.total_amount).toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="text-[10px] text-orange-400 uppercase tracking-widest font-black">Remaining</div>
                                                    <div className="text-orange-400 font-black text-xl">${parseFloat(sale.balance_due).toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => handleOpenDeliveryModal(sale)}
                                                        className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                                                        title="Track Delivery"
                                                    >
                                                        <Package size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenPaymentModal(sale)}
                                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                                    >
                                                        PAY DEBT
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>

                         {/* Payments Timeline */}
                         <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-700 bg-slate-800/30">
                                <h3 className="text-lg font-black text-white flex items-center gap-3">
                                    <Check size={20} className="text-emerald-500" />
                                    Payments Received
                                </h3>
                            </div>
                            <div className="overflow-x-auto min-h-[300px]">
                                <table className="w-full text-left text-sm">
                                    <tbody className="divide-y divide-slate-700">
                                         {(() => {
                                             const payments = customerDetail?.sales?.flatMap(s => 
                                                (s.debt?.payments || []).map(p => ({ ...p, invoice_number: s.invoice_number }))
                                             ) || [];
                                             if (payments.length === 0) return <tr><td className="px-6 py-12 text-center text-slate-600 italic">No payments found.</td></tr>;
                                             return payments.sort((a,b) => new Date(b.payment_date) - new Date(a.payment_date)).slice(0, 15).map((p, idx) => (
                                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-emerald-400 font-bold mb-1">{p.invoice_number}</div>
                                                        <div className="text-[10px] text-slate-500">{new Date(p.payment_date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase border border-emerald-500/20 mb-1 inline-block">
                                                            {p.payment_method}
                                                        </span>
                                                        <div className="text-slate-400 text-[10px] italic">
                                                            {p.notes || "Standard Payment"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-emerald-400 font-black text-2xl">+${parseFloat(p.amount || p.amount_paid || 0).toFixed(2)}</div>
                                                    </td>
                                                </tr>
                                             ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {/* Add Walpo Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Walpo Cusub">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Dooro Macmiilka</label>
                        <select
                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={walpoForm.customer_id}
                            onChange={(e) => setWalpoForm({...walpoForm, customer_id: e.target.value})}
                            required
                        >
                            <option value="">-- Dooro Macmiil --</option>
                            {customers.filter(c => c.status === 'active').map(c => (
                                <option key={c.customer_id} value={c.customer_id}>
                                    {c.full_name} - {c.phone}
                                </option>
                            ))}
                        </select>
                        {selectedCustomer && (
                            <div className="bg-linear-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-500/50 rounded-xl p-4 mt-3">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-500 rounded-full p-2">
                                        <User size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-lg">{selectedCustomer.full_name}</p>
                                        <p className="text-blue-300 text-sm">{selectedCustomer.phone}</p>
                                        {selectedCustomer.address && (
                                            <p className="text-slate-400 text-xs mt-1">{selectedCustomer.address}</p>
                                        )}
                                    </div>
                                    {selectedCustomer.current_balance > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Deyn Hadda</p>
                                            <p className="text-orange-400 font-bold">${parseFloat(selectedCustomer.current_balance).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-4 border-t border-slate-700 pt-4">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Ku dar Alaabta</label>
                        
                        {/* Current Product Display */}
                        {currentItem.product_id && (
                            <div className="bg-linear-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 rounded-xl p-4 mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-emerald-500 rounded-full p-2">
                                        <Package size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold text-lg">{currentItem.product_name}</p>
                                        <p className="text-emerald-300 text-sm">Qiimaha: ${currentItem.unit_price.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Wadarta</p>
                                        <p className="text-emerald-400 font-bold text-xl">${currentItem.subtotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-6">
                                <select
                                    className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={currentItem.product_id}
                                    onChange={handleProductSelect}
                                >
                                    <option value="">-- Dooro Alaab --</option>
                                    {products.map(p => (
                                        <option key={p.product_id} value={p.product_id}>
                                            {p.name} (Stock: {p.current_stock})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <input 
                                    type="number"
                                    placeholder="Tirada"
                                    className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={currentItem.quantity}
                                    onChange={(e) => handleQuantityChange(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div className="col-span-2">
                                <input 
                                    type="number"
                                    placeholder="Qiimaha"
                                    step="0.01"
                                    min="0"
                                    className="w-full bg-primary/50 border border-blue-500/40 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={currentItem.unit_price}
                                    onChange={(e) => handlePriceChange(e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <button
                                    type="button"
                                    onClick={addItemToList}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-3 font-bold transition-all"
                                >
                                    <Plus size={20} className="mx-auto" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    {walpoForm.items.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Alaabta la Doortay</label>
                            <div className="bg-primary/30 rounded-xl p-4 space-y-2">
                                {walpoForm.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.product_name}</p>
                                            <p className="text-slate-400 text-xs">{item.quantity} x ${item.unit_price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-emerald-400 font-bold">${item.subtotal.toFixed(2)}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Discount Input */}
                    <div className="bg-secondary/30 border border-slate-700 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <DollarSign size={16} className="text-emerald-400" />
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Discount (Qiimo dhimis):</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-primary/50 border border-slate-700 px-3 py-1.5 rounded-lg">
                                <input
                                    type="number"
                                    value={walpoForm.discount_amount || ''}
                                    onChange={(e) => {
                                        const discount = Math.max(0, parseFloat(e.target.value) || 0);
                                        setWalpoForm({
                                            ...walpoForm,
                                            discount_amount: discount,
                                            total_amount: walpoForm.subtotal - discount + walpoForm.tax_amount
                                        });
                                    }}
                                    className="w-20 bg-transparent text-sm font-bold text-emerald-400 outline-none text-right"
                                    placeholder="0.00"
                                />
                                <span className="text-xs font-bold text-slate-500">$</span>
                            </div>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold">Wadarta Guud:</span>
                            <span className="text-2xl font-bold text-emerald-400">${walpoForm.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                        >
                            <X size={18} className="inline mr-2" />
                            Jooji
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
                        >
                            <Save size={18} className="inline mr-2" />
                            Kaydi
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delivery Tracking Modal */}
            <Modal isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)} title="Delivery Tracking">
                {selectedSale && (
                    <form onSubmit={handleDeliveryUpdate} className="space-y-6">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-blue-400 font-bold">{selectedSale.customer?.full_name}</p>
                            <p className="text-slate-400 text-sm">{selectedSale.invoice_number}</p>
                        </div>

                        <div className="space-y-3">
                            {selectedSale.items?.map((item, index) => (
                                <div key={index} className="bg-secondary/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-white font-medium">{item.product?.name || item.product?.product_name || 'Product'}</p>
                                        <span className="text-slate-400 text-sm">Wadarta: {item.quantity}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <label className="text-xs text-slate-500">Tirada la Qaatay:</label>
                                        <input 
                                            type="number"
                                            className="flex-1 bg-primary/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            value={item.taken_quantity || 0}
                                            onChange={(e) => updateTakenQuantity(index, e.target.value)}
                                            min="0"
                                            max={item.quantity}
                                        />
                                        {item.taken_quantity >= item.quantity && (
                                            <Check size={18} className="text-emerald-400" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsDeliveryModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                            >
                                Jooji
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
                            >
                                Kaydi Delivery
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Diiwaangeli Lacag Bixin">
                {selectedSale && (
                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 text-sm">Macmiilka:</span>
                                <span className="text-white font-bold">{selectedSale.customer?.full_name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 text-sm">Invoice No:</span>
                                <span className="text-white font-mono">{selectedSale.invoice_number}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-emerald-500/30 pt-2 mt-2">
                                <span className="text-slate-400 font-bold">Haraaga:</span>
                                <span className="text-xl font-bold text-orange-400">
                                    ${parseFloat(selectedSale.balance_due || selectedSale.debt?.remaining_amount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1 block">Lacagta la bixiyay</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400">$</span>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        placeholder="0.00"
                                        value={paymentForm.amount_paid}
                                        onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})}
                                        required
                                        max={parseFloat(selectedSale.balance_due || selectedSale.debt?.remaining_amount || 0)}
                                    />
                                </div>
                                {paymentForm.amount_paid > 0 && (
                                    <div className="mt-2 flex justify-between items-center bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                                        <span className="text-xs text-slate-400 font-bold uppercase">Haraaga Cusub (New Balance):</span>
                                        <span className={`font-mono font-bold ${
                                            (parseFloat(selectedSale.balance_due || selectedSale.debt?.remaining_amount || 0) - parseFloat(paymentForm.amount_paid || 0)) < 0 
                                            ? 'text-rose-400' 
                                            : 'text-emerald-400'
                                        }`}>
                                            ${Math.max(0, (parseFloat(selectedSale.balance_due || selectedSale.debt?.remaining_amount || 0) - parseFloat(paymentForm.amount_paid || 0))).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1 block">Habka Bixinta</label>
                                <select 
                                    className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    value={paymentForm.payment_method}
                                    onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})}
                                >
                                    <option value="cash">Cash (Lacag Cadaan)</option>
                                    <option value="evc_plus">EVC Plus</option>
                                    <option value="bank">Bank (Xawaalad)</option>
                                    <option value="gold">eDahab</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1 block">Notes / Ref #</label>
                                <textarea 
                                    className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-24"
                                    placeholder="Enter notes..."
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                            >
                                Jooji
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all"
                            >
                                Bixi Lacagta
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default WalpoPage;
