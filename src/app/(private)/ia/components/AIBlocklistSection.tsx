'use client';
import { Ban, Instagram, MessageCircle, Search, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import CardEmptyState from '@/components/CardEmptyState';
import Input from '@/components/Input';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonForm } from '@/components/Skeleton';
import { ToastContainer, useToast } from '@/components/Toast';
import { aiBlocklistService } from '@/services/ai-blocklist.service';
import { contactService } from '@/services/contact.service';
import type { AiBlockedContact } from '@/types/AI';
import type { Contact } from '@/types/Contact';
import { getInitials } from '@/utils/displayName';
import { extractPhoneDigits, formatPhoneNumber } from '@/utils/phone';

const SEARCH_MIN_CHARS = 2;
const SEARCH_LIMIT = 8;
const SEARCH_DEBOUNCE_MS = 300;
const FILTER_VISIBLE_FROM = 8;

type Channel = 'WHATSAPP' | 'INSTAGRAM';

interface ContactRowData {
  id: string;
  name: string;
  detail: string;
  channels: Channel[];
}

function formatPhone(phone: string | null | undefined): string {
  return phone ? formatPhoneNumber(extractPhoneDigits(phone)) : '';
}

function fromBlocked(contact: AiBlockedContact): ContactRowData {
  const phone = formatPhone(contact.phoneE164);
  const instagram = contact.igUsername ? `@${contact.igUsername}` : '';
  return {
    id: contact.id,
    name: contact.displayName || phone || instagram || 'Contato sem nome',
    detail: [phone, instagram].filter(Boolean).join(' · '),
    channels: contact.channels,
  };
}

function fromContact(contact: Contact): ContactRowData {
  const identities = contact.identities ?? [];
  const phone = formatPhone(contact.phoneE164 ?? identities.find((identity) => identity.phoneE164)?.phoneE164);
  const igUsername = identities.find((identity) => identity.igUsername)?.igUsername;
  const instagram = igUsername ? `@${igUsername}` : '';
  return {
    id: contact.id,
    name: contact.displayName || phone || instagram || 'Contato sem nome',
    detail: [phone, instagram].filter(Boolean).join(' · '),
    channels: [...new Set(identities.map((identity) => identity.type))],
  };
}

function ChannelBadges({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {channels.includes('WHATSAPP') && <Badge type="whatsapp" text="WhatsApp" icon={MessageCircle} pill/>}
      {channels.includes('INSTAGRAM') && <Badge type="instagram" text="Instagram" icon={Instagram} pill/>}
    </div>
  );
}

function ContactRow({ contact, meta, action }: { contact: ContactRowData; meta?: string; action: ReactNode }) {
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {getInitials(contact.name)}
        </span>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{contact.name}</p>
          {(contact.detail || meta) && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {[contact.detail, meta].filter(Boolean).join(' · ')}
            </p>
          )}
          <ChannelBadges channels={contact.channels}/>
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">{action}</div>
    </li>
  );
}

export default function AIBlocklistSection() {
  const { toasts, addToast, removeToast } = useToast();
  const [blocked, setBlocked] = useState<AiBlockedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const searchRun = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      setBlocked(await aiBlocklistService.list());
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const term = query.trim();
    const run = ++searchRun.current;
    if (term.length < SEARCH_MIN_CHARS) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      contactService.listContacts({ search: term, limit: SEARCH_LIMIT })
        .then((page) => {
          if (run === searchRun.current) setResults(page.data);
        })
        .catch(() => {
          if (run === searchRun.current) setResults([]);
        })
        .finally(() => {
          if (run === searchRun.current) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const blockedIds = useMemo(() => new Set(blocked.map((contact) => contact.id)), [blocked]);

  const handleBlock = useCallback(async (contact: ContactRowData) => {
    setPendingId(contact.id);
    try {
      setBlocked(await aiBlocklistService.block([contact.id]));
      addToast('success', `A IA não vai mais mandar mensagens para ${contact.name}.`);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Não foi possível bloquear o contato.');
    } finally {
      setPendingId(null);
    }
  }, [addToast]);

  const handleUnblock = useCallback(async (contact: ContactRowData) => {
    setPendingId(contact.id);
    const previous = blocked;
    setBlocked((current) => current.filter((item) => item.id !== contact.id));
    try {
      await aiBlocklistService.unblock(contact.id);
      addToast('success', `${contact.name} saiu da lista. A IA volta a responder essa pessoa.`);
    } catch (err) {
      setBlocked(previous);
      addToast('error', err instanceof Error ? err.message : 'Não foi possível tirar o contato da lista.');
    } finally {
      setPendingId(null);
    }
  }, [blocked, addToast]);

  const blockedRows = useMemo(() => {
    const rows = blocked.map((contact) => ({ row: fromBlocked(contact), blockedAt: contact.blockedAt }));
    const term = filter.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(({ row }) => `${row.name} ${row.detail}`.toLowerCase().includes(term));
  }, [blocked, filter]);

  const showSearchHint = query.trim().length > 0 && query.trim().length < SEARCH_MIN_CHARS;
  const showNoResults = !searching && query.trim().length >= SEARCH_MIN_CHARS && results.length === 0;

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionHeader
          title="Bloquear contatos"
          hint="Contatos desta lista nunca recebem mensagens da IA, até você tirá-los daqui."
        />
        <Callout tone="info" className="mb-3">
          A IA não responde nem manda mensagem de retomada para estes contatos, em nenhum canal e em nenhum perfil de IA.
          Respostas automáticas por palavra-chave, fluxos e campanhas continuam funcionando normalmente.
        </Callout>
        <Input
          aria-label="Buscar contato para bloquear"
          placeholder="Busque pelo nome, telefone ou @ do Instagram"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          leftIcon={<Search size={16}/>}
          {...(showSearchHint ? { hint: 'Digite pelo menos 2 letras para buscar.' } : {})}
        />
        {searching && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Buscando contatos...</p>
        )}
        {showNoResults && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Nenhum contato encontrado com essa busca.</p>
        )}
        {!searching && results.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
            {results.map((contact) => {
              const row = fromContact(contact);
              const isBlocked = blockedIds.has(row.id);
              return (
                <ContactRow
                  key={row.id}
                  contact={row}
                  action={isBlocked
                    ? <Badge type="neutral" text="Já bloqueado" icon={Ban} pill/>
                    : (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Ban size={14}/>}
                        loading={pendingId === row.id}
                        loadingText="Bloqueando..."
                        disabled={pendingId !== null}
                        onClick={() => void handleBlock(row)}
                      >
                        Bloquear
                      </Button>
                    )}
                />
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <SectionHeader
          title="Contatos bloqueados"
          hint={blocked.length === 1 ? '1 contato bloqueado' : `${blocked.length} contatos bloqueados`}
        />
        {loading && <div className="animate-pulse" aria-busy="true"><SkeletonForm fields={2}/></div>}
        {!loading && loadFailed && (
          <CardEmptyState
            message="Não foi possível carregar a lista de bloqueio."
            action={<Button variant="ghost" size="sm" onClick={() => void load()}>Tentar de novo</Button>}
          />
        )}
        {!loading && !loadFailed && blocked.length === 0 && (
          <CardEmptyState message="Nenhum contato bloqueado. A IA conversa com todos os contatos dos canais em que está ativa."/>
        )}
        {!loading && !loadFailed && blocked.length > 0 && (
          <>
            {blocked.length >= FILTER_VISIBLE_FROM && (
              <Input
                aria-label="Filtrar contatos bloqueados"
                placeholder="Filtrar a lista"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                leftIcon={<Search size={16}/>}
              />
            )}
            {blockedRows.length === 0
              ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Nenhum contato bloqueado corresponde ao filtro.</p>
              : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {blockedRows.map(({ row, blockedAt }) => (
                    <ContactRow
                      key={row.id}
                      contact={row}
                      {...(blockedAt ? { meta: `Bloqueado em ${new Date(blockedAt).toLocaleDateString('pt-BR')}` } : {})}
                      action={(
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<UserCheck size={14}/>}
                          loading={pendingId === row.id}
                          loadingText="Desbloqueando..."
                          disabled={pendingId !== null}
                          onClick={() => void handleUnblock(row)}
                        >
                          Desbloquear
                        </Button>
                      )}
                    />
                  ))}
                </ul>
              )}
          </>
        )}
      </Card>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
