'use client';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

import AISimpleMode from '@/app/(private)/ia/components/AISimpleMode';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { SkeletonForm } from '@/components/Skeleton';
import { ToastContainer } from '@/components/Toast';
import { useAIConfig } from '@/hooks/AIHooks';

interface AiSetupModalProps {
  onClose: () => void;
}

export default function AiSetupModal({ onClose }: AiSetupModalProps) {
  const {
    loading,
    businessName,
    customRules,
    maxCustomRulesChars,
    followUpMinutes,
    followUpMessage,
    channels,
    activeProfileId,
    saving,
    saveSimpleSetup,
    toggleFollowUp,
    toggleChannel,
    toasts,
    removeToast,
  } = useAIConfig();

  return (
    <>
      <Modal isOpen onClose={onClose} title="Conte para a IA sobre seu negócio" size="xl">
        {loading ? (
          <SkeletonForm fields={4} />
        ) : (
          <div className="space-y-4">
            <AISimpleMode
              businessName={businessName}
              customRules={customRules}
              maxCustomRulesChars={maxCustomRulesChars}
              followUpMinutes={followUpMinutes}
              followUpMessage={followUpMessage}
              channels={channels}
              activeProfileId={activeProfileId}
              saving={saving}
              onSave={saveSimpleSetup}
              onToggleFollowUp={toggleFollowUp}
              onToggleChannel={toggleChannel}
            />
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
              <Link
                href="/ia"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              >
                <ExternalLink size={12} /> Abrir a tela completa da Inteligência Artificial
              </Link>
              <Button onClick={onClose} className="justify-center">
                Voltar aos primeiros passos
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
