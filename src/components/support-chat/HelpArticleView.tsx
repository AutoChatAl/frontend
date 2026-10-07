'use client';
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';

import { HELP_CATEGORIES, stripQuery, type HelpArticle } from './helpArticles';

interface HelpArticleViewProps {
  article: HelpArticle;
  pathname: string;
  onBack: () => void;
  onNavigate: (href: string) => void;
}

export default function HelpArticleView({ article, pathname, onBack, onNavigate }: HelpArticleViewProps) {
  const categoryLabel = HELP_CATEGORIES.find((category) => category.id === article.category)?.label ?? '';
  const linkRoute = stripQuery(article.link.href);
  const alreadyThere = pathname === linkRoute && !article.link.href.includes('?');

  return (
    <article className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        <ArrowLeft size={14}/>
        Voltar
      </button>

      <header className="space-y-1.5">
        {categoryLabel && (
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{categoryLabel}</p>
        )}
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">{article.title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">{article.summary}</p>
      </header>

      <ol className="space-y-2.5">
        {article.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
              aria-hidden
            >
              {index + 1}
            </span>
            <p className="pt-0.5 text-sm text-slate-700 dark:text-slate-300">{step}</p>
          </li>
        ))}
      </ol>

      {article.tip && (
        <Callout tone="info">
          <span className="flex items-start gap-2">
            <Lightbulb size={14} className="mt-0.5 shrink-0"/>
            <span>{article.tip}</span>
          </span>
        </Callout>
      )}

      {alreadyThere ? (
        <Callout tone="success">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={14} className="shrink-0"/>
            Você já está na tela certa. É só seguir os passos acima.
          </span>
        </Callout>
      ) : (
        <Button onClick={() => onNavigate(article.link.href)} className="w-full justify-center">
          Ir para {article.link.label}
          <ArrowRight size={16}/>
        </Button>
      )}
    </article>
  );
}
