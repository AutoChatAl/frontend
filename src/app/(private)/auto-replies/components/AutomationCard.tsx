'use client';
import { ExternalLink, FileText, Image as ImageIcon, Mic, Pencil, Send, Trash2 } from 'lucide-react';

import Card from '@/components/Card';
import IconButton from '@/components/IconButton';
import ToggleSwitch from '@/components/ToggleSwitch';

import {
  CHANNEL_TYPE_LABEL,
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

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className || 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'}`}>
      {children}
    </span>
  );
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-slate-400 dark:text-slate-500">{label}</p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}

/** Anexos da resposta em uma linha só de ícones — cabe onde o texto não cabe. */
function Attachments({ audio, image, document: doc, link }: {
  audio?: boolean;
  image?: boolean;
  document?: boolean;
  link?: string | null;
}) {
  if (!audio && !image && !doc && !link) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
      {audio && (<span className="inline-flex items-center gap-1"><Mic size={12} />Áudio</span>)}
      {image && (<span className="inline-flex items-center gap-1"><ImageIcon size={12} />Imagem</span>)}
      {doc && (<span className="inline-flex items-center gap-1"><FileText size={12} />Documento</span>)}
      {link && (<span className="inline-flex min-w-0 items-center gap-1"><ExternalLink size={12} /><span className="truncate">{link}</span></span>)}
    </div>
  );
}

export default function AutomationCard({ row, channelName, onToggle, onEdit, onDelete }: AutomationCardProps) {
  const kind = KIND_META[row.kind];
  const KindIcon = kind.icon;

  return (
    <Card className={`p-4 transition-opacity ${row.enabled ? '' : 'opacity-60'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip className={kind.chip}>
              <KindIcon size={11} />
              {kind.label}
            </Chip>
            <Chip>{channelName ?? CHANNEL_TYPE_LABEL[row.channelType]}</Chip>
            {row.kind === 'COMMENT' && row.rule.triggerOnAnyComment
              ? <Chip className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Qualquer comentário</Chip>
              : <Chip>{MATCH_MODE_LABELS[row.rule.matchMode] ?? row.rule.matchMode}</Chip>}
            {row.kind === 'DM' && row.rule.caseSensitive && (
              <Chip className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">Aa</Chip>
            )}
            {row.kind === 'COMMENT' && row.rule.oncePerUser && <Chip>1x por pessoa</Chip>}
          </div>

          {row.kind === 'DM' ? (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <FieldBlock label="Quando receber">
                <p className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-[13px] font-semibold text-slate-900 dark:bg-slate-700/50 dark:text-white">
                  &quot;{row.rule.keyword}&quot;
                </p>
              </FieldBlock>
              <FieldBlock label="Responder com">
                {hasText(row.rule.replyType) && row.rule.replyMessage && (
                  <p className="line-clamp-2 whitespace-pre-wrap text-[13px] text-slate-600 dark:text-slate-300">
                    {row.rule.replyMessage}
                  </p>
                )}
                <Attachments
                  audio={hasAudio(row.rule.replyType)}
                  image={hasImage(row.rule.replyType)}
                  document={hasDocument(row.rule.replyType)}
                  link={row.rule.replyLinkUrl ? row.rule.replyLinkLabel || row.rule.replyLinkUrl : null}
                />
              </FieldBlock>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <FieldBlock label="Quando comentarem">
                {row.rule.triggerOnAnyComment ? (
                  <p className="text-[13px] text-slate-500 dark:text-slate-400">Qualquer comentário no post</p>
                ) : (
                  <p className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-[13px] font-semibold text-slate-900 dark:bg-slate-700/50 dark:text-white">
                    &quot;{row.rule.keyword}&quot;
                  </p>
                )}
                {row.rule.commentReplyEnabled && row.rule.commentReplyMessage && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Responde no comentário: {row.rule.commentReplyMessage}
                  </p>
                )}
              </FieldBlock>
              <FieldBlock label="DM enviada">
                {row.rule.dmMessage && (
                  <p className="line-clamp-2 whitespace-pre-wrap text-[13px] text-slate-600 dark:text-slate-300">
                    {row.rule.dmMessage}
                  </p>
                )}
                <Attachments
                  audio={!!row.rule.dmAudioBase64}
                  image={!!row.rule.dmImageBase64}
                  document={!!row.rule.dmDocumentBase64}
                  link={row.rule.dmLinkUrl ? row.rule.dmLinkLabel || row.rule.dmLinkUrl : null}
                />
                {!row.rule.dmMessage && !row.rule.dmLinkUrl && !row.rule.dmAudioBase64 && !row.rule.dmImageBase64 && (
                  <p className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <Send size={11} />
                    Sem conteúdo configurado
                  </p>
                )}
              </FieldBlock>
            </div>
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
