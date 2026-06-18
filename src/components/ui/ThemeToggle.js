'use client';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const isLight = document.documentElement.classList.contains('light');
        setTheme(isLight ? 'light' : 'dark');
    }, []);

    const toggleTheme = () => {
        if (theme === 'dark') {
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
            setTheme('light');
        } else {
            document.documentElement.classList.remove('light');
            localStorage.setItem('theme', 'dark');
            setTheme('dark');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-md flex items-center justify-center"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                <Sun size={18} className="text-amber-500" />
            ) : (
                <Moon size={18} className="text-blue-400" />
            )}
        </button>
    );
}
