'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

const useTheme = () => {
    // Initialize state from local storage or default to 'system'
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'system';
        }
        return 'system';
    });

    const setAppTheme = useCallback((newTheme: Theme) => {
        setTheme(newTheme);
        if (newTheme === 'system') {
            localStorage.removeItem('theme');
        } else {
            localStorage.setItem('theme', newTheme);
        }
    }, []);

    const isDarkMode = useMemo(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        
        // System theme check
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false; 
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;
        
        if (isDarkMode) {
            root.classList.add('dark-mode');
        } else {
            root.classList.remove('dark-mode');
        }
        
        root.setAttribute('data-theme', theme);
    }, [isDarkMode, theme]);

    return { theme, isDarkMode, setAppTheme };
};

export default useTheme;
