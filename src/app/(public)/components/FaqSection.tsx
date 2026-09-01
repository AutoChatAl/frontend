'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Preciso saber programar para usar a Synq?',
    answer:
      'Não. A plataforma é 100% no-code. Você conecta o WhatsApp e o Instagram em poucos cliques, cadastra produtos e regras por formulário, e a IA já entra em ação. Toda a configuração leva menos de 10 minutos.',
  },
  {
    question: 'Precisa conectar alguma API de IA?',
    answer:
      'Não. A inteligência artificial já vem incluída na Synq. Você não precisa criar conta em nenhum serviço externo nem colar chave de API: basta cadastrar o catálogo, as regras e o tom de voz. O consumo fica visível no painel, descontado da cota de mensagens de IA do seu plano.',
  },
  {
    question: 'Como funcionam as integrações do WhatsApp e do Instagram?',
    answer:
      'Os dois canais são conectados pelas APIs oficiais da Meta, no seu próprio perfil comercial. Você mantém o número e o histórico de conversas, e a operação roda dentro das políticas da plataforma, sem o risco de bloqueio que existe nas ferramentas não oficiais.',
  },
  ...(HIDDEN_FEATURES.cartRecovery
    ? []
    : [
      {
        question: 'Como funciona a recuperação de carrinho abandonado?',
        answer:
            'Conectamos a sua plataforma de infoproduto (Hotmart, Kiwify, Eduzz, Monetizze, PerfectPay) ou um webhook genérico. Quando o cliente abandona o checkout, a Synq dispara uma sequência de mensagens no WhatsApp ou no Instagram, com link de pagamento e cupom, para reverter a venda.',
      },
    ]),
  {
    question: 'Em quanto tempo a IA aprende o meu negócio?',
    answer:
      'Na hora. Você cadastra produtos, regras e tom de voz no painel, e a IA passa a usar esses dados como contexto em cada resposta. Dá para editar quando quiser e ver na mesma hora como ela responde com a nova configuração.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim, sem fidelidade e sem multa. O cancelamento é feito direto no painel e você mantém o acesso até o fim do período já pago.',
  },
  {
    question: 'O que acontece se eu passar do limite de mensagens?',
    answer:
      'O atendimento não trava. Nos planos pagos, as mensagens excedentes são cobradas por uso, a partir de R$ 0,015 por mensagem no plano Domínio. No teste gratuito existe um limite, liberado assim que você faz o upgrade.',
  },
  {
    question: 'Posso usar com vários atendentes?',
    answer:
      'Sim. O plano Crescimento inclui 2 colaboradores e o Domínio inclui 4. Em qualquer plano você pode contratar colaboradores extras.',
  },
  {
    question: 'Vocês têm suporte em português?',
    answer:
      'Sim, 100% em português brasileiro. O suporte padrão atende em horário comercial nos planos Impulso e Crescimento, e o plano Domínio tem atendimento prioritário.',
  },
];

function FaqRow({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-200 transition-colors">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-slate-900 text-sm sm:text-base">{item.question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} className={`shrink-0 ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              {item.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Perguntas frequentes
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FaqRow
              key={i}
              item={item}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
