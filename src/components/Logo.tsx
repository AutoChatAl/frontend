import Image from 'next/image';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  /** Tamanho do ícone: sm (w-6), md (w-9) ou lg (w-12). */
  size?: LogoSize;
  /** Exibe o texto "Synq" ao lado do ícone. */
  showText?: boolean;
  /** Classes extras no wrapper. */
  className?: string;
  /** Classes extras na imagem (ex.: animações de hover). */
  imgClassName?: string;
  /** Sobrescreve a cor/estilo do texto. */
  textClassName?: string;
  /** Prioriza o carregamento da imagem (logos acima da dobra). */
  priority?: boolean;
}

const SIZE_MAP: Record<LogoSize, { box: string; px: number; text: string }> = {
  sm: { box: 'w-6 h-6', px: 24, text: 'text-base' },
  md: { box: 'w-8 h-8', px: 36, text: 'text-lg' },
  lg: { box: 'w-12 h-12', px: 48, text: 'text-2xl' },
};

export default function Logo({
  size = 'md',
  showText = true,
  className = '',
  imgClassName = '',
  textClassName = 'text-slate-900 dark:text-white',
  priority = false,
}: LogoProps) {
  const { box, px, text } = SIZE_MAP[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/icone.png"
        alt="Synq"
        width={px}
        height={px}
        priority={priority}
        className={`${box} object-contain shrink-0 ${imgClassName}`}
      />
      {showText && (
        <span className={`font-bold tracking-tight pb-1 ${text} ${textClassName}`}>Synq</span>
      )}
    </span>
  );
}
