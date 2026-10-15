'use client';

import Callout from '@/components/Callout';
import Textarea from '@/components/Textarea';
import ToggleRow from '@/components/ToggleRow';
import type { BuyerWelcome } from '@/types/CartRecovery';

import { formatDelay } from './platformGuides';
import { MessageVariablesHint } from './RecoveryStepsEditor';

const MAX_DELAY_MINUTES = 43200;

interface BuyerWelcomeSectionProps {
  value: BuyerWelcome;
  onChange: (value: BuyerWelcome) => void;
}

export default function BuyerWelcomeSection({ value, onChange }: BuyerWelcomeSectionProps) {
  return (
    <div className="space-y-4">
      <ToggleRow
        title="Mandar boas-vindas quando a compra for aprovada"
        description="Quem acabou de comprar recebe uma mensagem sua no WhatsApp ou Instagram. Ótimo para mandar o acesso, tirar dúvidas e já começar a conversa."
        checked={value.enabled}
        onChange={(enabled) => onChange({ ...value, enabled })}
      />

      {value.enabled && (
        <div className="space-y-4">
          <Textarea
            label="Mensagem de boas-vindas"
            value={value.message}
            onChange={(e) => onChange({ ...value, message: e.target.value })}
            rows={4}
            maxLength={4000}
            placeholder="Oi {first_name}! Sua compra foi aprovada..."
          />
          <MessageVariablesHint />

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span>Enviar depois de</span>
            <input
              type="number"
              min={0}
              max={MAX_DELAY_MINUTES}
              value={value.delayMinutes}
              aria-label="Minutos de espera da boas-vindas"
              onChange={(e) => onChange({ ...value, delayMinutes: Math.max(0, Number(e.target.value) || 0) })}
              className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span>minutos</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">({formatDelay(value.delayMinutes)})</span>
          </div>

          <Callout tone="info">
            A boas-vindas sai uma vez por pedido, pelo canal em que o comprador já conversou com você. Quem nunca
            mandou mensagem para você não recebe, para o seu número não correr risco de bloqueio. No WhatsApp Oficial
            e no Instagram, ela só chega se a conversa foi nas últimas 24h.
          </Callout>
        </div>
      )}
    </div>
  );
}
