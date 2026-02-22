import React, { useState, useEffect } from 'react';
import { translations } from './translations';
import { LanguageContext } from './LanguageContextDef';


export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(localStorage.getItem('language') || 'so');

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = (key) => {
        const keys = key.split('.');
        let translation = translations[language];
        
        for (const k of keys) {
            if (translation[k]) {
                translation = translation[k];
            } else {
                return key; // Fallback to key if not found
            }
        }
        return translation;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'so' ? 'en' : 'so');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
