/**
 * Marcação de texto do WhatsApp (`*negrito*`, `_itálico_`, `~riscado~`,
 * ```` ```mono``` ````). O mesmo texto é escrito no editor, mostrado no preview
 * e listado nas telas de automação — antes cada lugar tinha a sua cópia destas
 * expressões, e elas saíam de sincronia.
 */

/**
 * Converte para HTML. Escapa `&`, `<` e `>` ANTES de inserir as tags, então o
 * resultado é seguro para `dangerouslySetInnerHTML`: nada que a pessoa digitar
 * vira elemento.
 */
export function whatsAppToHtml(text: string, options: { codeClassName?: string } = {}): string {
  const codeClass = options.codeClassName
    ?? 'bg-gray-200/50 dark:bg-gray-600/50 px-1 rounded text-xs font-mono';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<del>$1</del>')
    .replace(/```([^`]+)```/g, `<code class="${codeClass}">$1</code>`)
    .replace(/\n/g, '<br/>');
}

/** Remove os marcadores sem formatar — para onde só cabe texto puro. */
export function stripWhatsAppFormatting(text: string): string {
  return text
    .replace(/```([\s\S]*?)```/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '$1')
    .replace(/~([^~\n]+)~/g, '$1');
}
