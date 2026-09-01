'use client';
import { motion, type Variants } from 'framer-motion';

const FEATURES = [
  {
    title: 'IA treinável',
    description:
      'Cadastre catálogo, regras e tom de voz. A IA responde como um vendedor da sua loja, 24h por dia.',
  },
  {
    title: 'Caixa de entrada única',
    description:
      'WhatsApp e Instagram no mesmo lugar, com transferência entre a IA e a sua equipe a qualquer momento.',
  },
  {
    title: 'Funil de vendas',
    description:
      'A IA qualifica o lead durante a conversa e move o card pelas etapas — do primeiro contato ao fechamento.',
  },
  {
    title: 'Disparo em massa',
    description:
      'Agende campanhas a partir de um template aprovado e envie para toda a base no horário que você marcar.',
  },
  {
    title: 'Automação de comentários',
    description:
      'Palavra-chave no comentário do Instagram vira conversa no direct, sem ninguém digitar nada.',
  },
  {
    title: 'Agendamento',
    description:
      'A IA marca o compromisso no Google Calendar da equipe e dispara os lembretes antes da hora.',
  },
  {
    title: 'Contatos, tags e grupos',
    description:
      'Histórico unificado de cada cliente e segmentação pronta para escolher quem recebe cada campanha.',
  },
  {
    title: 'Painel em tempo real',
    description:
      'Mensagens enviadas pela IA, por automações e pela equipe, com o consumo do plano numa visão só.',
  },
];

// Colunas no maior breakpoint — define de que lado cada card entra.
const COLUMNS = 4;

function entersFromLeft(index: number): boolean {
  return index % COLUMNS < COLUMNS / 2;
}

/** As pontas chegam primeiro e o grid fecha em direção ao meio. */
function enterDelay(index: number): number {
  const column = index % COLUMNS;
  const stepsFromEdge = entersFromLeft(index) ? column : COLUMNS - 1 - column;
  return Math.floor(index / COLUMNS) * 0.1 + stepsFromEdge * 0.12;
}

// O gatilho fica no container: sem isso cada card esperava a própria entrada na
// viewport e a coreografia chegava picotada, em vez de uma onda só.
const CARD_VARIANTS: Variants = {
  hidden: (index: number) => ({ opacity: 0, x: entersFromLeft(index) ? -48 : 48 }),
  show: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: enterDelay(index), duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function FeaturesGrid() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">
            Tudo no mesmo lugar
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Uma plataforma. <span className="text-indigo-600">Toda sua operação.</span>
          </h2>
          <p className="text-base text-slate-600">
            Substitua múltiplas ferramentas por uma única central de atendimento, vendas e marketing.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={CARD_VARIANTS}
              className="rounded-xl border border-slate-200 bg-white p-5 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-indigo-200"
            >
              <h3 className="mb-1.5 text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
