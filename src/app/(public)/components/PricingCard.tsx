'use client';

import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
}

export default function PricingCard({ name, price, period, description, features, highlighted = false, ctaText = 'Começar agora' }: PricingCardProps) {
  return (
    <div
      className={`relative p-8 rounded-2xl border-2 transition-all hover:scale-105 ${
        highlighted
          ? 'bg-linear-to-br from-indigo-600 to-purple-600 border-indigo-500 shadow-2xl shadow-indigo-500/50'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 px-4 py-1 rounded-full text-xs font-bold">
          MAIS POPULAR
        </div>
      )}

      <div className={highlighted ? 'text-white' : 'text-slate-800 dark:text-white'}>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <p className={`text-sm mb-6 ${highlighted ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{description}</p>

        <div className="mb-6">
          <span className="text-5xl font-bold">{price}</span>
          <span className={`text-lg ml-2 ${highlighted ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>/{period}</span>
        </div>

        <button
          className={`w-full py-3 px-6 rounded-lg font-semibold mb-8 transition-all ${
            highlighted
              ? 'bg-white text-indigo-600 hover:bg-indigo-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {ctaText}
        </button>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check size={20} className={`flex shrink-0 mt-0.5 ${highlighted ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span className={`text-sm ${highlighted ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-300'}`}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
