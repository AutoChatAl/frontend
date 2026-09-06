'use client';
import { useState, useEffect, useCallback } from 'react';

import Badge from '@/components/Badge';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonRows } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleRow from '@/components/ToggleRow';
import { apiClient } from '@/utils/ApiClient';

interface WorkspaceNotifications {
    emailCampaignDispatch: boolean;
    schedulingReminder: boolean;
}
/**
 * Avisos ainda não implementados no backend — o workspace só persiste
 * `emailCampaignDispatch` e `schedulingReminder`. Ficam visíveis como roadmap,
 * mas marcados: switch ligado e travado prometia e-mail que nunca sai.
 */
const UPCOMING_ITEMS = [
  { title: 'Resumo semanal', desc: 'Estatísticas de desempenho toda segunda-feira.' },
  { title: 'Alertas de conexão', desc: 'Aviso imediato se o WhatsApp desconectar.' },
  { title: 'Novidades e dicas', desc: 'Como melhorar suas conversões com IA.' },
];
export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<WorkspaceNotifications>({
    emailCampaignDispatch: false,
    schedulingReminder: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get<WorkspaceNotifications>('/auth/workspace/notifications');
      if (response.success && response.data) {
        setNotifications({
          emailCampaignDispatch: false,
          schedulingReminder: false,
          ...(response.data as Partial<WorkspaceNotifications>),
        });
      }
    }
    catch {
    }
    finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  const updateNotification = useCallback(async (patch: Partial<WorkspaceNotifications>, message: string, errorMessage: string) => {
    setSaving(true);
    try {
      const response = await apiClient.put<{
                ok: boolean;
                notifications: WorkspaceNotifications;
            }>('/auth/workspace/notifications', patch);
      if (response.success && response.data) {
        const data = response.data as {
                    ok: boolean;
                    notifications: WorkspaceNotifications;
                };
        setNotifications((prev) => ({
          ...prev,
          ...(data.notifications as Partial<WorkspaceNotifications>),
        }));
        addToast('success', message);
      }
      else {
        addToast('error', errorMessage);
      }
    }
    catch {
      addToast('error', errorMessage);
    }
    finally {
      setSaving(false);
    }
  }, [addToast]);
  const handleEmailToggle = (checked: boolean) => updateNotification(
    { emailCampaignDispatch: checked },
    checked ? 'Notificação por e-mail ativada.' : 'Notificação por e-mail desativada.',
    'Erro ao atualizar notificação.',
  );
  const handleSchedulingReminderToggle = (checked: boolean) => updateNotification(
    { schedulingReminder: checked },
    checked ? 'Lembrete de agendamento ativado.' : 'Lembrete de agendamento desativado.',
    'Erro ao atualizar lembrete de agendamento.',
  );
  if (loading) {
    return (<Card className="p-4">
      <div className="animate-pulse" aria-busy="true"><SkeletonRows count={3} avatar={false}/></div>
    </Card>);
  }
  return (<div className="space-y-3">
    <Card className="p-4">
      <SectionHeader
        title="Avisos automáticos"
        hint="O que o sistema envia sozinho, e para quem. Cada mudança é salva na hora."
      />
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        <ToggleRow
          title="Disparo de campanha"
          description="Um e-mail para o endereço da conta toda vez que a rotina automática dispara uma campanha."
          checked={notifications.emailCampaignDispatch}
          onChange={handleEmailToggle}
          disabled={saving}
        />
        <ToggleRow
          title="Lembrete de agendamento"
          description="Mensagem no WhatsApp do contato 1 hora antes do horário marcado. A verificação roda a cada 30 minutos."
          checked={notifications.schedulingReminder}
          onChange={handleSchedulingReminderToggle}
          disabled={saving}
        />
      </div>
    </Card>

    <Card className="p-4">
      <SectionHeader title="Em breve" hint="Ainda não estão ativos — nenhum e-mail destes é enviado por enquanto."/>
      <Callout tone="warning" className="mb-3">
        Estes avisos aparecem aqui como roadmap. Enquanto o controle não existir de verdade, os interruptores ficam
        desligados para não prometer e-mail que não sai.
      </Callout>
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {UPCOMING_ITEMS.map((item) => (
          <ToggleRow
            key={item.title}
            title={item.title}
            description={item.desc}
            checked={false}
            onChange={() => undefined}
            disabled
            badge={<Badge type="neutral" text="Em breve" pill/>}
          />
        ))}
      </div>
    </Card>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
