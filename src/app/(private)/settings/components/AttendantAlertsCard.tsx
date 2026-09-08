'use client';
import { BellRing, Volume2 } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import SegmentedControl from '@/components/SegmentedControl';
import Select from '@/components/Select';
import { SkeletonRows } from '@/components/Skeleton';
import ToggleRow from '@/components/ToggleRow';
import { useAttendantAlerts } from '@/contexts/AttendantAlertsContext';
import type { AlertMode, AlertPreferencesPatch, AlertTone } from '@/types/AlertPreferences';
import { ALERT_MODE_OPTIONS, ALERT_TONE_OPTIONS } from '@/types/AlertPreferences';

interface AttendantAlertsCardProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

const INCOMING_SCOPE_OPTIONS = [
  { value: 'all', label: 'Todas as mensagens' },
  { value: 'new', label: 'Somente conversas novas' },
] as const;

const SOUND_BLOCKED_MESSAGE = 'O navegador ainda não liberou o som nesta página. Clique em qualquer lugar e tente de novo.';

/**
 * Preferências de alerta do atendente: o que avisa, por onde e com que som. É a
 * única seção de Notificações que o colaborador enxerga — as demais são avisos
 * do workspace, decididos pelo dono.
 */
export default function AttendantAlertsCard({ onFeedback }: AttendantAlertsCardProps) {
  const {
    preferences,
    loaded,
    saving,
    updatePreferences,
    browserPermission,
    requestBrowserPermission,
    previewSound,
    previewBrowserNotification,
  } = useAttendantAlerts();
  const [previewing, setPreviewing] = useState(false);

  const save = async (patch: AlertPreferencesPatch, message: string) => {
    try {
      await updatePreferences(patch);
      onFeedback('success', message);
    } catch {
      onFeedback('error', 'Erro ao salvar preferência de alerta.');
    }
  };

  const handleModeChange = async (mode: AlertMode) => {
    const label = ALERT_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
    await save({ mode }, `Tipo de notificação: ${label.toLowerCase()}.`);
    // A troca é um clique, e o pedido de permissão só é aceito dentro de um gesto —
    // pedir aqui poupa a pessoa de um segundo botão.
    if (mode !== 'in-app' && browserPermission === 'default') {
      await requestBrowserPermission();
    }
  };

  const handleToneChange = async (soundTone: AlertTone) => {
    await save({ soundTone }, 'Toque atualizado.');
    const played = await previewSound(soundTone);
    if (!played) onFeedback('error', SOUND_BLOCKED_MESSAGE);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const played = await previewSound(preferences.soundTone);
      if (!played) onFeedback('error', SOUND_BLOCKED_MESSAGE);
    } finally {
      setPreviewing(false);
    }
  };

  const handleBrowserPreview = () => {
    if (previewBrowserNotification()) {
      onFeedback('success', 'Notificação enviada ao navegador. Se nada apareceu na tela, o bloqueio é do sistema operacional.');
    } else {
      onFeedback('error', 'O navegador recusou: a permissão de notificação não está concedida.');
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestBrowserPermission();
    if (result === 'granted') onFeedback('success', 'Notificações do navegador permitidas.');
    else if (result === 'denied') onFeedback('error', 'O navegador bloqueou as notificações deste site.');
  };

  if (!loaded) {
    return (<Card className="p-4">
      <div className="animate-pulse" aria-busy="true"><SkeletonRows count={4} avatar={false}/></div>
    </Card>);
  }

  const { enabled } = preferences;
  const usesBrowser = preferences.mode !== 'in-app';
  const rowsDisabled = saving || !enabled;

  return (<Card className="p-4">
    <SectionHeader
      title="Alertas de atendimento"
      hint="Como você quer ser avisado quando chega conversa. Vale só para você e acompanha a sua conta em qualquer navegador."
      action={<span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500"><BellRing size={14}/> Salvo na hora</span>}
    />

    <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
      <ToggleRow
        title="Avisar quando chegar conversa"
        description="Chave geral. Desligada, nenhum som, cartão ou notificação é disparado para você — o contador da caixa de entrada continua funcionando normalmente."
        checked={enabled}
        onChange={(checked) => save({ enabled: checked }, checked ? 'Alertas de atendimento ativados.' : 'Alertas de atendimento desativados.')}
        disabled={saving}
      />

      <ToggleRow
        title="Mensagens recebidas"
        description="Avisa quando um contato escreve. Não avisa da conversa que você já está com a tela aberta e visível."
        checked={preferences.incomingMessages}
        onChange={(checked) => save({ incomingMessages: checked }, checked ? 'Aviso de mensagens recebidas ativado.' : 'Aviso de mensagens recebidas desativado.')}
        disabled={rowsDisabled}
      >
        {enabled && preferences.incomingMessages && (
          <div className="space-y-1.5">
            <SegmentedControl
              ariaLabel="Quais mensagens avisar"
              options={INCOMING_SCOPE_OPTIONS}
              value={preferences.newConversationsOnly ? 'new' : 'all'}
              onChange={(value) => save(
                { newConversationsOnly: value === 'new' },
                value === 'new' ? 'Avisando só de conversas novas.' : 'Avisando de todas as mensagens.',
              )}
              disabled={saving}
            />
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {preferences.newConversationsOnly
                ? 'Conversa nova é a primeira mensagem de um contato que ainda não tinha conversa na caixa de entrada — ou de uma que estava arquivada e voltou.'
                : 'Várias mensagens seguidas do mesmo contato viram um aviso só.'}
            </p>
          </div>
        )}
      </ToggleRow>

      <ToggleRow
        title="Transferência para atendimento humano"
        description="Quando a IA, um fluxo ou uma palavra-chave passa a conversa para uma pessoa e o contato entra na fila de atendimento."
        checked={preferences.humanHandoff}
        onChange={(checked) => save({ humanHandoff: checked }, checked ? 'Aviso de transferência ativado.' : 'Aviso de transferência desativado.')}
        disabled={rowsDisabled}
      />

      <ToggleRow
        title="Som"
        description="Um toque curto junto com o aviso. O navegador só toca depois que você clica em algum lugar da página — regra dele, vale para qualquer site."
        checked={preferences.sound}
        onChange={(checked) => save({ sound: checked }, checked ? 'Som ativado.' : 'Som desativado.')}
        disabled={rowsDisabled}
      >
        {enabled && preferences.sound && (
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              ariaLabel="Toque do alerta"
              options={ALERT_TONE_OPTIONS}
              value={preferences.soundTone}
              onChange={handleToneChange}
              disabled={saving}
            />
            <Button variant="ghost" size="sm" icon={<Volume2 size={14}/>} onClick={handlePreview} loading={previewing} disabled={saving}>
              Ouvir
            </Button>
          </div>
        )}
      </ToggleRow>

      <div className="py-3 last:pb-0">
        <div className={enabled ? '' : 'opacity-60'}>
          <Select<AlertMode>
            label="Tipo de notificação"
            options={ALERT_MODE_OPTIONS.map((option) => ({ value: option.value, label: option.label, description: option.description }))}
            value={preferences.mode}
            onChange={handleModeChange}
            disabled={rowsDisabled}
            hint="A notificação do navegador é a que aparece pelo sistema operacional, mesmo com o Synq em outra aba."
          />
        </div>
        {enabled && usesBrowser && browserPermission === 'default' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={<BellRing size={14}/>} onClick={handleRequestPermission}>
              Permitir notificações do navegador
            </Button>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sem a permissão, o aviso fica só dentro do sistema.</span>
          </div>
        )}
        {enabled && usesBrowser && browserPermission === 'denied' && (
          <Callout tone="warning" className="mt-2">
            O navegador bloqueou as notificações deste site. Para liberar, clique no ícone de cadeado ao lado do endereço,
            abra as permissões do site e permita notificações. Enquanto isso, o aviso fica só dentro do sistema.
          </Callout>
        )}
        {enabled && usesBrowser && browserPermission === 'granted' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" icon={<BellRing size={14}/>} onClick={handleBrowserPreview}>
              Enviar notificação de teste
            </Button>
            <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Permissão concedida. Se o teste não aparecer na tela, o bloqueio é do sistema operacional: o navegador
              precisa estar liberado em Ajustes do Sistema → Notificações (Mac) ou Configurações → Sistema →
              Notificações (Windows), com estilo faixa/banner, e o modo Foco / Não perturbe desligado.
            </span>
          </div>
        )}
        {enabled && usesBrowser && browserPermission === 'unsupported' && (
          <Callout tone="info" className="mt-2">
            Este navegador não oferece notificações do sistema. O aviso fica dentro do Synq.
          </Callout>
        )}
      </div>
    </div>

    <Callout tone="info" className="mt-3">
      Com a aba em segundo plano, o título dela mostra quantos avisos chegaram — assim dá para acompanhar pela barra de abas,
      mesmo sem permissão de notificação.
    </Callout>
  </Card>);
}
