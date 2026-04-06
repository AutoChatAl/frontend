'use client';

import { Clock, Loader2, Mail, Plus, Trash2, Users, Edit3, X, Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { useToast, ToastContainer } from '@/components/Toast';
import { authService, type AuthUser, type Permission } from '@/services/auth.service';
import { collaboratorService, type Member, type Invite } from '@/services/collaborator.service';

const PERMISSION_OPTIONS: { value: Permission; label: string }[] = [
  { value: 'contacts', label: 'Contatos' },
  { value: 'groups', label: 'Grupos' },
  { value: 'campaigns', label: 'Campanhas' },
  { value: 'scheduling', label: 'Agendamentos' },
  { value: 'auto-replies', label: 'Auto-Respostas' },
  { value: 'ia', label: 'IA' },
  { value: 'channels', label: 'Canais' },
];

function PermissionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none ${
        checked
          ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${
        checked
          ? 'bg-indigo-600 border-indigo-600'
          : 'border-slate-300 dark:border-slate-600'
      }`}>
        {checked && <Check size={12} className="text-white" />}
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}

export default function MembersTab() {
  const [_user, setUser] = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState<Permission[]>([]);
  const [inviteSending, setInviteSending] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'member' | 'invite'; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  async function loadData() {
    try {
      const [u, m, i] = await Promise.all([
        authService.fetchMe(),
        collaboratorService.getMembers(),
        collaboratorService.getInvites(),
      ]);
      setUser(u);
      setMembers(m);
      setInvites(i.filter((inv) => inv.status === 'pending'));
    } catch {
      const cached = authService.getUser();
      if (cached) setUser(cached);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleInvitePermission(p: Permission) {
    setInvitePermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function toggleEditPermission(p: Permission) {
    setEditPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function handleSendInvite() {
    if (!inviteEmail || invitePermissions.length === 0) {
      addToast('error', 'Preencha o email e selecione ao menos uma permissão.');
      return;
    }
    setInviteSending(true);
    try {
      await collaboratorService.sendInvite(inviteEmail, invitePermissions);
      addToast('success', 'Convite enviado com sucesso.');
      setShowInviteModal(false);
      setInviteEmail('');
      setInvitePermissions([]);
      await loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao enviar convite.');
    } finally {
      setInviteSending(false);
    }
  }

  async function handleSavePermissions() {
    if (!editingMember || editPermissions.length === 0) return;
    setEditSaving(true);
    try {
      await collaboratorService.updateMember(editingMember.id, editPermissions);
      addToast('success', 'Permissões atualizadas com sucesso.');
      setEditingMember(null);
      await loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar permissões.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'member') {
        await collaboratorService.removeMember(deleteTarget.id);
        addToast('success', 'Membro removido com sucesso.');
      } else {
        await collaboratorService.cancelInvite(deleteTarget.id);
        addToast('success', 'Convite cancelado com sucesso.');
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao realizar ação.');
    } finally {
      setDeleteLoading(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || 'U';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
              Equipe
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Gerencie quem tem acesso ao painel.</p>
          </div>
          <Button size="sm" icon={<Plus size={14} />} className="self-start sm:self-auto" onClick={() => setShowInviteModal(true)}>
            Convidar Membro
          </Button>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-3 border border-slate-100 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                  {getInitials(member.name)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{member.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'owner' ? (
                  <Badge type="admin" text="Administrador" />
                ) : (
                  <>
                    <Badge type="collaborator" text="Colaborador" />
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setEditPermissions([...member.permissions]);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'member', id: member.id, name: member.name })}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {invites.length > 0 && (
        <Card className="p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Mail size={18} className="text-amber-600 dark:text-amber-400" />
            Convites Pendentes
          </h3>
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-3 border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{invite.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type="warning" text="Pendente" />
                  <button
                    onClick={() => setDeleteTarget({ type: 'invite', id: invite.id, name: invite.email })}
                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Convidar Colaborador" size="sm">
        <div className="space-y-5">
          <Input
            label="Email do colaborador"
            type="email"
            placeholder="colaborador@empresa.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Permissões de acesso
            </p>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <PermissionCheckbox
                  key={opt.value}
                  label={opt.label}
                  checked={invitePermissions.includes(opt.value)}
                  onChange={() => toggleInvitePermission(opt.value)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSendInvite}
              loading={inviteSending}
              loadingText="Enviando..."
              disabled={!inviteEmail || invitePermissions.length === 0}
            >
              Enviar Convite
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        title={`Editar permissões - ${editingMember?.name || ''}`}
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Permissões de acesso
            </p>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <PermissionCheckbox
                  key={opt.value}
                  label={opt.label}
                  checked={editPermissions.includes(opt.value)}
                  onChange={() => toggleEditPermission(opt.value)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingMember(null)}>Cancelar</Button>
            <Button
              onClick={handleSavePermissions}
              loading={editSaving}
              loadingText="Salvando..."
              disabled={editPermissions.length === 0}
            >
              Salvar Permissões
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'member' ? 'Remover membro' : 'Cancelar convite'}
        message={
          deleteTarget?.type === 'member'
            ? `Tem certeza que deseja remover "${deleteTarget.name}" do workspace? Esta ação não pode ser desfeita.`
            : `Tem certeza que deseja cancelar o convite para "${deleteTarget?.name}"?`
        }
        confirmLabel={deleteTarget?.type === 'member' ? 'Remover' : 'Cancelar Convite'}
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
