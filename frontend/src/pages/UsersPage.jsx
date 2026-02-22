import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { Plus, Search, UserPlus, Edit2, Trash2, Shield, Mail, Phone, Save, X, Download, FileText, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import Modal from '../components/Modal';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage';

const UsersPage = () => {
    const { t } = useLanguage();
    const { user: currentUser, isAdmin, canDo } = useContext(AuthContext);
    // [x] Create Detailed Schema Migration for Master Tables (Tenants, Super Admins).
    // [x] Create Migration to add `tenant_id` to ALL existing tables.
    // [x] Implement data seeding (First Tenant + Hidden Super Admin).
    // [x] Migrate existing data (Sales, Users, Clean) to `tenant_id = 1`.
    // [x] Implement `TenantScope` (Global Scope) in all Models for data isolation.
    // [x] Update `AuthController` to handle Tenant vs Super Admin login.
    // [x] Create hidden Super Admin login route.
    // [x] Standardize frontend role checks.
    // [x] Add role helper functions to `AuthProvider.jsx`.
    // [x] Update `Sidebar`, `UsersPage`, `Dashboard`, and `Accounting` for Admin role.
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showTablePasswords, setShowTablePasswords] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordLocked, setPasswordLocked] = useState(false);
    const [userForm, setUserForm] = useState({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        role: 'admin',
        is_enabled: true,
        permissions: {
            modules: {},
            actions: {}
        }
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setPasswordLocked(false);
        setShowPassword(false);
        setUserForm({
            username: '',
            password: '',
            full_name: '',
            email: '',
            phone: '',
            role: 'admin',
            is_enabled: true,
            permissions: {
                modules: {},
                actions: {}
            }
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setIsEditing(true);
        setPasswordLocked(true); // Lock by default when editing
        setShowPassword(false);
        setUserForm({
            ...user,
            password: user.plain_password || '', // Show current password if available
            permissions: user.permissions || { modules: {}, actions: {} }
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/users/${userForm.user_id}`, userForm);
            } else {
                await api.post('/users', userForm);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error.response?.data || error.message);
            alert('Waan ka xunnahay, khalad ayaa dhacay: ' + (error.response?.data?.message || 'Hubi xogta aad gelisay'));
        }
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Ma hubtaa inaad tirtirto ${user.full_name}?`)) return;
        try {
            await api.delete(`/users/${user.user_id}`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Khalad ayaa dhacay.');
        }
    };

    const exportToExcel = () => {
        const headers = ['Magaca', 'Username', 'Email', 'Taleefan', 'Role', 'Status'];
        const csvContent = [
            headers.join(','),
            ...users.map(u => [
                u.full_name,
                u.username,
                u.email || '',
                u.phone || '',
                u.role,
                u.is_enabled ? 'Enabled' : 'Disabled',
                u.is_online ? 'Online' : 'Offline'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'isticmaalayaasha.csv';
        link.click();
    };

    const printPage = () => {
        window.print();
    };

    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(search.toLowerCase()) || 
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    const maskEmail = (email) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        if (!name || !domain) return email;
        return `${name[0]}...${name[name.length - 1]}@${domain}`;
    };

    const maskPhone = (phone) => {
        if (!phone) return '';
        if (phone.length <= 4) return phone;
        return `...${phone.slice(-4)}`;
    };

    if ((!isAdmin && !canDo('manage_users')) || currentUser?.role === 'app_manager') {
        return <Navigate to="/" />;
    }

    return (
        <>
        <div className="max-w-7xl mx-auto space-y-8 print:hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Maamulka Users-ka</h1>
                    <p className="text-slate-400">Maaree isticmaalayaasha nidaamka iyo awoodahooda.</p>
                </div>
                <div className="flex items-center gap-3">
                    {(isAdmin || canDo('manage_users')) && (
                        <button 
                            onClick={exportToExcel}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all"
                        >
                            <Download size={18} />
                            <span>Excel</span>
                        </button>
                    )}
                    <button 
                        onClick={printPage}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold border border-slate-700 hover:bg-slate-700 transition-all"
                    >
                        <FileText size={18} />
                        <span>PDF</span>
                    </button>
                    {(isAdmin || canDo('manage_users')) && (
                        <button 
                            onClick={() => setShowTablePasswords(!showTablePasswords)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold border border-slate-700 transition-all ${showTablePasswords ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            title={showTablePasswords ? "Qarso Passwords" : "Muuji Passwords"}
                        >
                            {showTablePasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            <span>Pass</span>
                        </button>
                    )}
                    {(isAdmin || canDo('manage_users')) && (
                        <button 
                            onClick={handleOpenAddModal}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={20} />
                            <span>Ku dar User</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-secondary/40 border border-slate-700 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            placeholder="Raadi magac ama username..." 
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
                                <th className="px-6 py-4">Isticmaalaha</th>
                                <th className="px-6 py-4">Username</th>
                                <th className="px-6 py-4">Password</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Xiriirka</th>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4">Online</th>
                                {(isAdmin || canDo('manage_users')) && <th className="px-6 py-4">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">Xogta waa la soo rarayaa...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-slate-500">Labaad laguma helin raadintaada.</td>
                                </tr>
                            ) : filteredUsers.map((u) => (
                                <tr key={u.user_id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 text-white font-medium">{u.full_name}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-blue-400">{u.username}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-amber-500">
                                        {showTablePasswords ? (u.plain_password || '********') : '••••••••'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            u.role === 'admin' ? 'bg-blue-500/10 text-blue-400' : 
                                            u.role === 'app_manager' ? 'bg-indigo-500/10 text-indigo-400' :
                                            'bg-amber-500/10 text-amber-400'
                                        }`}>
                                            {t(u.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            {u.phone && <span className="flex items-center text-xs text-slate-400"><Phone size={12} className="mr-1" /> {maskPhone(u.phone)}</span>}
                                            {u.email && <span className="flex items-center text-xs text-slate-400"><Mail size={12} className="mr-1" /> {maskEmail(u.email)}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                            u.is_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                        }`}>
                                            {u.is_enabled ? 'ENABLED' : 'DISABLED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-2 h-2 rounded-full ${u.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                            <span className={`text-[10px] font-bold ${u.is_online ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {u.is_online ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </div>
                                    </td>
                                    {(isAdmin || canDo('manage_users')) && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={() => handleOpenEditModal(u)}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(u)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                                                    disabled={currentUser?.user_id === u.user_id}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Wax ka baddal User-ka' : 'Ku dar User Cusub'}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Magaca Buuxa</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={userForm.full_name}
                                onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Username</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={userForm.username}
                                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Password {isEditing && '(Leave blank to keep current)'}</label>
                                    <button
                                        type="button"
                                        onClick={() => setPasswordLocked(!passwordLocked)}
                                        className={`p-1 rounded-md transition-colors ${passwordLocked ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                                        title={passwordLocked ? "Unlock Password" : "Lock Password"}
                                    >
                                        {passwordLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                    </button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
                                        let pass = "";
                                        for(let i=0; i<8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                                        setUserForm({...userForm, password: pass});
                                        setShowPassword(true); // Show generated password
                                    }}
                                    disabled={passwordLocked}
                                    className={`text-[10px] font-bold hover:underline ${passwordLocked ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400'}`}
                                >
                                    Generate
                                </button>
                            </div>
                            <div className="relative">
                                <input 
                                    required={!isEditing}
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10 ${passwordLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                                    readOnly={passwordLocked}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Role</label>
                             <select 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={userForm.role}
                                onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                            >
                                <option value="admin">{t('admin')}</option>
                                <option value="cashier">{t('cashier')}</option>
                                <option value="app_manager">{t('app_manager')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Taleefanka</label>
                            <input 
                                type="text" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={userForm.phone}
                                onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={userForm.email}
                                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 pt-4">
                        <input 
                            type="checkbox" 
                            id="is_enabled"
                            className="w-5 h-5 rounded bg-primary/50 border-slate-700 text-blue-600 focus:ring-0"
                            checked={userForm.is_enabled}
                            onChange={(e) => setUserForm({...userForm, is_enabled: e.target.checked})}
                        />
                        <label htmlFor="is_enabled" className="text-slate-300 font-medium cursor-pointer">Account-kan waa mid firfircoon (Enabled)</label>
                    </div>
                    {/* Permissions Section */}
                    <div className="border-t border-slate-700 pt-6 mt-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <Shield size={20} className="text-blue-400" />
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Permissions (Awoodaha)</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Module Access */}
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1 mb-3 block">Module Access (Helitaanka Qaybaha)</label>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
                                    {[
                                        { key: 'dashboard', label: 'Dashboard' },
                                        { key: 'products', label: 'Products' },
                                        { key: 'customers', label: 'Customers' },
                                        { key: 'pos', label: 'POS' },
                                        { key: 'sales_history', label: 'Sales History' },
                                        { key: 'expenses', label: 'Expenses' },
                                        { key: 'suppliers', label: 'Suppliers' },
                                        { key: 'accounting', label: 'Accounting' },
                                        { key: 'purchases', label: 'Purchases' },
                                        { key: 'walpo', label: 'Walpo' },
                                        { key: 'reports', label: 'Reports' },
                                        { key: 'financial_reports', label: 'Financial Reports' },
                                        { key: 'users', label: 'User Management' },
                                        { key: 'logs', label: 'System Logs' },
                                        { key: 'settings', label: 'Settings' },
                                        { key: 'mobile_management', label: 'Mobile Management' }
                                    ].map(mod => (
                                        <label key={mod.key} className="flex items-center space-x-3 p-2 rounded-lg bg-primary/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-0"
                                                checked={userForm.permissions?.modules?.[mod.key] === true}
                                                onChange={(e) => {
                                                    const newModules = { ...userForm.permissions?.modules, [mod.key]: e.target.checked };
                                                    setUserForm({
                                                        ...userForm,
                                                        permissions: { ...userForm.permissions, modules: newModules }
                                                    });
                                                }}
                                            />
                                            <span className="text-xs text-slate-300 font-medium">{mod.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Action Permissions */}
                            <div>
                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1 mb-3 block">Actions (Awoodaha Waxqabadka)</label>
                                <div className="space-y-3">
                                    {[
                                        { key: 'record', label: 'Record Data (Diiwaangelin)', description: 'Can add new items, sales, etc.' },
                                        { key: 'edit', label: 'Edit Data (Wax ka baddal)', description: 'Can modify existing records.' },
                                        { key: 'delete', label: 'Delete Data (Masaxid)', description: 'Extreme: Can delete any records.' },
                                        { key: 'manage_users', label: 'Manage Users (Maamulka User-ka)', description: 'Can block/remove other users.' }
                                    ].map(action => (
                                        <label key={action.key} className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                                            userForm.permissions?.actions?.[action.key] 
                                                ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-500/5' 
                                                : 'bg-primary/30 border-slate-700 hover:bg-slate-800'
                                        }`}>
                                            <input 
                                                type="checkbox" 
                                                className="mt-1 w-5 h-5 rounded border-slate-700 text-blue-600 focus:ring-0"
                                                checked={userForm.permissions?.actions?.[action.key] === true}
                                                onChange={(e) => {
                                                    const newActions = { ...userForm.permissions?.actions, [action.key]: e.target.checked };
                                                    setUserForm({
                                                        ...userForm,
                                                        permissions: { ...userForm.permissions, actions: newActions }
                                                    });
                                                }}
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-white">{action.label}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{action.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
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
                            <span>Keydi Isbedelka</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
        
        {/* --- PRINT ONLY VIEW --- */}
        <div className="hidden print:block w-full min-h-screen bg-white text-black p-8 font-sans">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 1cm; size: landscape; }
                    body { -webkit-print-color-adjust: exact; background: white !important; }
                }
            `}} />

            <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                    <tr className="bg-slate-100 text-slate-900 uppercase text-[10px] font-black tracking-wider">
                        <th className="border border-slate-300 px-4 py-3">User</th>
                        <th className="border border-slate-300 px-4 py-3">Username</th>
                        <th className="border border-slate-300 px-4 py-3">Password</th>
                        <th className="border border-slate-300 px-4 py-3">Role</th>
                        <th className="border border-slate-300 px-4 py-3">Account Connection</th>
                        <th className="border border-slate-300 px-4 py-3">Online</th>
                        <th className="border border-slate-300 px-4 py-3">Last Exit</th>
                    </tr>
                </thead>
                <tbody className="text-xs font-medium text-slate-800">
                    {filteredUsers.map((u, i) => (
                        <tr key={i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                            <td className="border-r border-slate-300 px-4 py-3 font-bold">{u.full_name}</td>
                            <td className="border-r border-slate-300 px-4 py-3 font-mono text-blue-800">{u.username}</td>
                            <td className="border-r border-slate-300 px-4 py-3 font-mono">••••••••</td>
                            <td className="border-r border-slate-300 px-4 py-3 uppercase text-[10px] font-black tracking-wider text-slate-500">{u.role}</td>
                            <td className="border-r border-slate-300 px-4 py-3 text-center">
                                <span className={`uppercase font-bold text-[10px] tracking-wide ${u.is_enabled ? 'text-emerald-700' : 'text-rose-700'}`}>{u.is_enabled ? 'ENABLED' : 'DISABLED'}</span>
                            </td>
                            <td className="px-4 py-3 text-center uppercase font-bold text-[10px] text-slate-400">
                                {u.is_online ? 'ONLINE' : 'OFFLINE'}
                            </td>
                            <td className="px-4 py-3 border-l border-slate-300 font-mono text-[10px] text-slate-500">
                                {u.last_logout_at ? new Date(u.last_logout_at).toLocaleString() : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        </>
    );
};

export default UsersPage;
