'use client';

import { useLayoutEffect } from 'react';

function applySavedTheme(): void {
  try {
    const saved = localStorage.getItem('theme');
    const root = document.documentElement;
    if (saved === 'dark') {
      root.classList.add('dark');
    }
    else {
      root.classList.remove('dark');
    }
  }
  catch {
    // Sem acesso ao armazenamento, o shell segue no tema claro.
  }
}

export default function AuthThemeSync() {
  useLayoutEffect(() => {
    applySavedTheme();
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);
  return null;
}
