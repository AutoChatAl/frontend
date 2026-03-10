'use client';

import { Plus, Trash2 } from 'lucide-react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';

const MEMBERS = [
  { name: 'John Doe', email: 'admin@loja.com', role: 'admin', initials: 'JD' },
  { name: 'Maria Silva', email: 'maria@loja.com', role: 'editor', initials: 'MS' },
  { name: 'Pedro Santos', email: 'pedro@loja.com', role: 'editor', initials: 'PS' },
];

export default function MembersTab() {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Equipe</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie quem tem acesso ao painel.</p>
        </div>
        <Button size="sm" icon={<Plus size={14} />}>Convidar Membro</Button>
      </div>

      <div className="space-y-4">
        {MEMBERS.map((member, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-600">
                {member.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{member.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                type={member.role === 'admin' ? 'admin' : 'neutral'}
                text={member.role === 'admin' ? 'Administrador' : 'Editor'}
              />
              {member.role !== 'admin' && (
                <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
