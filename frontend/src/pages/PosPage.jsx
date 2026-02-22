import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContextDef';
import { 
    Search, 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    CreditCard, 
    Banknote, 
    Smartphone, 
    User,
    CheckCircle2,
    Loader2,
    Printer,
    Package
} from 'lucide-react';

const PosPage = () => {
    const { isAdmin, canDo } = useContext(AuthContext);
    const { settings } = useSettings();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.active_price || item.selling_price) * item.quantity), 0);
    const total = subtotal - discount;

    useEffect(() => {
        setAmountPaid(total);
    }, [total]);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            setProducts(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.product_id === product.product_id);
        if (existing) {
            setCart(cart.map(item => 
                item.product_id === product.product_id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Cart-gu waa maran yahay.');
            return;
        }

        if (paymentMethod === 'credit' && !selectedCustomer) {
            alert('Fadlan dooro macmiil haddii aad dayn ku bixinayso.');
            return;
        }

        setProcessing(true);
        try {
            const saleData = {
                customer_id: selectedCustomer,
                subtotal: subtotal,
                discount_amount: discount,
                tax_amount: 0,
                total_amount: total,
                amount_paid: parseFloat(amountPaid) || 0,
                payment_method: paymentMethod === 'evc' ? 'evc_plus' : paymentMethod, 
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.active_price || item.selling_price,
                    subtotal: (item.active_price || item.selling_price) * item.quantity
                }))
            };

            const response = await api.post('/sales', saleData);
            const invoiceNumber = response.data.invoice_number;
            
            setOrderSuccess(true);
            
            // Ask to print
            if (window.confirm('Ma rabtaa inaad daabacdo riskidhka?')) {
                handlePrintReceipt(saleData, invoiceNumber);
            }
            setCart([]);
            setSelectedCustomer(null);
            setDiscount(0);
            fetchProducts(); // Refresh stock
            setTimeout(() => setOrderSuccess(false), 3000);
        } catch (error) {
            console.error('Checkout failed:', error.response?.data || error.message);
            alert('Waan ka xunnahay, iibka ma guulaysan: ' + (error.response?.data?.message || 'Khalad ayaa dhacay'));
        } finally {
            setProcessing(false);
        }
    };

    const handlePrintReceipt = (saleData, invoiceNumber) => {
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
                        ${settings.store_logo ? `<img class="logo" src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'" />` : ''}
                        <h2 class="store-name">${settings.store_name}</h2>
                        <p class="store-info">${settings.store_address || 'Mogadishu, Somalia'}</p>
                        <p class="store-info">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                        <div class="receipt-title">OFFICIAL RECEIPT</div>
                    </div>

                    <div class="info">
                        <div class="row"><span>INVOICE:</span> <span>${invoiceNumber || 'NEW'}</span></div>
                        <div class="row"><span>DATE:</span> <span>${new Date().toLocaleString()}</span></div>
                        <div class="row"><span>CUSTOMER:</span> <span>${selectedCustomer ? customers.find(c => c.customer_id == selectedCustomer)?.full_name : 'Macmiilka Guud'}</span></div>
                        <div class="row"><span>CASHIER:</span> <span>${localStorage.getItem('username') || 'System'}</span></div>
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
                            ${cart.map(item => `
                                <tr>
                                    <td>
                                        ${item.name}<br/>
                                        <span style="font-size: 9px;">
                                            $${parseFloat(item.active_price || item.selling_price).toFixed(2)}
                                            ${item.is_on_discount ? ` (Was $${parseFloat(item.selling_price).toFixed(2)})` : ''}
                                        </span>
                                    </td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td style="text-align: right;">$${((item.active_price || item.selling_price) * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-row">
                            <span>SUBTOTAL:</span>
                            <span>$${subtotal.toFixed(2)}</span>
                        </div>
                        ${discount > 0 ? `
                        <div class="total-row">
                            <span>DISCOUNT:</span>
                            <span>-$${parseFloat(discount).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="total-row grand-total">
                            <span>GRAND TOTAL:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                        <div class="total-row" style="font-size: 11px;">
                            <span>PAID:</span>
                            <span>$${parseFloat(amountPaid).toFixed(2)}</span>
                        </div>
                        ${(total - amountPaid) > 0 ? `
                        <div class="total-row" style="font-size: 11px; color: #000;">
                            <span>BALANCE DUE:</span>
                            <span>$${(total - amountPaid).toFixed(2)}</span>
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
                            // window.close();  // Temporarily commented for easier verification
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredProducts = products.filter(p => 
        p.is_active && (
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.product_code.toLowerCase().includes(search.toLowerCase())
        )
    );

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Products Section */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Raadi alaab magaceeda ama koodkeeda..."
                            className="w-full pl-12 pr-4 py-3 bg-secondary/40 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium backdrop-blur-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isAdmin && (
                        <button 
                            className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all whitespace-nowrap"
                            onClick={() => alert('Void Sale logic implemented for Admin only.')}
                        >
                            VOID SALE
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.product_id}
                                    onClick={() => addToCart(product)}
                                    className="bg-secondary/40 border border-slate-700 rounded-2xl text-left hover:border-blue-500/50 hover:bg-slate-800/40 transition-all group relative overflow-hidden active:scale-95 flex flex-col"
                                >
                                    <div className="h-32 w-full bg-slate-800 border-b border-slate-700 overflow-hidden relative">
                                        {product.image_path ? (
                                            <img 
                                                src={`http://localhost:8000/storage/${product.image_path}`} 
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <Package className="opacity-20" size={40} />
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 p-2 bg-blue-600 text-white rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus size={16} />
                                        </div>
                                        {product.is_on_discount && (
                                            <div className="absolute top-2 left-2 px-2 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg shadow-lg">
                                                -{Math.round(((product.selling_price - product.active_price) / product.selling_price) * 100)}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-white mb-1 line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-slate-500 mb-3 font-mono">{product.product_code}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-emerald-400">
                                                    ${product.active_price}
                                                </span>
                                                {product.is_on_discount && (
                                                    <span className="text-[10px] text-slate-500 line-through">
                                                        ${product.selling_price}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${product.current_stock > 5 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                STK: {product.current_stock}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Section */}
            <div className="w-full lg:w-96 flex flex-col bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-4 border-b border-slate-700">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select 
                            className="w-full pl-10 pr-4 py-2 bg-primary/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            value={selectedCustomer || ''}
                            onChange={(e) => setSelectedCustomer(e.target.value || null)}
                        >
                            <option value="">Macmiilka Guud (Walk-in)</option>
                            {customers.map(c => (
                                <option key={c.customer_id} value={c.customer_id}>{c.full_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-4">
                            <ShoppingCart size={48} />
                            <p className="text-sm font-medium">Cart-gu waa maran yahay</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product_id} className="bg-primary/40 border border-slate-700 p-3 rounded-xl flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                                    {item.image_path ? (
                                        <img 
                                            src={`http://localhost:8000/storage/${item.image_path}`} 
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Package size={16} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-bold text-white line-clamp-1 flex-1">{item.name}</h4>
                                        <button onClick={() => removeFromCart(item.product_id)} className="text-slate-500 hover:text-rose-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-1">
                                            <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:text-white text-slate-400">
                                                <Minus size={14} />
                                            </button>
                                            <span className="text-white text-sm font-bold min-w-[20px] text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:text-white text-slate-400">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-white text-sm block">
                                                ${((item.active_price || item.selling_price) * item.quantity).toFixed(2)}
                                            </span>
                                            {item.is_on_discount && (
                                                <span className="text-[10px] text-slate-500 line-through">
                                                    ${(item.selling_price * item.quantity).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-slate-800/40 border-t border-slate-700 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Qaabka Lacag Bixinta</p>
                            <div className="flex items-center space-x-2 bg-primary/30 border border-slate-700 px-3 py-1.5 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Discount:</span>
                                <input 
                                    type="number" 
                                    value={discount || ''} 
                                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-16 bg-transparent text-sm font-bold text-emerald-400 outline-none p-0 text-right"
                                    placeholder="0.00"
                                />
                                <span className="text-[10px] font-bold text-slate-500">$</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'cash', icon: Banknote, label: 'Cash' },
                                { id: 'evc', icon: Smartphone, label: 'EVC' },
                                { id: 'bank', icon: CreditCard, label: 'Bank' },
                                { id: 'gold', icon: Package, label: 'eDahab' },
                                { id: 'credit', icon: User, label: 'Credit' },
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                        paymentMethod === method.id 
                                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                                        : 'bg-primary/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                                    }`}
                                >
                                    <method.icon size={18} />
                                    <span className="text-[10px] font-bold mt-1 uppercase">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Lacagta la bixiyay (Paid)</span>
                            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Paid:</span>
                                <input 
                                    type="number" 
                                    value={amountPaid || ''} 
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    className="w-20 bg-transparent text-sm font-bold text-white outline-none p-0 text-right"
                                    placeholder="0.00"
                                />
                                <span className="text-[10px] font-bold text-slate-500">$</span>
                            </div>
                        </div>
                        {parseFloat(amountPaid) < total && (
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-bold uppercase">Haraaga (Debt):</span>
                                <span className="text-rose-400 font-bold">${(total - (parseFloat(amountPaid) || 0)).toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-slate-400 font-medium">Wadarta Guud</span>
                        <span className="text-3xl font-black text-white">${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing || !canDo('record')}
                        className={`w-full py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-xl ${
                            orderSuccess 
                            ? 'bg-emerald-500 text-white' 
                            : (cart.length === 0 || processing || !canDo('record'))
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                        }`}
                    >
                        {processing ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : orderSuccess ? (
                            <>
                                <CheckCircle2 size={24} />
                                <span>Iibka waa Guul!</span>
                            </>
                        ) : (
                            <>
                                <span>{canDo('record') ? 'GUBI DALABKA' : 'MA LAHA AWOOD'}</span>
                                <CheckCircle2 size={24} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosPage;
