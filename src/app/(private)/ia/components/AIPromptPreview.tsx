'use client';

import { Sparkles } from 'lucide-react';

import Card from '@/components/Card';
import type { Product } from '@/types/AI';

interface AIPromptPreviewProps {
  segment: string;
  businessName: string;
  assistantName: string;
  tone: string;
  products: Product[];
}

export default function AIPromptPreview({ segment, businessName, assistantName, products }: AIPromptPreviewProps) {
  const productNames = products.map((p) => p.name).filter(Boolean);
  const assistantDisplayName = assistantName.trim() || 'assistente virtual';
  const businessPart = businessName.trim() ? ` da ${businessName.trim()}` : '';
  const segmentPart = segment.trim()
    ? `especialista em ${segment.trim()}`
    : 'pronta para te ajudar no que precisar';
  const productPart = productNames.length > 0
    ? `Posso te orientar sobre ${productNames.slice(0, 3).join(', ')}${productNames.length > 3 ? ' e outros serviços' : ''}.`
    : 'Posso te ajudar com informações, dúvidas e próximos passos.';

  return (
    <Card className="p-4 sm:p-6 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-indigo-500" />
        Exemplo de Apresentacao da IA
      </h3>
      <div className="text-sm text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm leading-relaxed">
        &quot;Oi! Eu sou <strong>{assistantDisplayName}</strong>{businessPart}, {segmentPart}. {productPart} Como posso te ajudar agora?&quot;
      </div>
    </Card>
  );
}
