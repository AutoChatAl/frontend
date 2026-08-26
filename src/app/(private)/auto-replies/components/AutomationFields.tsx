'use client';
import { AlertCircle, Check, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import type { WorkspaceChannel, WorkspaceChannelType } from '@/hooks/WorkspaceChannelsHook';
import type { InstagramMedia } from '@/types/Channel';
import { getChannelStatusBadgeClasses, getChannelStatusLabel } from '@/utils/channelStatus';

import { CHANNEL_TYPE_META } from './automationMeta';

/**
 * Peças de formulário compartilhadas pelo modal de automação.
 *
 * Regras aplicadas em todas elas:
 * - rótulo é texto puro, sem ícone decorativo;
 * - o estado selecionado usa o indigo primário da Synq, não a cor da
 *   plataforma — cor de plataforma fica reservada para identificar o canal;
 * - campo de uma linha tem 42px, a mesma altura de `Input`/`Textarea`, para o
 *   formulário não ficar em degraus.
 */
export const FIELD_HEIGHT = 'h-[42px]';

const TILE_BASE = 'flex cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-medium transition-colors';
const TILE_ON = 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-slate-800 dark:text-indigo-300';
const TILE_OFF = 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600';

export function FieldLabel({ children, required, optional, htmlFor }: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {children}
      {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      {optional && <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">(opcional)</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: string | undefined }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle size={12} className="shrink-0" />
      {children}
    </p>
  );
}

/** Bloco de assunto dentro do modal, separado por uma linha fina. */
export function FormSection({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-5 first:border-0 first:pt-0 dark:border-slate-700/60">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      )}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

/** Controle segmentado: opções curtas e mutuamente exclusivas numa linha só. */
export function SegmentedControl<T extends string>({ options, value, onChange, disabled }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Trava a escolha quando outra opção do formulário já decidiu por ela. */
  disabled?: boolean;
}) {
  return (
    <div className={`flex w-full rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800 ${FIELD_HEIGHT} ${disabled ? 'opacity-60' : ''}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center rounded-lg px-2 text-[13px] font-medium transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
              active
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 dark:text-slate-400' + (disabled ? '' : ' hover:text-slate-700 dark:hover:text-slate-200')
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Grade de opções quando são muitas para caber num segmentado. */
export function TileGroup<T extends string>({ options, value, onChange, columns = 3 }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  // Classes literais: o Tailwind varre o código-fonte e não geraria um
  // `sm:grid-cols-` montado em tempo de execução.
  const grid = columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3';
  return (
    <div className={`grid gap-2 ${grid}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={`${TILE_BASE} ${FIELD_HEIGHT} ${option.value === value ? TILE_ON : TILE_OFF}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ChannelPickerProps {
  channels: WorkspaceChannel[];
  loading: boolean;
  value: string;
  onChange: (channel: WorkspaceChannel) => void;
  emptyMessage: string;
  error?: string | undefined;
}

/**
 * A seleção é indigo (é um campo); o quadradinho do ícone mantém a cor da
 * plataforma, que é identidade do canal e não cromo de formulário.
 */
export function ChannelPicker({ channels, loading, value, onChange, emptyMessage, error }: ChannelPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Carregando canais...</span>
      </div>
    );
  }

  if (channels.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {channels.map((channel) => {
          const selected = channel.id === value;
          const meta = CHANNEL_TYPE_META[channel.type];
          const Icon = meta.icon;
          return (
            <label
              key={channel.id}
              className={`flex cursor-pointer select-none items-center gap-3 rounded-xl border p-3 transition-colors ${selected ? TILE_ON : TILE_OFF}`}
            >
              <input
                type="radio"
                name="automation-channel"
                value={channel.id}
                checked={selected}
                onChange={() => onChange(channel)}
                className="sr-only"
              />
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{channel.name}</span>
                <span className="block text-xs text-slate-400 dark:text-slate-500">{meta.label}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getChannelStatusBadgeClasses(channel.status)}`}>
                {getChannelStatusLabel(channel.status)}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError>{error}</FieldError>
    </>
  );
}

interface FileFieldProps {
  label: string;
  accept: string;
  hint: string;
  fileName: string;
  onPick: (file: File) => void;
  onRemove: () => void;
  error?: string | undefined;
}

/** Área de upload usada tanto pela imagem quanto pelo documento. */
export function FileField({ label, accept, hint, fileName, onPick, onRemove, error }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
        }}
      />
      {fileName ? (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-500/40 dark:bg-slate-800">
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{fileName}</span>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remover ${label.toLowerCase()}`}
            className="shrink-0 cursor-pointer text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
        >
          <Upload size={16} />
          <span className="text-sm font-medium">{hint}</span>
        </button>
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}

/** Insere `{{username}}` no fim do campo — só faz sentido no Instagram. */
export function UsernameInserter({ onInsert }: { onInsert: () => void }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onInsert}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
      >
        Inserir {'{{username}}'}
      </button>
      <span className="text-xs text-slate-400 dark:text-slate-500">Será substituído pelo @ de quem comentou</span>
    </div>
  );
}

export function CharCounter({ value, max }: { value: number; max: number }) {
  const near = value > max * 0.9;
  return (
    <span className={`text-xs tabular-nums ${near ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>
      {value}/{max}
    </span>
  );
}

export function channelTypeOf(channels: WorkspaceChannel[], channelId: string, fallback: WorkspaceChannelType): WorkspaceChannelType {
  return channels.find((channel) => channel.id === channelId)?.type ?? fallback;
}

interface KeywordsInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  onAdd: (raw: string) => void;
  placeholder: string;
  max: number;
  error?: string | undefined;
}

/**
 * Entrada de várias palavras-chave em chips.
 *
 * Enter e vírgula confirmam a palavra; Backspace no campo vazio apaga a última,
 * que é como todo campo de tags se comporta e evita ter que mirar no ×. O texto
 * pendente é confirmado no `blur` para ninguém perder o que digitou ao clicar
 * direto em "Salvar".
 */
export function KeywordsInput({ values, onChange, onAdd, placeholder, max, error }: KeywordsInputProps) {
  const [draft, setDraft] = useState('');
  const full = values.length >= max;

  const commit = () => {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft('');
  };

  return (
    <div>
      <div className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border bg-white p-1.5 transition-colors focus-within:ring-2 dark:bg-slate-800 ${
        error
          ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-500/20'
          : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-indigo-500/20 dark:border-slate-700'
      }`}>
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="inline-flex max-w-full items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-[13px] font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          >
            <span className="truncate">{value}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, position) => position !== index))}
              aria-label={`Remover ${value}`}
              className="shrink-0 cursor-pointer opacity-60 transition-opacity hover:opacity-100"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          disabled={full}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
              return;
            }
            if (event.key === 'Backspace' && !draft && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          placeholder={values.length === 0 ? placeholder : full ? '' : 'Adicionar outra...'}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-slate-500"
        />
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Separe com Enter ou vírgula
        </p>
        {values.length > 0 && <CharCounter value={values.length} max={max} />}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

interface PostPickerProps {
  posts: InstagramMedia[];
  loading: boolean;
  failed: boolean;
  selected: string[];
  onChange: (postIds: string[]) => void;
  error?: string | undefined;
}

/** Grade de publicações da conta, para a regra valer só em posts escolhidos. */
export function PostPicker({ posts, loading, failed, selected, onChange, error }: PostPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Carregando publicações...</span>
      </div>
    );
  }

  if (failed || posts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
        {failed
          ? 'Não foi possível carregar as publicações desta conta agora.'
          : 'Nenhuma publicação encontrada nesta conta.'}
      </p>
    );
  }

  const toggle = (postId: string) => {
    onChange(selected.includes(postId)
      ? selected.filter((id) => id !== postId)
      : [...selected, postId]);
  };

  return (
    <div>
      <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-4 dark:border-slate-700">
        {posts.map((post) => {
          const active = selected.includes(post.id);
          return (
            <button
              key={post.id}
              type="button"
              onClick={() => toggle(post.id)}
              aria-pressed={active}
              title={post.caption ?? undefined}
              className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                active ? 'border-indigo-500' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {post.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnailUrl}
                  alt={post.caption ?? 'Publicação do Instagram'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] text-slate-400 dark:bg-slate-700/60 dark:text-slate-500">
                  sem capa
                </span>
              )}
              {active && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check size={12} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {selected.length === 0
            ? 'Nenhum post escolhido'
            : `${selected.length} ${selected.length === 1 ? 'post escolhido' : 'posts escolhidos'}`}
        </p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="cursor-pointer text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Limpar
          </button>
        )}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
