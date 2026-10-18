'use client';
import { Check, FileSpreadsheet, MessageCircle, Search, Smartphone } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

import ImportContactsModal from '@/app/(private)/contacts/components/ImportContactsModal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { hasPermission } from '@/contexts/SidebarContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { contactService } from '@/services/contact.service';
import { groupService } from '@/services/group.service';
import { planLimitsService } from '@/services/plan-limits.service';
import type { Contact } from '@/types/Contact';
import { getInitials } from '@/utils/displayName';

const NAME_TOO_SHORT = 'O nome do grupo precisa ter pelo menos 2 caracteres.';

type RawContact = Contact & {
    _id?: string;
};
const normalizeContact = (c: RawContact): Contact => ({ ...c, id: c.id ?? c._id ?? '' });
interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, contactIds: string[]) => Promise<void>;
    onImported?: () => void | Promise<void>;
}
export default function CreateGroupModal({ isOpen, onClose, onSubmit, onImported }: CreateGroupModalProps) {
  const user = useAuthUser();
  const canImportContacts = hasPermission(user, 'contacts');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [maxContacts, setMaxContacts] = useState(250);
  const [limitError, setLimitError] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (isOpen) {
      planLimitsService.getLimits().then((l) => setMaxContacts(l.maxContactsPerGroup));
    }
  }, [isOpen]);
  const searchContacts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const result = await contactService.listContacts({ search: query, limit: 20 });
      setSearchResults(result.data.map(normalizeContact));
    }
    catch {
      setSearchResults([]);
    }
    finally {
      setSearching(false);
    }
  }, []);
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current)
      clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchContacts(value), 350);
  };
  const toggleContact = (contactId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(contactId)) {
        setLimitError('');
        return prev.filter((id) => id !== contactId);
      }
      if (prev.length >= maxContacts) {
        setLimitError(`Limite de ${maxContacts} contatos por grupo atingido.`);
        return prev;
      }
      setLimitError('');
      return [...prev, contactId];
    });
  };
  const getContactDisplay = (contact: Contact) => {
    if (contact.displayName)
      return contact.displayName;
    const identity = contact.identities?.[0];
    if (identity?.phoneE164)
      return identity.phoneE164;
    if (identity?.igUsername)
      return `@${identity.igUsername}`;
    return 'Sem nome';
  };
  const getContactChannels = (contact: Contact) => {
    const types = new Set(contact.identities?.map((i) => i.type) || []);
    return { whatsapp: types.has('WHATSAPP'), instagram: types.has('INSTAGRAM') };
  };
  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim().length >= 2)
      setNameError('');
  };
  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2 || loading)
      return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), selectedIds);
      setName('');
      setSelectedIds([]);
      setSearchQuery('');
      setSearchResults([]);
      setNameError('');
    }
    finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setName('');
    setNameError('');
    setSelectedIds([]);
    setSearchQuery('');
    setSearchResults([]);
    setLimitError('');
    setImported(false);
    setImportOpen(false);
  };
  const handleClose = () => {
    if (importOpen)
      return;
    resetForm();
    onClose();
  };
  const handleOpenImport = () => {
    if (!canImportContacts || loading)
      return;
    if (name.trim().length < 2) {
      setNameError(NAME_TOO_SHORT);
      return;
    }
    setNameError('');
    setImportOpen(true);
  };
  const handleImport = async (file: File) => {
    const trimmed = name.trim();
    if (trimmed.length < 2)
      throw new Error(NAME_TOO_SHORT);
    const result = await groupService.importGroup({
      name: trimmed,
      file,
      consentConfirmed: true,
    });
    return result.report;
  };
  const handleImportSuccess = () => {
    setImported(true);
    void onImported?.();
  };
  const handleImportClose = () => {
    setImportOpen(false);
    if (!imported)
      return;
    resetForm();
    onClose();
  };
  return (<>
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Novo Grupo" size="md">
      <div className="space-y-5">
        <Input label="Nome do grupo" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} onBlur={() => { if (name.trim().length > 0 && name.trim().length < 2) setNameError(NAME_TOO_SHORT); }} placeholder="Ex: VIP Black Friday" error={nameError} autoFocus/>

        <div>
          <Input label="Selecionar contatos" type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Buscar contatos por nome ou telefone..." leftIcon={<Search size={16}/>}/>

          {searching && (<p className="text-xs text-slate-400 mt-2">Buscando...</p>)}

          {searchResults.length > 0 && (<div className="max-h-48 overflow-y-auto space-y-1 mt-2">
            {searchResults.map((contact) => {
              const selected = selectedIds.includes(contact.id);
              const channels = getContactChannels(contact);
              return (<button key={contact.id} type="button" onClick={() => toggleContact(contact.id)} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${selected
                ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600'
                : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                  {getInitials(getContactDisplay(contact))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-white truncate">{getContactDisplay(contact)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {channels.whatsapp && <MessageCircle size={12} className="text-emerald-500"/>}
                  {channels.instagram && <Smartphone size={12} className="text-fuchsia-500"/>}
                </div>
                {selected && <Check size={14} className="text-indigo-600 dark:text-indigo-400"/>}
              </button>);
            })}
          </div>)}

          {selectedIds.length > 0 && (<p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {selectedIds.length}/{maxContacts} contato{selectedIds.length > 1 ? 's' : ''} selecionado{selectedIds.length > 1 ? 's' : ''}
          </p>)}
          {limitError && (<p className="text-xs text-red-500 mt-1">{limitError}</p>)}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
            <span className="text-xs text-slate-400 dark:text-slate-500">ou</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
          </div>
          <Button variant="secondary" icon={<FileSpreadsheet size={16}/>} onClick={handleOpenImport} disabled={!canImportContacts || loading} className="w-full justify-center" aria-describedby="import-spreadsheet-hint">
          Importar planilha
          </Button>
          {canImportContacts ? (<p id="import-spreadsheet-hint" className="text-xs text-slate-500 dark:text-slate-400">
          O grupo já nasce com os contatos do arquivo .csv ou .xlsx.
          </p>) : (<p id="import-spreadsheet-hint" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          Sem a permissão de Contatos, o envio de planilha fica desativado. Peça ao administrador da conta para liberar.
          </p>)}
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
    <ImportContactsModal isOpen={importOpen} onClose={handleImportClose} onImport={handleImport} onSuccess={handleImportSuccess} requireConsent title="Importar planilha no grupo"/>
  </>);
}
