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
  // IMPORTANTE: o valor inicial precisa ser idêntico no servidor e no cliente,
  // senão a hidratação quebra. Por isso começamos sempre com `false` e só
  // lemos o localStorage dentro de useEffect (depois do mount).
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // No mount, lê a preferência salva
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
      }
    }
    setMounted(true);
  }, []);

  // Aplica a classe `dark` no <html> e persiste a preferência
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
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

  // SEMPRE renderiza os filhos — não retornamos `null` condicionalmente, pois
  // isso quebrava a hidratação (server enviava conteúdo, client renderizava
  // null, React esculhambava a reconciliação).
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('Falha ao carregar o tema.');
  }

  return context;
}
