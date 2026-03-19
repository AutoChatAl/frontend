'use client';

import { Check } from 'lucide-react';

interface WhatsAppPreviewProps {
  message: string;
  senderName?: string;
}

function formatWhatsAppText(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>');
  html = html.replace(/~([^~\n]+)~/g, '<del>$1</del>');
  html = html.replace(/```([^`]+)```/g, '<code class="bg-gray-200/50 dark:bg-gray-600/50 px-1 rounded text-xs font-mono">$1</code>');

  html = html.replace(/\n/g, '<br/>');

  return html;
}

export default function WhatsAppPreview({ message, senderName = 'Synq' }: WhatsAppPreviewProps) {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-[#075E54] dark:bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-bold">
          {senderName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{senderName}</p>
          <p className="text-green-200 dark:text-green-300 text-[10px]">online</p>
        </div>
      </div>

      <div
        className="p-4 min-h-30 max-h-62.5 overflow-y-auto"
        style={{
          backgroundColor: '#ECE5DD',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c5bdb3\' fill-opacity=\'0.15\'%3E%3Cpath opacity=\'.5\' d=\'M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      >
        {message ? (
          <div className="flex justify-end">
            <div className="bg-[#DCF8C6] dark:bg-[#005C4B] rounded-lg rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
              <div
                className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed wrap-break-word whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatWhatsAppText(message) }}
              />
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{time}</span>
                <Check size={12} className="text-blue-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-gray-500 italic">Digite uma mensagem para ver o preview...</p>
          </div>
        )}
      </div>
    </div>
  );
}
