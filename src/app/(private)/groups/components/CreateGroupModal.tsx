'use client';

import { Search, MessageCircle, Smartphone, Check } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { contactService } from '@/services/contact.service';
import type { Contact } from '@/types/Contact';

type RawContact = Contact & { _id?: string };
const normalizeContact = (c: RawContact): Contact => ({ ...c, id: c.id ?? c._id ?? '' });

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, contactIds: string[]) => Promise<void>;
}

export default function CreateGroupModal({ isOpen, onClose, onSubmit }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const toggleContact = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

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

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2 || loading) return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), selectedIds);
      setName('');
      setSelectedIds([]);
      setSearchQuery('');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedIds([]);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Novo Grupo" size="md">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Nome do grupo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: VIP Black Friday"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Selecionar contatos
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar contatos por nome ou telefone..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {searching && (
            <p className="text-xs text-slate-400 mt-2">Buscando...</p>
          )}

          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
              {searchResults.map((contact) => {
                const selected = selectedIds.includes(contact.id);
                const channels = getContactChannels(contact);

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleContact(contact.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${
                      selected
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600'
                        : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                      {getContactDisplay(contact).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 dark:text-white truncate">{getContactDisplay(contact)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {channels.whatsapp && <MessageCircle size={12} className="text-emerald-500" />}
                      {channels.instagram && <Smartphone size={12} className="text-fuchsia-500" />}
                    </div>
                    {selected && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {selectedIds.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {selectedIds.length} contato{selectedIds.length > 1 ? 's' : ''} selecionado{selectedIds.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || name.trim().length < 2} className="flex-1">
            {loading ? 'Criando...' : 'Criar Grupo'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
