'use client';
import { Bot, Check, Info, Loader2, Plus, TrendingDown, TrendingUp, UserMinus, X } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import Button from '@/components/Button';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { funnelService } from '@/services/funnel.service';
import { tagService } from '@/services/tag.service';
import type { AttendanceStatus, FunnelLead, FunnelStage, LeadOrigin } from '@/types/Funnel';

import {
  ATTENDANCE_META,
  CHANNEL_META,
  CONFIDENCE_META,
  formatCurrency,
  formatIdentifier,
  formatRelative,
  FUNNEL_ORIGIN_OPTIONS,
  getInitials,
  ORIGIN_META,
  SOURCE_CHANNEL_META,
} from './meta';
import ScoreRing from './ScoreRing';
import TemperatureBadge from './TemperatureBadge';

interface LeadDetailDrawerProps {
  lead: FunnelLead | null;
  stages: FunnelStage[];
  onClose: () => void;
  onSaved: (lead: FunnelLead, fromStageId: string | null) => void;
  /** Pedido de remoção do quadro — a confirmação e a chamada ficam na página. */
  onRemoveFromFunnel: (lead: FunnelLead) => void;
}

const ATTENDANCE_OPTIONS = (Object.keys(ATTENDANCE_META) as AttendanceStatus[]).map((value) => ({
  value,
  label: ATTENDANCE_META[value].label,
}));

/**
 * Só as origens de contato. Se o lead já veio com outra (importação, campanha),
 * ela entra na lista para o select não abrir em branco — mas não é oferecida.
 */
function originOptions(current: LeadOrigin) {
  const values = FUNNEL_ORIGIN_OPTIONS.includes(current)
    ? FUNNEL_ORIGIN_OPTIONS
    : [...FUNNEL_ORIGIN_OPTIONS, current];
  return values.map((value) => ({ value, label: ORIGIN_META[value].label }));
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{children}</p>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <span className="truncate text-right text-[13px] text-slate-700 dark:text-slate-300">{value}</span>
    </div>
  );
}

export default function LeadDetailDrawer({
  lead,
  stages,
  onClose,
  onSaved,
  onRemoveFromFunnel,
}: LeadDetailDrawerProps) {
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

  const currentStage = stages.find((stage) => stage.id === lead.funnelStageId) ?? null;
  const identifier = formatIdentifier(lead.identifier);
  const sourceMeta = lead.sourceChannel ? SOURCE_CHANNEL_META[lead.sourceChannel.type] : null;
  const SourceIcon = sourceMeta?.icon;
  const sourceLabel = lead.sourceChannel
    ? formatIdentifier(lead.sourceChannel.identifier) ?? lead.sourceChannel.name ?? null
    : null;

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

  const hasSale = lead.salesValueCents > 0;
  const hasCart = lead.abandonedValueCents > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-in slide-in-from-right duration-300 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-700">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[13px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              {getInitials(lead.displayName)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {lead.displayName || 'Sem nome'}
              </h3>
              {identifier && (
                <p className="truncate font-mono text-xs text-slate-400 dark:text-slate-500">{identifier}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {/* Qualificação: score, chance de fechar e o que moveu esse número. */}
          <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center gap-3.5">
              <ScoreRing score={lead.score} temperature={lead.temperature} size={52} />
              <div className="min-w-0 space-y-1">
                <TemperatureBadge temperature={lead.temperature} size="md" />
                <p className="text-[13px] text-slate-600 dark:text-slate-300">
                  Chance de fechar{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{lead.conversionProbability}%</span>
                  <span className="ml-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {CONFIDENCE_META[lead.conversionConfidence].short}
                  </span>
                </p>
                {/* De onde saiu a base, em português — o número não pode ser mágico. */}
                {currentStage && !currentStage.isGoal && !currentStage.isLost && (
                  <p className="text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                    {lead.conversionBasis === 'outcome'
                      ? `Parte de ${currentStage.conversionRate}% em "${currentStage.name}" (faixa ${currentStage.conversionLow}–${currentStage.conversionHigh}%, ${currentStage.conversionSample} leads) e ajusta pelos sinais deste lead.`
                      : `Ninguém chegou ao fim do funil ainda: a base de ${currentStage.conversionRate}% vem do ritmo de avanço entre as etapas e ajusta pelos sinais deste lead.`}
                  </p>
                )}
              </div>
            </div>
            {lead.conversionDrivers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lead.conversionDrivers.map((driver) => {
                  const up = driver.impact === 'up';
                  const DriverIcon = up ? TrendingUp : TrendingDown;
                  return (
                    <span
                      key={driver.label}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'}`}
                    >
                      <DriverIcon size={11} />
                      {driver.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <SectionTitle>Situação</SectionTitle>
            <Select
              label="Etapa do funil"
              value={stageId}
              onChange={(value) => setStageId(value)}
              options={stages.map((stage) => ({ value: stage.id, label: stage.name }))}
            />
            {lead.stageMovedBy === 'AI' && (
              <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                <Bot size={13} className="mt-0.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Movido pela IA {formatRelative(lead.stageEnteredAt)}
                  {lead.stageMoveReason ? `: ${lead.stageMoveReason}` : '.'}
                </p>
              </div>
            )}
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
                options={originOptions(lead.origin)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <SectionTitle>Contexto</SectionTitle>
            <div className="flex flex-wrap gap-1.5 pb-1 pt-1">
              {lead.channels.map((channel) => {
                const ChannelIcon = CHANNEL_META[channel].icon;
                return (
                  <span
                    key={channel}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${CHANNEL_META[channel].className}`}
                  >
                    <ChannelIcon size={12} />
                    {CHANNEL_META[channel].label}
                  </span>
                );
              })}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {sourceMeta && SourceIcon && (
                <Row
                  label="Entrou por"
                  value={
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <SourceIcon size={12} className={`shrink-0 ${sourceMeta.className}`} />
                      <span className="truncate">{sourceLabel ?? sourceMeta.label}</span>
                    </span>
                  }
                />
              )}
              <Row label="Última interação" value={formatRelative(lead.lastInteractionAt)} />
              <Row
                label="No funil desde"
                value={lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR') : '—'}
              />
              {hasSale && (
                <Row
                  label={`Vendas (${lead.salesCount})`}
                  value={formatCurrency(lead.salesValueCents)}
                />
              )}
              {hasCart && (
                <Row
                  label={`Carrinho abandonado (${lead.abandonedCount})`}
                  value={formatCurrency(lead.abandonedValueCents)}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle>Organização</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
                  >
                    {active && <Check size={11} />}
                    {tag.name}
                  </button>
                );
              })}
              {allTags.length === 0 && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">Nenhuma etiqueta criada ainda.</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleCreateTag()}
                placeholder="Nova etiqueta"
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag || newTag.trim().length < 1}
                className="flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                {creatingTag ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Criar
              </button>
            </div>
            <Textarea
              label="Observações"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anotações rápidas sobre o lead..."
              rows={3}
            />
          </div>

          <details className="group rounded-lg border border-slate-200 dark:border-slate-700">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
              <Info size={13} className="text-slate-400" />
              Ajustar o score manualmente
            </summary>
            <div className="space-y-1.5 border-t border-slate-100 px-3 py-3 dark:border-slate-700">
              <input
                id="score-override"
                type="number"
                min={0}
                max={100}
                value={scoreInput}
                onChange={(event) => setScoreInput(event.target.value)}
                placeholder={`Automático (${lead.score})`}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Em branco mantém o cálculo automático (recência, compras, carrinho, espera e opt-in).
              </p>
            </div>
          </details>

          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4 dark:border-slate-700">
          {/* Ação destrutiva usa a variante `danger` do Button, como manda o design system. */}
          <Button variant="danger" onClick={() => onRemoveFromFunnel(lead)} disabled={saving} icon={<UserMinus size={14} />}>
            Remover do funil
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={saving} loadingText="Salvando...">
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
