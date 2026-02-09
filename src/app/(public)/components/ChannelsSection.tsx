'use client';

import { MessageCircle, Smartphone, Globe, Bot, Check } from 'lucide-react';

interface ChannelCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  bgColor: string;
  iconColor: string;
  highlight?: boolean;
  delay?: string;
}

function ChannelCard({ icon: Icon, title, subtitle, bgColor, iconColor, highlight, delay }: ChannelCardProps) {
  const baseClasses = 'p-6 rounded-2xl shadow-lg border flex flex-col items-center text-center';
  const highlightClasses = highlight
    ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white scale-105'
    : 'bg-white border-slate-100';
  const animationClasses = delay ? `animate-bounce ${delay} duration-[3000ms]` : '';

  return (
    <div className={`${baseClasses} ${highlightClasses} ${animationClasses}`}>
      <div
        className={`w-16 h-16 ${highlight ? 'bg-white/20 backdrop-blur-sm' : bgColor} rounded-full flex items-center justify-center mb-4 ${highlight ? 'text-white' : iconColor}`}
      >
        <Icon size={32} />
      </div>
      <h4 className={`font-bold ${highlight ? 'text-white' : 'text-slate-800'}`}>{title}</h4>
      <p className={`text-xs mt-1 ${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{subtitle}</p>
    </div>
  );
}

export default function ChannelsSection() {
  const benefits = [
    'Sem risco de banimento (API Oficial)',
    'Responda comentários do Instagram automaticamente',
    'Recupere carrinhos abandonados no WhatsApp',
    'Transbordo inteligente para atendentes humanos',
  ];

  return (
    <section id="canais" className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-16">
        <div className="w-full md:w-1/2 relative">
          <div className="absolute inset-0 bg-linear-to-tr from-indigo-100 to-fuchsia-100 dark:from-indigo-900/20 dark:to-fuchsia-900/20 rounded-full blur-3xl opacity-60"></div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="space-y-4 mt-8">
              <ChannelCard
                icon={MessageCircle}
                title="WhatsApp"
                subtitle="API Oficial"
                bgColor="bg-emerald-100"
                iconColor="text-emerald-600"
                delay="delay-1000"
              />
              <ChannelCard
                icon={Globe}
                title="Web Chat"
                subtitle="Widget Site"
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
            </div>
            <div className="space-y-4">
              <ChannelCard
                icon={Smartphone}
                title="Instagram"
                subtitle="Directs & Stories"
                bgColor="bg-fuchsia-100"
                iconColor="text-fuchsia-600"
              />
              <ChannelCard
                icon={Bot}
                title="IA Central"
                subtitle="Processamento"
                bgColor=""
                iconColor=""
                highlight
              />
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
            Esteja onde seu cliente está. <br />
            <span className="text-indigo-600">Responda instantaneamente.</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            Centralize todos os seus canais de atendimento. Nossa plataforma conecta-se oficialmente às APIs do
            WhatsApp e Instagram, garantindo estabilidade e segurança.
          </p>
          <ul className="space-y-4">
            {benefits.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Check size={14} strokeWidth={3} />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
