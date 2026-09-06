'use client';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { SkeletonCards, SkeletonPage } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useWorkspaceChannels } from '@/hooks/WorkspaceChannelsHook';
import { collaboratorService, type Member } from '@/services/collaborator.service';
import { flowService } from '@/services/flow.service';
import { funnelService } from '@/services/funnel.service';
import type { Flow, FlowEdge, FlowNode, FlowNodeKind } from '@/types/Flow';
import type { FunnelStageDefinition } from '@/types/Funnel';

import { BLOCKS, blockMeta, defaultNodeFields, outputHandles, requiresAiPlan } from './components/blocks';
import FlowCanvas from './components/FlowCanvas';
import NodeInspector from './components/NodeInspector';

function createId(): string {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export default function FlowsPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Rascunho do fluxo aberto: o canvas edita aqui e só vai ao servidor no salvar.
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [linking, setLinking] = useState<{ nodeId: string; handleId: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [channelsOpen, setChannelsOpen] = useState(false);
  const channelsRef = useRef<HTMLDivElement>(null);
  const { channels } = useWorkspaceChannels();
  const { hasAiPlan } = useSubscription();
  const router = useRouter();
  // Alimentam os blocos de funil e de atribuição. Falha aqui não impede montar o
  // fluxo: os outros blocos seguem editáveis e só esses dois ficam sem opção.
  const [stages, setStages] = useState<FunnelStageDefinition[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [scale, setScale] = useState(1);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [pickerOpen]);

  useEffect(() => {
    if (!channelsOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (channelsRef.current && !channelsRef.current.contains(event.target as Node)) setChannelsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [channelsOpen]);

  const active = useMemo(() => flows.find((flow) => flow._id === activeId) ?? null, [flows, activeId]);
  const selected = useMemo(() => nodes.find((node) => node.id === selectedId) ?? null, [nodes, selectedId]);

  const openFlow = useCallback((flow: Flow) => {
    setActiveId(flow._id);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setSelectedId(null);
    setLinking(null);
    setDirty(false);
  }, []);

  useEffect(() => {
    flowService
      .list()
      .then((list) => {
        setFlows(list);
        const [first] = list;
        if (first) openFlow(first);
      })
      .catch(() => addToast('error', 'Não foi possível carregar os fluxos.'))
      .finally(() => setLoading(false));
  }, [addToast, openFlow]);

  useEffect(() => {
    void funnelService.listStages().then(setStages).catch(() => setStages([]));
    void collaboratorService.getMembers().then(setMembers).catch(() => setMembers([]));
  }, []);

  const handleCreateFlow = async () => {
    try {
      const flow = await flowService.create({ name: `Fluxo ${flows.length + 1}` });
      setFlows((prev) => [flow, ...prev]);
      openFlow(flow);
    } catch {
      addToast('error', 'Não foi possível criar o fluxo.');
    }
  };

  const handleRename = async (name: string) => {
    if (!active || !name.trim() || name === active.name) return;
    try {
      const updated = await flowService.update(active._id, { name: name.trim() });
      setFlows((prev) => prev.map((flow) => (flow._id === updated._id ? updated : flow)));
    } catch {
      addToast('error', 'Não foi possível renomear o fluxo.');
    }
  };

  const handleToggleChannel = async (channelId: string) => {
    if (!active) return;
    const next = active.channelIds.includes(channelId)
      ? active.channelIds.filter((id) => id !== channelId)
      : [...active.channelIds, channelId];
    try {
      const updated = await flowService.update(active._id, { channelIds: next });
      setFlows((prev) => prev.map((flow) => (flow._id === updated._id ? updated : flow)));
    } catch {
      addToast('error', 'Não foi possível alterar os canais.');
    }
  };

  const handleSave = async () => {
    if (!activeId) return;
    setSaving(true);
    try {
      const updated = await flowService.update(activeId, { nodes, edges });
      setFlows((prev) => prev.map((flow) => (flow._id === updated._id ? updated : flow)));
      setDirty(false);
      addToast('success', 'Fluxo salvo.');
    } catch {
      addToast('error', 'Não foi possível salvar o fluxo.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!active) return;
    try {
      const updated = await flowService.update(active._id, { enabled: !active.enabled, nodes, edges });
      setFlows((prev) => prev.map((flow) => (flow._id === updated._id ? updated : flow)));
      setDirty(false);
      addToast('success', updated.enabled ? 'Fluxo ativado.' : 'Fluxo desativado.');
    } catch {
      // O servidor recusa ativar fluxo sem bloco inicial, sem canal, ou com bloco
      // de IA sem plano contratado.
      addToast(
        'error',
        nodes.some((node) => requiresAiPlan(node.kind)) && !hasAiPlan
          ? 'Este fluxo usa o bloco de IA, que precisa de um plano de IA ativo.'
          : 'Para ativar, o fluxo precisa de um bloco de início (gatilho ou boas-vindas) e de ao menos um canal.',
      );
    }
  };

  const handleDeleteFlow = async () => {
    if (!activeId) return;
    try {
      await flowService.remove(activeId);
      const remaining = flows.filter((flow) => flow._id !== activeId);
      setFlows(remaining);
      const [next] = remaining;
      if (next) openFlow(next);
      else {
        setActiveId(null);
        setNodes([]);
        setEdges([]);
      }
      addToast('success', 'Fluxo excluído.');
    } catch {
      addToast('error', 'Não foi possível excluir o fluxo.');
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleDropBlock = (kind: FlowNodeKind, x: number, y: number) => {
    // O card travado não é arrastável, mas o dado do drag pode vir de outro lugar
    // — e o servidor recusa ativar o fluxo depois. Barrar aqui evita montar um
    // desenho que nunca poderia rodar.
    if (requiresAiPlan(kind) && !hasAiPlan) {
      addToast('error', 'O bloco de IA precisa de um plano de IA ativo.');
      return;
    }
    const meta = blockMeta(kind);
    const node: FlowNode = {
      id: createId(),
      kind,
      x,
      y,
      label: meta.label,
      ...defaultNodeFields(kind),
    };
    setNodes((prev) => [...prev, node]);
    setSelectedId(node.id);
    setDirty(true);
  };

  const handleMoveNode = (nodeId: string, x: number, y: number) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, x, y } : node)));
    setDirty(true);
  };

  const handlePatchNode = (patch: Partial<FlowNode>) => {
    if (!selectedId || !selected) return;
    const patched = { ...selected, ...patch };
    setNodes((prev) => prev.map((node) => (node.id === selectedId ? patched : node)));

    // Várias edições apagam saídas: reduzir as opções da pergunta, desligar o
    // prazo, tirar um caminho do randomizador. As ligações que saíam delas
    // ficariam apontando para um handle inexistente, então são removidas aqui.
    const valid = new Set(outputHandles(patched).map((handle) => handle.id));
    setEdges((prev) =>
      prev.filter((edge) => edge.from !== selectedId || valid.has(edge.fromHandle ?? 'next')),
    );
    setDirty(true);
  };

  const handleRemoveNode = () => {
    if (!selectedId) return;
    setNodes((prev) => prev.filter((node) => node.id !== selectedId));
    setEdges((prev) => prev.filter((edge) => edge.from !== selectedId && edge.to !== selectedId));
    setSelectedId(null);
    setDirty(true);
  };

  const handleCompleteLink = (targetId: string) => {
    if (!linking) return;
    setEdges((prev) => {
      // Uma saída leva a um destino só: religar substitui em vez de acumular.
      const withoutSameHandle = prev.filter(
        (edge) => !(edge.from === linking.nodeId && (edge.fromHandle ?? 'next') === linking.handleId),
      );
      return [
        ...withoutSameHandle,
        { id: `e${createId()}`, from: linking.nodeId, to: targetId, fromHandle: linking.handleId },
      ];
    });
    setLinking(null);
    setDirty(true);
  };

  if (loading) return <SkeletonPage><SkeletonCards count={6}/></SkeletonPage>;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-3 sm:h-[calc(100vh-7rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              aria-expanded={pickerOpen}
              className="flex max-w-64 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-left transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Fluxo
                </span>
                <span className="block truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                  {active?.name ?? 'Nenhum'}
                </span>
              </span>
              <span className="shrink-0 text-[10px] text-slate-400">▾</span>
            </button>

            {pickerOpen && (
              <div className="animate-dropdown absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 dark:border-slate-700 dark:bg-slate-800">
                <div className="max-h-72 overflow-y-auto">
                  {flows.map((flow) => (
                    <button
                      key={flow._id}
                      type="button"
                      onClick={() => {
                        openFlow(flow);
                        setPickerOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                        flow._id === activeId ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          flow.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-slate-900 dark:text-white">
                          {flow.name}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {flow.nodes.length} {flow.nodes.length === 1 ? 'bloco' : 'blocos'} ·{' '}
                          {flow.enabled ? 'ativo' : 'rascunho'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPickerOpen(false);
                    void handleCreateFlow();
                  }}
                  className="w-full cursor-pointer border-t border-slate-100 px-3 py-2 text-left text-[13px] font-medium text-indigo-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-slate-700/50"
                >
                  Criar novo fluxo
                </button>
              </div>
            )}
          </div>

          {active && (
            <div className="relative" ref={channelsRef}>
              <button
                type="button"
                onClick={() => setChannelsOpen((open) => !open)}
                aria-expanded={channelsOpen}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-left transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              >
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Canais
                  </span>
                  <span className="block text-[13px] font-semibold text-slate-900 dark:text-white">
                    {active.channelIds.length === 0
                      ? 'Nenhum'
                      : `${active.channelIds.length} selecionado${active.channelIds.length > 1 ? 's' : ''}`}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">▾</span>
              </button>

              {channelsOpen && (
                <div className="animate-dropdown absolute left-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 dark:border-slate-700 dark:bg-slate-800">
                  {channels.length === 0 && (
                    <p className="px-3 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                      Nenhum canal conectado ainda.
                    </p>
                  )}
                  {channels.map((channel) => {
                    const checked = active.channelIds.includes(channel.id);
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => handleToggleChannel(channel.id)}
                        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                            checked
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-slate-900 dark:text-white">
                            {channel.name}
                          </span>
                          <span className="block text-[11px] text-slate-400">
                            {channel.type === 'INSTAGRAM'
                              ? 'Instagram'
                              : channel.type === 'WHATSAPP_OFFICIAL'
                                ? 'WhatsApp Oficial'
                                : 'WhatsApp'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-700">
                    O fluxo só escuta os canais marcados.
                  </p>
                </div>
              )}
            </div>
          )}

          {active && (
            <input
              key={active._id}
              defaultValue={active.name}
              onBlur={(event) => handleRename(event.target.value)}
              aria-label="Nome do fluxo"
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[13px] font-medium text-slate-900 transition-colors hover:border-slate-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white dark:hover:border-slate-700"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {active && (
            <>
              <Button variant="secondary" size="sm" className="rounded-md" onClick={handleToggleEnabled}>
                {active.enabled ? 'Desativar' : 'Ativar'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="rounded-md"
                loading={saving}
                disabled={!dirty}
                onClick={handleSave}
              >
                {dirty ? 'Salvar' : 'Salvo'}
              </Button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:scale-105 hover:bg-red-50 active:scale-95 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Excluir
              </button>
            </>
          )}
        </div>
      </div>

      {active && (
        <div className="flex min-h-0 flex-1 gap-3">
          <aside className="hidden w-56 shrink-0 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 lg:flex dark:border-slate-700 dark:bg-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Blocos
            </p>
            {BLOCKS.map((block) => {
              const locked = block.requiresAi === true && !hasAiPlan;
              return (
                <div
                  key={block.kind}
                  draggable={!locked}
                  onDragStart={(event) => event.dataTransfer.setData('application/synq-block', block.kind)}
                  onClick={locked ? () => router.push('/plans') : undefined}
                  title={locked ? 'Disponível com um plano de IA ativo' : undefined}
                  className={
                    locked
                      ? 'cursor-pointer rounded-lg border border-dashed border-slate-200 p-2.5 opacity-60 transition-colors hover:border-indigo-300 hover:opacity-100 dark:border-slate-700 dark:hover:border-indigo-500/40'
                      : 'cursor-grab rounded-lg border border-slate-200 p-2.5 transition-colors hover:border-indigo-300 active:cursor-grabbing dark:border-slate-700 dark:hover:border-indigo-500/40'
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${block.dot}`} />
                    <p className="text-[13px] font-medium text-slate-900 dark:text-white">{block.label}</p>
                    {locked && <Lock size={12} className="ml-auto shrink-0 text-slate-400 dark:text-slate-500" />}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400 dark:text-slate-500">
                    {locked ? 'Requer um plano de IA. Toque para ver os planos.' : block.hint}
                  </p>
                </div>
              );
            })}
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Clique numa saída e depois no bloco de destino para ligar. Clique numa linha para removê-la.
            </p>
          </aside>

          <FlowCanvas
            nodes={nodes}
            edges={edges}
            selectedId={selectedId}
            linking={linking}
            onSelect={(id) => {
              setSelectedId(id);
              if (id === null) setLinking(null);
            }}
            onMoveNode={handleMoveNode}
            onDropBlock={handleDropBlock}
            onStartLink={(nodeId, handleId) =>
              setLinking((prev) =>
                prev?.nodeId === nodeId && prev.handleId === handleId ? null : { nodeId, handleId },
              )
            }
            onCompleteLink={handleCompleteLink}
            onRemoveEdge={(edgeId) => {
              setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
              setDirty(true);
            }}
            scale={scale}
            onScaleChange={setScale}
            hasAiPlan={hasAiPlan}
          />

          {selected && (
            <NodeInspector
              node={selected}
              stages={stages}
              members={members}
              hasAiPlan={hasAiPlan}
              onChange={handlePatchNode}
              onRemove={handleRemoveNode}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}

      {!active && (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
          <div className="max-w-sm text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Nenhum fluxo ainda</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
              Crie um fluxo para começar a montar a automação.
            </p>
            <div className="mt-4 flex justify-center">
              <Button variant="primary" size="sm" onClick={handleCreateFlow}>
                Criar fluxo
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteFlow}
        message={`Excluir o fluxo "${active?.name ?? ''}"? Esta ação não pode ser desfeita.`}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
