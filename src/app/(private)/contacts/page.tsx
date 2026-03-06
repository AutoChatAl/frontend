/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  Loader2,
  MoreVertical,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

import { columns } from './components/ContactColumns';
import SyncContactsModal from './components/SyncContactsModal';

import Table from '@/components/Table';
import { channelsService } from '@/services/channels.service';
import { contactService } from '@/services/contact.service';
import type { WhatsAppInstance } from '@/types/Channel';
import type { Contact } from '@/types/Contact';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [whatsappChannels, setWhatsappChannels] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [contactsList, waChannels] = await Promise.all([
        contactService.listContacts(),
        channelsService.getWhatsAppInstances().catch(() => [] as WhatsAppInstance[]),
      ]);
      setContacts(contactsList);
      setWhatsappChannels(waChannels);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts;

    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();

    const q = normalize(query);
    return contacts.filter((c) => {
      const parts: string[] = [c.displayName ?? ''];
      for (const identity of c.identities ?? []) {
        if (identity.phoneE164) parts.push(identity.phoneE164);
        if (identity.igUsername) parts.push(identity.igUsername);
      }
      return normalize(parts.join(' ')).includes(q);
    });
  }, [contacts, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-500" size={28} />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Contatos</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Gerencie sua base de contatos e leads
            {contacts.length > 0 && (
              <span className="ml-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                {contacts.length} no total
              </span>
            )}
          </p>
        </div>

        {/* Sync button — always visible */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm"
        >
          <RefreshCw size={15} />
          Sincronizar WhatsApp
        </button>
      </header>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <Users size={22} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Nenhum contato ainda
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Sincronize contatos via WhatsApp ou aguarde interações chegarem.
            </p>
          </div>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
          >
            <RefreshCw size={15} />
            Sincronizar WhatsApp
          </button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          actions={{
            searchBar: {
              placeholder: 'Buscar por nome, telefone ou @usuário...',
              value: query,
              onChange: setQuery,
            },
          }}
          renderActions={() => (
            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <MoreVertical size={16} />
            </button>
          )}
        />
      )}

      <SyncContactsModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={loadData}
        whatsappChannels={whatsappChannels}
      />
    </div>
  );
}
