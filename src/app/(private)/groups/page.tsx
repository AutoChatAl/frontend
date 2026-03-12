'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import AddGroupCard from './components/AddGroupCard';
import CreateGroupModal from './components/CreateGroupModal';
import GroupCard from './components/GroupCard';
import ManageGroupModal from './components/ManageGroupModal';

import Button from '@/components/Button';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import PageLoader from '@/components/PageLoader';
import { ToastContainer, useToast } from '@/components/Toast';
import { groupService } from '@/services/group.service';
import type { Group } from '@/types/Group';

type RawGroup = Group & { _id?: string };
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
    } catch {
      addToast('error', 'Erro ao carregar grupos.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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
    } catch {
      addToast('error', 'Erro ao criar grupo.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    setDeleting(true);
    try {
      await groupService.deleteGroup(deleteGroup.id);
      addToast('success', 'Grupo excluído com sucesso!');
      setDeleteGroup(null);
      await loadGroups();
    } catch {
      addToast('error', 'Erro ao excluir grupo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Grupos de Contatos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Organize listas de transmissão para seus disparos</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setCreateModalOpen(true)}>
          Novo Grupo
        </Button>
      </div>

      {loading ? (
        <PageLoader message="Carregando grupos..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              memberCount={group.memberCount}
              channelTypes={group.channelTypes ?? []}
              createdAt={group.createdAt}
              onManage={(id) => {
                const g = groups.find((gr) => gr.id === id);
                if (g) setManageGroup(g);
              }}
              onDelete={(id) => {
                const g = groups.find((gr) => gr.id === id);
                if (g) setDeleteGroup(g);
              }}
            />
          ))}

          <AddGroupCard onClick={() => setCreateModalOpen(true)} />
        </div>
      )}

      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />

      <ManageGroupModal
        isOpen={!!manageGroup}
        onClose={() => setManageGroup(null)}
        group={manageGroup}
        onUpdated={loadGroups}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onConfirm={handleDeleteGroup}
        title="Excluir grupo"
        message={`Tem certeza que deseja excluir o grupo "${deleteGroup?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
