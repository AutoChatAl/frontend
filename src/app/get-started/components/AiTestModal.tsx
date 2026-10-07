'use client';
import { useCallback, useState } from 'react';

import AISimulator from '@/app/(private)/ia/components/AISimulator';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

interface AiTestModalProps {
  onClose: () => void;
  onReplied: () => void;
}

export default function AiTestModal({ onClose, onReplied }: AiTestModalProps) {
  const [replied, setReplied] = useState(false);

  const handleReply = useCallback(() => {
    setReplied(true);
    onReplied();
  }, [onReplied]);

  return (
    <Modal isOpen onClose={onClose} title="Teste a IA agora" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Faça de conta que você é um cliente e mande uma pergunta. A IA responde do jeito que vai responder no seu WhatsApp ou Instagram.
        </p>
        <AISimulator onReply={handleReply} />
        <div className="flex justify-end">
          <Button onClick={onClose} variant={replied ? 'primary' : 'secondary'} className="w-full justify-center sm:w-auto">
            {replied ? 'Terminei o teste' : 'Fechar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
