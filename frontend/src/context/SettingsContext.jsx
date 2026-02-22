import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { SettingsContext } from './SettingsContextDef';

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        store_name: "Somali Official POS",
        store_address: "Main Street, Mogadishu, Somalia",
        store_number: "+252 61XXXXXXX",
        store_logo: null,
    });
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(prev => ({ ...prev, ...response.data }));
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const refreshSettings = () => {
        fetchSettings();
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
