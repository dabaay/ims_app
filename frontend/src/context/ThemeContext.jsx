import React, { useState, useEffect } from 'react';
import { ThemeContext } from './ThemeContextDef';

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or default to 'dark'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    // Initialize color theme from localStorage or default to 'blue'
    const [colorTheme, setColorTheme] = useState(localStorage.getItem('colorTheme') || 'blue');

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Remove old classes
        root.classList.remove('light', 'dark');
        root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-rose', 'theme-cyan');

        // Add new classes
        root.classList.add(theme);
        root.classList.add(`theme-${colorTheme}`);

        // Save to localStorage
        localStorage.setItem('theme', theme);
        localStorage.setItem('colorTheme', colorTheme);
    }, [theme, colorTheme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const changeColorTheme = (color) => {
        setColorTheme(color);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colorTheme, changeColorTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
