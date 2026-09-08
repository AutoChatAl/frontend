'use client';
import { Download, File, FileArchive, FileCode, FileSpreadsheet, FileText, Presentation, type LucideIcon } from 'lucide-react';
import { useRef } from 'react';

import { formatBytes } from '@/utils/inboxMedia';

/**
 * Aparência por família de arquivo, no mesmo pareamento que o WhatsApp usa: PDF em
 * vermelho, planilha em verde, apresentação em âmbar. O chip colorido é o que deixa
 * o tipo legível de relance, antes mesmo de ler o nome.
 */
interface DocumentLook {
  icon: LucideIcon;
  /** Chip do ícone no balão recebido — no enviado ele vira um véu branco sobre o indigo. */
  chip: string;
}

const GENERIC_LOOK: DocumentLook = {
  icon: File,
  chip: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
};

const LOOK_BY_EXTENSION: Record<string, DocumentLook> = {
  pdf: { icon: FileText, chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
  doc: { icon: FileText, chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  docx: { icon: FileText, chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  odt: { icon: FileText, chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  rtf: { icon: FileText, chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  xls: { icon: FileSpreadsheet, chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  xlsx: { icon: FileSpreadsheet, chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  csv: { icon: FileSpreadsheet, chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  ods: { icon: FileSpreadsheet, chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  ppt: { icon: Presentation, chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  pptx: { icon: Presentation, chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  odp: { icon: Presentation, chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  zip: { icon: FileArchive, chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  rar: { icon: FileArchive, chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  '7z': { icon: FileArchive, chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  gz: { icon: FileArchive, chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  json: { icon: FileCode, chip: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' },
  xml: { icon: FileCode, chip: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' },
  txt: { icon: FileText, chip: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' },
};

/** Extensões que o mime denuncia quando o provider manda o arquivo sem nome. */
const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
  'text/csv': 'csv',
  'text/plain': 'txt',
};

function extensionOf(fileName: string | null | undefined, mimeType: string | null | undefined): string {
  const fromName = fileName?.includes('.') ? fileName.split('.').pop() : undefined;
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const mime = (mimeType || '').split(';')[0]?.trim().toLowerCase() ?? '';
  return EXTENSION_BY_MIME[mime] ?? '';
}

/** Bytes do arquivo por trás do base64, sem decodificar: 4 caracteres = 3 bytes. */
function byteLengthOf(base64: string | null | undefined): number | null {
  if (!base64) return null;
  const payload = base64.slice(base64.indexOf(',') + 1);
  if (!payload) return null;
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

/** Tipos que o navegador desenha numa aba — o resto só faz sentido baixar. */
function isPreviewable(mimeType: string | null | undefined): boolean {
  const mime = (mimeType || '').toLowerCase();
  return mime.startsWith('application/pdf') || mime.startsWith('text/') || mime.startsWith('image/');
}

/**
 * Abrir um `data:` no topo da aba é bloqueado pelo navegador desde o Chrome 60 — o
 * blob temporário é o caminho que sobra para a pré-visualização. A revogação espera
 * um minuto porque revogar na hora fecharia a aba recém-aberta.
 */
function openInNewTab(src: string, mimeType: string | null | undefined) {
  if (!src.startsWith('data:')) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }
  const payload = src.slice(src.indexOf(',') + 1);
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType || 'application/octet-stream' }));
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Documento desenhado como no WhatsApp: chip do tipo, nome do arquivo e a linha de
 * metadados ("PDF · 245 KB"), com o botão de download à direita. Tocar na linha abre
 * a pré-visualização quando o navegador sabe desenhar o formato; nos demais, baixa.
 */
export default function DocumentBubble({
  src,
  fileName,
  mimeType,
  base64,
  outgoing,
}: {
  src: string;
  fileName?: string | null | undefined;
  mimeType?: string | null | undefined;
  base64?: string | null | undefined;
  outgoing: boolean;
}) {
  const name = fileName?.trim() || 'Documento';
  const extension = extensionOf(fileName, mimeType);
  const size = byteLengthOf(base64);
  const look = (extension && LOOK_BY_EXTENSION[extension]) || GENERIC_LOOK;
  const Icon = look.icon;
  const meta = [extension.toUpperCase(), size !== null ? formatBytes(size) : null].filter(Boolean).join(' · ');
  const previewable = isPreviewable(mimeType);
  // Nomes de arquivo se repetem entre mensagens, então o clique na linha aciona o
  // próprio link de download por referência — não por id, que colidiria.
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const shell = outgoing
    ? 'border-white/20 bg-white/10'
    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40';
  const rowHover = outgoing ? 'hover:bg-white/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50';
  // No balão enviado o chip colorido brigaria com o indigo — vira um véu branco.
  const chip = outgoing ? 'bg-white/15 text-white' : look.chip;

  return (
    <div className={`flex w-64 max-w-full items-center overflow-hidden rounded-xl border ${shell}`}>
      <button
        type="button"
        onClick={() => (previewable ? openInNewTab(src, mimeType) : downloadRef.current?.click())}
        title={previewable ? `Abrir ${name}` : `Baixar ${name}`}
        className={`flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${rowHover}`}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chip}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[13px] font-medium ${outgoing ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {name}
          </span>
          {meta && (
            <span className={`block text-[11px] ${outgoing ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
              {meta}
            </span>
          )}
        </span>
      </button>
      <a
        ref={downloadRef}
        href={src}
        download={name}
        // Em URL de outro domínio o navegador ignora o `download` e navega — sem o
        // target, a inbox inteira sairia da tela.
        target="_blank"
        rel="noreferrer"
        title="Baixar"
        aria-label={`Baixar ${name}`}
        className={`shrink-0 self-stretch px-2.5 py-2 transition-colors ${rowHover} ${outgoing ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'} flex items-center`}
      >
        <Download size={17} />
      </a>
    </div>
  );
}
