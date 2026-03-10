'use client';

import { Mail } from 'lucide-react';

import Card from '@/components/Card';
import ToggleSwitch from '@/components/ToggleSwitch';

const NOTIFICATION_ITEMS = [
  { title: 'Resumo Semanal', desc: 'Receba estatísticas de desempenho toda segunda-feira.' },
  { title: 'Alertas de Conexão', desc: 'Seja notificado imediatamente se o WhatsApp desconectar.' },
  { title: 'Novidades e Dicas', desc: 'Dicas de como melhorar suas conversões com IA.' },
];

export default function NotificationsTab() {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <Mail size={20} className="text-indigo-600 dark:text-indigo-400" /> Preferências de Email
      </h3>
      <div className="space-y-6">
        {NOTIFICATION_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-white">{item.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
            </div>
            <ToggleSwitch defaultChecked />
          </div>
        ))}
      </div>
    </Card>
  );
}
