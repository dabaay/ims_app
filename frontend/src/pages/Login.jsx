import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContextDef';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { settings } = useSettings();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const userData = await login(username, password);
            if (userData?.role === 'app_manager') {
                navigate('/mobile/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4 font-sans text-primary dark:text-white transition-colors duration-300">
            <div className="max-w-md w-full bg-secondary/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-(--border-color) animate-in fade-in zoom-in duration-300 transition-colors">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105 duration-300">
                        <LogIn size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2 tracking-tight text-primary dark:text-white">{settings.store_name}</h1>
                    <p className="text-secondary-text dark:text-slate-300 text-lg">Point of Sale System</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-secondary-text dark:text-slate-300 mb-2 px-1">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-text dark:text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-3 bg-primary/50 border border-(--border-color) rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none placeholder:text-secondary-text/50 text-primary dark:text-white"
                                placeholder="Gali magacaaga"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-text dark:text-slate-300 mb-2 px-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-text dark:text-slate-400 group-focus-within:text-blue-400 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                className="block w-full pl-11 pr-4 py-3 bg-primary/50 border border-(--border-color) rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none placeholder:text-secondary-text/50 text-primary dark:text-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:scale-100 rounded-xl font-bold transform transition-all active:scale-95 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>Gali Nidaamka</span>
                                <LogIn size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="fixed bottom-6 w-full text-center">
                <p className="text-slate-500 text-sm">Copyright © 2026 {settings.store_name}. All rights reserved.</p>
            </div>
        </div>
    );
};

export default Login;
