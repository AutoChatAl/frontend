'use client';
import { ExternalLink, FileText, Image as ImageIcon, Mic, Pencil, Trash2 } from 'lucide-react';

import Card from '@/components/Card';
import IconButton from '@/components/IconButton';
import ToggleSwitch from '@/components/ToggleSwitch';
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
  onToggle: (row: AutomationRow) => void;
  onEdit: (row: AutomationRow) => void;
  onDelete: (row: AutomationRow) => void;
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

function FormattedMessage({ text, clamp = 3 }: { text: string; clamp?: 2 | 3 }) {
  return (
    <div
      className={`wrap-break-word text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 ${CLAMP_CLASS[clamp]}`}
      dangerouslySetInnerHTML={{ __html: whatsAppToHtml(text, { codeClassName: 'rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-700/60' }) }}
    />
  );
}

function Attachments({ audio, image, document: doc, link }: {
  audio?: boolean;
  image?: boolean;
  document?: boolean;
  link?: string | null;
}) {
  if (!audio && !image && !doc && !link) return null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
      {audio && (<span className="inline-flex items-center gap-1"><Mic size={12} />Áudio</span>)}
      {image && (<span className="inline-flex items-center gap-1"><ImageIcon size={12} />Imagem</span>)}
      {doc && (<span className="inline-flex items-center gap-1"><FileText size={12} />Documento</span>)}
      {link && (<span className="inline-flex min-w-0 max-w-full items-center gap-1"><ExternalLink size={12} className="shrink-0" /><span className="truncate">{link}</span></span>)}
    </div>
  );
}

/** Gatilho numa linha só: rótulo e valor lado a lado, sem roubar altura. */
function Trigger({ label, keyword, any }: { label: string; keyword: string; any?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[11px] text-slate-400 dark:text-slate-500">{label}</span>
      {any ? (
        <span className="text-[13px] text-slate-500 dark:text-slate-400">qualquer comentário no post</span>
      ) : (
        <span className="max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 text-[13px] font-semibold text-slate-900 dark:bg-slate-700/50 dark:text-white">
          &quot;{keyword}&quot;
        </span>
      )}
    </div>
  );
}

export default function AutomationCard({ row, channelName, onToggle, onEdit, onDelete }: AutomationCardProps) {
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
            {row.kind === 'COMMENT' && row.rule.triggerOnAnyComment
              ? null
              : <Chip>{MATCH_MODE_LABELS[row.rule.matchMode] ?? row.rule.matchMode}</Chip>}
            {row.kind === 'DM' && row.rule.caseSensitive && (
              <Chip className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Diferencia maiúsculas
              </Chip>
            )}
            {row.kind === 'COMMENT' && row.rule.oncePerUser && <Chip>1x por pessoa</Chip>}
          </div>

          {row.kind === 'DM' ? (
            <>
              <Trigger label="Quando receber" keyword={row.rule.keyword} />
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/30">
                <p className="mb-1 text-[11px] text-slate-400 dark:text-slate-500">Responder com</p>
                {hasText(row.rule.replyType) && row.rule.replyMessage
                  ? <FormattedMessage text={row.rule.replyMessage} />
                  : <p className="text-[13px] text-slate-400 dark:text-slate-500">Sem texto — só anexo</p>}
                <Attachments
                  audio={hasAudio(row.rule.replyType)}
                  image={hasImage(row.rule.replyType)}
                  document={hasDocument(row.rule.replyType)}
                  link={row.rule.replyLinkUrl ? row.rule.replyLinkLabel || row.rule.replyLinkUrl : null}
                />
              </div>
            </>
          ) : (
            <>
              <Trigger
                label="Quando comentarem"
                keyword={row.rule.keyword}
                any={row.rule.triggerOnAnyComment}
              />
              {row.rule.commentReplyEnabled && row.rule.commentReplyMessage && (
                <div className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/60 p-2.5 dark:border-fuchsia-500/20 dark:bg-fuchsia-500/5">
                  <p className="mb-1 text-[11px] text-fuchsia-600 dark:text-fuchsia-400">Responde no comentário</p>
                  <FormattedMessage text={row.rule.commentReplyMessage} clamp={2} />
                </div>
              )}
              <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-700/60 dark:bg-slate-900/30">
                <p className="mb-1 text-[11px] text-slate-400 dark:text-slate-500">DM enviada</p>
                {row.rule.dmMessage
                  ? <FormattedMessage text={row.rule.dmMessage} />
                  : <p className="text-[13px] text-slate-400 dark:text-slate-500">Sem texto — só anexo</p>}
                <Attachments
                  audio={!!row.rule.dmAudioBase64}
                  image={!!row.rule.dmImageBase64}
                  document={!!row.rule.dmDocumentBase64}
                  link={row.rule.dmLinkUrl ? row.rule.dmLinkLabel || row.rule.dmLinkUrl : null}
                />
              </div>
            </>
          )}
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
