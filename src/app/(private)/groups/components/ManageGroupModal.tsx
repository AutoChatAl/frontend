'use client';

import { Search, UserPlus, X, MessageCircle, Smartphone, Users } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { contactService } from '@/services/contact.service';
import { groupService } from '@/services/group.service';
import type { Contact } from '@/types/Contact';
import type { Group } from '@/types/Group';

type RawContact = Contact & { _id?: string };
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadGroupData = useCallback(async () => {
    if (!group) return;
    setLoading(true);
    try {
      const data = await groupService.getGroup(group.id);
      setMembers((data.contacts || []).map(normalizeContact));
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    if (isOpen && group) {
      loadGroupData();
      setShowAddContacts(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedContactIds([]);
    }
  }, [isOpen, group, loadGroupData]);

  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const result = await contactService.listContacts({ search: query, limit: 20 });
      setSearchResults(result.data.map(normalizeContact));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchContacts(value), 350);
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const handleAddSelected = async () => {
    if (!group || selectedContactIds.length === 0) return;
    setSaving(true);
    try {
      const currentIds = members.map((m) => m.id);
      const newIds = selectedContactIds.filter((id) => !currentIds.includes(id));
      const allIds = [...currentIds, ...newIds];
      await groupService.setMembers(group.id, allIds);
      setShowAddContacts(false);
      setSelectedContactIds([]);
      setSearchQuery('');
      await loadGroupData();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (contactId: string) => {
    if (!group) return;
    setSaving(true);
    try {
      const newIds = members.filter((m) => m.id !== contactId).map((m) => m.id);
      await groupService.setMembers(group.id, newIds);
      await loadGroupData();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const memberIds = new Set(members.map((m) => m.id));

  const getContactDisplay = (contact: Contact) => {
    if (contact.displayName) return contact.displayName;
    const identity = contact.identities?.[0];
    if (identity?.phoneE164) return identity.phoneE164;
    if (identity?.igUsername) return `@${identity.igUsername}`;
    return 'Sem nome';
  };

  const getContactChannels = (contact: Contact) => {
    const types = new Set(contact.identities?.map((i) => i.type) || []);
    return { whatsapp: types.has('WHATSAPP'), instagram: types.has('INSTAGRAM') };
  };

  if (!group) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={group.name} size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Users size={14} />
            <span>{members.length} contatos</span>
          </div>
          {!showAddContacts && (
            <Button
              size="sm"
              icon={<UserPlus size={14} />}
              onClick={() => setShowAddContacts(true)}
            >
              Adicionar Contatos
            </Button>
          )}
        </div>

        {showAddContacts && (
          <div className="border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Adicionar contatos</h4>
              <button
                onClick={() => { setShowAddContacts(false); setSelectedContactIds([]); setSearchQuery(''); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar contatos por nome ou telefone..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {searching && (
              <p className="text-xs text-slate-400">Buscando...</p>
            )}

            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {searchResults.map((contact) => {
                  const alreadyMember = memberIds.has(contact.id);
                  const selected = selectedContactIds.includes(contact.id);
                  const channels = getContactChannels(contact);

                  return (
                    <button
                      key={contact.id}
                      onClick={() => !alreadyMember && toggleContactSelection(contact.id)}
                      disabled={alreadyMember}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${
                        alreadyMember
                          ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800'
                          : selected
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600'
                            : 'hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                        {getContactDisplay(contact).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-white truncate">{getContactDisplay(contact)}</p>
                      </div>
                      <div className="flex gap-1">
                        {channels.whatsapp && <MessageCircle size={12} className="text-emerald-500" />}
                        {channels.instagram && <Smartphone size={12} className="text-fuchsia-500" />}
                      </div>
                      {alreadyMember && <span className="text-xs text-slate-400">Já membro</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedContactIds.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                <span className="text-xs text-slate-500">{selectedContactIds.length} selecionados</span>
                <Button size="sm" onClick={handleAddSelected} disabled={saving}>
                  {saving ? 'Adicionando...' : 'Adicionar Selecionados'}
                </Button>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum contato neste grupo</p>
            {group.type === 'MANUAL' && (
              <p className="text-xs mt-1">Clique em &ldquo;Adicionar Contatos&rdquo; para começar</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {members.map((contact) => {
              const channels = getContactChannels(contact);
              return (
                <div key={contact.id} className="flex items-center gap-3 py-3 group/row">
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
                    {getContactDisplay(contact).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {getContactDisplay(contact)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contact.identities?.map((identity, i) => (
                        <span key={i} className="text-xs text-slate-400">
                          {identity.phoneE164 || (identity.igUsername && `@${identity.igUsername}`) || ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {channels.whatsapp && (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <MessageCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    {channels.instagram && (
                      <div className="w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/50 flex items-center justify-center">
                        <Smartphone size={12} className="text-fuchsia-600 dark:text-fuchsia-400" />
                      </div>
                    )}
                    {group.type === 'MANUAL' && (
                      <button
                        onClick={() => handleRemoveMember(contact.id)}
                        disabled={saving}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                        title="Remover do grupo"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
