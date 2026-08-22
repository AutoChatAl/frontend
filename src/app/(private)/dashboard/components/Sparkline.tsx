'use client';
import { useEffect, useId, useRef, useState } from 'react';

interface Props {
    data: number[];
    /** Cor da linha/área (hex já resolvido para o tema atual). */
    color: string;
    height?: number;
}

/**
 * Mini-gráfico de linha com área em gradiente para cards de KPI.
 * Sem eixos, grid ou tooltip — apenas a forma da evolução.
 */
export default function Sparkline({ data, color, height = 36 }: Props) {
  const gradientId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el)
      return;
    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (entry)
        setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(...data, 1);
  const PAD_T = 3;
  const PAD_B = 1;
  const DOT_R = 2.5;
  const plotH = height - PAD_T - PAD_B;
  const plotW = Math.max(width - DOT_R * 2, 0);
  const getX = (i: number) => DOT_R + (i / (data.length - 1 || 1)) * plotW;
  const getY = (val: number) => PAD_T + plotH - (val / max) * plotH;

  const linePath = data
    .map((val, i) => {
      const x = getX(i);
      const y = getY(val);
      if (i === 0)
        return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const midX = (prevX + x) / 2;
      const prevY = getY(data[i - 1] ?? 0);
      return `C ${midX} ${prevY}, ${midX} ${y}, ${x} ${y}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${height - PAD_B} L ${getX(0)} ${height - PAD_B} Z`;
  const lastValue = data[data.length - 1] ?? 0;

  return (<div ref={containerRef} className="w-full" style={{ height }} aria-hidden>
    {width > 0 && data.length > 1 && (<svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25}/>
          <stop offset="100%" stopColor={color} stopOpacity={0.02}/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none"/>
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={getX(data.length - 1)} cy={getY(lastValue)} r={DOT_R} fill={color} strokeWidth={1.5} className="stroke-white dark:stroke-slate-800"/>
    </svg>)}
  </div>);
}
