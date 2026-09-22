'use client';
import { FlaskConical, Plus, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import Input from '@/components/Input';
import SectionHeader from '@/components/SectionHeader';
import Select from '@/components/Select';
import { SkeletonForm } from '@/components/Skeleton';
import Textarea from '@/components/Textarea';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleRow from '@/components/ToggleRow';
import { guardrailsService } from '@/services/guardrails.service';
import type {
  AiGuardrails,
  GuardrailPreview,
  GuardrailSuggestions,
  GuardrailViolationAction,
  UpdateGuardrailsPayload,
} from '@/types/Guardrails';

type TermField = 'handoffKeywords' | 'forbiddenPhrases' | 'blockedTopics';

/** Lista de termos editável: chips removíveis, campo de adicionar e sugestões. */
function TermList({
  terms,
  suggestions,
  placeholder,
  disabled,
  onChange,
}: {
  terms: string[];
  suggestions?: string[];
  placeholder: string;
  disabled: boolean;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (value: string) => {
    const term = value.trim();
    // Comparação sem caixa: cadastrar "Procon" tendo "procon" criaria duas
    // regras idênticas que o usuário veria como uma só.
    if (!term || terms.some((existing) => existing.toLowerCase() === term.toLowerCase())) return;
    onChange([...terms, term]);
    setDraft('');
  };

  const unused = (suggestions ?? []).filter(
    (item) => !terms.some((existing) => existing.toLowerCase() === item.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      {terms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {terms.map((term) => (
            <span
              key={term}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200"
            >
              {term}
              <button
                type="button"
                aria-label={`Remover ${term}`}
                disabled={disabled}
                onClick={() => onChange(terms.filter((item) => item !== term))}
                className="cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:text-rose-600 disabled:opacity-50 dark:hover:text-rose-400"
              >
                <X size={13}/>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          maxLength={80}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add(draft);
            }
          }}
          wrapperClassName="flex-1"
        />
        <Button size="sm" variant="secondary" icon={<Plus size={14}/>} onClick={() => add(draft)} disabled={disabled || !draft.trim()}>
          Adicionar
        </Button>
      </div>

      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">Sugestões:</span>
          {unused.map((item) => (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => add(item)}
              className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            >
              + {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Limites da IA: o que ela não pode tratar e o que ela não pode dizer.
 *
 * Seção autônoma como a base de conhecimento — as regras valem para o workspace
 * inteiro, não para o perfil ativo, e cada mudança grava na hora.
 */
export default function AIGuardrailsSection() {
  const [guardrails, setGuardrails] = useState<AiGuardrails | null>(null);
  const [suggestions, setSuggestions] = useState<GuardrailSuggestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testInbound, setTestInbound] = useState('');
  const [testOutbound, setTestOutbound] = useState('');
  const [preview, setPreview] = useState<GuardrailPreview | null>(null);
  const [testing, setTesting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async () => {
    try {
      const result = await guardrailsService.get();
      setGuardrails(result.guardrails);
      setSuggestions(result.suggestions);
    } catch {
      addToast('error', 'Não foi possível carregar os limites da IA.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (patch: UpdateGuardrailsPayload, message: string) => {
    setSaving(true);
    const previous = guardrails;
    setGuardrails((current) => (current ? { ...current, ...patch } as AiGuardrails : current));
    try {
      setGuardrails(await guardrailsService.update(patch));
      addToast('success', message);
    } catch (err) {
      setGuardrails(previous);
      addToast('error', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }, [guardrails, addToast]);

  const saveTerms = useCallback((field: TermField, next: string[]) => {
    save({ [field]: next }, 'Lista atualizada.');
  }, [save]);

  const runTest = useCallback(async () => {
    if (!testInbound.trim() && !testOutbound.trim()) return;
    setTesting(true);
    try {
      setPreview(await guardrailsService.preview({
        ...(testInbound.trim() ? { inbound: testInbound.trim() } : {}),
        ...(testOutbound.trim() ? { outbound: testOutbound.trim() } : {}),
      }));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao testar.');
    } finally {
      setTesting(false);
    }
  }, [testInbound, testOutbound, addToast]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse" aria-busy="true"><SkeletonForm fields={3}/></div>
      </Card>
    );
  }

  if (!guardrails) {
    return (
      <Card className="p-4">
        <p className="text-[13px] text-slate-500 dark:text-slate-400">
          Não foi possível carregar os limites da IA. Recarregue a página para tentar de novo.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <ToggleRow
          title="Aplicar limites à IA"
          description="Regras que valem para todos os perfis de IA deste workspace. Desligado, nenhuma verificação é feita."
          checked={guardrails.enabled}
          onChange={(checked) => save({ enabled: checked }, checked ? 'Limites ativados.' : 'Limites desativados.')}
          disabled={saving}
          badge={<ShieldCheck size={13} className="text-emerald-500"/>}
        />
      </Card>

      {guardrails.enabled && (
        <>
          <Card className="p-4">
            <SectionHeader
              title="Assuntos que exigem uma pessoa"
              hint="Se o cliente usar um destes termos, a IA não responde: a conversa vai direto para atendimento humano."
            />
            <TermList
              terms={guardrails.handoffKeywords}
              suggestions={suggestions?.handoffKeywords ?? []}
              placeholder="procon, advogado, processo judicial..."
              disabled={saving}
              onChange={(next) => saveTerms('handoffKeywords', next)}
            />
          </Card>

          <Card className="p-4">
            <SectionHeader
              title="O que a IA não pode dizer"
              hint="Se a resposta que a IA escreveu contiver um destes termos, ela não é enviada."
            />
            <TermList
              terms={guardrails.forbiddenPhrases}
              suggestions={suggestions?.forbiddenPhrases ?? []}
              placeholder="garanto, prometo, desconto especial..."
              disabled={saving}
              onChange={(next) => saveTerms('forbiddenPhrases', next)}
            />

            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700/60">
              <ToggleRow
                title="Bloquear dados sensíveis na resposta"
                description="Impede a IA de escrever CPF, CNPJ ou número de cartão. Telefone e valor não são afetados — o dígito verificador é conferido antes de bloquear."
                checked={guardrails.blockSensitiveData}
                onChange={(checked) => save({ blockSensitiveData: checked }, 'Regra de dados sensíveis atualizada.')}
                disabled={saving}
              />
            </div>

            <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-700/60">
              <Select
                label="Quando uma resposta for barrada"
                options={(['HANDOFF', 'FALLBACK'] as GuardrailViolationAction[]).map((value) => ({
                  value,
                  label: value === 'HANDOFF' ? 'Chamar um atendente' : 'Enviar uma mensagem de contorno',
                  description: value === 'HANDOFF'
                    ? 'A conversa vai para uma pessoa. Mais seguro: a IA não tenta de novo e reincide.'
                    : 'A IA manda um texto fixo seu e a conversa segue com ela.',
                }))}
                value={guardrails.onViolation}
                onChange={(value) => save({ onViolation: value as GuardrailViolationAction }, 'Ação atualizada.')}
                disabled={saving}
              />
              {guardrails.onViolation === 'FALLBACK' && (
                <Textarea
                  label="Mensagem de contorno"
                  rows={2}
                  maxLength={1000}
                  defaultValue={guardrails.fallbackMessage}
                  disabled={saving}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (!value || value === guardrails.fallbackMessage) return;
                    save({ fallbackMessage: value }, 'Mensagem atualizada.');
                  }}
                  hint="Salvo ao clicar fora do campo."
                />
              )}
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader
              title="Assuntos a evitar"
              hint="Entram no prompt como regra. É prevenção, não bloqueio: faz a IA desviar antes de escrever algo que seria barrado."
            />
            <TermList
              terms={guardrails.blockedTopics}
              placeholder="política, religião, orientação médica..."
              disabled={saving}
              onChange={(next) => saveTerms('blockedTopics', next)}
            />
            {guardrails.blockedTopics.length > 0 && (
              <Callout tone="warning" className="mt-3">
                Instrução no prompt é orientação, não garantia — o modelo pode desobedecer.
                O que impede de verdade são as duas listas acima, que rodam em código.
              </Callout>
            )}
          </Card>

          {/* Errar de menos e errar de mais custam caro aqui. Sem poder testar, o
              usuário só descobre qual dos dois está acontecendo em produção. */}
          <Card className="p-4">
            <SectionHeader
              title="Testar"
              hint="Confira o que suas regras bloqueiam, sem envolver a IA nem o cliente."
            />
            <div className="space-y-2.5">
              <Input
                label="Mensagem do cliente"
                placeholder="se não resolverem vou chamar meu advogado"
                value={testInbound}
                maxLength={1000}
                disabled={testing}
                onChange={(event) => setTestInbound(event.target.value)}
              />
              <Input
                label="Resposta que a IA escreveria"
                placeholder="garanto que chega antes de sexta"
                value={testOutbound}
                maxLength={1000}
                disabled={testing}
                onChange={(event) => setTestOutbound(event.target.value)}
              />
              <Button
                onClick={runTest}
                loading={testing}
                loadingText="Testando..."
                disabled={!testInbound.trim() && !testOutbound.trim()}
                icon={<FlaskConical size={16}/>}
              >
                Testar
              </Button>
            </div>

            {preview && (
              <div className="mt-3 space-y-2">
                {testInbound.trim() && (
                  <Callout tone={preview.inbound ? 'warning' : 'success'}>
                    {preview.inbound
                      ? <>A IA <strong>não responderia</strong> — o termo &quot;{preview.inbound.matched}&quot; encaminha direto para um atendente.</>
                      : <>A IA responderia normalmente. Nenhum termo de encaminhamento casou.</>}
                  </Callout>
                )}
                {testOutbound.trim() && (
                  <Callout tone={preview.outbound ? 'warning' : 'success'}>
                    {preview.outbound
                      ? <>
                        Essa resposta seria <strong>barrada</strong>
                        {preview.outbound.reason === 'SENSITIVE_DATA'
                          ? <> por conter {preview.outbound.matched}.</>
                          : <> pelo termo &quot;{preview.outbound.matched}&quot;.</>}
                        {' '}
                        {preview.onViolation === 'FALLBACK' ? 'Sairia a mensagem de contorno.' : 'A conversa iria para um atendente.'}
                      </>
                      : <>Essa resposta passaria sem bloqueio.</>}
                  </Callout>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
