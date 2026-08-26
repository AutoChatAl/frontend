'use client';
import Image from 'next/image';

interface BrandLogoProps {
    /** Lado do quadrado, em px. */
    size?: number;
    /**
     * Superfície onde o logo vai ficar. O roxo da marca é escuro (#301070) e
     * some em fundo escuro, então ali o traço é clareado.
     * - `auto`: acompanha o tema da página (padrão)
     * - `light`: sempre em cima de fundo claro, sem ajuste
     * - `dark`: sempre em cima de fundo escuro ou colorido
     */
    on?: 'auto' | 'light' | 'dark';
    /** Vazio quando o nome "Synq" já aparece do lado. */
    alt?: string;
    className?: string;
    priority?: boolean;
}
const BRIGHTNESS: Record<'auto' | 'light' | 'dark', string> = {
  auto: 'dark:brightness-[1.9]',
  light: '',
  dark: 'brightness-[1.9]',
};

/** Marca do Synq. Um lugar só para trocar o arquivo ou mexer no ajuste de contraste. */
export default function BrandLogo({ size = 28, on = 'auto', alt = '', className = '', priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${BRIGHTNESS[on]} ${className}`}
    />
  );
}
