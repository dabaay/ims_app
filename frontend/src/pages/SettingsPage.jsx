import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTheme } from '../context/useTheme';
import { useSettings } from '../context/SettingsContextDef';
import Modal from '../components/Modal';
import { 
    Settings as SettingsIcon, 
    User, 
    Bell, 
    Shield, 
    Database, 
    Globe, 
    HardDrive,
    Save,
    CreditCard,
    ChevronRight,
    Loader2,
    Lock,
    Eye,
    EyeOff,
    Facebook,
    Instagram,
    MessageCircle,
    Music2,
    Upload,
    Trash2,
    Store,
    History
} from 'lucide-react';

const SettingsSection = ({ title, description, children }) => (
    <div className="bg-secondary/40 border border-slate-700 p-8 rounded-3xl backdrop-blur-sm space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700/30 pb-4 mb-2">
            <div>
                <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
                <p className="text-slate-400 text-sm">{description}</p>
            </div>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const Toggle = ({ label, enabled, onChange }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-slate-300 font-medium">{label}</span>
        <button 
            onClick={() => onChange(!enabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : ''}`}></div>
        </button>
    </div>
);

const SettingsPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme, colorTheme, changeColorTheme } = useTheme();
    const { refreshSettings } = useSettings();
    const [notifications, setNotifications] = useState(true);
    const [lowStockAlert, setLowStockAlert] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Store Settings State
    const [storeSettings, setStoreSettings] = useState({
        store_name: "Somali Official POS",
        store_address: "Main Street, Mogadishu, Somalia",
        store_number: "+252 61XXXXXXX",
        store_logo: null,
        tiktok_handle: "@somali_store",
        tiktok_show: true,
        facebook_handle: "somali.store",
        facebook_show: true,
        instagram_handle: "somali_store",
        instagram_show: true,
        whatsapp_number: "+252 61XXXXXXX",
        whatsapp_show: true,
        show_social_labels: true,
        app_version: "1.0.0",
        app_download_url: "",
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    // Password change state
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passLoading, setPassLoading] = useState(false);
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            const settings = response.data;
            setStoreSettings(prev => ({ ...prev, ...settings }));
            
            if (settings.store_logo) {
                setLogoPreview(`http://localhost:8000/storage/${settings.store_logo}`);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    const handleStoreSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            
            // Append all settings
            Object.keys(storeSettings).forEach(key => {
                if (key !== 'store_logo') {
                    formData.append(key, storeSettings[key]);
                }
            });

            // Append logo if new file selected
            if (logoFile) {
                formData.append('store_logo', logoFile);
            }

            await api.post('/settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            fetchSettings(); // Refresh local settings
            refreshSettings(); // Refresh global context settings
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPassError('Password-ada cusub isuma midna.');
            return;
        }

        setPassLoading(true);
        try {
            await api.post('/change-password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setPassSuccess('Password-ka waa la bedelay!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setTimeout(() => setIsPasswordModalOpen(false), 2000);
        } catch (error) {
            setPassError(error.response?.data?.message || 'Khalad ayaa dhacay.');
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                        <SettingsIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">Dookhyada (Settings)</h1>
                        <p className="text-slate-400">Habaynta nidaamka iyo xogta dukaanka.</p>
                    </div>
                </div>
                <button 
                    onClick={handleStoreSave}
                    disabled={saving}
                    className={`flex items-center space-x-2 px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${
                        saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'
                    } text-white shadow-blue-500/20`}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span className="uppercase tracking-widest text-xs">{saved ? 'Waa la keydiyay!' : 'Keydi Dhammaan'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Store Branding Section */}
                <SettingsSection 
                    title="Astaanta Dukaanka (Branding)" 
                    description="Xogta rasmiga ah ee ka muuqanaysa dhammaan waraaqaha iyo warbixinada."
                >
                    <div className="flex flex-col md:flex-row gap-10 items-start">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative group">
                                <div className="w-40 h-40 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-500/50">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <Store size={40} className="mx-auto text-slate-600 mb-2" />
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">No Logo Uploaded</p>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 cursor-pointer bg-blue-600/0 hover:bg-blue-600/40 flex items-center justify-center transition-all group-hover:opacity-100 opacity-0 rounded-3xl">
                                    <input type="file" className="hidden" onChange={handleLogoChange} accept="image/*" />
                                    <Upload className="text-white" size={24} />
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Store Logo (1:1 Recommended)</p>
                        </div>

                        <div className="flex-1 grid grid-cols-1 gap-6 w-full">
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1">Store Name</label>
                                <input 
                                    type="text" 
                                    value={storeSettings.store_name}
                                    onChange={(e) => setStoreSettings({...storeSettings, store_name: e.target.value})}
                                    placeholder="Enter Official Store Name"
                                    className="w-full bg-primary/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1">Physical Address</label>
                                <input 
                                    type="text" 
                                    value={storeSettings.store_address}
                                    onChange={(e) => setStoreSettings({...storeSettings, store_address: e.target.value})}
                                    placeholder="e.g. Main Street, Mogadishu, Somalia"
                                    className="w-full bg-primary/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1">Contact Number</label>
                                <input 
                                    type="text" 
                                    value={storeSettings.store_number}
                                    onChange={(e) => setStoreSettings({...storeSettings, store_number: e.target.value})}
                                    placeholder="+252 XXXXXXX"
                                    className="w-full bg-primary/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* Social Media Presence */}
                <SettingsSection 
                    title="Baraha Bulshada (Social Media)" 
                    description="Ku dar barahaaga bulshada si ay ugu muuqdaan hoose ee warbixinada."
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-primary/20 p-6 rounded-3xl border border-slate-700/30">
                        {/* TikTok */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-slate-400">
                                    <Music2 size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">TikTok Handle</span>
                                </div>
                                <Toggle enabled={storeSettings.tiktok_show} onChange={(val) => setStoreSettings({...storeSettings, tiktok_show: val})} />
                            </div>
                            <input 
                                type="text" 
                                value={storeSettings.tiktok_handle}
                                onChange={(e) => setStoreSettings({...storeSettings, tiktok_handle: e.target.value})}
                                className="w-full bg-secondary/30 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Facebook */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-blue-400">
                                    <Facebook size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Facebook Handle</span>
                                </div>
                                <Toggle enabled={storeSettings.facebook_show} onChange={(val) => setStoreSettings({...storeSettings, facebook_show: val})} />
                            </div>
                            <input 
                                type="text" 
                                value={storeSettings.facebook_handle}
                                onChange={(e) => setStoreSettings({...storeSettings, facebook_handle: e.target.value})}
                                className="w-full bg-secondary/30 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Instagram */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-rose-400">
                                    <Instagram size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Instagram Handle</span>
                                </div>
                                <Toggle enabled={storeSettings.instagram_show} onChange={(val) => setStoreSettings({...storeSettings, instagram_show: val})} />
                            </div>
                            <input 
                                type="text" 
                                value={storeSettings.instagram_handle}
                                onChange={(e) => setStoreSettings({...storeSettings, instagram_handle: e.target.value})}
                                className="w-full bg-secondary/30 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-emerald-400">
                                    <MessageCircle size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp Number</span>
                                </div>
                                <Toggle enabled={storeSettings.whatsapp_show} onChange={(val) => setStoreSettings({...storeSettings, whatsapp_show: val})} />
                            </div>
                            <input 
                                type="text" 
                                value={storeSettings.whatsapp_number}
                                onChange={(e) => setStoreSettings({...storeSettings, whatsapp_number: e.target.value})}
                                className="w-full bg-secondary/30 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-700/30">
                            <Toggle label="Show Labels (TikTok, Facebook, etc.) next to icons" enabled={storeSettings.show_social_labels} onChange={(val) => setStoreSettings({...storeSettings, show_social_labels: val})} />
                        </div>
                    </div>
                </SettingsSection>

                {/* Appearance Settings */}
                <SettingsSection 
                    title="Muuqaalka (Appearance)" 
                    description="Xulo midabka iyo muuqaalka aad doorbideyso."
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-300 font-medium">Habka (Mode)</span>
                            <div className="flex items-center bg-primary/50 rounded-lg p-1 border border-white/10">
                                <button 
                                    onClick={() => theme === 'light' && toggleTheme()}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Dark
                                </button>
                                <button 
                                    onClick={() => theme === 'dark' && toggleTheme()}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Light
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-slate-300 font-medium block">Midabka (Accent Color)</span>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { id: 'blue', color: '#3b82f6', label: 'Blue' },
                                    { id: 'green', color: '#10b981', label: 'Green' },
                                    { id: 'purple', color: '#8b5cf6', label: 'Purple' },
                                    { id: 'orange', color: '#f97316', label: 'Orange' },
                                    { id: 'rose', color: '#f43f5e', label: 'Rose' },
                                    { id: 'cyan', color: '#06b6d4', label: 'Cyan' },
                                ].map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => changeColorTheme(c.id)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${colorTheme === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: c.color }}
                                        title={c.label}
                                    >
                                        {colorTheme === c.id && <div className="w-3 h-3 bg-white rounded-full" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection 
                    title="Wargelinta (Notifications)" 
                    description="Xakamee sida nidaamku kuu ogeysiinayo xogta."
                >
                    <Toggle label="Wargelinta Desktop-ka" enabled={notifications} onChange={setNotifications} />
                    <Toggle label="Ogeysiiska Alaabta Gabaabsi ah" enabled={lowStockAlert} onChange={setLowStockAlert} />
                </SettingsSection>

                {/* Security & System */}
                <SettingsSection 
                    title="Amniga & System-ka" 
                    description="Habaynta keydka xogta iyo xisaabaadka gaarka ah."
                >
                    <div className="space-y-4">
                        <button 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="w-full flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-2xl hover:bg-slate-800/50 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Shield size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-white font-bold">Bedel Password-ka</span>
                                    <span className="text-xs text-slate-500">Cusboonaysii amniga xisaabtaada</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-500" />
                        </button>

                        <button 
                            onClick={() => navigate('/logs')}
                            className="w-full flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-2xl hover:bg-slate-800/50 transition-all group"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                    <History size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-white font-bold">System Logs</span>
                                    <span className="text-xs text-slate-500">Sales, Expenses & Audit History</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-500" />
                        </button>
                    </div>
                </SettingsSection>

                {/* Mobile App Version */}
                <SettingsSection
                    title="📱 Mobile App Version"
                    description="Ku daabac nooca cusub ee app-ka oo ku dar link-ka APK-da si macaamiisha loogu ogeysiiyo update."
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                <HardDrive size={12} />
                                Current App Version
                            </label>
                            <input
                                type="text"
                                value={storeSettings.app_version}
                                onChange={(e) => setStoreSettings({ ...storeSettings, app_version: e.target.value })}
                                placeholder="e.g. 1.0.0"
                                className="w-full bg-primary/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold font-mono"
                            />
                            <p className="text-[11px] text-slate-500 pl-1">
                                Macaamiisha oo haysta nooc ka hooseeya will be prompted to update.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] pl-1 flex items-center gap-2">
                                <Globe size={12} />
                                APK Download URL
                            </label>
                            <input
                                type="url"
                                value={storeSettings.app_download_url}
                                onChange={(e) => setStoreSettings({ ...storeSettings, app_download_url: e.target.value })}
                                placeholder="https://yoursite.com/app.apk"
                                className="w-full bg-primary/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
                            />
                            <p className="text-[11px] text-slate-500 pl-1">
                                Direct link to the APK file or a Google Drive / hosting URL.
                            </p>
                        </div>
                    </div>

                    <div className="mt-2 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                        <Database size={16} className="text-blue-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-blue-300 text-xs font-bold mb-1">How it works</p>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                When a customer opens the app, their version is compared to the one set here.
                                If the server version is higher, a download dialog appears automatically.
                                Use semantic versioning: <span className="font-mono text-blue-300">1.0.0 → 1.1.0 → 2.0.0</span>.
                            </p>
                        </div>
                    </div>
                </SettingsSection>
            </div>

            {/* Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title="Bedel Password-ka"
            >
                <form onSubmit={handlePasswordChange} className="space-y-5">
                    {passError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl">{passError}</div>}
                    {passSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl">{passSuccess}</div>}
                    
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Password-ka Hadda</label>
                        <input 
                            required
                            type="password" 
                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Password-ka Cusub</label>
                        <input 
                            required
                            type="password" 
                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Xaqiiji Password-ka</label>
                        <input 
                            required
                            type="password" 
                            className="w-full bg-primary/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={passLoading}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                        >
                            {passLoading ? 'Waa la keydinayaa...' : 'Bedel Password'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SettingsPage;
