'use client';

import { Sparkles } from 'lucide-react';

import Card from '@/components/Card';
import type { Product } from '@/types/AI';

interface AIPromptPreviewProps {
  segment: string;
  tone: string;
  products: Product[];
}

export default function AIPromptPreview({ segment, tone, products }: AIPromptPreviewProps) {
  const productNames = products.map((p) => p.name).join(', ') || '...';

  return (
    <Card className="p-4 sm:p-6 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-indigo-500" />
        Preview do Prompt Gerado
      </h3>
      <div className="text-sm text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm leading-relaxed">
        &quot;Você é um assistente virtual <strong>{tone || '...'}</strong> especializado em <strong>{segment || '...'}</strong>.
        Seu objetivo é ajudar clientes com dúvidas sobre <strong>{productNames}</strong>.
        Sempre seja educado, use emojis ocasionalmente e mantenha um tom profissional mas acolhedor.&quot;
      </div>
    </Card>
  );
}
