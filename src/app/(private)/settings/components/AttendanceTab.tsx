'use client';
import { Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import Select from '@/components/Select';
import { SkeletonForm } from '@/components/Skeleton';
import Textarea from '@/components/Textarea';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleRow from '@/components/ToggleRow';
import { attendanceService } from '@/services/attendance.service';
import type { AttendanceSettings, AttendanceStatus, UpdateAttendanceSettingsPayload } from '@/types/Attendance';

const COOLDOWN_OPTIONS = [0, 6, 12, 24, 48];

function cooldownLabel(hours: number): string {
  if (hours === 0) return 'Sempre que entrar na fila';
  if (hours === 24) return 'No máximo 1 vez por dia';
  return `No máximo 1 vez a cada ${hours}h`;
}

export default function AttendanceTab() {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async () => {
    try {
      // O status é acessório: falhar nele não pode esconder a configuração.
      const [loaded, loadedStatus] = await Promise.all([
        attendanceService.getSettings(),
        attendanceService.getStatus().catch(() => null),
      ]);
      setSettings(loaded);
      setStatus(loadedStatus);
    } catch {
      addToast('error', 'Não foi possível carregar as regras de atendimento.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (patch: UpdateAttendanceSettingsPayload, successMessage: string) => {
    setSaving(true);
    // Atualização otimista: o switch responde na hora e volta sozinho se a API recusar.
    const previous = settings;
    setSettings((current) => (current ? { ...current, ...patch } as AttendanceSettings : current));
    try {
      const updated = await attendanceService.updateSettings(patch);
      setSettings(updated);
      addToast('success', successMessage);
    } catch (err) {
      setSettings(previous);
      addToast('error', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }, [settings, addToast]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse" aria-busy="true"><SkeletonForm fields={3}/></div>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="p-4">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Não foi possível carregar as regras de atendimento. Recarregue a página para tentar de novo.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Estado do expediente: é ele que explica por que o aviso pode estar quieto agora. */}
      {status && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="shrink-0 text-slate-400"/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
                  {status.hasBusinessHours
                    ? (status.open ? 'Em expediente agora' : 'Fora do expediente')
                    : 'Sem expediente cadastrado'}
                </p>
                <Badge
                  type={status.hasBusinessHours ? (status.open ? 'success' : 'neutral') : 'processing'}
                  text={status.hasBusinessHours ? (status.open ? 'Aberto' : 'Fechado') : '24h'}
                />
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {status.hasBusinessHours
                  ? `Fuso ${status.timezone}${status.nextOpeningAt ? ` · volta em ${new Date(status.nextOpeningAt).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}`
                  : 'Sem horários em Agendamentos, o sistema trata o negócio como aberto o tempo todo.'}
              </p>
            </div>
          </div>
          {!status.hasBusinessHours && (
            <Callout tone="warning" className="mt-3">
              O aviso abaixo só dispara depois que você cadastrar o expediente
              em <strong>Agendamentos → Horários</strong>. Sem ele, o sistema nunca considera o negócio fechado.
            </Callout>
          )}
        </Card>
      )}

      <Card className="p-4">
        <SectionHeader
          title="Fora do horário"
          hint="O que o cliente ouve quando pede um atendente e não há ninguém para atender. Cada mudança é salva na hora."
        />
        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
          <ToggleRow
            title="Avisar que o atendimento está fechado"
            description="Enviado quando o cliente pede atendimento humano fora do expediente. A IA continua respondendo normalmente — o aviso trata só do que depende de uma pessoa."
            checked={settings.outsideHoursEnabled}
            onChange={(checked) => save({ outsideHoursEnabled: checked }, checked
              ? 'Aviso de fora do horário ativado.'
              : 'Aviso de fora do horário desativado.')}
            disabled={saving}
          />

          {settings.outsideHoursEnabled && (
            <>
              <div className="py-3">
                <Textarea
                  label="Mensagem"
                  rows={3}
                  maxLength={1000}
                  defaultValue={settings.outsideHoursMessage}
                  disabled={saving}
                  // Salva ao sair do campo: um PATCH por tecla digitada seria uma
                  // requisição a cada letra da mensagem.
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (!value || value === settings.outsideHoursMessage) return;
                    save({ outsideHoursMessage: value }, 'Mensagem atualizada.');
                  }}
                  hint="Salvo ao clicar fora do campo."
                />
              </div>

              <ToggleRow
                title="Dizer quando o atendimento volta"
                description='Acrescenta a hora de retorno calculada do seu expediente — "Voltamos amanhã às 08:00", "Voltamos segunda-feira às 08:00".'
                checked={settings.outsideHoursAnnounceReturn}
                onChange={(checked) => save({ outsideHoursAnnounceReturn: checked }, 'Aviso de retorno atualizado.')}
                disabled={saving}
              />

              <div className="py-3">
                <Select
                  label="Repetir o aviso para o mesmo cliente"
                  options={COOLDOWN_OPTIONS.map((hours) => ({ value: String(hours), label: cooldownLabel(hours) }))}
                  value={String(settings.outsideHoursCooldownHours)}
                  onChange={(value) => save({ outsideHoursCooldownHours: Number(value) }, 'Intervalo entre avisos atualizado.')}
                  disabled={saving}
                  hint="Evita mandar cinco avisos para quem escreve cinco vezes de madrugada."
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
