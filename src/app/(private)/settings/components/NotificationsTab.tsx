'use client';

import { Mail, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import Card from '@/components/Card';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleSwitch from '@/components/ToggleSwitch';
import { apiClient } from '@/utils/ApiClient';

interface WorkspaceNotifications {
  emailCampaignDispatch: boolean;
  schedulingReminder: boolean;
}

const EMAIL_NOTIFICATION_ITEMS = [
  { title: 'Resumo Semanal', desc: 'Receba estatísticas de desempenho toda segunda-feira.' },
  { title: 'Alertas de Conexão', desc: 'Seja notificado imediatamente se o WhatsApp desconectar.' },
  { title: 'Novidades e Dicas', desc: 'Dicas de como melhorar suas conversões com IA.' },
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
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleEmailToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      const response = await apiClient.put<{ ok: boolean; notifications: WorkspaceNotifications }>(
        '/auth/workspace/notifications',
        { emailCampaignDispatch: checked },
      );
      if (response.success && response.data) {
        const data = response.data as { ok: boolean; notifications: WorkspaceNotifications };
        setNotifications((prev) => ({
          ...prev,
          ...(data.notifications as Partial<WorkspaceNotifications>),
        }));
        addToast('success', checked ? 'Notificação por e-mail ativada.' : 'Notificação por e-mail desativada.');
      } else {
        addToast('error', 'Erro ao atualizar notificação.');
      }
    } catch {
      addToast('error', 'Erro ao atualizar notificação.');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedulingReminderToggle = async (checked: boolean) => {
    setSaving(true);
    try {
      const response = await apiClient.put<{ ok: boolean; notifications: WorkspaceNotifications }>(
        '/auth/workspace/notifications',
        { schedulingReminder: checked },
      );
      if (response.success && response.data) {
        const data = response.data as { ok: boolean; notifications: WorkspaceNotifications };
        setNotifications((prev) => ({
          ...prev,
          ...(data.notifications as Partial<WorkspaceNotifications>),
        }));
        addToast('success', checked ? 'Lembrete de agendamento ativado.' : 'Lembrete de agendamento desativado.');
      } else {
        addToast('error', 'Erro ao atualizar lembrete de agendamento.');
      }
    } catch {
      addToast('error', 'Erro ao atualizar lembrete de agendamento.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
          <Mail size={20} className="text-indigo-600 dark:text-indigo-400" /> Preferências de Email
        </h3>
        <div className="space-y-6">
          {EMAIL_NOTIFICATION_ITEMS.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{item.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
              <ToggleSwitch defaultChecked />
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Disparo de Campanha</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receba um e-mail estilizado toda vez que uma campanha for disparada pela rotina automática.
                  O e-mail será enviado para o endereço utilizado no cadastro da sua conta.
                </p>
              </div>
              <ToggleSwitch
                checked={notifications.emailCampaignDispatch}
                onChange={handleEmailToggle}
                disabled={saving}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-white">Lembrete de Agendamento</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A cada 30 minutos, o sistema verifica agendamentos da próxima 1 hora e envia uma mensagem de lembrete ao contato via WhatsApp.
                </p>
              </div>
              <ToggleSwitch
                checked={notifications.schedulingReminder}
                onChange={handleSchedulingReminderToggle}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </Card>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
