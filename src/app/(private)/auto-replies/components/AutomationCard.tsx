'use client';
import { ExternalLink, FileText, Image as ImageIcon, Mic, MousePointerClick, Pencil, Send, Trash2, Zap } from 'lucide-react';

import Card from '@/components/Card';
import IconButton from '@/components/IconButton';
import ToggleSwitch from '@/components/ToggleSwitch';
import type { AutomationResult } from '@/types/AutomationInsights';
import { whatsAppToHtml } from '@/utils/whatsappFormat';

import {
  CHANNEL_TYPE_META,
  hasAudio,
  hasDocument,
  hasImage,
  hasText,
  KIND_META,
  MATCH_MODE_LABELS,
  type AutomationRow,
} from './automationMeta';

interface AutomationCardProps {
  row: AutomationRow;
  channelName: string | null;
  result?: AutomationResult | null | undefined;
  resultsReady?: boolean;
  onToggle: (row: AutomationRow) => void;
  onEdit: (row: AutomationRow) => void;
  onDelete: (row: AutomationRow) => void;
}

function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? one : many}`;
}

function lastTriggered(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(date)) / 86_400_000);
  if (days <= 0) return 'última vez hoje';
  if (days === 1) return 'última vez ontem';
  if (days < 30) return `última vez há ${days} dias`;
  return `última vez em ${date.toLocaleDateString('pt-BR')}`;
}

function ResultsLine({ result, ready }: { result: AutomationResult | null | undefined; ready: boolean }) {
  if (!ready) return null;
  if (!result || result.triggers === 0) {
    return (
      <p className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-400 dark:border-slate-700/60 dark:text-slate-500">
        <Zap size={12} className="shrink-0" />
        Ainda não disparou
      </p>
    );
  }
  const when = lastTriggered(result.lastTriggeredAt);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <Zap size={12} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
        <strong className="font-semibold text-slate-900 dark:text-white">{plural(result.triggers, 'disparo', 'disparos')}</strong>
      </span>
      {result.linksSent > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <Send size={12} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
          {plural(result.linksSent, 'pessoa recebeu o link', 'pessoas receberam o link')}
        </span>
      )}
      {result.linksSent > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <MousePointerClick size={12} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
          {plural(result.clicks, 'clique', 'cliques')}
        </span>
      )}
      {when && <span className="text-slate-400 dark:text-slate-500">{when}</span>}
    </div>
  );
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'}`}>
      {children}
    </span>
  );
}

/**
 * O texto sai com a marcação do WhatsApp (`*negrito*`, `_itálico_`). Renderizar
 * é o certo aqui: mostrar os asteriscos crus não é o que a pessoa escreveu, e
 * `whatsAppToHtml` escapa a entrada antes de montar as tags.
 */
// Classe literal, não interpolada: o Tailwind varre o código-fonte e não
// geraria um `line-clamp-` montado em tempo de execução.
const CLAMP_CLASS = { 2: 'line-clamp-2', 3: 'line-clamp-3' } as const;

function FormattedMessage({ text, clamp = 3, bold }: { text: string; clamp?: 2 | 3; bold?: boolean }) {
  const tone = bold
    ? 'font-semibold text-slate-900 dark:text-white'
    : 'text-slate-600 dark:text-slate-300';
  return (
    <div
      className={`wrap-break-word text-[13px] leading-relaxed ${tone} ${CLAMP_CLASS[clamp]}`}
      dangerouslySetInnerHTML={{ __html: whatsAppToHtml(text, { codeClassName: 'rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-700/60' }) }}
    />
  );
}

interface LinkButton {
  url: string;
  label: string;
  description: string;
}

const EMPTY_TEXT = 'Sem texto — só anexo';

/**
 * Quando existe botão de link, a mensagem e o botão são **uma coisa só** na
 * entrega: o Instagram monta um card com título, descrição e botão. Então o
 * card aqui segue a mesma ordem do que chega para a pessoa — título, descrição,
 * botão, destino — em vez de jogar o texto para fora e o botão para cima dele.
 */
function ResponseBody({ text, clamp, link, boldTitle }: {
  text: string;
  clamp?: 2 | 3;
  link: LinkButton | null;
  /**
   * No Instagram com botão, a mensagem vira o `title` de um generic template e
   * o próprio Instagram renderiza esse campo em negrito. O card mostra assim
   * para não passar a impressão de que o texto chega igual ao resto.
   */
  boldTitle?: boolean;
}) {
  const body = text
    ? <FormattedMessage text={text} {...(clamp ? { clamp } : {})} {...(boldTitle && link ? { bold: true } : {})} />
    : <p className="text-[13px] text-slate-400 dark:text-slate-500">{EMPTY_TEXT}</p>;

  if (!link) return body;

  return (
    // `max-w-sm` porque o card não é um bloco de página: é a reprodução de uma
    // mensagem, e mensagem esticada na largura toda da linha não se parece com
    // o que chega no celular de quem recebe.
    <div className="max-w-sm overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="px-2.5 py-2">
        {body}
        {link.description && (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-slate-500 dark:text-slate-400">
            {link.description}
          </p>
        )}
      </div>
      <div className="border-t border-slate-100 px-2.5 py-2 dark:border-slate-700">
        <p className="flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 py-1.5 text-[12px] font-semibold text-white">
          <ExternalLink size={12} className="shrink-0" />
          <span className="truncate">{link.label || 'Saiba mais'}</span>
        </p>
        <p className="mt-1.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{link.url}</p>
      </div>
    </div>
  );
}

/** Anexos são mensagens à parte, então vêm depois do card da mensagem. */
function Attachments({ audio, image, document: doc }: {
  audio?: boolean;
  image?: boolean;
  document?: boolean;
}) {
  if (!audio && !image && !doc) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
      {audio && (<span className="inline-flex items-center gap-1"><Mic size={12} />Áudio</span>)}
      {image && (<span className="inline-flex items-center gap-1"><ImageIcon size={12} />Imagem</span>)}
      {doc && (<span className="inline-flex items-center gap-1"><FileText size={12} />Documento</span>)}
    </div>
  );
}

/** Só vira card quando existe destino — label e descrição sozinhos não valem nada. */
function linkOf(url?: string, label?: string, description?: string): LinkButton | null {
  if (!url) return null;
  return { url, label: label ?? '', description: description ?? '' };
}

const KEYWORD_CHIP = 'max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-[13px] font-semibold text-slate-900 dark:bg-slate-700/50 dark:text-white';

/**
 * Gatilho numa linha só: rótulo e palavras lado a lado, sem roubar altura.
 *
 * O separador entre as palavras é a própria regra: "ou" quando basta uma bater,
 * "e" quando a mensagem precisa conter todas. Sem isso, duas palavras na tela
 * não dizem qual das duas leituras vale.
 */
function Trigger({ label, keywords, logic, any }: {
  label: string;
  keywords: string[];
  logic?: 'ANY' | 'ALL';
  any?: boolean;
}) {
  const separator = logic === 'ALL' ? 'e' : 'ou';
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[11px] text-slate-400 dark:text-slate-500">{label}</span>
      {any ? (
        <span className="text-[13px] text-slate-500 dark:text-slate-400">qualquer comentário</span>
      ) : (
        keywords.map((keyword, index) => (
          <span key={`${keyword}-${index}`} className="flex min-w-0 items-center gap-2">
            {index > 0 && <span className="text-[11px] text-slate-400 dark:text-slate-500">{separator}</span>}
            <span className={KEYWORD_CHIP}>&quot;{keyword}&quot;</span>
          </span>
        ))
      )}
    </div>
  );
}

/** Regras antigas não têm `keywords` — sem o fallback o card ficaria sem gatilho. */
function keywordsOf(rule: { keyword: string; keywords?: string[] }): string[] {
  return rule.keywords?.length ? rule.keywords : [rule.keyword].filter(Boolean);
}

export default function AutomationCard({ row, channelName, result, resultsReady = false, onToggle, onEdit, onDelete }: AutomationCardProps) {
  const kind = KIND_META[row.kind];
  const KindIcon = kind.icon;
  const channel = CHANNEL_TYPE_META[row.channelType];
  const ChannelIcon = channel.icon;

  return (
    <Card className={`p-4 transition-opacity ${row.enabled ? '' : 'opacity-60'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip className={kind.chip}>
              <KindIcon size={11} />
              {kind.label}
            </Chip>
            <Chip className={channel.chip}>
              <ChannelIcon size={11} />
              {channelName ?? channel.label}
            </Chip>
            {(row.kind !== 'DM' && row.rule.triggerOnAnyComment) || row.rule.matchMode === 'CONTAINS'
              ? null
              : <Chip>{MATCH_MODE_LABELS[row.rule.matchMode] ?? row.rule.matchMode}</Chip>}
            {row.kind === 'DM' && row.rule.caseSensitive && (
              <Chip className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Diferencia maiúsculas
              </Chip>
            )}
            {row.kind === 'COMMENT' && row.rule.postFilter === 'SPECIFIC' && (
              <Chip>
                {row.rule.postIds?.length === 1 ? '1 post' : `${row.rule.postIds?.length ?? 0} posts`}
              </Chip>
            )}
            {row.kind !== 'DM' && row.rule.oncePerUser && <Chip>1x por pessoa</Chip>}
          </div>

          {row.kind === 'DM' ? (
            <>
              <Trigger
                label="Quando receber"
                keywords={keywordsOf(row.rule)}
                {...(row.rule.keywordLogic ? { logic: row.rule.keywordLogic } : {})}
              />
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/30">
                <p className="mb-1 text-[11px] text-slate-400 dark:text-slate-500">Responder com</p>
                <ResponseBody
                  text={hasText(row.rule.replyType) ? row.rule.replyMessage : ''}
                  link={linkOf(row.rule.replyLinkUrl, row.rule.replyLinkLabel, row.rule.replyLinkDescription)}
                  boldTitle={row.channelType === 'INSTAGRAM'}
                />
                <Attachments
                  audio={hasAudio(row.rule.replyType)}
                  image={hasImage(row.rule.replyType)}
                  document={hasDocument(row.rule.replyType)}
                />
              </div>
            </>
          ) : (
            <>
              <Trigger
                label={row.kind === 'LIVE' ? 'Quando comentarem na live' : 'Quando comentarem'}
                keywords={keywordsOf(row.rule)}
                {...(row.rule.keywordLogic ? { logic: row.rule.keywordLogic } : {})}
                any={row.rule.triggerOnAnyComment}
              />
              {row.rule.commentReplyEnabled && row.rule.commentReplyMessage && (
                <div className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/60 p-2.5 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/5">
                  <p className="mb-1 text-[11px] text-fuchsia-600 dark:text-fuchsia-400">Responde no comentário</p>
                  <FormattedMessage text={row.rule.commentReplyMessage} clamp={2} />
                </div>
              )}
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/30">
                <p className="mb-1 text-[11px] text-slate-400 dark:text-slate-500">Mensagem no Direct</p>
                <ResponseBody
                  text={row.rule.dmMessage}
                  link={linkOf(row.rule.dmLinkUrl, row.rule.dmLinkLabel, row.rule.dmLinkDescription)}
                  boldTitle
                />
                {/* Sem áudio: comentário e live não anexam áudio (o Instagram recusa
                    para quem nunca abriu conversa). */}
                <Attachments
                  audio={false}
                  image={!!row.rule.dmImageBase64}
                  document={!!row.rule.dmDocumentBase64}
                />
              </div>
            </>
          )}

          <ResultsLine result={result} ready={resultsReady} />
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          <ToggleSwitch checked={row.enabled} onChange={() => onToggle(row)} />
          <IconButton icon={<Pencil size={16} />} onClick={() => onEdit(row)} variant="default" size="md" />
          <IconButton icon={<Trash2 size={16} />} onClick={() => onDelete(row)} variant="danger" size="md" />
        </div>
      </div>
    </Card>
  );
}
