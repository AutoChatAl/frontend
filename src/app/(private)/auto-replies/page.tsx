'use client';
import { AlertCircle, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import ImportExportMenu from '@/components/ImportExportMenu';
import Select from '@/components/Select';
import { SkeletonPage, SkeletonRows } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { useWorkspaceChannels } from '@/hooks/WorkspaceChannelsHook';
import { autoReplyService } from '@/services/auto-reply.service';
import { automationInsightsService } from '@/services/automation-insights.service';
import { commentAutomationService } from '@/services/comment-automation.service';
import { liveAutomationService } from '@/services/live-automation.service';
import { setupOnboardingService } from '@/services/setup-onboarding.service';
import type { AutomationResult } from '@/types/AutomationInsights';
import type { AutoReply } from '@/types/AutoReply';
import type { BusinessType } from '@/types/BusinessType';
import type { CommentAutomation } from '@/types/CommentAutomation';
import type { LiveAutomation } from '@/types/LiveAutomation';
import { getErrorMessageFromCatch } from '@/utils/ErrorHandling';

import AutomationCard from './components/AutomationCard';
import AutomationFilters, { type KindFilter } from './components/AutomationFilters';
import { draftFromSuggestion, type AutomationDraft } from './components/automationForm';
import { toCommentRow, toDmRow, toLiveRow, type AutomationKind, type AutomationRow } from './components/automationMeta';
import AutomationModal from './components/AutomationModal';
import AutomationTypeModal from './components/AutomationTypeModal';
import RecipeGallery from './components/RecipeGallery';
import { getRecipe, recipesForBusiness, type AutomationRecipe } from './recipes';

/** `?tipo=` abre a tela já filtrada — é por onde a rota antiga de comentários chega. */
function kindFromParam(value: string | null): KindFilter {
  if (value === 'comentario' || value === 'comment') return 'COMMENT';
  if (value === 'live') return 'LIVE';
  if (value === 'dm' || value === 'mensagem') return 'DM';
  return 'ALL';
}

type WithMongoId<T> = T & { _id?: string };

interface CreateRequest {
  kind: AutomationKind;
  draft?: Partial<AutomationDraft>;
  requireLink?: boolean;
  messagePlaceholder?: string;
  intro?: string;
  title?: string;
}

function resultKey(kind: string, id: string): string {
  return `${kind}-${id}`;
}

export default function AutoRepliesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<AutomationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<KindFilter>(() => kindFromParam(searchParams.get('tipo')));
  const [channelId, setChannelId] = useState('');
  // Canal de destino da importação: o id que vem no arquivo é do workspace de origem.
  const [importChannelId, setImportChannelId] = useState('');

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [creating, setCreating] = useState<CreateRequest | null>(null);
  const [editTarget, setEditTarget] = useState<AutomationRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AutomationRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [results, setResults] = useState<Map<string, AutomationResult> | null>(null);
  const [describing, setDescribing] = useState(false);
  const [describeError, setDescribeError] = useState<string | null>(null);
  const recipeHandled = useRef(false);

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
        throw new Error('Não foi possível carregar as automações');
      }
      const merged: AutomationRow[] = [
        ...(dms ?? []).map((rule: WithMongoId<AutoReply>) => toDmRow({ ...rule, id: rule.id || rule._id || '' })),
        ...(comments ?? []).map((rule: WithMongoId<CommentAutomation>) => toCommentRow({ ...rule, id: rule.id || rule._id || '' })),
        ...(lives ?? []).map((rule: WithMongoId<LiveAutomation>) => toLiveRow({ ...rule, id: rule.id || rule._id || '' })),
      ];
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRows(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as automações');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const list = await automationInsightsService.getResults();
      setResults(new Map(list.map((item) => [resultKey(item.kind, item.automationId), item])));
    } catch {
      setResults(null);
    }
  }, []);

  useEffect(() => {
    void fetchRows();
    void fetchResults();
  }, [fetchRows, fetchResults]);

  useEffect(() => {
    let alive = true;
    setupOnboardingService.fetch()
      .then((state) => { if (alive) setBusinessType(state.businessType); })
      .catch(() => { if (alive) setBusinessType(null); });
    return () => { alive = false; };
  }, []);

  const recipes = useMemo(() => recipesForBusiness(businessType), [businessType]);

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

  const openRecipe = useCallback((recipe: AutomationRecipe) => {
    const { target } = recipe;
    if (target.type === 'automation') {
      setCreating({
        kind: target.kind,
        draft: target.draft,
        title: recipe.title,
        ...(target.requiresLink ? { requireLink: true } : {}),
        ...(target.messagePlaceholder ? { messagePlaceholder: target.messagePlaceholder } : {}),
        ...(target.note ? { intro: target.note } : {}),
      });
      return;
    }
    if (target.type === 'flow') {
      router.push(`/flows?template=${encodeURIComponent(target.templateId)}`);
      return;
    }
    if (target.type === 'cart-recovery') {
      router.push('/cart-recovery');
      return;
    }
    router.push('/ia');
  }, [router]);

  useEffect(() => {
    if (recipeHandled.current) return;
    const recipe = getRecipe(searchParams.get('recipe'));
    if (!recipe) return;
    recipeHandled.current = true;
    router.replace('/auto-replies');
    openRecipe(recipe);
  }, [searchParams, router, openRecipe]);

  const handleDescribe = async (description: string) => {
    setDescribing(true);
    setDescribeError(null);
    try {
      const suggestion = await automationInsightsService.draftFromText(description);
      setCreating({
        kind: suggestion.kind,
        draft: draftFromSuggestion(suggestion),
        title: 'Revise a automação sugerida',
        intro: 'Montamos esta automação a partir do que você escreveu. Confira as palavras e a mensagem, escolha onde ela vale e salve para ativar.',
      });
    } catch (err) {
      setDescribeError(getErrorMessageFromCatch(err, 'Não conseguimos entender o pedido agora. Tente descrever de outro jeito ou escolha um dos objetivos acima.'));
    } finally {
      setDescribing(false);
    }
  };

  const handleToggle = async (row: AutomationRow) => {
    try {
      if (row.kind === 'DM') await autoReplyService.toggle(row.id);
      else if (row.kind === 'LIVE') await liveAutomationService.toggle(row.id);
      else await commentAutomationService.toggle(row.id);
      setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, enabled: !item.enabled } : item)));
      addToast('success', `Automação ${row.enabled ? 'desativada' : 'ativada'}`);
    } catch {
      addToast('error', 'Não foi possível ligar ou desligar a automação');
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
      addToast('error', 'Não foi possível excluir a automação');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const afterSave = (message: string) => {
    void fetchRows();
    void fetchResults();
    addToast('success', message);
  };

  if (loading && rows.length === 0) {
    return <SkeletonPage><SkeletonRows count={5}/></SkeletonPage>;
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
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Automações</h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Respostas automáticas para mensagens, comentários e lives, funcionando 24 horas por dia
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ImportExportMenu
          resourceLabel="automações"
          onExport={() => autoReplyService.exportCsv(channelId || undefined)}
          onImport={(csv) => autoReplyService.importCsv(importChannelId, csv)}
          onImported={() => { void fetchRows(); }}
          onError={(message) => addToast('error', message)}
          importBlocked={!importChannelId}
          importExtra={(
            <Select
              label="Onde as respostas vão funcionar"
              placeholder={channels.length === 0 ? 'Nenhum número ou conta conectada' : 'Escolha o número ou a conta...'}
              value={importChannelId}
              onChange={setImportChannelId}
              disabled={channels.length === 0}
              options={channels.map((channel) => ({ value: channel.id, label: channel.name }))}
              hint="Todas as respostas do arquivo entram aqui."
            />
          )}
        />
        <div data-tour="auto-replies-new">
          <Button icon={<Plus size={16}/>} onClick={() => setTypePickerOpen(true)} className="w-full justify-center sm:w-auto">
            Criar do zero
          </Button>
        </div>
      </div>
    </div>

    <RecipeGallery
      recipes={recipes}
      businessType={businessType}
      onPick={openRecipe}
      onDescribe={(text) => { void handleDescribe(text); }}
      describing={describing}
      describeError={describeError}
      onDescribeChange={() => setDescribeError(null)}
      initialVisible={rows.length > 0 ? 3 : 6}
    />

    {rows.length > 0 && (<>
      <h2 className="pt-2 text-sm font-semibold text-slate-900 dark:text-white">Suas automações</h2>
      <AutomationFilters
        kind={kind}
        onKindChange={setKind}
        channelId={channelId}
        onChannelChange={setChannelId}
        channels={channels}
        counts={counts}
      />
    </>)}

    {rows.length === 0 ? null : visible.length === 0 ? (<p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-[13px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
      Nenhuma automação com esses filtros.
    </p>) : (<div className="grid gap-2 sm:gap-3">
      {visible.map((row) => (
        <AutomationCard
          key={`${row.kind}-${row.id}`}
          row={row}
          channelName={channelNameById.get(row.channelId) ?? null}
          result={results?.get(resultKey(row.kind, row.id)) ?? null}
          resultsReady={results !== null}
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
        setCreating({ kind: picked });
      }}
    />

    {creating && (<AutomationModal
      isOpen
      kind={creating.kind}
      initialDraft={creating.draft}
      requireLink={creating.requireLink}
      messagePlaceholder={creating.messagePlaceholder}
      intro={creating.intro}
      title={creating.title}
      channels={channels}
      channelsLoading={channelsLoading}
      onClose={() => setCreating(null)}
      onSuccess={() => {
        setCreating(null);
        afterSave('Automação criada e ativada!');
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
        afterSave('Automação atualizada!');
      }}
    />)}

    {deleteTarget && (<ConfirmDeleteModal
      isOpen
      onClose={() => setDeleteTarget(null)}
      onConfirm={handleDelete}
      loading={deleting}
      title="Excluir automação"
      message={deleteTarget.kind === 'DM'
        ? `Tem certeza que deseja excluir a resposta automática para "${deleteTarget.rule.keyword}"?`
        : `Tem certeza que deseja excluir a automação ${deleteTarget.kind === 'LIVE' ? 'de live ' : ''}${deleteTarget.rule.keyword ? `para "${deleteTarget.rule.keyword}"` : 'de qualquer comentário'}?`}
    />)}

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
