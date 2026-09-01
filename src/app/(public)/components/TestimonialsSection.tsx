'use client';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Rodrigo Lemos',
    segment: 'Infoprodutor',
    rating: 5,
    content:
      'Lançamento com três mil pessoas no grupo e a IA deu conta do primeiro atendimento inteiro. Só chegou até mim quem já estava decidido a comprar.',
  },
  {
    name: 'Carolina Menezes',
    segment: 'Dentista',
    rating: 4.5,
    content:
      'Antes eu perdia paciente que mandava mensagem fora do horário. Agora a IA responde, tira a dúvida de valor e já deixa a consulta agendada para o dia seguinte.',
  },
  {
    name: 'Marcelo Antunes',
    segment: 'Dono de e-commerce',
    rating: 5,
    content:
      'O funil sozinho já pagou a ferramenta. Bato o olho e sei quem está negociando e quem só está olhando, sem precisar abrir uma conversa.',
  },
  {
    name: 'Priscila Fontes',
    segment: 'Assessoria de investimentos',
    rating: 4,
    content:
      'Meu time perdia a manhã respondendo as mesmas perguntas antes da primeira reunião. Agora a IA faz essa triagem e só chega na agenda quem já está pronto para conversar.',
  },
  {
    name: 'Eduardo Salles',
    segment: 'Fábrica de móveis',
    rating: 4.5,
    content:
      'Recebo pedido de orçamento por WhatsApp o dia inteiro. A IA já pergunta quantidade, prazo e acabamento antes de passar para o meu comercial.',
  },
];

function Rating({ value }: { value: number }) {
  const label = value.toFixed(1).replace('.', ',');

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5" aria-label={`Avaliação ${label} de 5`}>
        {Array.from({ length: 5 }, (_, i) => {
          // Fração desta estrela: 1 cheia, 0.5 pela metade, 0 vazia.
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} aria-hidden="true" className="relative inline-flex">
              <Star size={15} className="fill-slate-200 text-slate-200" />
              {fill > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-slate-400">{label}</span>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section id="depoimentos" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Quem já usa
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Feito para quem <span className="text-indigo-600">atende de verdade</span>
          </h2>
          <p className="text-base text-slate-600">
            Do infoprodutor à fábrica, quem depende de conversa para vender atende pela Synq — e
            estes são só alguns dos ramos que passam por aqui.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-5">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.figure
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.45, ease: 'easeOut' }}
              className="flex w-full flex-col rounded-3xl border border-slate-200/80 bg-white/70 p-6 backdrop-blur-sm sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.834rem)] lg:p-7"
            >
              <Rating value={testimonial.rating} />

              <blockquote className="mt-4 text-sm leading-relaxed text-slate-700">
                “{testimonial.content}”
              </blockquote>

              <figcaption className="mt-auto pt-6">
                <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{testimonial.segment}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
