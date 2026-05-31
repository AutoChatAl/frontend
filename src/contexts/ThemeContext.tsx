'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ThemeContextType {
    darkMode: boolean;
    toggleTheme: () => void;
    setDarkMode: (value: boolean) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
interface ThemeProviderProps {
    children: ReactNode;
}
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted)
      return;
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode, mounted]);
  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };
  const value: ThemeContextType = {
    darkMode,
    toggleTheme,
    setDarkMode,
  };

  return (<ThemeContext.Provider value={value}>
    {children}
  </ThemeContext.Provider>);
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('Falha ao carregar o tema.');
  }
  return context;
}
