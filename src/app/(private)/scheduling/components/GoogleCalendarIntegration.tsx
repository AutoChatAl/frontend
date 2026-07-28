'use client';
import { Calendar, CheckCircle, Loader2, RefreshCw, Unlink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { googleCalendarService } from '@/services/google-calendar.service';
import type { GoogleCalendarStatus } from '@/types/GoogleCalendar';

interface GoogleCalendarIntegrationProps {
    onToast: (type: 'success' | 'error', message: string) => void;
}

export default function GoogleCalendarIntegration({ onToast }: GoogleCalendarIntegrationProps) {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const loadStatus = useCallback(async () => {
    try {
      const data = await googleCalendarService.getStatus();
      setStatus(data);
    }
    catch {
      setStatus({ connected: false });
    }
    finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  const handleConnect = async () => {
    try {
      setConnecting(true);
      const url = await googleCalendarService.getOAuthUrl();
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      const popup = window.open(url, 'Google Agenda', `width=${width},height=${height},left=${left},top=${top}`);
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setConnecting(false);
          loadStatus();
        }
      }, 500);
    }
    catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Erro ao conectar com o Google Agenda.');
      setConnecting(false);
    }
  };
  const handleSync = async () => {
    try {
      setSyncing(true);
      const data = await googleCalendarService.syncNow();
      setStatus(data);
      onToast('success', 'Sincronização com o Google Agenda concluída!');
    }
    catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Erro ao sincronizar com o Google Agenda.');
    }
    finally {
      setSyncing(false);
    }
  };
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await googleCalendarService.disconnect();
      setStatus({ connected: false });
      setConfirmOpen(false);
      onToast('success', 'Google Agenda desconectado.');
    }
    catch (error) {
      onToast('error', error instanceof Error ? error.message : 'Erro ao desconectar o Google Agenda.');
    }
    finally {
      setDisconnecting(false);
    }
  };
  const formatLastSync = (value?: string | null) => {
    if (!value)
      return 'Ainda não sincronizado';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  if (loading) {
    return (<div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400"/>
    </div>);
  }
  return (<div className="space-y-4">
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-indigo-600 dark:text-indigo-400"/>
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Google Agenda</h3>
        {status?.connected && (<Badge type="success" text="Conectado" icon={CheckCircle} pill/>)}
      </div>

      {!status?.connected && (<div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
              Conecte sua conta do Google para sincronizar seus agendamentos nos dois sentidos: agendamentos criados no Synq aparecem no seu Google Agenda, e eventos criados no Google Agenda aparecem automaticamente no seu calendário do Synq, bloqueando os horários na disponibilidade.
        </p>
        <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0"/>
                Agendamentos manuais e criados pela IA são enviados ao Google Agenda
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0"/>
                Eventos do Google Agenda aparecem no calendário e bloqueiam horários
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0"/>
                Alterações e cancelamentos são refletidos nos dois lados
          </li>
        </ul>
        <Button onClick={() => { void handleConnect(); }} loading={connecting} loadingText="Aguardando conexão..." icon={<Calendar size={14}/>}>
              Conectar Google Agenda
        </Button>
      </div>)}

      {status?.connected && (<div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Conta conectada</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{status.googleEmail || 'Conta Google'}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Última sincronização</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatLastSync(status.lastSyncedAt)}</p>
          </div>
        </div>

        {status.lastSyncError && (<div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg p-3">
          <p className="text-sm text-rose-700 dark:text-rose-400">
                Ocorreu um erro na última sincronização. Tente sincronizar novamente ou reconecte sua conta.
          </p>
        </div>)}

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button variant="secondary" onClick={() => { void handleSync(); }} loading={syncing} loadingText="Sincronizando..." icon={<RefreshCw size={14}/>}>
                Sincronizar agora
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)} icon={<Unlink size={14}/>}>
                Desconectar
          </Button>
        </div>
      </div>)}
    </div>

    <ConfirmDeleteModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => { void handleDisconnect(); }} title="Desconectar Google Agenda" message="Os agendamentos existentes serão mantidos no Synq, mas deixarão de ser sincronizados com o Google Agenda. Deseja continuar?" confirmLabel="Desconectar" loading={disconnecting}/>
  </div>);
}
