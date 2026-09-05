'use client';
import { Lock } from 'lucide-react';
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { FlowEdge, FlowNode, FlowNodeKind } from '@/types/Flow';

import {
  HANDLE_HEIGHT,
  HEADER_HEIGHT,
  NODE_WIDTH,
  PREVIEW_HEIGHT,
  blockMeta,
  handleOffsetY,
  nodeHeight,
  nodePreview,
  outputHandles,
} from './blocks';

interface FlowCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedId: string | null;
  /** Saída armada, aguardando o clique no bloco de destino. */
  linking: { nodeId: string; handleId: string } | null;
  onSelect: (nodeId: string | null) => void;
  onMoveNode: (nodeId: string, x: number, y: number) => void;
  onDropBlock: (kind: FlowNodeKind, x: number, y: number) => void;
  onStartLink: (nodeId: string, handleId: string) => void;
  onCompleteLink: (targetNodeId: string) => void;
  onRemoveEdge: (edgeId: string) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  /** Falso deixa o card que depende de IA marcado como inativo. */
  hasAiPlan: boolean;
}

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 1.4;
const ZOOM_STEP = 0.15;

const CANVAS_SIZE = { width: 2600, height: 1800 };

function handlePoint(node: FlowNode, handleIndex: number): { x: number; y: number } {
  return { x: node.x + NODE_WIDTH, y: node.y + handleOffsetY(node, handleIndex) };
}

/** Entrada do bloco: meio da borda esquerda. */
function entryPoint(node: FlowNode): { x: number; y: number } {
  return { x: node.x, y: node.y + nodeHeight(node) / 2 };
}

function edgePath(start: { x: number; y: number }, end: { x: number; y: number }): string {
  const curve = Math.max(48, Math.abs(end.x - start.x) / 2);
  return `M ${start.x} ${start.y} C ${start.x + curve} ${start.y}, ${end.x - curve} ${end.y}, ${end.x} ${end.y}`;
}

export default function FlowCanvas({
  nodes,
  edges,
  selectedId,
  linking,
  onSelect,
  onMoveNode,
  onDropBlock,
  onStartLink,
  onCompleteLink,
  onRemoveEdge,
  scale,
  onScaleChange,
  hasAiPlan,
}: FlowCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  // Arrasto do fundo: guarda de onde a vista partiu para aplicar o delta.
  const panOrigin = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [panning, setPanning] = useState(false);

  const pointToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }, [scale]);

  const handleNodePointerDown = (event: ReactPointerEvent<HTMLDivElement>, node: FlowNode) => {
    event.stopPropagation();
    onSelect(node.id);
    const point = pointToCanvas(event.clientX, event.clientY);
    dragOffset.current = { x: point.x - node.x, y: point.y - node.y };
    setDraggingId(node.id);
  };

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    panOrigin.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    setPanning(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pan = panOrigin.current;
    if (pan && viewportRef.current) {
      viewportRef.current.scrollLeft = pan.scrollLeft - (event.clientX - pan.x);
      viewportRef.current.scrollTop = pan.scrollTop - (event.clientY - pan.y);
      return;
    }
    if (!draggingId) return;
    const point = pointToCanvas(event.clientX, event.clientY);
    onMoveNode(
      draggingId,
      Math.max(0, point.x - dragOffset.current.x),
      Math.max(0, point.y - dragOffset.current.y),
    );
  };

  const stopDragging = () => {
    setDraggingId(null);
    panOrigin.current = null;
    setPanning(false);
  };

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={viewportRef}
        className={`h-full overflow-auto rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 ${
          panning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerLeave={stopDragging}
      >
        {/* Wrapper com o tamanho já escalado, para a rolagem acompanhar o zoom. */}
        <div style={{ width: CANVAS_SIZE.width * scale, height: CANVAS_SIZE.height * scale }}>
          <div
            ref={surfaceRef}
            style={{
              width: CANVAS_SIZE.width,
              height: CANVAS_SIZE.height,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
            className="relative bg-[radial-gradient(circle,rgb(203_213_225)_1px,transparent_1px)] bg-[size:22px_22px] dark:bg-[radial-gradient(circle,rgb(51_65_85)_1px,transparent_1px)]"
            onPointerDown={startPan}
            onClick={() => onSelect(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const kind = event.dataTransfer.getData('application/synq-block') as FlowNodeKind;
              if (!kind) return;
              const point = pointToCanvas(event.clientX, event.clientY);
              onDropBlock(kind, Math.max(0, point.x - NODE_WIDTH / 2), Math.max(0, point.y - 24));
            }}
          >
            {/* Ligações atrás dos cards, para o traço não passar por cima do texto. */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {edges.map((edge) => {
                const from = nodes.find((node) => node.id === edge.from);
                const to = nodes.find((node) => node.id === edge.to);
                if (!from || !to) return null;
                const handles = outputHandles(from);
                const index = Math.max(0, handles.findIndex((handle) => handle.id === (edge.fromHandle ?? 'next')));
                const path = edgePath(handlePoint(from, index), entryPoint(to));
                return (
                  <g key={edge.id} className="pointer-events-auto">
                    <path d={path} fill="none" strokeWidth={2} className="stroke-slate-300 dark:stroke-slate-600" />
                    {/* Alvo grosso e invisível: acertar uma curva de 2px no mouse é ruim. */}
                    <path
                      d={path}
                      fill="none"
                      strokeWidth={16}
                      stroke="transparent"
                      className="cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveEdge(edge.id);
                      }}
                    >
                      <title>Clique para remover a ligação</title>
                    </path>
                  </g>
                );
              })}
            </svg>

            {nodes.map((node) => {
              const meta = blockMeta(node.kind);
              // Fluxo montado com plano de IA que depois caiu: o card avisa por
              // que o desenho parou de funcionar, em vez de falhar em silêncio.
              const aiLocked = meta.requiresAi === true && !hasAiPlan;
              const handles = outputHandles(node);
              const preview = nodePreview(node);
              const isSelected = node.id === selectedId;
              const isLinkTarget = linking !== null && linking.nodeId !== node.id;

              return (
                <div
                  key={node.id}
                  style={{ left: node.x, top: node.y, width: NODE_WIDTH }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isLinkTarget) onCompleteLink(node.id);
                    else onSelect(node.id);
                  }}
                  className={`absolute rounded-xl border bg-white transition-colors dark:bg-slate-800 ${
                    isSelected
                      ? 'border-indigo-400 ring-2 ring-indigo-500/20'
                      : isLinkTarget
                        ? 'cursor-pointer border-indigo-300 ring-2 ring-indigo-500/10'
                        : aiLocked
                          ? 'border-dashed border-slate-300 dark:border-slate-600'
                          : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div
                    onPointerDown={(event) => handleNodePointerDown(event, node)}
                    style={{ height: HEADER_HEIGHT }}
                    className={`flex flex-col justify-center px-3.5 ${
                      draggingId === node.id ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  >
                    <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${meta.tint}`}>
                      {meta.label}
                      {aiLocked && (
                        <Lock
                          size={11}
                          className="shrink-0 text-slate-400 dark:text-slate-500"
                          aria-label="Requer plano de IA"
                        />
                      )}
                    </span>
                    <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                      {node.label}
                    </p>
                  </div>

                  {preview && (
                    <div style={{ height: PREVIEW_HEIGHT }} className="px-3 pb-1">
                      <div className="h-full overflow-hidden rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-900/60">
                        <p className="line-clamp-3 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                          {preview}
                        </p>
                      </div>
                    </div>
                  )}

                  {handles.map((handle) => (
                    <button
                      key={handle.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onStartLink(node.id, handle.id);
                      }}
                      style={{ height: HANDLE_HEIGHT }}
                      className={`relative flex w-full items-center border-t border-slate-100 px-3.5 text-[11px] transition-colors dark:border-slate-700/70 ${
                        linking?.nodeId === node.id && linking.handleId === handle.id
                          ? 'font-semibold text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate pr-3">{handle.label}</span>
                      {/* Ponto sobre a borda direita, de onde a curva sai. */}
                      <span
                        style={{ top: HANDLE_HEIGHT / 2 }}
                        className={`absolute right-0 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full ring-2 ring-white dark:ring-slate-800 ${
                          linking?.nodeId === node.id && linking.handleId === handle.id
                            ? 'bg-indigo-500'
                            : meta.dot
                        }`}
                      />
                    </button>
                  ))}

                  {handles.length === 0 && (
                    <p
                      style={{ height: HANDLE_HEIGHT }}
                      className="flex items-center border-t border-slate-100 px-3.5 text-[11px] text-slate-400 dark:border-slate-700/70 dark:text-slate-500"
                    >
                  Fim do fluxo
                    </p>
                  )}
                </div>
              );
            })}

            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-32">
                <p className="max-w-xs text-center text-sm text-slate-400 dark:text-slate-500">
              Arraste um bloco da lista ao lado para começar o fluxo.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div
        onPointerDown={(event) => event.stopPropagation()}
        className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
      >
        <button
          type="button"
          onClick={() => onScaleChange(Math.max(ZOOM_MIN, scale - ZOOM_STEP))}
          disabled={scale <= ZOOM_MIN}
          aria-label="Diminuir zoom"
          className="h-7 w-7 cursor-pointer rounded-md text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onScaleChange(1)}
          className="min-w-12 cursor-pointer rounded-md px-1 text-[11px] font-semibold tabular-nums text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          type="button"
          onClick={() => onScaleChange(Math.min(ZOOM_MAX, scale + ZOOM_STEP))}
          disabled={scale >= ZOOM_MAX}
          aria-label="Aumentar zoom"
          className="h-7 w-7 cursor-pointer rounded-md text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
