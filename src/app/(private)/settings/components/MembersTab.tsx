'use client';
import { Check, Clock, Edit3, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import SectionHeader from '@/components/SectionHeader';
import { useToast, ToastContainer } from '@/components/Toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { authService, type AuthUser, type Permission } from '@/services/auth.service';
import { collaboratorService, type Member, type Invite } from '@/services/collaborator.service';
import { HIDDEN_FEATURES } from '@lib/featureFlags';

interface PermissionOption {
    value: Permission;
    label: string;
    hint: string;
    /** Some da lista quando a feature está oculta na navegação. */
    hidden?: boolean;
}

/**
 * Espelha WORKSPACE_PERMISSIONS do backend, na mesma ordem da sidebar.
 * Ao criar uma área nova no produto, adicione a permissão aqui, no tipo
 * `Permission` (services/auth.service.ts) e no backend.
 */
const PERMISSION_OPTIONS: PermissionOption[] = [
  { value: 'dashboard', label: 'Visão Geral', hint: 'Painel com métricas do workspace' },
  { value: 'channels', label: 'Canais', hint: 'WhatsApp por QR Code e contas do Instagram' },
  { value: 'whatsapp-official', label: 'API Oficial', hint: 'Números oficiais da Meta, templates e consumo' },
  { value: 'inbox', label: 'Chat', hint: 'Atender conversas na caixa de entrada' },
  { value: 'contacts', label: 'Contatos', hint: 'Base de contatos e fila de atendimento' },
  { value: 'groups', label: 'Grupos', hint: 'Segmentações e listas' },
  { value: 'campaigns', label: 'Campanhas', hint: 'Disparos e templates' },
  { value: 'funnel', label: 'Funil', hint: 'Quadro de estágios e leads' },
  { value: 'cart-recovery', label: 'Recuperação', hint: 'Recuperação de carrinhos abandonados', hidden: HIDDEN_FEATURES.cartRecovery },
  { value: 'scheduling', label: 'Agendamentos', hint: 'Agenda, serviços e horários' },
  { value: 'auto-replies', label: 'Auto-Respostas', hint: 'Respostas automáticas e automação de comentários' },
  { value: 'ia', label: 'IA', hint: 'Configuração do agente de inteligência artificial' },
];

const VISIBLE_PERMISSION_OPTIONS = PERMISSION_OPTIONS.filter((opt) => !opt.hidden);
const VISIBLE_PERMISSION_VALUES: Permission[] = VISIBLE_PERMISSION_OPTIONS.map((opt) => opt.value);

/**
 * O papel do membro, não a suposição de que "tudo que não é dono é
 * colaborador" — uma conta `admin` (suporte do Synq) tem acesso total e
 * aparecia como colaborador antes disso.
 */
function memberBadge(member: Member): { type: 'admin' | 'collaborator'; text: string } {
  if (member.role === 'owner') return { type: 'admin', text: 'Administrador' };
  if (member.role === 'admin') return { type: 'admin', text: 'Admin do sistema' };
  return { type: 'collaborator', text: 'Colaborador' };
}

function allSelected(selected: Permission[]): boolean {
  return VISIBLE_PERMISSION_VALUES.every((value) => selected.includes(value));
}

/**
 * Alterna todas as opções VISÍVEIS preservando as ocultas que o membro já tem.
 * Sem isso, "Marcar todas" apagaria silenciosamente uma permissão de feature
 * escondida da navegação (hoje, Recuperação) na hora de salvar.
 */
function toggleAll(selected: Permission[]): Permission[] {
  const hiddenKept = selected.filter((value) => !VISIBLE_PERMISSION_VALUES.includes(value));
  return allSelected(selected) ? hiddenKept : [...hiddenKept, ...VISIBLE_PERMISSION_VALUES];
}
function PermissionCheckbox({ label, hint, checked, onChange }: {
    label: string;
    hint?: string;
    checked: boolean;
    onChange: () => void;
}) {
  return (<div role="checkbox" aria-checked={checked} tabIndex={0} onClick={onChange} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    onChange();
  } }} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors select-none ${checked
    ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/20'
    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
    <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${checked
      ? 'bg-indigo-600 border-indigo-600'
      : 'border-slate-300 dark:border-slate-600'}`}>
      {checked && <Check size={12} className="text-white"/>}
    </div>
    <span className="min-w-0">
      <span className="block text-[13px] leading-tight text-slate-700 dark:text-slate-300">{label}</span>
      {hint && <span className="block text-[11px] leading-tight text-slate-400 dark:text-slate-500">{hint}</span>}
    </span>
  </div>);
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
  const [deleteTarget, setDeleteTarget] = useState<{
        type: 'member' | 'invite';
        id: string;
        name: string;
    } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();
  const { usage, planName } = useSubscription();
  // Limite de colaboradores do plano (já inclui extras contratados). -1 = ilimitado.
  // Enquanto o uso não carregou, assume ilimitado para não bloquear indevidamente — o backend é a barreira final.
  const collaboratorLimit = usage?.collaborators?.limit ?? -1;
  const isUnlimitedCollaborators = collaboratorLimit === -1;
  // Vagas consumidas = colaboradores aceitos + convites pendentes (cada pendente ocupará uma vaga).
  const usedCollaboratorSlots = members.filter((m) => !m.fullAccess).length + invites.length;
  const atCollaboratorLimit = !isUnlimitedCollaborators && usedCollaboratorSlots >= collaboratorLimit;
  const collaboratorLimitMessage = collaboratorLimit === 0
    ? `O plano ${planName} não inclui colaboradores. Faça upgrade para convidar.`
    : `Limite de ${collaboratorLimit} colaborador${collaboratorLimit === 1 ? '' : 'es'} do plano ${planName} atingido.`;
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
    }
    catch {
      const cached = authService.getUser();
      if (cached)
        setUser(cached);
    }
    finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadData();
  }, []);
  function toggleInvitePermission(p: Permission) {
    setInvitePermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }
  function toggleEditPermission(p: Permission) {
    setEditPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }
  async function handleSendInvite() {
    if (!inviteEmail || invitePermissions.length === 0) {
      addToast('error', 'Preencha o email e selecione ao menos uma permissão.');
      return;
    }
    if (atCollaboratorLimit) {
      addToast('error', collaboratorLimitMessage);
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
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao enviar convite.');
    }
    finally {
      setInviteSending(false);
    }
  }
  async function handleSavePermissions() {
    if (!editingMember || editPermissions.length === 0)
      return;
    setEditSaving(true);
    try {
      await collaboratorService.updateMember(editingMember.id, editPermissions);
      addToast('success', 'Permissões atualizadas com sucesso.');
      setEditingMember(null);
      await loadData();
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao atualizar permissões.');
    }
    finally {
      setEditSaving(false);
    }
  }
  async function handleDelete() {
    if (!deleteTarget)
      return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'member') {
        await collaboratorService.removeMember(deleteTarget.id);
        addToast('success', 'Membro removido com sucesso.');
      }
      else {
        await collaboratorService.cancelInvite(deleteTarget.id);
        addToast('success', 'Convite cancelado com sucesso.');
      }
      setDeleteTarget(null);
      await loadData();
    }
    catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Erro ao realizar ação.');
    }
    finally {
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
    return (<div className="flex items-center justify-center py-8">
      <Loader2 size={20} className="animate-spin text-slate-400"/>
    </div>);
  }
  return (<div className="space-y-3">
    <Card className="p-4">
      <SectionHeader
        title="Equipe"
        hint="Quem entra no painel e o que cada um pode abrir."
        action={<>
          <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold tabular-nums text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {isUnlimitedCollaborators ? 'Ilimitado' : `${usedCollaboratorSlots}/${collaboratorLimit}`}
          </span>
          <Button size="sm" icon={<Plus size={14}/>} disabled={atCollaboratorLimit} onClick={() => setShowInviteModal(true)} className="flex-1 justify-center py-2 sm:flex-none sm:py-1.5">
              Convidar
          </Button>
        </>}
      />

      {atCollaboratorLimit && <Callout tone="warning" className="mb-3">{collaboratorLimitMessage}</Callout>}

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                {getInitials(member.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{member.name}</p>
                  <Badge type={memberBadge(member).type} text={memberBadge(member).text} pill/>
                  {member.isSelf && (
                    <span className="rounded-full border border-slate-200 px-1.5 text-[10px] font-medium leading-4 text-slate-500 dark:border-slate-600 dark:text-slate-400">
                      você
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
              </div>
            </div>
            {/* `manageable` vem do servidor: dono, admin e a própria conta nunca
                são editáveis nem removíveis por esta tela. */}
            {member.manageable && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" title="Editar permissões" onClick={() => {
                  setEditingMember(member);
                  setEditPermissions([...member.permissions]);
                }} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400">
                  <Edit3 size={15}/>
                </button>
                <button type="button" title="Remover membro" onClick={() => setDeleteTarget({ type: 'member', id: member.id, name: member.name })} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                  <Trash2 size={15}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>

    {invites.length > 0 && (
      <Card className="p-4">
        <SectionHeader title="Convites pendentes" hint="Cada convite já ocupa uma vaga do plano até ser aceito ou cancelado."/>
        <div className="space-y-2">
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  <Clock size={16}/>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{invite.email}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button type="button" title="Cancelar convite" onClick={() => setDeleteTarget({ type: 'invite', id: invite.id, name: invite.email })} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                <X size={15}/>
              </button>
            </div>
          ))}
        </div>
      </Card>
    )}

    <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Convidar Colaborador" size="sm">
      <div className="space-y-5">
        <Input label="Email do colaborador" type="email" placeholder="colaborador@empresa.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}/>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Permissões de acesso
            </p>
            <button type="button" onClick={() => setInvitePermissions(toggleAll(invitePermissions))} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {allSelected(invitePermissions) ? 'Limpar' : 'Marcar todas'}
            </button>
          </div>
          <div className="space-y-2">
            {VISIBLE_PERMISSION_OPTIONS.map((opt) => (<PermissionCheckbox key={opt.value} label={opt.label} hint={opt.hint} checked={invitePermissions.includes(opt.value)} onChange={() => toggleInvitePermission(opt.value)}/>))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setShowInviteModal(false)}>Cancelar</Button>
          <Button onClick={handleSendInvite} loading={inviteSending} loadingText="Enviando..." disabled={!inviteEmail || invitePermissions.length === 0}>
              Enviar Convite
          </Button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={!!editingMember} onClose={() => setEditingMember(null)} title={`Editar permissões - ${editingMember?.name || ''}`} size="sm">
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Permissões de acesso
            </p>
            <button type="button" onClick={() => setEditPermissions(toggleAll(editPermissions))} className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
              {allSelected(editPermissions) ? 'Limpar' : 'Marcar todas'}
            </button>
          </div>
          <div className="space-y-2">
            {VISIBLE_PERMISSION_OPTIONS.map((opt) => (<PermissionCheckbox key={opt.value} label={opt.label} hint={opt.hint} checked={editPermissions.includes(opt.value)} onChange={() => toggleEditPermission(opt.value)}/>))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => setEditingMember(null)}>Cancelar</Button>
          <Button onClick={handleSavePermissions} loading={editSaving} loadingText="Salvando..." disabled={editPermissions.length === 0}>
              Salvar Permissões
          </Button>
        </div>
      </div>
    </Modal>

    <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title={deleteTarget?.type === 'member' ? 'Remover membro' : 'Cancelar convite'} message={deleteTarget?.type === 'member'
      ? `Tem certeza que deseja remover "${deleteTarget.name}" do workspace? Esta ação não pode ser desfeita.`
      : `Tem certeza que deseja cancelar o convite para "${deleteTarget?.name}"?`} confirmLabel={deleteTarget?.type === 'member' ? 'Remover' : 'Cancelar Convite'} loading={deleteLoading}/>

    <ToastContainer toasts={toasts} onRemove={removeToast}/>
  </div>);
}
