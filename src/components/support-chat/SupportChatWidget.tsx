'use client';
import { LifeBuoy, MessageCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { whatsappHref } from '@/app/(public)/components/whatsappContact';
import SegmentedControl from '@/components/SegmentedControl';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSupportChat, type SupportChatView } from '@/contexts/SupportChatContext';

import HelpPanel from './HelpPanel';
import SupportConversation from './SupportConversation';
import { useHelpCenter } from './useHelpCenter';

const MOBILE_QUERY = '(max-width: 639px)';

function isSmallScreen(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches;
}

export default function SupportChatWidget() {
  const router = useRouter();
  const { isOpen, view, setView, openChat, conversation, workspaceConfigured, setIsOpen } = useSupportChat();
  const { isTrialing } = useSubscription();
  const help = useHelpCenter(isOpen);
  const [draft, setDraft] = useState('');
  const [focusComposer, setFocusComposer] = useState(false);
  const unreadBadge = conversation?.unreadByVisitorCount ?? 0;

  const whatsappLinkFor = useCallback((topic: string | null) => {
    if (!isTrialing) return null;
    const message = topic
      ? `Olá! Estou no teste grátis do Synq. Li o artigo "${topic}", mas ainda preciso de ajuda.`
      : 'Olá! Estou no teste grátis do Synq e preciso de ajuda.';
    return whatsappHref(message);
  }, [isTrialing]);

  const handleViewChange = (nextView: SupportChatView) => {
    setFocusComposer(false);
    setView(nextView);
  };

  const handleTalkToSupport = (context: string | null) => {
    if (context && !draft.trim()) {
      setDraft(context);
    }
    setFocusComposer(true);
    openChat();
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isSmallScreen()) {
      setIsOpen(false);
    }
  };

  const tabOptions: { value: SupportChatView; label: string }[] = [
    { value: 'help', label: 'Ajuda' },
    { value: 'chat', label: unreadBadge > 0 && view !== 'chat' ? `Conversa (${unreadBadge > 9 ? '9+' : unreadBadge})` : 'Conversa' },
  ];

  return (<>
    {!isOpen && (<div className="fixed bottom-6 right-6 z-40">
      <button type="button" onClick={() => setIsOpen(true)} aria-label="Abrir ajuda e suporte" title="Ajuda e suporte" className="relative flex h-13 w-13 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 dark:shadow-none">
        <MessageCircle size={22}/>
        {unreadBadge > 0 && (<span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-center text-xs font-bold text-white ring-2 ring-white dark:ring-slate-900">
          {unreadBadge > 9 ? '9+' : unreadBadge}
        </span>)}
      </button>
    </div>)}

    {isOpen && (<div role="dialog" aria-label="Ajuda e suporte" className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white dark:bg-slate-800 sm:inset-auto sm:bottom-0 sm:right-6 sm:h-140 sm:w-105 sm:rounded-t-lg sm:border sm:border-b-0 sm:border-slate-200 sm:shadow-xl sm:dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 bg-indigo-600 px-4 py-3 text-white dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <LifeBuoy size={18}/>
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">Ajuda do Synq</h3>
            <p className="truncate text-xs text-indigo-100 dark:text-slate-400">
              {view === 'help' ? 'Respostas na hora para as dúvidas mais comuns' : 'Fale com uma pessoa da nossa equipe'}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar ajuda" className="rounded-lg p-1.5 text-indigo-100 transition-colors hover:bg-white/10 hover:text-white dark:text-slate-400">
          <X size={18}/>
        </button>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        <SegmentedControl
          options={tabOptions}
          value={view}
          onChange={handleViewChange}
          ariaLabel="Escolha entre artigos de ajuda e conversa com a equipe"
        />
      </div>

      {view === 'help' ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <HelpPanel
            pathname={help.pathname}
            query={help.query}
            onQueryChange={help.setQuery}
            results={help.results}
            suggestions={help.suggestions}
            groups={help.groups}
            activeArticle={help.activeArticle}
            onOpenArticle={help.openArticle}
            onCloseArticle={help.closeArticle}
            onNavigate={handleNavigate}
            onTalkToSupport={handleTalkToSupport}
            whatsappLinkFor={whatsappLinkFor}
            chatAvailable={workspaceConfigured}
          />
        </div>
      ) : (
        <SupportConversation
          draft={draft}
          onDraftChange={setDraft}
          focusOnMount={focusComposer}
          whatsappLink={whatsappLinkFor(null)}
          onOpenHelp={() => handleViewChange('help')}
        />
      )}
    </div>)}
  </>);
}
