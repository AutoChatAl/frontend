'use client';
import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

import ImportContactsModal from '@/app/(private)/contacts/components/ImportContactsModal';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import { hasPermission } from '@/contexts/SidebarContext';
import { useAuthUser } from '@/hooks/useAuthUser';
import { groupService } from '@/services/group.service';

import GroupContactPicker from './GroupContactPicker';

const NAME_TOO_SHORT = 'O nome do grupo precisa ter pelo menos 2 caracteres.';
const NAME_REQUIRED_FOR_CONTACTS = 'Dê um nome ao grupo para liberar a seleção de contatos.';
const NAME_REQUIRED_FOR_IMPORT = 'Dê um nome ao grupo para liberar a importação da planilha.';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // O nome vem primeiro: a seleção de contatos e a planilha só liberam com ele preenchido.
  const nameIsValid = name.trim().length >= 2;
  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim().length >= 2)
      setNameError('');
  };
  const handleSubmit = async () => {
    if (!nameIsValid || loading)
      return;
    setLoading(true);
    try {
      await onSubmit(name.trim(), selectedIds);
      setName('');
      setSelectedIds([]);
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
    if (!nameIsValid) {
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

        <GroupContactPicker
          selectedIds={selectedIds}
          onSelectedChange={setSelectedIds}
          disabled={!nameIsValid}
          disabledHint={NAME_REQUIRED_FOR_CONTACTS}
        />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
            <span className="text-xs text-slate-400 dark:text-slate-500">ou</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>
          </div>
          <Button variant="secondary" icon={<FileSpreadsheet size={16}/>} onClick={handleOpenImport} disabled={!canImportContacts || loading || !nameIsValid} className="w-full justify-center" aria-describedby="import-spreadsheet-hint">
          Importar planilha
          </Button>
          {canImportContacts ? (<p id="import-spreadsheet-hint" className="text-xs text-slate-500 dark:text-slate-400">
            {nameIsValid ? 'O grupo já nasce com os contatos do arquivo .csv ou .xlsx.' : NAME_REQUIRED_FOR_IMPORT}
          </p>) : (<p id="import-spreadsheet-hint" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          Sem a permissão de Contatos, o envio de planilha fica desativado. Peça ao administrador da conta para liberar.
          </p>)}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !nameIsValid} className="flex-1">
            {loading ? 'Criando...' : 'Criar Grupo'}
          </Button>
        </div>
      </div>
    </Modal>
    <ImportContactsModal isOpen={importOpen} onClose={handleImportClose} onImport={handleImport} onSuccess={handleImportSuccess} requireConsent title="Importar planilha no grupo"/>
  </>);
}
