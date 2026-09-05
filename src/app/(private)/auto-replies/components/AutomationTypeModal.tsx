'use client';
import { ArrowRight } from 'lucide-react';

import Modal from '@/components/Modal';

import { KIND_META, type AutomationKind } from './automationMeta';

interface AutomationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPick: (kind: AutomationKind) => void;
}

const OPTIONS: { kind: AutomationKind; description: string }[] = [
  { kind: 'DM', description: 'Responde quando alguém manda uma palavra-chave no WhatsApp ou no Instagram.' },
  { kind: 'COMMENT', description: 'Responde o comentário no post do Instagram e ainda manda um DM para quem comentou.' },
  { kind: 'LIVE', description: 'Durante a transmissão ao vivo, responde no chat e manda um DM para quem comentou.' },
];

/** Um passo antes do formulário: cada tipo abre o modal que já existia. */
export default function AutomationTypeModal({ isOpen, onClose, onPick }: AutomationTypeModalProps) {
  return (
    // `lg` em vez de `md`: com três opções, `max-w-2xl` deixaria cada card com ~200px
    // e o texto quebraria demais.
    <Modal isOpen={isOpen} onClose={onClose} title="Nova automação" size="lg">
      {/* Os três lado a lado a partir de md. Abaixo disso não cabem sem espremer o
          texto, então empilham — é o único ponto em que a linha se quebra. */}
      <div className="grid gap-3 md:grid-cols-3">
        {OPTIONS.map((option) => {
          const meta = KIND_META[option.kind];
          const Icon = meta.icon;
          return (
            <button
              key={option.kind}
              type="button"
              onClick={() => onPick(option.kind)}
              className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 ${meta.tile}`}>
                <Icon size={18} />
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{meta.label}</span>
              <span className="text-[13px] leading-snug text-slate-500 dark:text-slate-400">{option.description}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                Configurar
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
