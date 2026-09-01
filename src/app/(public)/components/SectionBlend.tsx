'use client';

interface SectionBlendProps {
  /** Borda da seção escura que recebe a rampa. */
  edge: 'top' | 'bottom';
}

// Rampa branco -> indigo -> noite aplicada nas bordas das seções escuras da landing.
// Todas as seções se encontram em branco puro (ver DESIGN_SYSTEM 9.6), então a seção
// escura "anoitece" a partir desse branco em vez de cortar em bloco. O último stop é
// slate-950 transparente para revelar o fundo real da seção por baixo.
// As classes ficam escritas por extenso porque o Tailwind lê o arquivo como texto.
const EDGE_CLASSES: Record<SectionBlendProps['edge'], string> = {
  top: 'top-0 bg-[linear-gradient(to_bottom,#ffffff_0%,#eef2ff_20%,#312e81_62%,rgba(2,6,23,0)_100%)]',
  bottom: 'bottom-0 bg-[linear-gradient(to_top,#ffffff_0%,#eef2ff_20%,#312e81_62%,rgba(2,6,23,0)_100%)]',
};

export default function SectionBlend({ edge }: SectionBlendProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 h-28 sm:h-36 ${EDGE_CLASSES[edge]}`}
    />
  );
}
