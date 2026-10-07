'use client';
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Textarea from '@/components/Textarea';
import { BUSINESS_TYPE_LABELS, type BusinessType } from '@/types/BusinessType';

import { RECIPE_DESTINATION_LABEL, type AutomationRecipe } from '../recipes';

interface RecipeGalleryProps {
  recipes: AutomationRecipe[];
  businessType: BusinessType | null;
  onPick: (recipe: AutomationRecipe) => void;
  onDescribe: (description: string) => void;
  describing: boolean;
  describeError: string | null;
  onDescribeChange?: () => void;
  initialVisible?: number;
  className?: string;
}

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 600;

export default function RecipeGallery({
  recipes,
  businessType,
  onPick,
  onDescribe,
  describing,
  describeError,
  onDescribeChange,
  initialVisible = 6,
  className = '',
}: RecipeGalleryProps) {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState('');
  const [localError, setLocalError] = useState('');

  const visible = expanded ? recipes : recipes.slice(0, initialVisible);
  const hidden = recipes.length - visible.length;

  const submit = () => {
    const text = description.trim();
    if (text.length < DESCRIPTION_MIN) {
      setLocalError('Conte um pouco mais: o que a pessoa faz e o que ela deve receber.');
      return;
    }
    setLocalError('');
    onDescribe(text);
  };

  return (
    <Card className={`p-4 sm:p-5 ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">O que você quer automatizar?</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {businessType
              ? `Escolha um objetivo. As sugestões para ${BUSINESS_TYPE_LABELS[businessType].toLowerCase()} aparecem primeiro e já vêm prontas.`
              : 'Escolha um objetivo. A automação já vem pronta, você só revisa e ativa.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((recipe) => {
          const Icon = recipe.icon;
          const forYou = !!businessType && recipe.audiences.includes(businessType);
          return (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onPick(recipe)}
              className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{recipe.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{recipe.description}</span>
                <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {forYou && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Indicado para você
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                    {RECIPE_DESTINATION_LABEL[recipe.target.type]}
                    <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {(hidden > 0 || expanded) && recipes.length > initialVisible && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            {expanded ? 'Mostrar menos' : `Ver todas (${recipes.length})`}
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700/60">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Ou descreva o que você quer</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Conte o que você quer e a gente monta a automação para você revisar. Nada é ativado sem a sua confirmação.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <Textarea
            wrapperClassName="flex-1"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              if (localError) setLocalError('');
              onDescribeChange?.();
            }}
            placeholder="Ex.: Quando alguém comentar QUERO no meu post, mandar o link do curso no Direct."
            rows={2}
            maxLength={DESCRIPTION_MAX}
            aria-label="Descreva o que você quer automatizar"
            error={localError || describeError || undefined}
          />
          <Button
            icon={<Sparkles size={16} />}
            onClick={submit}
            loading={describing}
            loadingText="Montando..."
            className="justify-center sm:mt-0.5"
          >
            Montar automação
          </Button>
        </div>
      </div>
    </Card>
  );
}
