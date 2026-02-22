import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Plus, Search, Filter, Edit2, Trash2, Package, Save, X, BarChart3, PieChart as PieIcon } from 'lucide-react';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { 
    PieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Legend
} from 'recharts';
import ChartCard from '../components/ChartCard';

const ProductList = () => {
    const { canDo } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [purchasedData, setPurchasedData] = useState({});
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({
        name: '',
        product_code: '',
        category: '',
        cost_price: '',
        selling_price: '',
        current_stock: '',
        unit: 'piece',
        is_active: true,
        discount_price: '',
        discount_start_date: '',
        discount_end_date: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchAnalytics();
        fetchPurchasedData();
    }, []);

    const fetchPurchasedData = async () => {
        try {
            const res = await api.get('/purchases');
            const purchases = res.data || [];
            
            // Map to store accumulated data for each product name
            const dataMap = {};
            
            purchases.forEach(p => {
                // Purchases are sorted by date desc, so we process latest first
                (p.items || []).forEach(item => {
                    const name = item.product_name || item.product?.name;
                    if (!name) return;
                    
                    if (!dataMap[name]) {
                        dataMap[name] = {
                            cost_price: parseFloat(item.unit_price) || 0,
                            quantity: 0,
                            unit: item.unit || 'piece'
                        };
                    }
                    
                    // Accumulate quantity from all purchases
                    dataMap[name].quantity += parseInt(item.quantity) || 0;
                });
            });
            
            setPurchasedData(dataMap);
        } catch (error) {
            console.error('Error fetching purchased data:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await api.get('/analytics/products');
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching product analytics:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            // Check if response.data is paginated or direct array
            setProducts(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentProduct({
            name: '',
            product_code: '',
            category: '',
            cost_price: '',
            selling_price: '',
            current_stock: '',
            unit: 'piece',
            is_active: true,
            discount_price: '',
            discount_start_date: '',
            discount_end_date: ''
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setIsEditing(true);
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Auto-generate barcode if SKU is empty
        let finalProductCode = currentProduct.product_code;
        if (!finalProductCode || finalProductCode.trim() === '') {
            // Generate a random 10-digit number
            finalProductCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        }

        const formData = new FormData();
        Object.keys(currentProduct).forEach(key => {
            if (key !== 'image' && currentProduct[key] !== null) {
                let value = key === 'product_code' ? finalProductCode : currentProduct[key];
                if (key === 'is_active') {
                    value = value ? '1' : '0';
                }
                formData.append(key, value);
            }
        });

        if (currentProduct.image) {
            formData.append('image', currentProduct.image);
        }

        // Add method spoofing for PUT if editing with a file
        if (isEditing && currentProduct.image) {
            formData.append('_method', 'PUT');
        }

        try {
            if (isEditing) {
                if (currentProduct.image) {
                    await api.post(`/products/${currentProduct.product_id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    await api.put(`/products/${currentProduct.product_id}`, currentProduct);
                }
            } else {
                await api.post('/products', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error.response?.data || error.message);
            alert('Waan ka xunnahay, khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta aad gelisay'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ma hubtaa inaad tirtirto alaabtan?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.product_code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Alaabada (Inventory)</h1>
                    <p className="text-slate-400">Maareynta iyo kormeerka alaabada kuu kaydsan.</p>
                </div>
                {canDo('record') && (
                    <button 
                        onClick={handleOpenAddModal}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
                    >
                        <Plus size={20} />
                        <span>Ku dar Alaab</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartCard 
                    title="Stock Distribution" 
                    subtitle="Inventory levels by category" 
                    icon={PieIcon}
                >
                    <PieChart>
                        <Pie
                            data={analytics?.stockByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {analytics?.stockByCategory?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                </ChartCard>

                <ChartCard 
                    title="Revenue by Category" 
                    subtitle="Top performing categories" 
                    icon={BarChart3}
                >
                    <BarChart data={analytics?.revenueByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartCard>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Raadi alaab magaceeda ama koodkeeda..."
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
                                <th className="px-6 py-4">Sawirka</th>
                                <th className="px-6 py-4">Alaabta</th>
                                <th className="px-6 py-4">Koodka</th>
                                <th className="px-6 py-4">Qaybta</th>
                                <th className="px-6 py-4">Qiimaha</th>
                                <th className="px-6 py-4 text-right">Stock-ga</th>
                                <th className="px-6 py-4">Status</th>
                                {(canDo('edit') || canDo('delete')) && <th className="px-6 py-4">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 text-lg italic">
                                        Waa la soo rarayaa...
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 text-lg italic">
                                        Ma jirto alaab la helay.
                                    </td>
                                </tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product.product_id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden">
                                            {product.image_path ? (
                                                <img 
                                                    src={`http://localhost:8000/storage/${product.image_path}`} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{product.name}</div>
                                        <div className="text-xs text-slate-500">{product.unit}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{product.product_code}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase">{product.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {product.is_on_discount ? (
                                            <>
                                                <div className="font-bold text-rose-500">${product.discount_price}</div>
                                                <div className="text-[10px] text-slate-500 line-through">${product.selling_price}</div>
                                                <div className="text-[9px] text-rose-400 font-bold uppercase mt-1">On Sale</div>
                                            </>
                                        ) : (
                                            <div className="font-bold text-emerald-400">${product.selling_price}</div>
                                        )}
                                        <div className="text-[10px] text-slate-500 mt-1">Cost: ${product.cost_price}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={product.current_stock < product.minimum_stock ? "text-rose-400 font-bold" : "text-white font-bold"}>
                                            {product.current_stock}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${product.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {(canDo('edit') || canDo('delete')) && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {canDo('edit') && (
                                                    <button 
                                                        onClick={() => handleOpenEditModal(product)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {canDo('delete') && (
                                                    <button 
                                                        onClick={() => handleDelete(product.product_id)}
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
                        {filteredProducts.length > 0 && (
                            <tfoot className="bg-slate-800/80 backdrop-blur-md sticky bottom-0 border-t-2 border-slate-700 z-10">
                                <tr className="divide-x divide-slate-700">
                                    <td colSpan="5" className="px-6 py-5 text-right text-slate-400 text-xs font-black uppercase tracking-widest">
                                        Wadarta Guud (Totals):
                                    </td>
                                    <td className="px-6 py-5 text-right text-white text-sm font-black">
                                        {filteredProducts.reduce((sum, p) => sum + parseFloat(p.current_stock || 0), 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right text-emerald-400 text-sm font-black whitespace-nowrap">
                                        ${filteredProducts.reduce((sum, p) => sum + (parseFloat(p.cost_price || 0) * parseFloat(p.current_stock || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    {(canDo('edit') || canDo('delete')) && <td></td>}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Wax ka beddel Alaabta' : 'Ku dar Alaab Cusub'}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Magaca Alaabta</label>
                            <input
                                required
                                type="text"
                                list="purchased-names-list"
                                placeholder="Dooro ama geli magaca alaabta..."
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentProduct.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const updates = { name: val };
                                    
                                    // Auto-fill if name matches a purchased item
                                    if (purchasedData[val]) {
                                        updates.cost_price = purchasedData[val].cost_price;
                                        updates.current_stock = purchasedData[val].quantity;
                                        updates.unit = purchasedData[val].unit;
                                    }
                                    
                                    setCurrentProduct({...currentProduct, ...updates});
                                }}
                            />
                            <datalist id="purchased-names-list">
                                {Object.keys(purchasedData).sort().map((name, i) => (
                                    <option key={i} value={name} />
                                ))}
                            </datalist>
                            {Object.keys(purchasedData).length > 0 && (
                                <p className="text-[10px] text-slate-500 mt-1 pl-1">
                                    {Object.keys(purchasedData).length} magac ayaa laga helay iibsiga — dooro ama geli cusub.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Koodka (SKU) <span className="text-[10px] text-slate-500 font-normal italic">(Optional)</span></label>
                            <input
                                type="text"
                                placeholder="Auto-generate if empty"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentProduct.product_code}
                                onChange={(e) => setCurrentProduct({...currentProduct, product_code: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Qaybta (Category)</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentProduct.category}
                                onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Qiimaha Iibsiga (Cost)</label>
                            <input
                                required
                                readOnly={!!purchasedData[currentProduct.name]}
                                type="number"
                                step="0.01"
                                className={`w-full ${purchasedData[currentProduct.name] ? 'bg-slate-800 text-slate-400' : 'bg-primary/50 text-white'} border border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50`}
                                value={currentProduct.cost_price}
                                onChange={(e) => setCurrentProduct({...currentProduct, cost_price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Qiimaha Iibinta (Price)</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentProduct.selling_price}
                                onChange={(e) => setCurrentProduct({...currentProduct, selling_price: e.target.value})}
                            />
                        </div>
                        <div className="col-span-2 border-t border-slate-700/50 pt-4 mt-2">
                            <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center">
                                <span className="bg-rose-500 w-1.5 h-1.5 rounded-full mr-2"></span>
                                Discount & Special Offer
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase">Qiimaha Qiimo-dhimista (Discount Price)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Geli qiimaha cusub..."
                                        className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-rose-500/50"
                                        value={currentProduct.discount_price || ''}
                                        onChange={(e) => setCurrentProduct({...currentProduct, discount_price: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase">Waqtiga Bilaashka (Start Date)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        value={currentProduct.discount_start_date ? currentProduct.discount_start_date.substring(0, 16) : ''}
                                        onChange={(e) => setCurrentProduct({...currentProduct, discount_start_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-[10px] font-bold mb-1.5 uppercase">Waqtiga Dhamaadka (End Date)</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                        value={currentProduct.discount_end_date ? currentProduct.discount_end_date.substring(0, 16) : ''}
                                        onChange={(e) => setCurrentProduct({...currentProduct, discount_end_date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Stock-ga Hadda</label>
                            <input
                                required
                                readOnly={!!purchasedData[currentProduct.name]}
                                type="number"
                                className={`w-full ${purchasedData[currentProduct.name] ? 'bg-slate-800 text-slate-400' : 'bg-primary/50 text-white'} border border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50`}
                                value={currentProduct.current_stock}
                                onChange={(e) => setCurrentProduct({...currentProduct, current_stock: e.target.value})}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Sawirka Alaabta</label>
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                                    {currentProduct.image ? (
                                        <img src={URL.createObjectURL(currentProduct.image)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : currentProduct.image_path ? (
                                        <img src={`http://localhost:8000/storage/${currentProduct.image_path}`} alt="Current" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Package size={24} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="flex-1 bg-primary/50 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                    onChange={(e) => setCurrentProduct({...currentProduct, image: e.target.files[0]})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1.5">Halbeegga (Unit)</label>
                            <select
                                disabled={!!purchasedData[currentProduct.name]}
                                className={`w-full ${purchasedData[currentProduct.name] ? 'bg-slate-800 text-slate-400' : 'bg-primary/50 text-white'} border border-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/50`}
                                value={currentProduct.unit}
                                onChange={(e) => setCurrentProduct({...currentProduct, unit: e.target.value})}
                            >
                                <option value="piece">Piece (Xabo)</option>
                                <option value="kg">KG</option>
                                <option value="liter">Liter</option>
                                <option value="box">Box (Kartoon)</option>
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
                            <span>Kaydi Alaabta</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProductList;
