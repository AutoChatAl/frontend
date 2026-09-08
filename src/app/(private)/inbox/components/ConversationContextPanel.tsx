'use client';
import { Check, CircleUser, Hand, Hourglass, Link2, Link2Off, Loader2, Lock, Pencil, Play, Undo2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import Input from '@/components/Input';
import Select from '@/components/Select';
import type { InboxAgent, InboxConversation } from '@/types/Inbox';

import { Avatar, CHANNEL_LABEL, channelBadge, formatCountdown, getInitials, normalizeDisplayName, relativeTime } from './ChatBits';
import PopoverMenu from './PopoverMenu';

const ATTENDANCE_LABEL: Record<string, string> = {
  OPEN: 'Em aberto',
  IN_PROGRESS: 'Em andamento',
  WAITING: 'Aguardando',
  RESOLVED: 'Resolvido',
};

/** Abaixo disso a conversa está perto de sair da janela — vale destacar. */
const EXPIRY_WARNING_MS = 2 * 60 * 60 * 1000;

interface ConversationContextPanelProps {
    conversation: InboxConversation;
    agents: InboxAgent[];
    currentUserId: string | null;
    /** Dono do workspace: pode transferir e devolver qualquer conversa. */
    hasFullAccess: boolean;
    assigning: boolean;
    messageCount: number;
    /** Demais conversas da caixa — destinos possíveis de um vínculo. */
    conversations: InboxConversation[];
    onAssign: (userId: string) => void;
    onUnassign: () => void;
    onResumeAi: () => void;
    onLink: (targetConversationId: string) => void;
    onUnlink: () => void;
    onRenameContact: (displayName: string) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (<div className="flex items-baseline justify-between gap-3 py-1.5 min-w-0">
    <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{label}</span>
    <span className="text-[13px] text-slate-700 dark:text-slate-300 truncate text-right">{value}</span>
  </div>);
}

function SectionTitle({ children }: { children: string }) {
  return (<p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
    {children}
  </p>);
}

export default function ConversationContextPanel({
  conversation,
  agents,
  currentUserId,
  hasFullAccess,
  assigning,
  messageCount,
  conversations,
  onAssign,
  onUnassign,
  onResumeAi,
  onLink,
  onUnlink,
  onRenameContact,
}: ConversationContextPanelProps) {
  // Irmãs já vinculadas e candidatas a vínculo saem da mesma lista que a caixa
  // já carregou — não vale uma busca própria para escolher entre o que está à vista.
  const linked = conversation.linkGroupId
    ? conversations.filter((other) => other.id !== conversation.id && other.linkGroupId === conversation.linkGroupId)
    : [];
  const linkCandidates = conversations.filter(
    (other) => other.id !== conversation.id
      && (!other.linkGroupId || other.linkGroupId !== conversation.linkGroupId),
  );
  // Nome em edição. O provedor manda o nome do WhatsApp quando o contato
  // permite; quando não manda, é por aqui que a conversa deixa de ser um número.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  // Só serve para redesenhar a contagem regressiva a cada minuto.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const assignedTo = conversation.assignedTo ?? null;
  const isMine = !!assignedTo && assignedTo === currentUserId;
  // Quem não é dono só mexe no que está livre ou é seu: ninguém tira o atendimento de outro.
  const canManage = hasFullAccess || !assignedTo || isMine;
  const assignedLabel = isMine ? 'Você' : conversation.assignedToName || 'Atendente removido';
  const aiPausedUntil = conversation.aiPausedUntil ? new Date(conversation.aiPausedUntil) : null;
  const aiPaused = !!aiPausedUntil && aiPausedUntil.getTime() > Date.now();
  const attendance = conversation.attendanceStatus ? ATTENDANCE_LABEL[conversation.attendanceStatus] : null;
  const expiresAt = conversation.expiresAt ?? null;
  const msToExpiry = expiresAt ? new Date(expiresAt).getTime() - Date.now() : null;
  const expiringSoon = msToExpiry !== null && msToExpiry <= EXPIRY_WARNING_MS;
  const replyWindowExpiresAt = conversation.replyWindowExpiresAt ?? null;
  const replyLocked = !replyWindowExpiresAt || new Date(replyWindowExpiresAt).getTime() <= Date.now();

  return (<div className="flex h-full flex-col overflow-y-auto">
    <div className="flex flex-col items-center gap-2 border-b border-slate-100 dark:border-slate-700 p-4 text-center">
      <Avatar name={conversation.contactName} identifier={conversation.contactIdentifier} avatarUrl={conversation.avatarUrl} size={56}/>
      <div className="min-w-0 w-full">
        {nameDraft === null ? (
          <button
            type="button"
            onClick={() => setNameDraft(conversation.contactName ?? '')}
            title="Dar um nome a este contato"
            className="group mx-auto flex max-w-full cursor-pointer items-center justify-center gap-1.5"
          >
            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {normalizeDisplayName(conversation.contactName) || conversation.contactIdentifier || 'Contato sem nome'}
            </span>
            <Pencil size={12} className="shrink-0 text-slate-300 transition-colors group-hover:text-indigo-500 dark:text-slate-600"/>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              value={nameDraft}
              autoFocus
              maxLength={120}
              placeholder="Nome do contato"
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setNameDraft(null);
                if (event.key === 'Enter' && nameDraft.trim()) {
                  onRenameContact(nameDraft.trim());
                  setNameDraft(null);
                }
              }}
              wrapperClassName="flex-1"
            />
            <button
              type="button"
              aria-label="Salvar nome"
              disabled={!nameDraft.trim()}
              onClick={() => { onRenameContact(nameDraft.trim()); setNameDraft(null); }}
              className="shrink-0 cursor-pointer rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
            >
              <Check size={16}/>
            </button>
          </div>
        )}
        {conversation.contactIdentifier && (<p className="truncate text-xs text-slate-400 dark:text-slate-500">
          {conversation.contactIdentifier}
        </p>)}
      </div>
      <div className="flex justify-center">
        {channelBadge(
          conversation.channelType,
          conversation.channelName || conversation.channelIdentifier,
        )}
      </div>
    </div>

    {expiresAt && (<div className={`flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 px-4 py-2.5 ${expiringSoon
      ? 'bg-amber-50/60 dark:bg-amber-500/5'
      : ''}`}>
      <Hourglass size={14} className={expiringSoon ? 'text-amber-600 dark:text-amber-400 shrink-0' : 'text-slate-400 dark:text-slate-500 shrink-0'}/>
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-medium ${expiringSoon ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {msToExpiry !== null && msToExpiry <= 0 ? 'Conversa expirada' : `Expira em ${formatCountdown(expiresAt)}`}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
            A janela reinicia a cada nova mensagem
        </p>
      </div>
    </div>)}

    <div className="space-y-2 border-b border-slate-100 dark:border-slate-700 p-4">
      <SectionTitle>Atendimento</SectionTitle>

      {assignedTo ? (<div className="flex items-center gap-2.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
          {getInitials(assignedLabel)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-slate-900 dark:text-white">{assignedLabel}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {conversation.assignedAt ? `assumiu ${relativeTime(conversation.assignedAt)}` : 'responsável pela conversa'}
          </p>
        </div>
      </div>) : (<div className="flex items-center gap-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-2.5 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500">
          <CircleUser size={15}/>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Na fila comum</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">visível para toda a equipe</p>
        </div>
      </div>)}

      {canManage && (<div className="flex items-center gap-1.5">
        <PopoverMenu side="down" align="start" widthClassName="w-64" disabled={assigning || agents.length === 0} label="Transferir conversa" trigger={(open) => (<span className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${open
          ? 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
          : 'border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}>
          {assigning ? <Loader2 size={13} className="animate-spin"/> : <UserPlus size={13}/>}
          {assignedTo ? 'Transferir' : 'Atribuir'}
        </span>)}>
          {(close) => (<div className="max-h-64 overflow-y-auto p-1.5">
            <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Passar para
            </p>
            {agents.map((agent) => {
              const active = agent.id === assignedTo;
              return (<button key={agent.id} type="button" disabled={active} onClick={() => {
                close();
                onAssign(agent.id);
              }} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${active
                ? 'bg-slate-50 dark:bg-slate-900/60 cursor-default'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer'}`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/60 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {getInitials(agent.name, agent.email)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">
                    {agent.id === currentUserId ? `${agent.name} (você)` : agent.name}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400 dark:text-slate-500">{agent.email}</span>
                </span>
                {active && (<span className="shrink-0 text-[10px] font-semibold text-indigo-500">atual</span>)}
              </button>);
            })}
          </div>)}
        </PopoverMenu>

        {assignedTo && (<button type="button" onClick={onUnassign} disabled={assigning} title="Devolver para a fila comum" className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <Undo2 size={13}/>
            Devolver
        </button>)}
      </div>)}

      {assignedTo && !canManage && (<p className="text-xs text-slate-400 dark:text-slate-500">
          Só {assignedLabel} ou o dono do workspace pode mudar esse atendimento.
      </p>)}
    </div>

    <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-700 p-4">
      <SectionTitle>Sinais</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {replyLocked && (<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <Lock size={11}/>
            Envio bloqueado
        </span>)}
        {conversation.awaitingHuman && (<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          <Hand size={11}/>
            Pediu atendimento humano
        </span>)}
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${aiPaused
          ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
          : 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400'}`}>
          {aiPaused ? 'IA pausada' : 'IA ativa'}
        </span>
        {attendance && (<span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          {attendance}
        </span>)}
      </div>
      {aiPaused && aiPausedUntil && (<div className="space-y-1.5 pt-0.5">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
            A IA volta sozinha às {aiPausedUntil.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
        </p>
        {canManage && (<button type="button" onClick={onResumeAi} disabled={assigning} className="flex items-center gap-1.5 rounded-lg border border-violet-200 dark:border-violet-500/30 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-400 transition-colors hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {assigning ? <Loader2 size={13} className="animate-spin"/> : <Play size={13}/>}
            Reativar IA agora
        </button>)}
      </div>)}
    </div>

    {/* Vínculo entre canais. Só junta o que a lista mostra: o envio continua
        preso ao canal desta conversa, e a IA daqui não enxerga a outra. */}
    <div className="border-t border-slate-100 p-4 dark:border-slate-700/60">
      <SectionTitle>Mesma pessoa</SectionTitle>
      {linked.length > 0 ? (<div className="mt-1.5 space-y-1.5">
        {linked.map((sibling) => (<div key={sibling.id} className="flex items-center gap-1.5 text-[13px] text-slate-700 dark:text-slate-300">
          <Link2 size={13} className="shrink-0 text-indigo-500"/>
          <span className="truncate">{sibling.contactName || sibling.contactIdentifier || 'Sem nome'}</span>
          <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{CHANNEL_LABEL[sibling.channelType]}</span>
        </div>))}
        <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          As conversas continuam separadas: cada uma responde pelo próprio canal.
        </p>
        <button type="button" onClick={onUnlink} disabled={assigning} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50 cursor-pointer">
          {assigning ? <Loader2 size={13} className="animate-spin"/> : <Link2Off size={13}/>}
          Desfazer vínculo
        </button>
      </div>) : (<div className="mt-1.5 space-y-1.5">
        <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          Se este contato também fala com você por outro canal, vincule as conversas para elas aparecerem juntas na lista.
        </p>
        {linkCandidates.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">Nenhuma outra conversa aberta para vincular.</p>
        ) : (<Select
          placeholder="Vincular a outra conversa..."
          value=""
          disabled={assigning}
          // Acima de dez conversas achar a pessoa na lista vira o trabalho; o
          // próprio Select liga a busca a partir do limiar dele.
          searchable
          options={linkCandidates.map((candidate) => ({
            value: candidate.id,
            label: candidate.contactName || candidate.contactIdentifier || 'Sem nome',
            description: CHANNEL_LABEL[candidate.channelType],
          }))}
          onChange={(value) => { if (value) onLink(value); }}
        />)}
      </div>)}
    </div>

    <div className="p-4">
      <SectionTitle>Detalhes</SectionTitle>
      <div className="mt-1 divide-y divide-slate-100 dark:divide-slate-700/60">
        <Row label="Canal" value={CHANNEL_LABEL[conversation.channelType]}/>
        <Row label="Recebido em" value={conversation.channelName || conversation.channelIdentifier || '—'}/>
        <Row label="Última mensagem" value={relativeTime(conversation.lastMessageAt)}/>
        <Row label="Janela de resposta" value={replyLocked || !replyWindowExpiresAt ? 'Encerrada' : `Fecha em ${formatCountdown(replyWindowExpiresAt)}`}/>
        <Row label="Conversa criada" value={new Date(conversation.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}/>
        <Row label="Mensagens no histórico" value={messageCount.toLocaleString('pt-BR')}/>
        <Row label="Não lidas" value={conversation.unreadCount.toLocaleString('pt-BR')}/>
      </div>
    </div>
  </div>);
}
