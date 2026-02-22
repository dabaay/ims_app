import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
    Package, 
    Plus, 
    Trash2, 
    Eye, 
    EyeOff, 
    Image as ImageIcon, 
    Search,
    X,
    Upload,
    CheckCircle2,
    Loader2,
    Calendar,
    Edit2,
    Download
} from 'lucide-react';
import { useLanguage } from '../context/useLanguage';

const PromotionsPage = () => {
    const { t } = useLanguage();
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        product_id: '',
        image: null,
        is_active: true,
        start_date: '',
        end_date: ''
    });
    
    const [editingId, setEditingId] = useState(null);
    
    const [imagePreview, setImagePreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, expired

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [promoRes, prodRes] = await Promise.all([
                api.get('/mobile-manager/promotions'),
                api.get('/products')
            ]);
            setPromotions(promoRes.data.data);
            setProducts(prodRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description || '');
        if (formData.product_id) data.append('product_id', formData.product_id);
        if (formData.image) data.append('image', formData.image);
        data.append('is_active', formData.is_active ? '1' : '0');
        if (formData.start_date) data.append('start_date', formData.start_date);
        if (formData.end_date) data.append('end_date', formData.end_date);

        try {
            if (editingId) {
                // For update, we might not have a new image
                await api.post(`/mobile-manager/promotions/${editingId}?_method=PUT`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/mobile-manager/promotions', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to save promotion');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', product_id: '', image: null, is_active: true, start_date: '', end_date: '' });
        setImagePreview(null);
        setEditingId(null);
    };

    const handleEdit = (promo) => {
        setEditingId(promo.promotion_id);
        setFormData({
            title: promo.title,
            description: promo.description || '',
            product_id: promo.product_id || '',
            image: null, // Don't reset image unless changed
            is_active: promo.is_active,
            start_date: promo.start_date ? promo.start_date.substring(0, 16) : '',
            end_date: promo.end_date ? promo.end_date.substring(0, 16) : ''
        });
        setImagePreview(promo.image_url);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await api.delete(`/mobile-manager/promotions/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggle = async (id) => {
        try {
            await api.post(`/mobile-manager/promotions/${id}/toggle`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const exportToCSV = () => {
        const headers = ['Title', 'Product', 'Status', 'Start Date', 'End Date', 'Description'];
        const csvRows = promotions.map(p => {
            let status = p.is_active ? 'Active' : 'Inactive';
            const now = new Date();
            if (p.end_date && new Date(p.end_date) < now) status = 'Expired';
            
            return [
                p.title,
                p.product?.name || 'General',
                status,
                p.start_date ? new Date(p.start_date).toLocaleDateString() : '-',
                p.end_date ? new Date(p.end_date).toLocaleDateString() : '-',
                `"${p.description?.replace(/"/g, '""') || ''}"`
            ].join(',');
        });
        
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mobile_promotions_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredPromotions = promotions.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        const now = new Date();
        const isExpired = p.end_date && new Date(p.end_date) < now;

        if (filterStatus === 'active') return p.is_active && !isExpired;
        if (filterStatus === 'inactive') return !p.is_active;
        if (filterStatus === 'expired') return isExpired;
        
        return true;
    });

    if (loading && promotions.length === 0) {
        return <div className="flex items-center justify-center min-h-[400px] text-white">
            <Loader2 className="animate-spin mr-2" /> Loading promotions...
        </div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-2 uppercase">
                        {t('mobile_promotions')}
                    </h1>
                    <p className="text-slate-400 font-medium">Manage advertisements and banners for the mobile app dashboard.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={exportToCSV}
                        className="flex items-center space-x-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700 transition-all"
                    >
                        <Download size={18} />
                        <span>{t('export_report')}</span>
                    </button>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={20} />
                        <span>{t('post_new_promotion')}</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-secondary/40 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-md flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text"
                        placeholder={t('search_promotions_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-primary/40 border border-slate-700 rounded-2xl text-white outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    {['all', 'active', 'inactive', 'expired'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                                filterStatus === status 
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                                    : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                            }`}
                        >
                            {t(`${status}_status`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPromotions.map((promo) => (
                    <div key={promo.promotion_id} className="bg-secondary/40 border border-slate-700/50 rounded-3xl overflow-hidden group hover:border-blue-500/30 transition-all flex flex-col">
                        <div className="relative h-48 overflow-hidden bg-primary/20">
                            <img 
                                src={promo.image_url} 
                                alt={promo.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {!promo.is_active && (
                                <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center">
                                    <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-700 rounded-lg">Inactive</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEdit(promo)}
                                    className="p-2 bg-slate-900/80 hover:bg-blue-600 text-white rounded-xl backdrop-blur-md transition-all shadow-xl"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleToggle(promo.promotion_id)}
                                    className="p-2 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-xl backdrop-blur-md transition-all shadow-xl"
                                    title={promo.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    {promo.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button 
                                    onClick={() => handleDelete(promo.promotion_id)}
                                    className="p-2 bg-slate-900/80 hover:bg-rose-600 text-white rounded-xl backdrop-blur-md transition-all shadow-xl"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-bold text-white tracking-tight">{promo.title}</h3>
                                {promo.is_active && (
                                    <span className="flex items-center text-[9px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                                {promo.description || 'No description provided.'}
                            </p>
                            
                            <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-slate-500">
                                    <ImageIcon size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">Promotional Banner</span>
                                </div>
                                {promo.product && (
                                    <div className="flex items-center space-x-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <Package size={12} className="text-blue-400" />
                                        <span className="text-[10px] font-bold text-white uppercase">{promo.product.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPromotions.length === 0 && !loading && (
                    <div className="col-span-full py-20 bg-secondary/20 border-2 border-dashed border-slate-700/50 rounded-3xl flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mb-4">
                            <Search size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No promotions match your search.</p>
                        <p className="text-slate-600 text-xs mt-1">Try changing your filters or search terms.</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary/80 backdrop-blur-md" onClick={() => !isSubmitting && setShowModal(false)}></div>
                    <div className="relative bg-secondary border border-slate-700 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Post New Advertisement</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Title</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
                                            placeholder="Enter advertisement title..."
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Description (Optional)</label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none h-24 resize-none"
                                            placeholder="Describe the promotion..."
                                        ></textarea>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Link to Product (Optional)</label>
                                        <select 
                                            value={formData.product_id}
                                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none appearance-none"
                                        >
                                            <option value="">None - General Advertisement</option>
                                            {products.map(p => (
                                                <option key={p.product_id} value={p.product_id}>{p.name} - ${p.selling_price}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                            <input 
                                                type="datetime-local" 
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                                            <input 
                                                type="datetime-local" 
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Promotion Banner Image</label>
                                    <div className="relative">
                                        {!imagePreview ? (
                                            <div className="group relative w-full h-40 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all flex flex-col items-center justify-center bg-primary/20 cursor-pointer overflow-hidden">
                                                <Upload size={24} className="text-slate-600 group-hover:text-blue-400 group-hover:-translate-y-1 transition-all" />
                                                <p className="text-slate-500 text-[10px] font-black uppercase mt-2">Click or drag banner image</p>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleImageChange}
                                                    required
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-700 shadow-xl group">
                                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => { setImagePreview(null); setFormData({ ...formData, image: null }); }}
                                                        className="p-3 bg-rose-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting || !formData.image}
                                className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Posting...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={20} />
                                        <span>Save Advertisement</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionsPage;
