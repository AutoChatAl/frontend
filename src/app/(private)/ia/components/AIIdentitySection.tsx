'use client';

import { Bot } from 'lucide-react';

import Card from '@/components/Card';
import type { Product } from '@/types/AI';

import AIProductsInput from './AIProductsInput';
import AISegmentSelector from './AISegmentSelector';
import AIToneSelector from './AIToneSelector';

interface AIIdentitySectionProps {
  segment: string;
  tone: string;
  products: Product[];
  onSegmentChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onAddProduct: (name: string) => void;
  onUpdateProduct: (id: string, data: { name?: string; priceCents?: number; link?: string }) => void;
  onDeleteProduct: (id: string) => void;
}

export default function AIIdentitySection({
  segment,
  tone,
  products,
  onSegmentChange,
  onToneChange,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: AIIdentitySectionProps) {
  return (
    <Card className="p-4 sm:p-6 md:col-span-2">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Bot size={18} className="text-indigo-600 dark:text-indigo-400" />
        Identidade do Assistente
      </h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AISegmentSelector value={segment} onChange={onSegmentChange} />
          <AIToneSelector value={tone} onChange={onToneChange} />
        </div>
        <AIProductsInput
          products={products}
          onAddProduct={onAddProduct}
          onUpdateProduct={onUpdateProduct}
          onDeleteProduct={onDeleteProduct}
        />
      </div>
    </Card>
  );
}
