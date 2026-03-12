'use client';

import { ArrowUpRight, MessageCircle, MoreVertical, Smartphone, Trash2, Users } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import Badge from '@/components/Badge';
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

export default function GroupCard({
  id,
  name,
  memberCount,
  channelTypes,
  createdAt,
  onManage,
  onDelete,
}: GroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="p-6 relative group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5">
          {channelTypes?.includes('WHATSAPP') && (
            <Badge type="whatsapp" text="WhatsApp" icon={MessageCircle} pill />
          )}
          {channelTypes?.includes('INSTAGRAM') && (
            <Badge type="instagram" text="Instagram" icon={Smartphone} pill />
          )}
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => { setMenuOpen(false); onManage(id); }}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <Users size={14} />
                Gerenciar
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(id); }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{name}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
        <Users size={14} />
        {memberCount} contatos
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
        <span className="text-xs text-slate-400 dark:text-slate-500">Criado em {formattedDate}</span>
        <button
          onClick={() => onManage(id)}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:underline"
        >
          Gerenciar <ArrowUpRight size={12} />
        </button>
      </div>
    </Card>
  );
}
