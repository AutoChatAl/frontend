'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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

/** Distância entre o gatilho e o painel. */
const GAP = 8;
/** Folga mínima até a borda da janela, para o painel nunca encostar no limite. */
const MARGIN = 8;

/**
 * Menu flutuante ancorado no gatilho: fecha ao clicar fora, no Esc e quando o
 * conteúdo pede. Mesma mecânica do dropdown de notificações do header.
 *
 * O painel vai para um portal no `body` em vez de ficar posicionado dentro do
 * gatilho: as colunas da inbox são cartões com `overflow-hidden`, e um painel
 * absoluto ali dentro era recortado na borda da coluna — abrindo a partir da
 * barra inferior, o menu aparecia cortado ao meio.
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
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const anchor = containerRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) {
      return;
    }
    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const rawTop = side === 'up' ? a.top - p.height - GAP : a.bottom + GAP;
    const rawLeft = align === 'end' ? a.right - p.width : a.left;
    // Prende dentro da janela: fora do fluxo do cartão, nada mais impede o
    // painel de escapar da tela quando o gatilho está perto da borda.
    const top = Math.max(MARGIN, Math.min(rawTop, window.innerHeight - p.height - MARGIN));
    const left = Math.max(MARGIN, Math.min(rawLeft, window.innerWidth - p.width - MARGIN));
    setCoords((prev) => (prev && prev.top === top && prev.left === left ? prev : { top, left }));
  }, [side, align]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // O painel não é mais descendente do gatilho: sem checar os dois, o
      // clique dentro do próprio menu fecharia o menu.
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    // `capture` para acompanhar também a rolagem das colunas internas, não só a da janela.
    const handleReflow = () => reposition();
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleReflow, true);
    window.addEventListener('resize', handleReflow);
    const observer = new ResizeObserver(handleReflow);
    if (panelRef.current) {
      observer.observe(panelRef.current);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleReflow, true);
      window.removeEventListener('resize', handleReflow);
      observer.disconnect();
    };
  }, [open, reposition]);

  return (<div ref={containerRef} className="relative">
    <button type="button" onClick={() => setOpen((prev) => !prev)} disabled={disabled} aria-haspopup="menu" aria-expanded={open} aria-label={label} className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
      {trigger(open)}
    </button>

    {open && createPortal(
      <div
        ref={panelRef}
        role="menu"
        aria-label={label}
        // Primeira renderização serve só para medir o painel — escondido, para
        // não piscar no canto antes de a posição final ser calculada.
        style={{ top: coords?.top ?? 0, left: coords?.left ?? 0, visibility: coords ? 'visible' : 'hidden' }}
        className={`fixed z-50 ${widthClassName} rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm dark:shadow-none overflow-hidden animate-dropdown`}
      >
        {children(() => setOpen(false))}
      </div>,
      document.body,
    )}
  </div>);
}
