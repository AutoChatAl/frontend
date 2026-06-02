'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Preciso saber programar para usar a Synq?',
    answer:
      'Nao. A plataforma e 100% no-code. Voce conecta seu WhatsApp e Instagram em poucos cliques, cadastra produtos e regras com formulario, e a IA ja entra em acao. Toda a configuracao leva menos de 10 minutos.',
  },
  {
    question: 'Como funcionam as integracoes do WhatsApp e Instagram?',
    answer:
      'O Instagram conecta diretamente via API Meta com login OAuth. O WhatsApp e conectado por leitura de QR Code, com controle automatico de cadencia, intervalos randomizados e limites diarios para preservar a saude do numero. Voce mantem seu numero atual e seu historico de conversas.',
  },
  {
    question: 'Como funciona a recuperacao de carrinho abandonado?',
    answer:
      'Conectamos sua plataforma de infoproduto (Hotmart, Kiwify, Eduzz, Monetizze, PerfectPay) ou webhook generico. Quando um cliente abandona o checkout, a Synq dispara automaticamente uma sequencia de mensagens no WhatsApp ou Instagram — com link de pagamento, cupom e tudo que precisa para reverter a venda.',
  },
  {
    question: 'Em quanto tempo a IA aprende meu negocio?',
    answer:
      'Imediatamente. Voce cadastra produtos, regras e tom de voz no painel — a IA usa esses dados como contexto em cada resposta. Voce pode editar e refinar a qualquer momento e ver na hora como ela responde com a nova configuracao.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim. Sem fidelidade, sem multa. Cancele direto no painel a qualquer momento — voce mantem o acesso ate o fim do periodo ja pago.',
  },
  {
    question: 'O que acontece se eu passar do limite de mensagens?',
    answer:
      'Voce nunca trava o atendimento. Nos planos pagos, mensagens excedentes sao cobradas por uso (a partir de R$ 0,015/msg no Dominio). No teste gratuito existe um limite que e restabelecido no upgrade.',
  },
  {
    question: 'Posso usar com varios atendentes?',
    answer:
      'Sim. Os planos Crescimento (2 colaboradores) e Dominio (4 colaboradores) ja incluem multiplos atendentes. Voce tambem pode adicionar colaboradores extras como add-on em qualquer plano.',
  },
  {
    question: 'Voces tem suporte em portugues?',
    answer:
      'Sim, 100% em portugues brasileiro. Suporte padrao em horario comercial nos planos Impulso e Crescimento, e suporte VIP prioritario no plano Dominio.',
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
    <section id="faq" className="py-24 bg-slate-50">
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
