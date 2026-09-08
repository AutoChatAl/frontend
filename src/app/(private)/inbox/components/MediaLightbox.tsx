'use client';
import { ChevronLeft, ChevronRight, Download, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Uma foto ou vídeo da conversa, na ordem em que aparece na thread. */
export interface LightboxItem {
  messageId: string;
  kind: 'image' | 'video';
  src: string;
  fileName?: string | null;
  caption?: string;
  createdAt: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;
/** Passo do zoom por clique duplo — perto o bastante para ler um comprovante. */
const DOUBLE_CLICK_ZOOM = 2.5;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Visualizador em tela cheia das mídias da conversa.
 *
 * A navegação é sobre a lista inteira da thread, não só sobre a mídia clicada:
 * quem abre uma foto do meio de um álbum segue para as vizinhas com as setas,
 * como em qualquer galeria.
 */
export default function MediaLightbox({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: LightboxItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const current = items[index];
  const hasSiblings = items.length > 1;

  const resetView = useCallback(() => {
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((next: number) => {
    if (items.length === 0) return;
    // Circular: da última volta para a primeira, sem botão desabilitado no caminho.
    const wrapped = (next + items.length) % items.length;
    onIndexChange(wrapped);
    resetView();
  }, [items.length, onIndexChange, resetView]);

  // Zoom herdado da mídia anterior confundiria: cada item abre encaixado na tela.
  useEffect(() => {
    resetView();
  }, [current?.messageId, resetView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(index + 1);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(index - 1);
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        setZoom((z) => clampZoom(z + ZOOM_STEP));
        return;
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        setZoom((z) => clampZoom(z - ZOOM_STEP));
        return;
      }
      if (event.key === '0') {
        event.preventDefault();
        resetView();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goTo, index, onClose, resetView]);

  // A thread continua rolando atrás do overlay se o body não for travado.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  if (!current) return null;

  const zoomable = current.kind === 'image';
  const zoomed = zoomable && zoom > MIN_ZOOM;

  const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!zoomed || event.button !== 0) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset({
      x: drag.baseX + (event.clientX - drag.startX),
      y: drag.baseY + (event.clientY - drag.startY),
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!zoomable) return;
    event.preventDefault();
    setZoom((z) => {
      const next = clampZoom(z - Math.sign(event.deltaY) * ZOOM_STEP);
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDoubleClick = () => {
    if (!zoomable) return;
    if (zoomed) {
      resetView();
      return;
    }
    setZoom(DOUBLE_CLICK_ZOOM);
  };

  const controlButton = 'rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent';
  const arrowButton = 'absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.fileName || (current.kind === 'image' ? 'Imagem' : 'Vídeo')}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <header
        className="flex shrink-0 items-center gap-2 px-3 py-2.5 sm:px-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/90">
            {current.fileName || (current.kind === 'image' ? 'Imagem' : 'Vídeo')}
          </p>
          <p className="text-[11px] text-white/50">
            {new Date(current.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {hasSiblings && ` · ${index + 1} de ${items.length}`}
          </p>
        </div>
        {zoomable && (
          <>
            <button type="button" onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))} disabled={zoom <= MIN_ZOOM} className={controlButton} title="Diminuir zoom (−)">
              <Minus size={18} />
            </button>
            <span className="w-12 text-center text-xs tabular-nums text-white/60">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))} disabled={zoom >= MAX_ZOOM} className={controlButton} title="Aumentar zoom (+)">
              <Plus size={18} />
            </button>
            <button type="button" onClick={resetView} disabled={!zoomed} className={controlButton} title="Tamanho original (0)">
              <RotateCcw size={17} />
            </button>
          </>
        )}
        <a
          href={current.src}
          download={current.fileName || true}
          target="_blank"
          rel="noreferrer"
          className={controlButton}
          title="Baixar"
        >
          <Download size={18} />
        </a>
        <button type="button" onClick={onClose} className={controlButton} title="Fechar (Esc)" aria-label="Fechar">
          <X size={20} />
        </button>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-2 sm:px-14"
        onWheel={handleWheel}
      >
        {hasSiblings && (
          <>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); goTo(index - 1); }}
              className={`${arrowButton} left-1 sm:left-3`}
              aria-label="Mídia anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); goTo(index + 1); }}
              className={`${arrowButton} right-1 sm:right-3`}
              aria-label="Próxima mídia"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {current.kind === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element -- mídia de chat (CDN dinâmico / base64) não suporta next/image
          <img
            src={current.src}
            alt={current.fileName || 'Imagem'}
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={handleDoubleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
            className={`max-h-full max-w-full select-none object-contain transition-transform duration-100 ${zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
          />
        ) : (
          <video
            key={current.messageId}
            src={current.src}
            controls
            autoPlay
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full rounded-lg"
          />
        )}
      </div>

      {current.caption && (
        <p
          className="shrink-0 px-4 pb-4 text-center text-sm text-white/80"
          onClick={(event) => event.stopPropagation()}
        >
          {current.caption}
        </p>
      )}
    </div>
  );
}
