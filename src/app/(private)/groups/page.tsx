'use client';
import { Plus, Users } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import EmptyState from '@/components/EmptyState';
import MetricCard from '@/components/MetricCard';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { groupService } from '@/services/group.service';
import type { Group } from '@/types/Group';

import AddGroupCard from './components/AddGroupCard';
import CreateGroupModal from './components/CreateGroupModal';
import GroupCard from './components/GroupCard';
import ManageGroupModal from './components/ManageGroupModal';

type RawGroup = Group & {
    _id?: string;
};
const normalizeGroup = (g: RawGroup): Group => ({ ...g, id: g.id ?? g._id ?? '' });
export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageGroup, setManageGroup] = useState<Group | null>(null);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const loadGroups = useCallback(async () => {
    try {
      const data = await groupService.listGroups();
      setGroups(data.map(normalizeGroup));
    }
    catch {
      addToast('error', 'Erro ao carregar grupos.');
    }
    finally {
      setLoading(false);
    }
  }, [addToast]);
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);
  /**
   * "Contatos nas listas" soma os grupos, então conta duas vezes quem está em
   * mais de um — o hint diz isso em vez de fingir que é gente distinta.
   */
  const stats = useMemo(() => {
    const totalMembers = groups.reduce((sum, group) => sum + (group.memberCount ?? 0), 0);
    const biggest = groups.reduce<Group | null>(
      (best, group) => (!best || (group.memberCount ?? 0) > (best.memberCount ?? 0) ? group : best),
      null,
    );
    return {
      total: groups.length,
      totalMembers,
      biggest,
      empty: groups.filter((group) => (group.memberCount ?? 0) === 0).length,
    };
  }, [groups]);
  const handleCreateGroup = async (name: string, contactIds: string[]) => {
    try {
      const raw = await groupService.createGroup({ name, type: 'MANUAL' });
      const group = normalizeGroup(raw);
      if (contactIds.length > 0) {
        await groupService.setMembers(group.id, contactIds);
      }
      addToast('success', 'Grupo criado com sucesso!');
      setCreateModalOpen(false);
      await loadGroups();
    }
    catch {
      addToast('error', 'Erro ao criar grupo.');
    }
  };
  const handleDeleteGroup = async () => {
    if (!deleteGroup)
      return;
    setDeleting(true);
    try {
      await groupService.deleteGroup(deleteGroup.id);
      addToast('success', 'Grupo excluído com sucesso!');
      setDeleteGroup(null);
      await loadGroups();
    }
    catch {
      addToast('error', 'Erro ao excluir grupo.');
    }
    finally {
      setDeleting(false);
    }
  };
  if (loading) {
    return <PageLoader message="Carregando grupos..."/>;
  }

  return (<div className="w-full max-w-full space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Grupos</h1>
        <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          Listas de transmissão para os seus disparos de campanha
        </p>
      </div>
      <div data-tour="groups-new">
        <Button icon={<Plus size={16}/>} onClick={() => setCreateModalOpen(true)} className="w-full justify-center sm:w-auto">
          Novo grupo
        </Button>
      </div>
    </div>

    {groups.length > 0 && (<div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <MetricCard title="Grupos" value={stats.total.toLocaleString('pt-BR')} hint="listas criadas"/>
      <MetricCard
        title="Contatos nas listas"
        value={stats.totalMembers.toLocaleString('pt-BR')}
        hint="somando todos os grupos"
      />
      <MetricCard
        title="Maior lista"
        value={(stats.biggest?.memberCount ?? 0).toLocaleString('pt-BR')}
        hint={stats.biggest?.name ?? '—'}
      />
      <MetricCard
        title="Listas vazias"
        value={stats.empty.toLocaleString('pt-BR')}
        hint={stats.empty > 0 ? 'não recebem disparo' : 'todas com contatos'}
      />
    </div>)}

    {groups.length === 0 ? (<EmptyState
      icon={<Users size={20}/>}
      title="Nenhum grupo criado ainda"
      description="Agrupe contatos para disparar campanhas para uma lista inteira de uma vez."
      action={{ label: 'Criar primeiro grupo', icon: <Plus size={16}/>, onClick: () => setCreateModalOpen(true) }}
    />) : (<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((group) => (<GroupCard key={group.id} id={group.id} name={group.name} memberCount={group.memberCount} channelTypes={group.channelTypes ?? []} createdAt={group.createdAt} onManage={(id) => {
        const g = groups.find((gr) => gr.id === id);
        if (g)
          setManageGroup(g);
      }} onDelete={(id) => {
        const g = groups.find((gr) => gr.id === id);
        if (g)
          setDeleteGroup(g);
      }}/>))}

      <AddGroupCard onClick={() => setCreateModalOpen(true)}/>
    </div>)}

    <CreateGroupModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={handleCreateGroup}/>

    <ManageGroupModal isOpen={!!manageGroup} onClose={() => setManageGroup(null)} group={manageGroup} onUpdated={loadGroups}/>

    <ConfirmDeleteModal isOpen={!!deleteGroup} onClose={() => setDeleteGroup(null)} onConfirm={handleDeleteGroup} title="Excluir grupo" message={`Tem certeza que deseja excluir o grupo "${deleteGroup?.name}"? Esta ação não pode ser desfeita.`} confirmLabel="Excluir" loading={deleting}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
