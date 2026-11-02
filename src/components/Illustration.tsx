'use client';
import Image from 'next/image';
import { useState } from 'react';

interface IllustrationProps {
    /** Arquivo em /public (ver DESIGN_SYSTEM.md §9.15). */
    src: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;
}

/**
 * Ilustração decorativa (fica fora da árvore de acessibilidade). Se o arquivo não existir ou
 * falhar, o espaço some em vez de mostrar imagem quebrada — a página não depende dela.
 */
export default function Illustration({ src, width, height, className = '', priority = false }: IllustrationProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      priority={priority}
      onError={() => setFailed(true)}
      className={`select-none object-contain ${className}`}
    />
  );
}
