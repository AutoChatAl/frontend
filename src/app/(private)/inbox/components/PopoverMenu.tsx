'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface PopoverMenuProps {
    /** Recebe o estado aberto para o gatilho poder se destacar quando o menu está visível. */
    trigger: (open: boolean) => ReactNode;
    children: (close: () => void) => ReactNode;
    /** Para onde o painel cresce. `up` é o caso da barra inferior. */
    side?: 'up' | 'down';
    align?: 'start' | 'end';
    widthClassName?: string;
    disabled?: boolean;
    label: string;
}

/**
 * Menu flutuante ancorado no gatilho: fecha ao clicar fora, no Esc e quando o
 * conteúdo pede. Mesma mecânica do dropdown de notificações do header.
 */
export default function PopoverMenu({
  trigger,
  children,
  side = 'down',
  align = 'start',
  widthClassName = 'w-64',
  disabled = false,
  label,
}: PopoverMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const position = [
    side === 'up' ? 'bottom-[calc(100%+0.5rem)]' : 'top-[calc(100%+0.5rem)]',
    align === 'end' ? 'right-0' : 'left-0',
  ].join(' ');

  return (<div ref={containerRef} className="relative">
    <button type="button" onClick={() => setOpen((prev) => !prev)} disabled={disabled} aria-haspopup="menu" aria-expanded={open} aria-label={label} className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
      {trigger(open)}
    </button>

    {open && (<div role="menu" aria-label={label} className={`absolute z-50 ${position} ${widthClassName} rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none overflow-hidden animate-dropdown`}>
      {children(() => setOpen(false))}
    </div>)}
  </div>);
}
