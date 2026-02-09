'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqItemProps extends FaqItem {
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        {question}
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="p-5 pt-0 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-50 dark:border-slate-700">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqItems: FaqItem[] = [
    {
      question: 'Preciso saber programar?',
      answer:
        'Não! Nossa plataforma é 100% no-code. Você configura sua IA apenas fazendo upload de arquivos ou digitando textos.',
    },
    {
      question: 'Posso usar meu número atual do WhatsApp?',
      answer:
        'Sim, você conecta seu número existente através da leitura de QR Code ou API Oficial, sem perder seu histórico.',
    },
    {
      question: 'A IA responde áudios?',
      answer:
        'Sim! Nossa IA transcreve áudios recebidos, entende o conteúdo e pode responder em texto ou até mesmo gerar áudio (plano Enterprise).',
    },
    {
      question: 'Como funciona o suporte?',
      answer:
        'Oferecemos suporte via chat em horário comercial para todos os planos, e suporte prioritário 24/7 para planos Pro e Enterprise.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <FaqItem
              key={i}
              question={item.question}
              answer={item.answer}
              isOpen={openFaq === i}
              onToggle={() => toggleFaq(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
