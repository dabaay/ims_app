import React, { useState, useEffect, useCallback, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContextDef';
import { 
    Truck, 
    Plus, 
    Search, 
    Calendar, 
    DollarSign, 
    Package, 
    Trash2, 
    Save, 
    X, 
    History,
    ChevronRight,
    ChevronDown,
    ArrowRight,
    MapPin,
    AlertCircle,
    Printer,
    FileText as FileIcon,
    ExternalLink,
    Edit
} from 'lucide-react';
import Modal from '../components/Modal';

const PurchasesPage = () => {
    const { isAdmin, canDo, hasPermission } = useContext(AuthContext);
    const { settings } = useSettings();
    const [purchases, setPurchases] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [purchaseForm, setPurchaseForm] = useState({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        transport_method: 'Bajaj',
        transport_cost: 0,
        status: 'received',
        notes: '',
        document: null,
        items: []
    });

    const fetchPurchases = useCallback(async () => {
        try {
            const response = await api.get('/purchases');
            setPurchases(response.data || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        }
    }, []);

    const fetchDropdowns = useCallback(async () => {
        try {
            const [prodRes, suppRes] = await Promise.all([
                api.get('/products'),
                api.get('/suppliers')
            ]);
            setProducts(prodRes.data.data || prodRes.data || []);
            setSuppliers(suppRes.data.data || suppRes.data || []);
        } catch (error) {
            console.error('Error fetching dropdowns:', error);
        }
    }, []);

    useEffect(() => {
        if (isAdmin || hasPermission('purchases')) {
            const init = async () => {
                setLoading(true);
                await Promise.all([fetchPurchases(), fetchDropdowns()]);
                setLoading(false);
            };
            init();
        }
    }, [isAdmin, hasPermission, fetchPurchases, fetchDropdowns]);

    if (!isAdmin && !hasPermission('purchases')) {
        return <div className="text-white p-8 text-center bg-secondary/40 rounded-3xl border border-slate-700">Access Restricted</div>;
    }

    const handleAddItem = () => {
        setPurchaseForm({
            ...purchaseForm,
            items: [...purchaseForm.items, { product_id: '', product_name: '', quantity: 1, unit: 'piece', unit_price: 0 }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = [...purchaseForm.items];
        newItems.splice(index, 1);
        setPurchaseForm({ ...purchaseForm, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...purchaseForm.items];
        newItems[index][field] = value;
        
        // If product name is entered/selected
        if (field === 'product_name') {
            // Check if it matches an existing product
            const prod = products.find(p => p.name === value);
            if (prod) {
                newItems[index].product_id = prod.product_id;
                newItems[index].unit_price = parseFloat(prod.cost_price) || 0;
                newItems[index].unit = prod.unit || 'piece';
            } else {
                newItems[index].product_id = '';
            }
        }
        
        setPurchaseForm({ ...purchaseForm, items: newItems });
    };

    const calculateSubtotal = () => {
        return purchaseForm.items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity) || 0), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + parseFloat(purchaseForm.transport_cost || 0);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (purchaseForm.items.length === 0) {
            alert('Fadlan ku dar ugu yaraan hal sheey.');
            return;
        }

        if (!purchaseForm.document) {
            alert('Fadlan ku dar sanad (Document/Receipt) ka hor inta aadan kaydin.');
            return;
        }

        setFormLoading(true);
        try {
            const formData = new FormData();
            formData.append('supplier_id', purchaseForm.supplier_id);
            formData.append('purchase_date', purchaseForm.purchase_date);
            formData.append('transport_method', purchaseForm.transport_method);
            formData.append('transport_cost', purchaseForm.transport_cost);
            formData.append('status', purchaseForm.status);
            formData.append('notes', purchaseForm.notes || '');
            formData.append('items', JSON.stringify(purchaseForm.items));
            
            if (purchaseForm.document instanceof File) {
                formData.append('document', purchaseForm.document);
            }

            if (isEditing) {
                formData.append('_method', 'PUT');
                await api.post(`/purchases/${editId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/purchases', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setIsModalOpen(false);
            fetchPurchases();
            resetForm();
        } catch (error) {
            alert('Khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta'));
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setPurchaseForm({
            supplier_id: '',
            purchase_date: new Date().toISOString().split('T')[0],
            transport_method: 'Bajaj',
            transport_cost: 0,
            status: 'received',
            notes: '',
            document: null,
            items: []
        });
        setIsEditing(false);
        setEditId(null);
    };

    const handleEdit = (purchase) => {
        setPurchaseForm({
            supplier_id: purchase.supplier_id || '',
            purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : '',
            transport_method: purchase.transport_method || 'Bajaj',
            transport_cost: purchase.transport_cost || 0,
            status: purchase.status || 'received',
            notes: purchase.notes || '',
            document: null, // Don't pre-fill file input
            items: purchase.items ? purchase.items.map(item => ({
                product_id: item.product_id || '',
                product_name: item.product_name || item.product?.name || '',
                quantity: item.quantity || 1,
                unit: item.unit || 'piece',
                unit_price: item.unit_price || 0
            })) : []
        });
        setIsEditing(true);
        setEditId(purchase.purchase_id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ma hubtaa inaad tirtirto iibkan? Stock-ga alaabta waa lala tirtiri doonaa.')) return;
        
        try {
            await api.delete(`/purchases/${id}`);
            fetchPurchases();
        } catch (error) {
            alert('Khalad ayaa dhacay markii la tirtirayay: ' + (error.response?.data?.message || 'Ma tirtiri karo'));
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const grandTotal = filteredPurchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);

        printWindow.document.write(`
            <html>
                <head>
                    <title>Warbixinta Iibka - Print</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border-bottom: 1px solid #e2e8f0; padding: 12px 8px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: 800; text-transform: uppercase; font-size: 10px; color: #64748b; letter-spacing: 1px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .text-right { text-align: right; }
                        .footer { margin-top: 30px; text-align: center; border-top: 2px solid #e2e8f0; padding-top: 20px; font-size: 10px; color: #94a3b8; }
                        .total-row { background: #f1f5f9; font-weight: 900; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
                            ${settings.store_logo ? (
                                `<img src="http://localhost:8000/storage/${settings.store_logo}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" style="height: 80px; max-width: 200px; object-fit: contain; margin-bottom: 15px;" />`
                            ) : null}
                            <div style="width: 80px; height: 80px; background: #1e3a8a; color: white; border-radius: 50%; display: ${settings.store_logo ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; margin: 0 auto 15px auto;">
                                ${settings.store_name?.[0] || 'S'}
                             </div>
                            <h1 style="margin: 0; color: #1e3a8a; text-transform: uppercase; font-size: 28px; font-weight: 900;">${settings.store_name}</h1>
                            <p style="margin: 5px 0; font-size: 12px; font-weight: bold; color: #64748b;">${settings.store_address || 'Mogadishu, Somalia'}</p>
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #64748b;">TEL: ${settings.store_number || '+252 xxx xxx xxx'}</p>
                        </div>
                        <h2 style="margin: 0; color: #334155; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">Warbixinta Iibka Supplier (Purchases Report)</h2>
                        <p style="margin: 5px 0; font-size: 11px; font-weight: bold; color: #64748b;">Taariikhda: ${new Date().toLocaleDateString()} | Printed: ${new Date().toLocaleTimeString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Purchase ID</th>
                                <th>Supplier</th>
                                <th>Taariikhda</th>
                                <th>Transport</th>
                                <th>Status</th>
                                <th class="text-right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredPurchases.map(p => `
                                <tr>
                                    <td style="font-family: monospace; font-weight: bold; color: #2563eb;">#P-${p.purchase_id}</td>
                                    <td><strong>${p.supplier?.company_name}</strong></td>
                                    <td>${new Date(p.purchase_date).toLocaleDateString()}</td>
                                    <td>${p.transport_method} ($${parseFloat(p.transport_cost).toFixed(2)})</td>
                                    <td><span style="font-weight: bold; color: ${p.status === 'received' ? '#10b981' : '#f59e0b'}">${p.status.toUpperCase()}</span></td>
                                    <td class="text-right"><strong>$${parseFloat(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="5" class="text-right" style="padding: 15px; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Grand Total:</td>
                                <td class="text-right" style="padding: 15px; font-size: 14px;">$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div class="footer">
                        <p>Document generated officially by ${settings.store_name}</p>
                        <p>&copy; ${new Date().getFullYear()} - All Rights Reserved</p>
                    </div>
                    <script>window.print(); window.close();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    const filteredPurchases = purchases.filter(p => 
        p.supplier?.company_name.toLowerCase().includes(search.toLowerCase()) ||
        p.purchase_id.toString().includes(search)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Iibka Supplier (Purchases)</h1>
                    <p className="text-slate-400">Diiwaangeli alaabta aad ka soo iibsatay suppliers-ka.</p>
                </div>
                <div className="flex items-center space-x-3">
                    {canDo('view') && (
                        <button 
                            onClick={handlePrint}
                            disabled={filteredPurchases.length === 0}
                            className="flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 shadow-lg disabled:opacity-50"
                        >
                            <Printer size={20} />
                            <span>Print Report</span>
                        </button>
                    )}
                    {canDo('record') && (
                        <button 
                            onClick={() => {
                                resetForm();
                                setIsModalOpen(true);
                            }}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                            <span>Iib Cusub (New Purchase)</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-6 border-b border-slate-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Raadi supplier ama ID..." 
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
                                <th className="px-6 py-4">Purchase ID</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4">Taariikhda</th>
                                <th className="px-6 py-4">Transport</th>
                                <th className="px-6 py-4 text-right">Cadadka</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Doc</th>
                                <th className="px-6 py-4 text-center">Items</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td>
                                </tr>
                            ) : filteredPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Ma jiraan iib la helay.</td>
                                </tr>
                            ) : filteredPurchases.map((p) => (
                                <React.Fragment key={p.purchase_id}>
                                    <tr 
                                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                        onClick={() => {
                                            const next = new Set(expandedRows);
                                            next.has(p.purchase_id) ? next.delete(p.purchase_id) : next.add(p.purchase_id);
                                            setExpandedRows(next);
                                        }}
                                    >
                                        <td className="px-6 py-4 font-mono text-xs text-blue-400 font-bold">#P-{p.purchase_id}</td>
                                        <td className="px-6 py-4 text-white font-medium">{p.supplier?.company_name}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{new Date(p.purchase_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-slate-300 font-bold">{p.transport_method}</span>
                                                <span className="text-[10px] text-slate-500">${parseFloat(p.transport_cost).toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-white">${parseFloat(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                                p.status === 'received' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 
                                                'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {p.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {p.document_url ? (
                                                <a 
                                                    href={p.document_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-400 hover:text-blue-300 transition-all inline-block"
                                                    title="View Document"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const next = new Set(expandedRows);
                                                    next.has(p.purchase_id) ? next.delete(p.purchase_id) : next.add(p.purchase_id);
                                                    setExpandedRows(next);
                                                }}
                                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                                title="View Items"
                                            >
                                                {expandedRows.has(p.purchase_id) 
                                                    ? <ChevronDown size={16} /> 
                                                    : <ChevronRight size={16} />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                {canDo('record') && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(p);
                                                        }}
                                                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {canDo('delete') && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(p.purchase_id);
                                                        }}
                                                        className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows.has(p.purchase_id) && (
                                        <tr className="bg-slate-900/60">
                                            <td colSpan="8" className="px-8 py-4">
                                                <div className="rounded-xl border border-slate-700 overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-slate-800/80 text-slate-400 text-[10px] uppercase tracking-widest">
                                                                <th className="px-4 py-2 text-left">#</th>
                                                                <th className="px-4 py-2 text-left">Alaabta (Product)</th>
                                                                <th className="px-4 py-2 text-center">Unit</th>
                                                                <th className="px-4 py-2 text-center">Tirada (Qty)</th>
                                                                <th className="px-4 py-2 text-right">Qiimaha (Unit Price)</th>
                                                                <th className="px-4 py-2 text-right">Wadarta (Total)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-700/50">
                                                            {p.items && p.items.length > 0 ? p.items.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-800/30">
                                                                    <td className="px-4 py-2 text-slate-500 font-mono">{idx + 1}</td>
                                                                    <td className="px-4 py-2 text-white font-medium">
                                                                        {item.product_name || item.product?.name || '—'}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center text-slate-400 text-xs">{item.unit || 'piece'}</td>
                                                                    <td className="px-4 py-2 text-center text-slate-300">{item.quantity}</td>
                                                                    <td className="px-4 py-2 text-right text-slate-300">${parseFloat(item.unit_price).toFixed(2)}</td>
                                                                    <td className="px-4 py-2 text-right text-emerald-400 font-bold">${parseFloat(item.total_price).toFixed(2)}</td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan="5" className="px-4 py-4 text-center text-slate-500 italic">Wax alaab ah lama helin.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                        {filteredPurchases.length > 0 && (
                            <tfoot className="bg-slate-800/80 backdrop-blur-md sticky bottom-0 border-t-2 border-slate-700 z-10">
                                <tr>
                                    <td colSpan="4" className="px-6 py-5 text-right text-slate-400 text-xs font-black uppercase tracking-widest">
                                        Wadarta Iibka (Total Purchases):
                                    </td>
                                    <td className="px-6 py-5 text-right text-white text-sm font-black whitespace-nowrap">
                                        ${filteredPurchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* Purchase Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title={isEditing ? `Edit Iib (Purchase #${editId})` : "Diiwaangeli Iib Cusub"}
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Supplier</label>
                            <select 
                                required
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={purchaseForm.supplier_id}
                                onChange={(e) => setPurchaseForm({...purchaseForm, supplier_id: e.target.value})}
                            >
                                <option value="">Dooro Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.supplier_id} value={s.supplier_id}>{s.company_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Taariikhda</label>
                            <input 
                                required
                                type="date" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={purchaseForm.purchase_date}
                                onChange={(e) => setPurchaseForm({...purchaseForm, purchase_date: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Status</label>
                            <select 
                                required
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={purchaseForm.status}
                                onChange={(e) => setPurchaseForm({...purchaseForm, status: e.target.value})}
                            >
                                <option value="received">Received (Alaabta waad heshay)</option>
                                <option value="pending">Pending (Weli ma helin)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Document (Upload PDF/Image) <span className="text-rose-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden" 
                                    id="purchase-document"
                                    onChange={(e) => setPurchaseForm({...purchaseForm, document: e.target.files[0]})}
                                />
                                <label 
                                    htmlFor="purchase-document"
                                    className="flex items-center justify-between w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white cursor-pointer hover:border-slate-500 transition-all"
                                >
                                    <span className="text-sm truncate">
                                        {purchaseForm.document ? purchaseForm.document.name : 'Click to upload...'}
                                    </span>
                                    <FileIcon size={20} className="text-slate-400" />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Alaabta la soo iibsaday</h3>
                            <button 
                                type="button" 
                                onClick={handleAddItem}
                                className="px-3 py-1.5 bg-blue-600/10 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center space-x-2"
                            >
                                <Plus size={14} />
                                <span>Ku dar line</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {purchaseForm.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-primary/30 p-3 rounded-xl border border-slate-700">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Alaabta (Product)</label>
                                        <input 
                                            required
                                            list={`products-datalist-${index}`}
                                            placeholder="Qor ama dooro alaabta..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                                            value={item.product_name || (products.find(p => p.product_id === item.product_id)?.name || '')}
                                            onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                                        />
                                        <datalist id={`products-datalist-${index}`}>
                                            {products.map(p => (
                                                <option key={p.product_id} value={p.name}>
                                                    Stock: {p.current_stock}
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Quantity</label>
                                        <input 
                                            required
                                            type="number" 
                                            min="1"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Unit</label>
                                        <select 
                                            required
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                                            value={item.unit}
                                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                        >
                                            <option value="piece">Piece (Xabo)</option>
                                            <option value="kg">KG</option>
                                            <option value="box">Box (Carton)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Unit Price ($)</label>
                                        <div className="flex items-center space-x-2">
                                            <input 
                                                required
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-2 text-slate-500 hover:text-rose-400 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {purchaseForm.items.length === 0 && (
                                <div className="text-center py-8 bg-primary/20 rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm italic">
                                    Wax alaab ah weli kuma aadan darin iibka.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Gaadiidka (Transportation)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Method</label>
                                    <select 
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                        value={purchaseForm.transport_method}
                                        onChange={(e) => setPurchaseForm({...purchaseForm, transport_method: e.target.value})}
                                    >
                                        <option value="Bajaj">Bajaj</option>
                                        <option value="Vekon">Vekon</option>
                                        <option value="Car">Car (Baabuur)</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Cost ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none"
                                        value={purchaseForm.transport_cost}
                                        onChange={(e) => setPurchaseForm({...purchaseForm, transport_cost: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1">Notes</label>
                                <textarea 
                                    className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none h-20"
                                    value={purchaseForm.notes}
                                    onChange={(e) => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                                    placeholder="Fariin dheeraad ah..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/10 space-y-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Summary (Wadarta)</h3>
                            <div className="space-y-2 border-b border-slate-700 pb-4">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal:</span>
                                    <span>${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Transport:</span>
                                    <span>${parseFloat(purchaseForm.transport_cost || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xl font-bold text-white uppercase tracking-tighter italic">Total Amount</span>
                                <span className="text-3xl font-black text-blue-400">${calculateTotal().toFixed(2)}</span>
                            </div>
                            
                            <button 
                                type="submit"
                                disabled={formLoading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 mt-4"
                            >
                                {formLoading ? <AlertCircle className="animate-spin" size={24} /> : <Save size={24} />}
                                <span>{formLoading ? 'Saving...' : 'Save Purchase'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PurchasesPage;
