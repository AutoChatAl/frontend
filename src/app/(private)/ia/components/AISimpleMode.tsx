'use client';
import { Building2, CheckCircle2, Clock, Link2, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { completeSetupStep } from '@/app/get-started/setupSteps';
import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import Input from '@/components/Input';
import SectionHeader from '@/components/SectionHeader';
import SegmentedControl from '@/components/SegmentedControl';
import Textarea from '@/components/Textarea';
import ToggleSwitch from '@/components/ToggleSwitch';
import { AI_FOLLOW_UP_OPTIONS, DEFAULT_AI_FOLLOW_UP_MESSAGE, type AIChannel, type AiPriceSource, type AiSimpleSetupAnswers } from '@/types/AI';

import { composeCustomRules, hasSimpleAnswers, isValidPriceLink, parseCustomRules } from '../simpleSetup';
import AIChannelsList from './AIChannelsList';
import AISimulator from './AISimulator';

interface AISimpleModeProps {
    businessName: string;
    customRules: string;
    maxCustomRulesChars: number;
    followUpMinutes: number;
    followUpMessage: string;
    channels: AIChannel[];
    activeProfileId: string | null;
    profileName?: string;
    saving: boolean;
    onSave: (data: { businessName: string; customRules: string }) => Promise<boolean>;
    onToggleFollowUp: (enabled: boolean) => Promise<void>;
    onToggleChannel: (id: string) => Promise<void>;
}

const PRICE_SOURCE_OPTIONS: ReadonlyArray<{ value: AiPriceSource; label: string }> = [
  { value: 'link', label: 'Num link (site ou catálogo)' },
  { value: 'list', label: 'Numa lista que eu escrevo' },
];

const ABOUT_MAX_CHARS = 600;
const HOURS_MAX_CHARS = 200;
const PRICE_LINK_MAX_CHARS = 300;
const PRICE_LIST_MAX_CHARS = 1500;

function markAiTested(): void {
  void completeSetupStep('ai-test');
}

function sameAnswers(a: AiSimpleSetupAnswers, b: AiSimpleSetupAnswers): boolean {
  return a.about === b.about
    && a.hours === b.hours
    && a.priceSource === b.priceSource
    && a.priceLink === b.priceLink
    && a.priceList === b.priceList;
}

export default function AISimpleMode({ businessName, customRules, maxCustomRulesChars, followUpMinutes, followUpMessage, channels, activeProfileId, profileName, saving, onSave, onToggleFollowUp, onToggleChannel }: AISimpleModeProps) {
  const saved = useMemo(() => parseCustomRules(customRules), [customRules]);
  const [answers, setAnswers] = useState<AiSimpleSetupAnswers>(saved.answers);
  const [name, setName] = useState(businessName);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAnswers(saved.answers);
  }, [saved]);

  useEffect(() => {
    setName(businessName);
  }, [businessName]);

  const update = <K extends keyof AiSimpleSetupAnswers>(key: K, value: AiSimpleSetupAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const composed = composeCustomRules(answers, saved.otherRules);
  const overLimit = maxCustomRulesChars > 0 && composed.length > maxCustomRulesChars;
  const linkInvalid = answers.priceSource === 'link' && !isValidPriceLink(answers.priceLink);
  const dirty = !sameAnswers(answers, saved.answers) || name.trim() !== businessName.trim();
  const answeredSaved = hasSimpleAnswers(saved.answers) || !!businessName.trim();
  const activeChannels = channels.filter((channel) => channel.active).length;
  const followUpOn = followUpMinutes > 0;
  const followUpLabel = AI_FOLLOW_UP_OPTIONS.find((option) => option.value === followUpMinutes)?.label ?? `${followUpMinutes} minutos`;

  const handleSave = async () => {
    setSubmitted(true);
    if (linkInvalid || overLimit) {
      return;
    }
    const ok = await onSave({ businessName: name.trim(), customRules: composed });
    if (ok) {
      setSubmitted(false);
    }
  };

  return (
    <div className="space-y-3">
      {profileName && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Você está configurando o perfil <span className="font-semibold text-slate-700 dark:text-slate-200">{profileName}</span>. Para trocar de perfil, use as configurações avançadas.
        </p>
      )}
      {!answeredSaved && (
        <Callout tone="info">
          Responda as 3 perguntas abaixo, ligue a IA no seu WhatsApp ou Instagram e faça um teste. Leva menos de 2 minutos.
        </Callout>
      )}
      {answeredSaved && activeChannels === 0 && (
        <Callout tone="warning">
          Falta pouco: ligue a IA em pelo menos uma conexão para ela começar a responder seus clientes.
        </Callout>
      )}
      {answeredSaved && activeChannels > 0 && (
        <Callout tone="success">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0"/>
            {activeChannels === 1
              ? 'Sua IA está pronta e já responde sozinha em 1 conexão.'
              : `Sua IA está pronta e já responde sozinha em ${activeChannels} conexões.`}
          </span>
        </Callout>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:items-start">
        <div className="min-w-0 space-y-3">
          <Card className="p-4">
            <SectionHeader
              title="Conte para a IA sobre o seu negócio"
              hint="Com essas respostas a IA já consegue atender. Você pode mudar quando quiser."
            />
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">1. O que você vende ou faz?</p>
                <Input
                  label="Nome do negócio"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  leftIcon={<Building2 size={16}/>}
                  placeholder="Ex.: Studio Bella"
                  maxLength={120}
                />
                <Textarea
                  label="Sobre o negócio"
                  rows={3}
                  value={answers.about}
                  maxLength={ABOUT_MAX_CHARS}
                  onChange={(event) => update('about', event.target.value)}
                  placeholder="Ex.: Vendemos roupas femininas pela internet, com entrega para todo o Brasil. Trocas em até 7 dias."
                  hint="Escreva como você explicaria para um cliente novo."
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">2. Qual é o seu horário de atendimento?</p>
                <Input
                  aria-label="Horário de atendimento"
                  value={answers.hours}
                  maxLength={HOURS_MAX_CHARS}
                  onChange={(event) => update('hours', event.target.value)}
                  leftIcon={<Clock size={16}/>}
                  placeholder="Ex.: Segunda a sexta, das 9h às 18h. Sábado até 12h."
                  hint="A IA usa essa informação quando o cliente perguntar se vocês estão abertos."
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">3. Onde o cliente vê os preços?</p>
                <SegmentedControl
                  ariaLabel="Onde o cliente vê os preços"
                  options={PRICE_SOURCE_OPTIONS}
                  value={answers.priceSource}
                  onChange={(value) => update('priceSource', value)}
                />
                {answers.priceSource === 'link' ? (
                  <Input
                    aria-label="Link com os preços"
                    value={answers.priceLink}
                    maxLength={PRICE_LINK_MAX_CHARS}
                    onChange={(event) => update('priceLink', event.target.value)}
                    leftIcon={<Link2 size={16}/>}
                    placeholder="Ex.: minhaloja.com.br/produtos"
                    hint="A IA manda este link quando alguém perguntar preço."
                    {...(submitted && linkInvalid ? { error: 'Confira o link. Ele deve ser um endereço de site, como minhaloja.com.br.' } : {})}
                  />
                ) : (
                  <Textarea
                    aria-label="Lista de preços"
                    rows={4}
                    value={answers.priceList}
                    maxLength={PRICE_LIST_MAX_CHARS}
                    onChange={(event) => update('priceList', event.target.value)}
                    placeholder={'Ex.:\nCorte masculino – R$ 40\nBarba – R$ 30\nCurso completo – R$ 497 ou 12x de R$ 49,70'}
                    hint="Um item por linha. A IA só informa os valores que estiverem aqui ou no catálogo."
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
              <p className={`text-xs ${overLimit ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                {overLimit
                  ? `As respostas passaram do limite de ${maxCustomRulesChars.toLocaleString('pt-BR')} letras do seu plano. Encurte o texto para salvar.`
                  : dirty ? 'Salve as respostas para a IA usar no atendimento e no teste.' : 'Tudo salvo.'}
              </p>
              <Button
                onClick={() => { void handleSave(); }}
                loading={saving}
                loadingText="Salvando..."
                disabled={!dirty || overLimit}
                icon={<Save size={16}/>}
                className="w-full justify-center sm:w-auto"
              >
                Salvar respostas
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader
              title="Retomar conversa parada"
              hint={followUpOn
                ? `Se o cliente parar de responder, a IA manda esta mensagem depois de ${followUpLabel.toLowerCase()}. Só uma vez por conversa parada.`
                : 'Se o cliente parar de responder, a IA manda uma mensagem curta para puxar o assunto de volta.'}
              action={
                <ToggleSwitch
                  checked={followUpOn}
                  disabled={saving}
                  onChange={(checked) => { void onToggleFollowUp(checked); }}
                  ariaLabel="Retomar conversa parada"
                />
              }
            />
            {followUpOn && (
              <p className="whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {followUpMessage.trim() || DEFAULT_AI_FOLLOW_UP_MESSAGE}
              </p>
            )}
          </Card>

          <div data-tour="ia-channels">
            <AIChannelsList channels={channels} onToggle={onToggleChannel} activeProfileId={activeProfileId}/>
          </div>
        </div>

        <div className="min-w-0 xl:sticky xl:top-4">
          <AISimulator {...(activeProfileId ? { profileId: activeProfileId } : {})} onReply={markAiTested}/>
        </div>
      </div>
    </div>
  );
}
