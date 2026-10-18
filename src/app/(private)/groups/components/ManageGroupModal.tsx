'use client';
import { UserPlus, X, MessageCircle, Smartphone, Users } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { groupService } from '@/services/group.service';
import type { Contact } from '@/types/Contact';
import type { Group } from '@/types/Group';
import { getInitials } from '@/utils/displayName';

import GroupContactPicker from './GroupContactPicker';

type RawContact = Contact & {
    _id?: string;
};
const normalizeContact = (c: RawContact): Contact => ({ ...c, id: c.id ?? c._id ?? '' });
interface ManageGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group | null;
    onUpdated: () => void;
}
export default function ManageGroupModal({ isOpen, onClose, group, onUpdated }: ManageGroupModalProps) {
  const [members, setMembers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const loadGroupData = useCallback(async () => {
    if (!group)
      return;
    setLoading(true);
    try {
      const data = await groupService.getGroup(group.id);
      setMembers((data.contacts || []).map(normalizeContact));
    }
    catch {
      setMembers([]);
    }
    finally {
      setLoading(false);
    }
  }, [group]);
  useEffect(() => {
    if (isOpen && group) {
      loadGroupData();
      setShowAddContacts(false);
      setSelectedContactIds([]);
    }
  }, [isOpen, group, loadGroupData]);
  const handleAddSelected = async () => {
    if (!group || selectedContactIds.length === 0)
      return;
    setSaving(true);
    try {
      const currentIds = members.map((m) => m.id);
      const newIds = selectedContactIds.filter((id) => !currentIds.includes(id));
      const allIds = [...currentIds, ...newIds];
      await groupService.setMembers(group.id, allIds);
      setShowAddContacts(false);
      setSelectedContactIds([]);
      await loadGroupData();
      onUpdated();
    }
    finally {
      setSaving(false);
    }
  };
  const handleRemoveMember = async (contactId: string) => {
    if (!group)
      return;
    setSaving(true);
    try {
      const newIds = members.filter((m) => m.id !== contactId).map((m) => m.id);
      await groupService.setMembers(group.id, newIds);
      await loadGroupData();
      onUpdated();
    }
    finally {
      setSaving(false);
    }
  };
  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const getContactDisplay = (contact: Contact) => {
    if (contact.displayName)
      return contact.displayName;
    const identity = contact.identities?.[0];
    if (identity?.phoneE164)
      return identity.phoneE164;
    if (identity?.igUsername)
      return `@${identity.igUsername}`;
    // Importado por planilha: sem identidade de canal, só o telefone do contato.
    if (contact.phoneE164)
      return contact.phoneE164;
    return 'Sem nome';
  };
  const getContactChannels = (contact: Contact) => {
    const types = new Set(contact.identities?.map((i) => i.type) || []);
    return { whatsapp: types.has('WHATSAPP'), instagram: types.has('INSTAGRAM') };
  };
  if (!group)
    return null;
  return (<Modal isOpen={isOpen} onClose={onClose} title={group.name} size="lg">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Users size={14}/>
          <span>{members.length} contatos</span>
        </div>
        {!showAddContacts && group.type === 'MANUAL' && (<Button size="sm" icon={<UserPlus size={14}/>} onClick={() => setShowAddContacts(true)}>
              Adicionar Contatos
        </Button>)}
      </div>

      {showAddContacts && (<div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Adicionar contatos</h4>
          <button type="button" onClick={() => { setShowAddContacts(false); setSelectedContactIds([]); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Fechar">
            <X size={16}/>
          </button>
        </div>

        <GroupContactPicker
          label=""
          selectedIds={selectedContactIds}
          onSelectedChange={setSelectedContactIds}
          memberIds={memberIds}
        />

        {selectedContactIds.length > 0 && (<div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {selectedContactIds.length} selecionado{selectedContactIds.length > 1 ? 's' : ''} · o grupo fica com {(members.length + selectedContactIds.length).toLocaleString('pt-BR')} contatos
          </span>
          <Button size="sm" onClick={handleAddSelected} disabled={saving}>
            {saving ? 'Adicionando...' : 'Adicionar Selecionados'}
          </Button>
        </div>)}
      </div>)}

      {loading ? (<div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600"/>
      </div>) : members.length === 0 ? (<div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-sm">Nenhum contato neste grupo</p>
        {group.type === 'MANUAL' && (<p className="text-xs mt-1">Clique em &ldquo;Adicionar Contatos&rdquo; para começar</p>)}
      </div>) : (<div className="divide-y divide-slate-100 dark:divide-slate-700/50">
        {members.map((contact) => {
          const channels = getContactChannels(contact);
          return (<div key={contact.id} className="flex items-center gap-3 py-3 group/row">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
              {getInitials(getContactDisplay(contact))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                {getContactDisplay(contact)}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {contact.identities?.map((identity, i) => (<span key={i} className="text-xs text-slate-400">
                  {identity.phoneE164 || (identity.igUsername && `@${identity.igUsername}`) || ''}
                </span>))}
                {(contact.identities?.length ?? 0) === 0 && contact.phoneE164 && (<span className="text-xs text-slate-400">
                  {contact.phoneE164}
                </span>)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {channels.whatsapp && (<div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <MessageCircle size={12} className="text-emerald-600 dark:text-emerald-400"/>
              </div>)}
              {channels.instagram && (<div className="w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/50 flex items-center justify-center">
                <Smartphone size={12} className="text-fuchsia-600 dark:text-fuchsia-400"/>
              </div>)}
              {group.type === 'MANUAL' && (<button onClick={() => handleRemoveMember(contact.id)} disabled={saving} className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all" title="Remover do grupo">
                <X size={14}/>
              </button>)}
            </div>
          </div>);
        })}
      </div>)}
    </div>
  </Modal>);
}
