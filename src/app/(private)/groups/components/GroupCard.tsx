'use client';
import { ArrowUpRight, Instagram, MessageCircle, MoreVertical, Trash2, Users, type LucideIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import Card from '@/components/Card';

interface GroupCardProps {
    id: string;
    name: string;
    memberCount: number;
    channelTypes?: string[];
    createdAt: string;
    onManage: (id: string) => void;
    onDelete: (id: string) => void;
}

const CHANNEL_CHIP: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  INSTAGRAM: {
    label: 'Instagram',
    icon: Instagram,
    className: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
  },
};

export default function GroupCard({ id, name, memberCount, channelTypes, createdAt, onManage, onDelete }: GroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const chips = (channelTypes ?? []).filter((type) => type in CHANNEL_CHIP);

  return (
    <Card className="flex flex-col p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-500/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{name}</h3>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={`Ações do grupo ${name}`}
              className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="animate-dropdown absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-none">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onManage(id); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                >
                  <Users size={14} className="text-slate-400" />
                  Gerenciar
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete(id); }}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={14} />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400">
          <Users size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          {memberCount.toLocaleString('pt-BR')} {memberCount === 1 ? 'contato' : 'contatos'}
        </p>

        {chips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {chips.map((type) => {
              const chip = CHANNEL_CHIP[type]!;
              const ChipIcon = chip.icon;
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.className}`}
                >
                  <ChipIcon size={11} />
                  {chip.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-700/60">
        <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">Criado em {formattedDate}</span>
        <button
          type="button"
          onClick={() => onManage(id)}
          className="inline-flex shrink-0 cursor-pointer items-center gap-0.5 text-[11px] font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Gerenciar
          <ArrowUpRight size={11} className="shrink-0" />
        </button>
      </div>
    </Card>
  );
}
