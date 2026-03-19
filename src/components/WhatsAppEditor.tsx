'use client';

import { Bold, Italic, Strikethrough, Code } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface WhatsAppEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string | undefined;
  maxLength?: number | undefined;
}

type FormatType = 'bold' | 'italic' | 'strikethrough' | 'monospace';

const FORMAT_MAP: Record<FormatType, { prefix: string; suffix: string }> = {
  bold: { prefix: '*', suffix: '*' },
  italic: { prefix: '_', suffix: '_' },
  strikethrough: { prefix: '~', suffix: '~' },
  monospace: { prefix: '```', suffix: '```' },
};

export default function WhatsAppEditor({
  value,
  onChange,
  placeholder = 'Digite a mensagem...',
  rows = 5,
  error,
  maxLength,
}: WhatsAppEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = useCallback(
    (format: FormatType) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const { prefix, suffix } = FORMAT_MAP[format];

      if (selectedText) {
        const before = value.substring(0, start);
        const after = value.substring(end);
        const newValue = `${before}${prefix}${selectedText}${suffix}${after}`;
        onChange(newValue);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            end + prefix.length,
          );
        });
      } else {
        const before = value.substring(0, start);
        const after = value.substring(end);
        const newValue = `${before}${prefix}${suffix}${after}`;
        onChange(newValue);

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            start + prefix.length,
          );
        });
      }
    },
    [value, onChange],
  );

  const buttons: { format: FormatType; icon: typeof Bold; label: string; shortcut: string }[] = [
    { format: 'bold', icon: Bold, label: 'Negrito', shortcut: '*texto*' },
    { format: 'italic', icon: Italic, label: 'Itálico', shortcut: '_texto_' },
    { format: 'strikethrough', icon: Strikethrough, label: 'Tachado', shortcut: '~texto~' },
    { format: 'monospace', icon: Code, label: 'Monoespaço', shortcut: '```texto```' },
  ];

  return (
    <div className="space-y-1.5">
      <div className="border rounded-xl overflow-hidden border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-colors">
        <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          {buttons.map(({ format, icon: Icon, label, shortcut }) => (
            <button
              key={format}
              type="button"
              onClick={() => applyFormat(format)}
              title={`${label} (${shortcut})`}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Icon size={16} />
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Formatação WhatsApp
            </span>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-none"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
