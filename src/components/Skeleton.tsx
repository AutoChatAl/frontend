/**
 * Blocos de carregamento que imitam o formato do conteúdo que vai chegar.
 *
 * Um spinner centralizado diz "espere" e nada mais; o esqueleto já mostra a
 * forma da página, então a troca pelo conteúdo real não reposiciona nada e a
 * espera parece menor. Nasceu de três versões escritas à mão (lista da inbox,
 * cards do dashboard, canais) que divergiam na cor e no arredondamento.
 *
 * Todo bloco é `aria-hidden`: para o leitor de tela isto é decoração, e quem
 * anuncia o carregamento é o `aria-busy` da região que os contém.
 */

/** Cinza único dos blocos, no claro e no escuro. */
const BLOCK = 'bg-slate-100 dark:bg-slate-700/50';

interface SkeletonProps {
  className?: string;
}

/** Bloco cru. A medida vem por classe, como no resto do projeto. */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`${BLOCK} rounded-lg ${className}`} />;
}

/**
 * Linhas de texto. A última sai mais curta de propósito — parágrafo real quase
 * nunca termina na margem, e a diferença é o que faz o bloco parecer texto.
 */
export function SkeletonText({ lines = 3, className = '' }: SkeletonProps & { lines?: number }) {
  return (
    <div aria-hidden className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-3 rounded ${BLOCK} ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Linhas de lista, com ou sem avatar — contatos, conversas, campanhas. */
export function SkeletonRows({ count = 5, avatar = true, className = '' }: SkeletonProps & { count?: number; avatar?: boolean }) {
  return (
    <div aria-hidden className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-700/60">
          {avatar && <div className={`h-10 w-10 shrink-0 rounded-full ${BLOCK}`} />}
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`h-3 w-1/3 rounded ${BLOCK}`} />
            <div className={`h-2.5 w-2/3 rounded ${BLOCK}`} />
          </div>
          <div className={`h-6 w-16 shrink-0 rounded-full ${BLOCK}`} />
        </div>
      ))}
    </div>
  );
}

/** Grade de cards — canais, cupons, fluxos. */
export function SkeletonCards({ count = 3, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div aria-hidden className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-slate-100 p-4 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 shrink-0 rounded-lg ${BLOCK}`} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className={`h-3 w-2/3 rounded ${BLOCK}`} />
              <div className={`h-2.5 w-1/3 rounded ${BLOCK}`} />
            </div>
          </div>
          <div className={`h-2.5 w-full rounded ${BLOCK}`} />
          <div className={`h-2.5 w-4/5 rounded ${BLOCK}`} />
        </div>
      ))}
    </div>
  );
}

/** Faixa de métricas do topo de uma página. */
export function SkeletonStats({ count = 4, className = '' }: SkeletonProps & { count?: number }) {
  return (
    <div aria-hidden className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2.5 rounded-xl border border-slate-100 p-4 dark:border-slate-700/60">
          <div className={`h-2.5 w-1/2 rounded ${BLOCK}`} />
          <div className={`h-6 w-1/3 rounded ${BLOCK}`} />
          <div className={`h-2 w-2/3 rounded ${BLOCK}`} />
        </div>
      ))}
    </div>
  );
}

/** Tabela com cabeçalho. */
export function SkeletonTable({ rows = 6, columns = 4, className = '' }: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div aria-hidden className={`overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/60 ${className}`}>
      <div className="flex gap-4 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 dark:border-slate-700/60 dark:bg-slate-700/20">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className={`h-2.5 flex-1 rounded ${BLOCK}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-700/40">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className={`h-3 flex-1 rounded ${BLOCK}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Formulário — campos rotulados, como as abas de configuração. */
export function SkeletonForm({ fields = 4, className = '' }: SkeletonProps & { fields?: number }) {
  return (
    <div aria-hidden className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <div className={`h-2.5 w-24 rounded ${BLOCK}`} />
          <div className={`h-10 w-full rounded-xl ${BLOCK}`} />
        </div>
      ))}
    </div>
  );
}

/**
 * Casca de uma página inteira: título, subtítulo e o conteúdo que for passado.
 *
 * `aria-busy` fica aqui, na região que substitui a página — é o que anuncia o
 * carregamento uma vez só, em vez de um bloco decorativo por vez.
 */
export function SkeletonPage({ children, className = '' }: SkeletonProps & { children?: React.ReactNode }) {
  return (
    <div aria-busy="true" className={`w-full max-w-full animate-pulse space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className={`h-4 w-48 rounded ${BLOCK}`} />
        <div className={`h-2.5 w-72 max-w-full rounded ${BLOCK}`} />
      </div>
      {children}
    </div>
  );
}
