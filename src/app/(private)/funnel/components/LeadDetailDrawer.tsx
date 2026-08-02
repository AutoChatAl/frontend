'use client';
import { Bot, Check, Loader2, Plus, ShoppingCart, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/components/Button';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { funnelService } from '@/services/funnel.service';
import { tagService } from '@/services/tag.service';
import type { AttendanceStatus, FunnelLead, FunnelStage, LeadOrigin } from '@/types/Funnel';

import {
  ATTENDANCE_META,
  CHANNEL_META,
  formatCurrency,
  formatRelative,
  getInitials,
  ORIGIN_META,
} from './meta';
import ScoreRing from './ScoreRing';
import TemperatureBadge from './TemperatureBadge';

interface LeadDetailDrawerProps {
  lead: FunnelLead | null;
  stages: FunnelStage[];
  onClose: () => void;
  onSaved: (lead: FunnelLead, fromStageId: string | null) => void;
}

const ATTENDANCE_OPTIONS = (Object.keys(ATTENDANCE_META) as AttendanceStatus[]).map((value) => ({
  value,
  label: ATTENDANCE_META[value].label,
}));

const ORIGIN_OPTIONS = (Object.keys(ORIGIN_META) as LeadOrigin[]).map((value) => ({
  value,
  label: ORIGIN_META[value].label,
}));

export default function LeadDetailDrawer({ lead, stages, onClose, onSaved }: LeadDetailDrawerProps) {
  const [stageId, setStageId] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('OPEN');
  const [origin, setOrigin] = useState<LeadOrigin>('MANUAL');
  const [notes, setNotes] = useState('');
  const [scoreInput, setScoreInput] = useState('');
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadTags = useCallback(async () => {
    try {
      const tags = await tagService.listTags();
      setAllTags(tags.map((tag) => ({ id: tag.id, name: tag.name })));
    } catch {
      setAllTags([]);
    }
  }, []);

  useEffect(() => {
    if (!lead) return;
    setStageId(lead.funnelStageId ?? '');
    setAttendanceStatus(lead.attendanceStatus);
    setOrigin(lead.origin);
    setNotes(lead.notes);
    setScoreInput('');
    setSelectedTagIds(lead.tags.map((tag) => tag.id));
    setError('');
    loadTags();
  }, [lead, loadTags]);

  if (!lead) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  };

  const handleCreateTag = async () => {
    const value = newTag.trim();
    if (value.length < 1) return;
    setCreatingTag(true);
    try {
      const created = await tagService.createTag(value);
      setAllTags((prev) => [...prev, { id: created.id, name: created.name }]);
      setSelectedTagIds((prev) => [...prev, created.id]);
      setNewTag('');
    } catch {
      setError('Não foi possível criar a etiqueta.');
    } finally {
      setCreatingTag(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const trimmedScore = scoreInput.trim();
      const scoreOverride = trimmedScore === '' ? null : Math.max(0, Math.min(100, Number(trimmedScore) || 0));
      let updated = await funnelService.updateLead(lead.id, {
        attendanceStatus,
        origin,
        notes,
        tagIds: selectedTagIds,
        scoreOverride,
      });
      const fromStageId = lead.funnelStageId;
      if (stageId && stageId !== lead.funnelStageId) {
        updated = await funnelService.moveLead(lead.id, stageId, 0);
      }
      onSaved(updated, fromStageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar o lead.');
    } finally {
      setSaving(false);
    }
  };

  const hasValue = lead.salesValueCents > 0 || lead.abandonedValueCents > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              {getInitials(lead.displayName)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {lead.displayName || 'Sem nome'}
              </h3>
              {lead.identifier && (
                <p className="truncate font-mono text-xs text-slate-400 dark:text-slate-500">{lead.identifier}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <ScoreRing score={lead.score} temperature={lead.temperature} size={56} />
            <div className="space-y-1.5">
              <TemperatureBadge temperature={lead.temperature} size="md" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conversão estimada <span className="font-semibold text-slate-700 dark:text-slate-200">{lead.conversionProbability}%</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Última interação {formatRelative(lead.lastInteractionAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {lead.channels.map((channel) => {
              const ChannelIcon = CHANNEL_META[channel].icon;
              return (
                <span
                  key={channel}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${CHANNEL_META[channel].className}`}
                >
                  <ChannelIcon size={12} />
                  {CHANNEL_META[channel].label}
                </span>
              );
            })}
            {hasValue && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <ShoppingCart size={12} />
                {lead.salesCount > 0
                  ? `${formatCurrency(lead.salesValueCents)} em vendas`
                  : `${formatCurrency(lead.abandonedValueCents)} em carrinho`}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Select
              label="Etapa do funil"
              value={stageId}
              onChange={(value) => setStageId(value)}
              options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
            />
            {lead.stageMovedBy === 'AI' && (
              <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 dark:border-indigo-900/20 dark:bg-indigo-900/10">
                <Bot size={13} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  Movido pela IA {formatRelative(lead.stageEnteredAt)}
                  {lead.stageMoveReason ? `: ${lead.stageMoveReason}` : '.'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select<AttendanceStatus>
              label="Atendimento"
              value={attendanceStatus}
              onChange={(value) => setAttendanceStatus(value)}
              options={ATTENDANCE_OPTIONS}
            />
            <Select<LeadOrigin>
              label="Origem"
              value={origin}
              onChange={(value) => setOrigin(value)}
              options={ORIGIN_OPTIONS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="score-override" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Sparkles size={13} className="text-indigo-500" />
              Ajustar score manualmente
            </label>
            <input
              id="score-override"
              type="number"
              min={0}
              max={100}
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              placeholder={`Automático (${lead.score})`}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">Deixe em branco para manter o cálculo automático.</p>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Etiquetas</span>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
                  >
                    {active && <Check size={11} />}
                    {tag.name}
                  </button>
                );
              })}
              {allTags.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">Nenhuma etiqueta criada ainda.</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleCreateTag()}
                placeholder="Nova etiqueta"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag || newTag.trim().length < 1}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {creatingTag ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Criar
              </button>
            </div>
          </div>

          <Textarea
            label="Observações"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anotações rápidas sobre o lead..."
            rows={3}
          />

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 p-5 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} loadingText="Salvando...">
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
