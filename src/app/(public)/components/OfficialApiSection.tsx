'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

const ADVANTAGES = [
  {
    title: 'Seu número fora de risco',
    description:
      'A conexão acontece na infraestrutura da própria Meta, não em bibliotecas não homologadas que deixam o número exposto a bloqueio e à perda do histórico.',
  },
  {
    title: 'Conexão estável',
    description:
      'Sem sessão caindo no meio do atendimento e sem aparelho para reconectar toda hora — as mensagens continuam entrando.',
  },
  {
    title: 'Conta comercial homologada',
    description:
      'Perfil oficial dentro das políticas da plataforma, elegível ao selo de verificação e aos recursos liberados só para contas aprovadas.',
  },
];

export default function OfficialApiSection() {
  return (
    <section id="seguranca" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white md:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]"
        >
          <div className="flex min-h-[15rem] items-center justify-center border-b border-slate-200/80 bg-white p-8 md:border-b-0 md:border-r lg:p-10">
            <Image
              src="/meta.png"
              alt="Meta Business Partner"
              width={520}
              height={436}
              sizes="(min-width: 768px) 40vw, 90vw"
              className="h-auto w-full max-w-sm object-contain"
            />
          </div>

          <div className="p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Segurança da operação
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Integração com as APIs oficiais do WhatsApp e do Instagram
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Conecte seus canais pelas APIs oficiais da Meta, no seu próprio perfil
              comercial. É o que separa uma operação que escala de um número bloqueado no meio da
              campanha.
            </p>

            <div className="mt-7 space-y-5">
              {ADVANTAGES.map((advantage) => (
                <div
                  key={advantage.title}
                  className="border-t border-slate-200/80 pt-5 first:border-t-0 first:pt-0"
                >
                  <p className="text-sm font-semibold text-slate-900">{advantage.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {advantage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
