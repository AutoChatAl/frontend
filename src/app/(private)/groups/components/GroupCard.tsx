'use client';

import { ArrowUpRight, MessageCircle, MoreVertical, Smartphone, Users } from 'lucide-react';

import Card from '@/components/Card';

interface GroupCardProps {
  id: number;
  name: string;
  platforms: string[];
  count: number;
  lastSent: string;
  onManage?: (id: number) => void;
  onOptions?: (id: number) => void;
}

export default function GroupCard({
  id,
  name,
  platforms,
  count,
  lastSent,
  onManage,
  onOptions,
}: GroupCardProps) {
  return (
    <Card className="p-6 relative group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex -space-x-2">
          {platforms.includes('whatsapp') && (
            <div
              className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-white dark:border-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 z-10 shadow-sm"
              title="WhatsApp"
            >
              <MessageCircle size={18} />
            </div>
          )}
          {platforms.includes('instagram') && (
            <div
              className="w-9 h-9 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900 border-2 border-white dark:border-slate-800 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 z-0 shadow-sm"
              title="Instagram"
            >
              <Smartphone size={18} />
            </div>
          )}
        </div>
        <button
          onClick={() => onOptions?.(id)}
          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{name}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
        <Users size={14} />
        {count} contatos
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
        <span className="text-xs text-slate-400 dark:text-slate-500">Último envio: {lastSent}</span>
        <button
          onClick={() => onManage?.(id)}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:underline"
        >
          Gerenciar <ArrowUpRight size={12} />
        </button>
      </div>
    </Card>
  );
}
