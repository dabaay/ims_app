import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/user');
            setUser(response.data);
        } catch {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const response = await api.post('/login', { username, password });
        localStorage.setItem('token', response.data.access_token);
        setUser(response.data.user);
        return response.data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const isAdmin = user?.role === 'admin';

    const hasPermission = (moduleKey) => {
        if (isAdmin) return true;
        return user?.permissions?.modules?.[moduleKey] === true;
    };

    const canDo = (action) => {
        if (isAdmin) return true;
        return user?.permissions?.actions?.[action] === true;
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, isAdmin, hasPermission, canDo }}>
            {children}
        </AuthContext.Provider>
    );
};
