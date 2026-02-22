import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Phone, Clock, Key, Save, Activity, Calendar, Lock } from 'lucide-react';

const ProfilePage = () => {
    const { user, setUser, isAdmin } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile');
            setProfile(response.data);
            setFormData({
                full_name: response.data.user.full_name,
                email: response.data.user.email || '',
                phone: response.data.user.phone || '',
                current_password: '',
                new_password: '',
                new_password_confirmation: ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        
        if (formData.new_password && formData.new_password !== formData.new_password_confirmation) {
            alert('New passwords do not match!');
            setSaving(false);
            return;
        }

        try {
            const response = await api.put('/profile', formData);
            alert('Profile updated successfully!');
            setUser(response.data.user); // Update context
            setFormData(prev => ({ ...prev, current_password: '', new_password: '', new_password_confirmation: '' }));
        } catch (error) {
            console.error('Update failed:', error);
            alert(error.response?.data?.message || 'Update failed.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white mb-6">Profile-kaaga (Your Profile)</h1>

            {(!isAdmin && user?.role !== 'app_manager') && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <Lock className="text-amber-500" size={20} />
                    <p className="text-amber-200 text-sm font-medium">
                        Shaqaale ahaan, waxaad bedeli kartaa kaliya password-kaaga. (As staff, you can only change your password.)
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-secondary/40 border border-slate-700 p-6 rounded-3xl backdrop-blur-sm shadow-xl flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-4 shadow-lg shadow-blue-600/20">
                            {user?.full_name?.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold text-white mb-1">{user?.full_name}</h2>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest">
                            {user?.role?.replace('_', ' ')}
                        </span>
                        
                        <div className="w-full border-t border-slate-700 my-6"></div>

                        <div className="w-full space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Joined</span>
                                <span className="text-white font-mono text-sm">{profile?.stats?.joined_at}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Total Hours Worked</span>
                                <span className="text-emerald-400 font-bold font-mono">{profile?.stats?.total_hours_worked} hrs</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2">
                    <div className="bg-secondary/40 border border-slate-700 p-8 rounded-3xl backdrop-blur-sm shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-blue-500" />
                            Personal Information
                        </h3>
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            className={`w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={formData.full_name}
                                            onChange={(e) => isAdmin && setFormData({...formData, full_name: e.target.value})}
                                            readOnly={!isAdmin}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            className={`w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={formData.phone}
                                            onChange={(e) => isAdmin && setFormData({...formData, phone: e.target.value})}
                                            readOnly={!isAdmin}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="email" 
                                            className={`w-full pl-12 pr-4 py-3 bg-primary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            value={formData.email}
                                            onChange={(e) => isAdmin && setFormData({...formData, email: e.target.value})}
                                            readOnly={!isAdmin}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-700 pt-6 mt-2">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Key size={20} className="text-amber-500" />
                                    Change Password
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">New Password (Optional)</label>
                                        <input 
                                            type="password" 
                                            className="w-full px-4 py-3 bg-primary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            value={formData.new_password}
                                            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                                            minLength={6}
                                        />
                                    </div>
                                    {formData.new_password && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Confirm New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-3 bg-primary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    value={formData.new_password_confirmation}
                                                    onChange={(e) => setFormData({...formData, new_password_confirmation: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-slate-500 font-bold uppercase tracking-widest pl-1">Current Password (Required)</label>
                                                <input 
                                                    type="password" 
                                                    className="w-full px-4 py-3 bg-primary/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    value={formData.current_password}
                                                    onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-secondary/40 border border-slate-700 p-8 rounded-3xl backdrop-blur-sm shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-emerald-500" />
                    Recent Activity
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">IP Address</th>
                                <th className="px-6 py-4">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {profile?.stats?.recent_activity?.length > 0 ? (
                                profile.stats.recent_activity.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                log.action === 'login' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300 text-sm">{new Date(log.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-slate-400 text-xs font-mono">{log.ip_address}</td>
                                        <td className="px-6 py-4 text-slate-400 text-xs">
                                            {log.action === 'logout' ? `${log.active_hours} hrs active` : '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No recent activity found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
