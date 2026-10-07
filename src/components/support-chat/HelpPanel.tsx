'use client';
import { Bot, ChevronRight, Search, Settings, ShoppingCart, Smartphone, Users, X, Zap, type LucideIcon } from 'lucide-react';

import CardEmptyState from '@/components/CardEmptyState';
import Input from '@/components/Input';

import type { HelpArticle, HelpCategory } from './helpArticles';
import HelpArticleView from './HelpArticleView';
import HelpContactCard from './HelpContactCard';
import type { HelpCategoryGroup } from './useHelpCenter';

const CATEGORY_ICONS: Record<HelpCategory, LucideIcon> = {
  channels: Smartphone,
  automations: Zap,
  ai: Bot,
  sales: ShoppingCart,
  contacts: Users,
  account: Settings,
};

const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400';

interface HelpPanelProps {
  pathname: string;
  query: string;
  onQueryChange: (value: string) => void;
  results: HelpArticle[];
  suggestions: HelpArticle[];
  groups: HelpCategoryGroup[];
  activeArticle: HelpArticle | null;
  onOpenArticle: (id: string) => void;
  onCloseArticle: () => void;
  onNavigate: (href: string) => void;
  onTalkToSupport: (context: string | null) => void;
  whatsappLinkFor: (topic: string | null) => string | null;
  chatAvailable: boolean;
}

function ArticleCard({ article, onOpen }: { article: HelpArticle; onOpen: (id: string) => void }) {
  const Icon = CATEGORY_ICONS[article.category];
  return (
    <button
      type="button"
      onClick={() => onOpen(article.id)}
      className="group flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        <Icon size={16}/>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900 dark:text-white">{article.title}</span>
        <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500 dark:text-slate-400">{article.summary}</span>
      </span>
      <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400"/>
    </button>
  );
}

function ArticleLink({ article, onOpen }: { article: HelpArticle; onOpen: (id: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(article.id)}
        className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400"
      >
        <span className="min-w-0">{article.title}</span>
        <ChevronRight size={14} className="shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600 dark:group-hover:text-indigo-400"/>
      </button>
    </li>
  );
}

export default function HelpPanel({
  pathname,
  query,
  onQueryChange,
  results,
  suggestions,
  groups,
  activeArticle,
  onOpenArticle,
  onCloseArticle,
  onNavigate,
  onTalkToSupport,
  whatsappLinkFor,
  chatAvailable,
}: HelpPanelProps) {
  const searching = query.trim().length > 0;

  if (activeArticle) {
    const context = `Li o artigo "${activeArticle.title}" e ainda tenho uma dúvida: `;
    return (
      <div className="space-y-5 p-4">
        <HelpArticleView article={activeArticle} pathname={pathname} onBack={onCloseArticle} onNavigate={onNavigate}/>
        <HelpContactCard
          onTalkToSupport={() => onTalkToSupport(context)}
          whatsappLink={whatsappLinkFor(activeArticle.title)}
          chatAvailable={chatAvailable}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <Input
        type="text"
        enterKeyHint="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Qual é a sua dúvida? Ex.: conectar WhatsApp"
        aria-label="Buscar nos artigos de ajuda"
        leftIcon={<Search size={16}/>}
        rightElement={searching ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Limpar busca"
            className="flex rounded-md p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={14}/>
          </button>
        ) : undefined}
      />

      {searching ? (
        <section className="space-y-2">
          <p className={SECTION_LABEL}>
            {results.length === 0
              ? 'Nenhum artigo encontrado'
              : `${results.length} ${results.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}`}
          </p>
          {results.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
              <CardEmptyState
                message="Tente outras palavras, como “QR Code”, “Instagram” ou “automação”."
                action={chatAvailable ? (
                  <button
                    type="button"
                    onClick={() => onTalkToSupport(`Procurei por "${query.trim()}" na ajuda e não achei. Minha dúvida: `)}
                    className="mt-1 text-[13px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Perguntar para a nossa equipe
                  </button>
                ) : undefined}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((article) => <ArticleCard key={article.id} article={article} onOpen={onOpenArticle}/>)}
            </div>
          )}
        </section>
      ) : (
        <>
          {suggestions.length > 0 && (
            <section className="space-y-2">
              <p className={SECTION_LABEL}>Sugestões para esta tela</p>
              <div className="space-y-2">
                {suggestions.map((article) => <ArticleCard key={article.id} article={article} onOpen={onOpenArticle}/>)}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <p className={SECTION_LABEL}>Todos os assuntos</p>
            {groups.map((group) => {
              const Icon = CATEGORY_ICONS[group.id];
              return (
                <div key={group.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-700">
                    <Icon size={14} className="text-indigo-600 dark:text-indigo-400"/>
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{group.label}</h5>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                    {group.articles.map((article) => <ArticleLink key={article.id} article={article} onOpen={onOpenArticle}/>)}
                  </ul>
                </div>
              );
            })}
          </section>
        </>
      )}

      <HelpContactCard
        onTalkToSupport={() => onTalkToSupport(null)}
        whatsappLink={whatsappLinkFor(null)}
        chatAvailable={chatAvailable}
      />
    </div>
  );
}
