'use client';
import { Plus, Save } from 'lucide-react';
import { useRef, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import Textarea from '@/components/Textarea';
import ToggleRow from '@/components/ToggleRow';
import type { SchedulingReminderKey, SchedulingReminders } from '@/types/Scheduling';
import {
  SCHEDULING_REMINDER_MESSAGE_MAX_LENGTH,
  SCHEDULING_REMINDER_OPTIONS,
  SCHEDULING_REMINDER_VARIABLES,
} from '@/types/Scheduling';

interface SchedulingRemindersConfigProps {
  reminders: SchedulingReminders;
  /** Só dono e administrador alteram — a rota recusa os demais. */
  canEdit: boolean;
  onToggle: (key: SchedulingReminderKey, enabled: boolean) => void;
  onSaveMessage: (key: SchedulingReminderKey, message: string) => Promise<boolean>;
}

const VARIABLE_PATTERN = /\{\{\s*([^{}\s]+)\s*\}\}/g;

function exampleFor(token: string, leadTime: string) {
  if (token === 'antecedencia') return leadTime;
  return SCHEDULING_REMINDER_VARIABLES.find((variable) => variable.token === token)?.example;
}

/** Mesma troca que o backend faz no envio, aceitando acento e maiúscula, com valores de exemplo. */
function renderPreview(message: string, leadTime: string) {
  return message.replace(VARIABLE_PATTERN, (match, raw: string) => {
    const token = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    return exampleFor(token, leadTime) ?? match;
  });
}

interface ReminderMessageEditorProps {
  title: string;
  savedMessage: string;
  leadTime: string;
  disabled: boolean;
  onSave: (message: string) => Promise<boolean>;
}

function ReminderMessageEditor({ title, savedMessage, leadTime, disabled, onSave }: ReminderMessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(savedMessage);
  const [saving, setSaving] = useState(false);
  const trimmed = draft.trim();
  const empty = trimmed.length === 0;
  const dirty = trimmed !== savedMessage;

  // Entra onde está o cursor (ou no lugar da seleção), não no fim do texto.
  const insertVariable = (token: string) => {
    const textarea = textareaRef.current;
    const text = `{{${token}}}`;
    const start = textarea?.selectionStart ?? draft.length;
    const end = textarea?.selectionEnd ?? draft.length;
    const next = `${draft.slice(0, start)}${text}${draft.slice(end)}`;
    if (next.length > SCHEDULING_REMINDER_MESSAGE_MAX_LENGTH) return;
    setDraft(next);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (await onSave(trimmed)) setDraft(trimmed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-2 rounded-lg border border-slate-100 p-3 dark:border-slate-700/60">
      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        maxLength={SCHEDULING_REMINDER_MESSAGE_MAX_LENGTH}
        disabled={disabled}
        aria-label={`Mensagem do lembrete ${title}`}
        error={empty ? 'A mensagem não pode ficar vazia.' : undefined}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500 dark:text-slate-400">Inserir variável:</span>
        {SCHEDULING_REMINDER_VARIABLES.map((variable) => (
          <button
            key={variable.token}
            type="button"
            onClick={() => insertVariable(variable.token)}
            disabled={disabled}
            title={`Insere {{${variable.token}}} — ex.: ${exampleFor(variable.token, leadTime)}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-500/40 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
          >
            <Plus size={11} />
            {variable.label}
          </button>
        ))}
      </div>

      {!empty && (
        <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/40">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Prévia</p>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] text-slate-700 dark:text-slate-200">
            {renderPreview(draft, leadTime)}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
          {draft.length}/{SCHEDULING_REMINDER_MESSAGE_MAX_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={() => setDraft(savedMessage)} disabled={saving}>
              Descartar
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={disabled || !dirty || empty}
            loading={saving}
            loadingText="Salvando..."
            icon={<Save size={14} />}
          >
            Salvar mensagem
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulingRemindersConfig({ reminders, canEdit, onToggle, onSaveMessage }: SchedulingRemindersConfigProps) {
  return (
    <Card className="p-4">
      <SectionHeader
        title="Lembretes automáticos"
        hint="Mensagem ao contato antes do horário marcado, no WhatsApp ou Instagram em que ele falou por último. Vale para agendamentos com contato vinculado."
      />
      {!canEdit && (
        <Callout className="mb-3">Só o dono ou um administrador da conta altera os lembretes.</Callout>
      )}
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {SCHEDULING_REMINDER_OPTIONS.map((option) => {
          const setting = reminders[option.key];
          return (
            <ToggleRow
              key={option.key}
              title={option.title}
              description={`Enviado cerca de ${option.leadTime} antes do horário. Ligado, você escolhe o texto da mensagem.`}
              checked={setting.enabled}
              onChange={(enabled) => onToggle(option.key, enabled)}
              disabled={!canEdit}
            >
              {setting.enabled && (
                <ReminderMessageEditor
                  title={option.title}
                  savedMessage={setting.message}
                  leadTime={option.leadTime}
                  disabled={!canEdit}
                  onSave={(message) => onSaveMessage(option.key, message)}
                />
              )}
            </ToggleRow>
          );
        })}
      </div>
    </Card>
  );
}
