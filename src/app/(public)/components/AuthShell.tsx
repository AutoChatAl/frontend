import { Bot, CheckCircle } from 'lucide-react';
import React, { type ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex" data-theme="light">
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-violet-800"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        ></div>

        <div className="relative z-10 text-white max-w-lg px-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-xl">
            <Bot size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-6">Potencialize seu atendimento com IA</h2>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Junte-se a mais de 10.000 empresas que automatizam vendas e suporte com o Synq.
          </p>

          <div className="mt-12 space-y-4">
            {[
              'Integração oficial WhatsApp & Instagram',
              'Treinamento de IA com seus próprios dados',
              'Dashboard de métricas em tempo real',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-indigo-50">
                <CheckCircle size={20} className="text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="text-slate-500 mt-2 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
