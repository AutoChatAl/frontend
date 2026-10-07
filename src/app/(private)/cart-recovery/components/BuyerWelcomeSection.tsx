'use client';

import Callout from '@/components/Callout';
import Textarea from '@/components/Textarea';
import ToggleRow from '@/components/ToggleRow';
import type { BuyerWelcome, IntegrationChannelType } from '@/types/CartRecovery';

import { formatDelay } from './platformGuides';
import { MessageVariablesHint } from './RecoveryStepsEditor';

const MAX_DELAY_MINUTES = 43200;

interface BuyerWelcomeSectionProps {
  value: BuyerWelcome;
  onChange: (value: BuyerWelcome) => void;
  channelType: IntegrationChannelType;
}

const CHANNEL_NOTES: Record<IntegrationChannelType, { tone: 'info' | 'warning'; text: string }> = {
  WHATSAPP: {
    tone: 'info',
    text: 'Enviamos para o telefone que o comprador informou na compra.',
  },
  WHATSAPP_OFFICIAL: {
    tone: 'warning',
    text: 'No WhatsApp Oficial, a boas-vindas só chega se o comprador falou com você nas últimas 24h. Se ele não fala com você há mais de 24h, ela não é enviada e o motivo aparece nos detalhes da compra, na aba Carrinhos.',
  },
  INSTAGRAM: {
    tone: 'warning',
    text: 'No Instagram, só conseguimos mandar a boas-vindas para quem já conversou com sua conta. Para quem nunca falou com você, ela não é enviada e o motivo aparece nos detalhes da compra, na aba Carrinhos.',
  },
};

export default function BuyerWelcomeSection({ value, onChange, channelType }: BuyerWelcomeSectionProps) {
  const note = CHANNEL_NOTES[channelType];

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

          <Callout tone={note.tone}>{note.text}</Callout>
          <Callout tone="info">
            Cada pedido recebe uma única boas-vindas, mesmo que a plataforma avise a aprovação mais de uma vez. Se a plataforma não mandar o telefone do comprador, não enviamos.
          </Callout>
        </div>
      )}
    </div>
  );
}
