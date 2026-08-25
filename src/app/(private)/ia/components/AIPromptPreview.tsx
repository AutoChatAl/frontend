'use client';

import Card from '@/components/Card';
import type { Product } from '@/types/AI';

import AISectionHeader from './AISectionHeader';

interface AIPromptPreviewProps {
    segment: string;
    businessName: string;
    assistantName: string;
    products: Product[];
}

/** Lê os campos de identidade e monta a primeira frase que o cliente vai receber. */
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
    <Card className="border-dashed p-4">
      <AISectionHeader
        title="Prévia da apresentação"
        hint="Atualiza conforme você edita os campos acima. É a abertura da conversa, não o prompt inteiro."
      />
      <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
        &ldquo;Oi! Eu sou <strong className="font-semibold text-slate-900 dark:text-white">{assistantDisplayName}</strong>{businessPart}, {segmentPart}. {productPart} Como posso te ajudar agora?&rdquo;
      </p>
    </Card>
  );
}
