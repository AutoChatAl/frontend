'use client';
import { AlertCircle, Plus, Reply } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EmptyState from '@/components/EmptyState';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { useWorkspaceChannels } from '@/hooks/WorkspaceChannelsHook';
import { autoReplyService } from '@/services/auto-reply.service';
import { commentAutomationService } from '@/services/comment-automation.service';
import { liveAutomationService } from '@/services/live-automation.service';
import type { AutoReply } from '@/types/AutoReply';
import type { CommentAutomation } from '@/types/CommentAutomation';
import type { LiveAutomation } from '@/types/LiveAutomation';

import AutomationCard from './components/AutomationCard';
import AutomationFilters, { type KindFilter } from './components/AutomationFilters';
import { toCommentRow, toDmRow, toLiveRow, type AutomationKind, type AutomationRow } from './components/automationMeta';
import AutomationModal from './components/AutomationModal';
import AutomationTypeModal from './components/AutomationTypeModal';

/** `?tipo=` abre a tela já filtrada — é por onde a rota antiga de comentários chega. */
function kindFromParam(value: string | null): KindFilter {
  if (value === 'comentario' || value === 'comment') return 'COMMENT';
  if (value === 'live') return 'LIVE';
  if (value === 'dm' || value === 'mensagem') return 'DM';
  return 'ALL';
}

type WithMongoId<T> = T & { _id?: string };

export default function AutoRepliesPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<AutomationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<KindFilter>(() => kindFromParam(searchParams.get('tipo')));
  const [channelId, setChannelId] = useState('');

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [creating, setCreating] = useState<AutomationKind | null>(null);
  const [editTarget, setEditTarget] = useState<AutomationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AutomationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toasts, addToast, removeToast } = useToast();
  const { channels, loading: channelsLoading } = useWorkspaceChannels();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Uma lista falhando não pode esconder a outra: cada serviço tem o seu catch.
      const [dms, comments, lives] = await Promise.all([
        autoReplyService.list().catch(() => null),
        commentAutomationService.list().catch(() => null),
        liveAutomationService.list().catch(() => null),
      ]);
      if (dms === null && comments === null && lives === null) {
        throw new Error('Erro ao carregar as automações');
      }
      const merged: AutomationRow[] = [
        ...(dms ?? []).map((rule: WithMongoId<AutoReply>) => toDmRow({ ...rule, id: rule.id || rule._id || '' })),
        ...(comments ?? []).map((rule: WithMongoId<CommentAutomation>) => toCommentRow({ ...rule, id: rule.id || rule._id || '' })),
        ...(lives ?? []).map((rule: WithMongoId<LiveAutomation>) => toLiveRow({ ...rule, id: rule.id || rule._id || '' })),
      ];
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRows(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar as automações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const channelNameById = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel.name])),
    [channels],
  );

  // O contador das abas respeita o canal escolhido, mas não o próprio tipo —
  // senão a aba não selecionada mostraria sempre zero.
  const byChannel = useMemo(
    () => (channelId ? rows.filter((row) => row.channelId === channelId) : rows),
    [rows, channelId],
  );
  const counts: Record<KindFilter, number> = useMemo(() => ({
    ALL: byChannel.length,
    DM: byChannel.filter((row) => row.kind === 'DM').length,
    COMMENT: byChannel.filter((row) => row.kind === 'COMMENT').length,
    LIVE: byChannel.filter((row) => row.kind === 'LIVE').length,
  }), [byChannel]);
  const visible = useMemo(
    () => (kind === 'ALL' ? byChannel : byChannel.filter((row) => row.kind === kind)),
    [byChannel, kind],
  );

  const handleToggle = async (row: AutomationRow) => {
    try {
      if (row.kind === 'DM') await autoReplyService.toggle(row.id);
      else if (row.kind === 'LIVE') await liveAutomationService.toggle(row.id);
      else await commentAutomationService.toggle(row.id);
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, enabled: !item.enabled } : item)));
      addToast('success', `Automação ${row.enabled ? 'desativada' : 'ativada'}`);
    } catch {
      addToast('error', 'Erro ao alterar o status da automação');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'DM') await autoReplyService.delete(deleteTarget.id);
      else if (deleteTarget.kind === 'LIVE') await liveAutomationService.delete(deleteTarget.id);
      else await commentAutomationService.delete(deleteTarget.id);
      setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      addToast('success', 'Automação excluída');
    } catch {
      addToast('error', 'Erro ao excluir a automação');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const afterSave = (message: string) => {
    fetchRows();
    addToast('success', message);
  };

  if (loading) {
    return <PageLoader message="Carregando automações..."/>;
  }

  if (error && rows.length === 0) {
    return (<div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={20}/>
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button onClick={fetchRows} size="sm">Tentar novamente</Button>
      </div>
    </div>);
  }

  return (<div className="w-full max-w-full space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Auto-respostas</h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Respostas automáticas por palavra-chave, em mensagens diretas e em comentários
        </p>
      </div>
      <div data-tour="auto-replies-new">
        <Button icon={<Plus size={16}/>} onClick={() => setTypePickerOpen(true)} className="w-full justify-center sm:w-auto">
          Nova automação
        </Button>
      </div>
    </div>

    {rows.length > 0 && (
      <AutomationFilters
        kind={kind}
        onKindChange={setKind}
        channelId={channelId}
        onChannelChange={setChannelId}
        channels={channels}
        counts={counts}
      />
    )}

    {rows.length === 0 ? (<EmptyState
      icon={<Reply size={20}/>}
      title="Nenhuma automação configurada"
      description="Crie regras para responder sozinho quando alguém mandar uma palavra-chave no direct ou comentar num post."
      action={{ label: 'Criar primeira automação', icon: <Plus size={16}/>, onClick: () => setTypePickerOpen(true) }}
    />) : visible.length === 0 ? (<p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-[13px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
      Nenhuma automação com esses filtros.
    </p>) : (<div className="grid gap-2 sm:gap-3">
      {visible.map((row) => (
        <AutomationCard
          key={`${row.kind}-${row.id}`}
          row={row}
          channelName={channelNameById.get(row.channelId) ?? null}
          onToggle={handleToggle}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      ))}
    </div>)}

    <AutomationTypeModal
      isOpen={typePickerOpen}
      onClose={() => setTypePickerOpen(false)}
      onPick={(picked) => {
        setTypePickerOpen(false);
        setCreating(picked);
      }}
    />

    {creating && (<AutomationModal
      isOpen
      kind={creating}
      channels={channels}
      channelsLoading={channelsLoading}
      onClose={() => setCreating(null)}
      onSuccess={() => {
        setCreating(null);
        afterSave('Automação criada com sucesso!');
      }}
    />)}

    {editTarget && (<AutomationModal
      isOpen
      kind={editTarget.kind}
      automation={editTarget}
      channels={channels}
      channelsLoading={channelsLoading}
      onClose={() => setEditTarget(null)}
      onSuccess={() => {
        setEditTarget(null);
        afterSave('Automação atualizada com sucesso!');
      }}
    />)}

    {deleteTarget && (<ConfirmDeleteModal
      isOpen
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleDelete}
      loading={deleting}
      title="Excluir automação"
      message={deleteTarget.kind === 'DM'
        ? `Tem certeza que deseja excluir a auto-resposta para "${deleteTarget.rule.keyword}"?`
        : `Tem certeza que deseja excluir a automação ${deleteTarget.kind === 'LIVE' ? 'de live ' : ''}${deleteTarget.rule.keyword ? `para "${deleteTarget.rule.keyword}"` : 'de qualquer comentário'}?`}
    />)}

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
