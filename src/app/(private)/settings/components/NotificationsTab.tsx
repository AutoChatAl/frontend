'use client';
import { useState, useEffect, useCallback } from 'react';

import Badge from '@/components/Badge';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonRows } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleRow from '@/components/ToggleRow';
import { useAuthUser } from '@/hooks/useAuthUser';
import type { SchedulingReminderKey, SchedulingReminders, SchedulingRemindersPatch } from '@/types/Scheduling';
import { SCHEDULING_REMINDER_OPTIONS } from '@/types/Scheduling';
import { apiClient } from '@/utils/ApiClient';

import AttendantAlertsCard from './AttendantAlertsCard';

interface WorkspaceNotifications {
    emailCampaignDispatch: boolean;
    schedulingReminders: SchedulingReminders | null;
}
interface WorkspaceNotificationsPatch {
    emailCampaignDispatch?: boolean;
    schedulingReminders?: SchedulingRemindersPatch;
}
/**
 * Avisos ainda não implementados no backend — o workspace só persiste o e-mail
 * de campanha e os lembretes de agendamento. Ficam visíveis como roadmap,
 * mas marcados: switch ligado e travado prometia e-mail que nunca sai.
 */
const UPCOMING_ITEMS = [
  { title: 'Resumo semanal', desc: 'Estatísticas de desempenho toda segunda-feira.' },
  { title: 'Alertas de conexão', desc: 'Aviso imediato se o WhatsApp desconectar.' },
  { title: 'Novidades e dicas', desc: 'Como melhorar suas conversões com IA.' },
];
export default function NotificationsTab() {
  // Os avisos do workspace (e-mail de campanha, lembrete) são decisão do dono; a
  // rota que os salva exige esse papel. O colaborador vê só os alertas dele.
  const user = useAuthUser();
  const canManageWorkspace = user?.role === 'owner' || user?.role === 'admin';
  const [notifications, setNotifications] = useState<WorkspaceNotifications>({
    emailCampaignDispatch: false,
    schedulingReminders: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const loadNotifications = useCallback(async () => {
    if (!canManageWorkspace) {
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get<WorkspaceNotifications>('/auth/workspace/notifications');
      if (response.success && response.data) {
        setNotifications({
          emailCampaignDispatch: response.data.emailCampaignDispatch ?? false,
          schedulingReminders: response.data.schedulingReminders ?? null,
        });
      }
    }
    catch {
    }
    finally {
      setLoading(false);
    }
  }, [canManageWorkspace]);
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  const updateNotification = useCallback(async (patch: WorkspaceNotificationsPatch, message: string, errorMessage: string) => {
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
        setNotifications({
          emailCampaignDispatch: data.notifications.emailCampaignDispatch,
          schedulingReminders: data.notifications.schedulingReminders,
        });
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
  const handleSchedulingReminderToggle = (key: SchedulingReminderKey, checked: boolean) => updateNotification(
    { schedulingReminders: { [key]: { enabled: checked } } },
    checked ? 'Lembrete de agendamento ativado.' : 'Lembrete de agendamento desativado.',
    'Erro ao atualizar lembrete de agendamento.',
  );
  return (<div className="space-y-3">
    <AttendantAlertsCard onFeedback={addToast}/>

    {canManageWorkspace && loading && (<Card className="p-4">
      <div className="animate-pulse" aria-busy="true"><SkeletonRows count={3} avatar={false}/></div>
    </Card>)}

    {canManageWorkspace && !loading && (<Card className="p-4">
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
        {notifications.schedulingReminders && SCHEDULING_REMINDER_OPTIONS.map((option) => (
          <ToggleRow
            key={option.key}
            title={`Lembrete de agendamento — ${option.title}`}
            description={`Mensagem ao contato ${option.leadTime} antes do horário marcado. O texto se personaliza em Agendamentos → Lembretes.`}
            checked={notifications.schedulingReminders?.[option.key].enabled ?? false}
            onChange={(checked) => handleSchedulingReminderToggle(option.key, checked)}
            disabled={saving}
          />
        ))}
      </div>
    </Card>)}

    {canManageWorkspace && !loading && (<Card className="p-4">
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
    </Card>)}

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
