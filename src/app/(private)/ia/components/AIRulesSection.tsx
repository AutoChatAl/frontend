'use client';

import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AI_FOLLOW_UP_MESSAGE_MAX_CHARS, AI_FOLLOW_UP_OPTIONS, DEFAULT_AI_FOLLOW_UP_MESSAGE } from '@/types/AI';

interface AIRulesSectionProps {
    customRules: string;
    followUpMinutes: number;
    followUpMessage: string;
    onCustomRulesChange: (value: string) => void;
    onFollowUpMinutesChange: (value: number) => void;
    onFollowUpMessageChange: (value: string) => void;
    /** Limite vindo do GET /config. Tem prioridade sobre o da assinatura, que pode estar em cache. */
    maxChars?: number;
}
export default function AIRulesSection({ customRules, followUpMinutes, followUpMessage, onCustomRulesChange, onFollowUpMinutesChange, onFollowUpMessageChange, maxChars: maxCharsProp }: AIRulesSectionProps) {
  const { status } = useSubscription();
  const maxChars = maxCharsProp && maxCharsProp > 0 ? maxCharsProp : (status?.limits?.maxCustomRulesChars ?? 0);
  const overLimit = maxChars > 0 && customRules.length > maxChars;
  const remaining = maxChars - customRules.length;
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <SectionHeader
          title="Retomar conversa parada"
          hint="Se o cliente sumir depois da última resposta da IA, ela manda uma mensagem curta puxando o assunto de volta."
        />
        <Select
          label="Mandar a mensagem depois de"
          value={String(followUpMinutes)}
          onChange={(value) => onFollowUpMinutesChange(Number(value))}
          options={AI_FOLLOW_UP_OPTIONS.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
          hint="Só uma mensagem por silêncio, com trava de 2h antes da próxima. Nunca em conversa que já foi para atendimento humano, que terminou com agendamento fechado ou com despedida do cliente. No Instagram e no WhatsApp Oficial, se o cliente não fala com você há mais de 24h, só dá para chamar de novo com um modelo aprovado. Por isso, nesses canais, a mensagem não é enviada quando o prazo escolhido passa de 24h."
        />

        {followUpMinutes > 0 && (
          <div className="mt-3">
            <Textarea
              label="Mensagem enviada"
              rows={3}
              maxLength={AI_FOLLOW_UP_MESSAGE_MAX_CHARS}
              value={followUpMessage}
              onChange={(e) => onFollowUpMessageChange(e.target.value)}
              placeholder={DEFAULT_AI_FOLLOW_UP_MESSAGE}
              hint="Texto fixo, enviado como está — não passa pela IA e não consome créditos de IA. Em branco, usa o texto do exemplo."
            />
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionHeader
          title="Prompt de treinamento"
          hint="Uma regra por linha. Entram no prompt exatamente como você escrever, então seja direto."
        />
        <Textarea
          rows={7}
          value={customRules}
          onChange={(e) => onCustomRulesChange(e.target.value)}
          {...(overLimit ? { error: `Passou do limite de ${maxChars.toLocaleString('pt-BR')} caracteres do seu plano — corte o texto antes de salvar.` } : {})}
          placeholder={'Sempre responda em português.\nNão ofereça descontos sem aprovação.\nEncaminhe reclamações para o suporte humano.'}
        />
        {maxChars > 0 && (
          <p className={`mt-1.5 text-right text-[11px] tabular-nums ${
            overLimit
              ? 'text-red-500'
              : remaining <= maxChars * 0.1
                ? 'text-amber-500'
                : 'text-slate-400 dark:text-slate-500'
          }`}>
            {customRules.length.toLocaleString('pt-BR')} / {maxChars.toLocaleString('pt-BR')}
          </p>
        )}
      </Card>
    </div>
  );
}
