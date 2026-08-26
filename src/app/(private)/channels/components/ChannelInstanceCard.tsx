'use client';
import { RefreshCw, Trash2, Wifi } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import Card from '@/components/Card';
import IconButton from '@/components/IconButton';
import { authService } from '@/services/auth.service';

interface ChannelInstanceCardProps {
    id: string | number;
    icon: ReactNode;
    title: string;
    subtitle: string;
    status: 'connected' | 'disconnected';
    statusLabel?: string;
    colorClass: 'emerald' | 'fuchsia';
    createdBy?: string | null | undefined;
    ownerName?: string | null | undefined;
    /**
     * Direito de gerenciar, vindo do backend. É a fonte confiável: o cálculo
     * local abaixo é só fallback para chamadas que ainda não devolvem o campo.
     */
    canManage?: boolean | undefined;
    onRefresh?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}
export default function ChannelInstanceCard({ id, icon, title, subtitle, status, statusLabel, colorClass, createdBy, ownerName, canManage: canManageProp, onRefresh, onDelete }: ChannelInstanceCardProps) {
  const refreshVariant = colorClass === 'emerald' ? 'success' : 'fuchsia';
  const [canManage, setCanManage] = useState(true);
  const [isOtherPersonChannel, setIsOtherPersonChannel] = useState(false);
  useEffect(() => {
    const user = authService.getUser();
    const fullAccess = !user?.role || user.role === 'owner' || user.role === 'admin';
    const isOwnChannel = !createdBy || (!!user?.id && createdBy === user.id);
    setCanManage(canManageProp ?? (fullAccess || isOwnChannel));
    // O rótulo "conectado por" aparece para qualquer um que veja um canal de
    // outra pessoa — não só para o dono, agora que o time enxerga tudo.
    setIsOtherPersonChannel(!!createdBy && !!user?.id && createdBy !== user.id);
  }, [createdBy, canManageProp]);
  return (<Card className="p-6 relative overflow-hidden group h-full flex flex-col">
    <div className="flex justify-between items-start mb-4 pt-2">
      {icon}
      <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status === 'connected'
        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
        : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'}`}>
        {status === 'connected' ? 'Online' : 'Desconectado'}
      </div>
    </div>
    <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    {isOtherPersonChannel && ownerName && (<p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-3">
          Conectado por <span className="font-medium text-slate-500 dark:text-slate-400">{ownerName}</span>
    </p>)}
    {(!isOtherPersonChannel || !ownerName) && <div className="mb-4"/>}

    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-50 dark:border-slate-700 pt-4 mt-auto">
      <span className="flex items-center gap-1">
        <Wifi size={14} className={status === 'connected'
          ? 'text-emerald-500 dark:text-emerald-400'
          :
          'text-rose-400 dark:text-rose-400'}/>
        {statusLabel || (status === 'connected' ? 'Sincronizado' : 'Dessincronizado')}
      </span>
    </div>

    {canManage && (<div className="absolute top-0.5 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
      <IconButton icon={<RefreshCw size={16}/>} onClick={() => onRefresh?.(id)} variant={refreshVariant}/>
      <IconButton icon={<Trash2 size={16}/>} onClick={() => onDelete?.(id)} variant="danger"/>
    </div>)}
  </Card>);
}
