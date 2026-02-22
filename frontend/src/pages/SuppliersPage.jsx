import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Plus, Search, Truck, Edit2, Trash2, Mail, Phone, MapPin, Save, X, Download, FileText, Upload, Link as LinkIcon } from 'lucide-react';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const SuppliersPage = () => {
    const { isAdmin, canDo, hasPermission } = useContext(AuthContext);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        payment_terms: '',
        contract_start: '',
        contract_end: '',
        status: 'active',
        notes: ''
    });

    // File Upload state
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        if (isAdmin || hasPermission('suppliers')) {
            fetchSuppliers();
        }
    }, [isAdmin, hasPermission]);

    if (!isAdmin && !hasPermission('suppliers')) {
        return <Navigate to="/" />;
    }

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentSupplier({
            company_name: '',
            contact_person: '',
            phone: '',
            email: '',
            address: '',
            tax_number: '',
            payment_terms: '',
            contract_start: '',
            contract_end: '',
            status: 'active',
            notes: ''
        });
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (supplier) => {
        setIsEditing(true);
        setCurrentSupplier(supplier);
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.keys(currentSupplier).forEach(key => {
            if (currentSupplier[key] !== null) {
                formData.append(key, currentSupplier[key]);
            }
        });
        
        if (selectedFile) {
            formData.append('document', selectedFile);
        }

        try {
            if (isEditing) {
                // Laravel handles PUT with FormData oddly, often requiring _method spoofing or just using POST with _method=PUT
                formData.append('_method', 'PUT');
                await api.post(`/suppliers/${currentSupplier.supplier_id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/suppliers', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            console.error('Error saving supplier:', error);
            alert('Khalad ayaa dhacay markii la kaydinayay xogta.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ma hubtaa inaad tirtirto supplier-kan?')) return;
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch {
            alert('Lama tirtiri karo supplier-kan. Waxaa laga yaabaa inuu leeyahay iibsi (purchases).');
        }
    };

    const exportToExcel = () => {
        const headers = ['Company', 'Contact', 'Phone', 'Email', 'Status'];
        const csvContent = [
            headers.join(','),
            ...suppliers.map(s => [
                s.company_name,
                s.contact_person,
                s.phone,
                s.email,
                s.status
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'suppliers.csv';
        link.click();
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.company_name.toLowerCase().includes(search.toLowerCase()) || 
        s.contact_person?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Suppliers (Alaab-keenayaasha)</h1>
                    <p className="text-slate-400">Maareynta shirkadaha alaabta keena iyo heshiisyada.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={exportToExcel}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all"
                    >
                        <Download size={18} />
                        <span>Excel</span>
                    </button>
                    {canDo('record') && (
                        <button 
                            onClick={handleOpenAddModal}
                            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                            <span>Ku dar Supplier</span>
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
                            placeholder="Raadi shirkad ama qofka lagula soo xiriiro..." 
                            className="w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Shirkadda</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Xiriirka</th>
                                <th className="px-6 py-4">Warqado (Docs)</th>
                                <th className="px-6 py-4">Status</th>
                                {(canDo('edit') || canDo('delete')) && <th className="px-6 py-4">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Ma jiraan suppliers hadda diiwaangashan.</td>
                                </tr>
                            ) : filteredSuppliers.map((s) => (
                                <tr key={s.supplier_id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400 font-bold">
                                                {s.company_name[0]}
                                            </div>
                                            <span className="text-white font-medium">{s.company_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{s.contact_person}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 flex items-center"><Phone size={12} className="mr-1" /> {s.phone}</span>
                                            <span className="text-slate-500 flex items-center"><Mail size={12} className="mr-1" /> {s.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {s.document_path ? (
                                            <a 
                                                href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace('/api', '')}/storage/${s.document_path}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold"
                                            >
                                                <LinkIcon size={12} />
                                                <span>Eeg Warqadda</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-600 text-[10px]">Ma jirto</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                        }`}>
                                            {s.status.toUpperCase()}
                                        </span>
                                    </td>
                                    {(canDo('edit') || canDo('delete')) && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {canDo('edit') && (
                                                    <button 
                                                        onClick={() => handleOpenEditModal(s)}
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {canDo('delete') && (
                                                    <button 
                                                        onClick={() => handleDelete(s.supplier_id)}
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

            {/* Supplier Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Wax ka baddal Supplier-ka' : 'Ku dar Supplier Cusub'}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Magaca Shirkadda</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentSupplier.company_name}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, company_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Qofka lagula soo xiriiro</label>
                            <input 
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentSupplier.contact_person}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, contact_person: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Taleefanka</label>
                            <input 
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentSupplier.phone}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentSupplier.email}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Cinwaanka (Address)</label>
                            <textarea 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-20"
                                value={currentSupplier.address}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, address: e.target.value})}
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Cashuura (Tax ID)</label>
                            <input 
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentSupplier.tax_number}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, tax_number: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Status</label>
                            <select 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={currentSupplier.status}
                                onChange={(e) => setCurrentSupplier({...currentSupplier, status: e.target.value})}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Document Upload Field */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Heshiiska ama Warqadaha (Upload Document)</label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    id="supplier-doc" 
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                />
                                <label 
                                    htmlFor="supplier-doc"
                                    className="flex items-center justify-center space-x-3 w-full py-6 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-slate-400 group-hover:text-blue-400"
                                >
                                    <Upload size={24} />
                                    <span className="font-medium">{selectedFile ? selectedFile.name : 'Dooro feyl (PDF ama Image)'}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
                        >
                            Ka noqo
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 flex items-center space-x-2"
                        >
                            <Save size={20} />
                            <span>Keydi Supplier-ka</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuppliersPage;
