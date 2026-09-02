'use client';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import type { FlowNode } from '@/types/Flow';

import { BRANCH_LABELS, DELAY_OPTIONS, KEYWORDS_MAX, NATIVE_CHOICES_MAX, RANDOM_BRANCHES_MAX, balancedWeights, blockMeta } from './blocks';

interface NodeInspectorProps {
  node: FlowNode;
  onChange: (patch: Partial<FlowNode>) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Teto de opções: é o limite de quick replies adotado para o Instagram. */
const CHOICES_MAX = 5;
/**
 * Título de botão tem teto de 20 caracteres nos dois canais. Passar disso faria
 * o botão chegar cortado, e a resposta do contato voltaria diferente do texto
 * salvo — o motor não reconheceria a escolha.
 */
const CHOICE_LABEL_MAX = 20;

export default function NodeInspector({ node, onChange, onRemove, onClose }: NodeInspectorProps) {
  const meta = blockMeta(node.kind);
  const choices = node.choices ?? [];
  const keywords = node.keywords ?? [];
  const weights = node.randomWeights ?? [];

  const updateKeyword = (index: number, value: string) => {
    const next = [...keywords];
    next[index] = value;
    onChange({ keywords: next });
  };
  const weightsTotal = weights.reduce((sum, weight) => sum + weight, 0);

  const updateWeight = (index: number, value: number) => {
    const next = [...weights];
    next[index] = Math.max(0, Math.min(100, value));
    onChange({ randomWeights: next });
  };

  const updateChoice = (index: number, value: string) => {
    const next = [...choices];
    next[index] = value;
    onChange({ choices: next });
  };

  // Sem botão no canal acima do teto: a opção fica travada e o envio vai em texto.
  const nativeChoicesAllowed = choices.length <= NATIVE_CHOICES_MAX;
  const sendsNativeChoices = nativeChoicesAllowed && node.choicesAsButtons !== false;

  const removeChoice = (index: number) => {
    // Remover uma opção derruba a saída dela; a ligação órfã é limpa na página.
    onChange({ choices: choices.filter((_, i) => i !== index) });
  };

  return (
    <aside className="w-72 shrink-0 space-y-4 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${meta.tint}`}>{meta.label}</p>
          <p className="mt-1 text-[12px] text-slate-400 dark:text-slate-500">{meta.hint}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-lg px-2 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      <Input
        label="Nome do bloco"
        value={node.label}
        onChange={(event) => onChange({ label: event.target.value })}
        maxLength={80}
      />

      {(node.kind === 'trigger' || node.kind === 'condition') && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {node.kind === 'trigger' ? 'Palavras que iniciam' : 'Palavras procuradas'}
          </p>

          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                wrapperClassName="flex-1"
                value={keyword}
                onChange={(event) => updateKeyword(index, event.target.value)}
                placeholder={node.kind === 'trigger' ? 'orçamento' : 'sim'}
                maxLength={200}
              />
              {keywords.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange({ keywords: keywords.filter((_, i) => i !== index) })}
                  className="cursor-pointer rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700"
                >
                  Remover
                </button>
              )}
            </div>
          ))}

          {keywords.length < KEYWORDS_MAX && (
            <button
              type="button"
              onClick={() => onChange({ keywords: [...keywords, ''] })}
              className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400"
            >
              Adicionar palavra
            </button>
          )}

          <Select
            label="A mensagem precisa"
            value={node.matchMode ?? 'CONTAINS'}
            onChange={(value) => onChange({ matchMode: value as NonNullable<FlowNode['matchMode']> })}
            options={[
              { value: 'CONTAINS', label: 'Conter a palavra' },
              { value: 'EXACT', label: 'Ser exatamente a palavra' },
              { value: 'STARTS_WITH', label: 'Começar com a palavra' },
            ]}
          />

          {keywords.length > 1 && (
            <Select
              label="Com várias palavras"
              value={node.keywordLogic ?? 'ANY'}
              onChange={(value) => onChange({ keywordLogic: value as NonNullable<FlowNode['keywordLogic']> })}
              options={[
                { value: 'ANY', label: 'Basta uma bater' },
                { value: 'ALL', label: 'Todas precisam aparecer' },
              ]}
            />
          )}

          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={node.caseSensitive ?? false}
              onChange={(event) => onChange({ caseSensitive: event.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-slate-600"
            />
            Diferenciar maiúsculas de minúsculas
          </label>
        </div>
      )}

      {node.kind === 'link' && (
        <>
          <Textarea
            label="Mensagem do card"
            rows={3}
            maxLength={4000}
            value={node.text ?? ''}
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder="O que aparece acima do botão"
          />
          <Input
            label="Nome do botão"
            value={node.buttonLabel ?? ''}
            onChange={(event) => onChange({ buttonLabel: event.target.value })}
            placeholder="Abrir"
            maxLength={CHOICE_LABEL_MAX}
            hint="Mesmo limite dos botões de resposta."
          />
          <Input
            label="Link"
            type="url"
            value={node.linkUrl ?? ''}
            onChange={(event) => onChange({ linkUrl: event.target.value })}
            placeholder="https://sualoja.com/produto"
            hint="O link é encurtado e o clique aparece no relatório."
          />
        </>
      )}

      {(node.kind === 'message' || node.kind === 'question') && (
        <Textarea
          label="Mensagem"
          rows={4}
          maxLength={4000}
          value={node.text ?? ''}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder="O que a Synq envia neste ponto"
        />
      )}

      {(node.kind === 'question' || node.kind === 'wait_reply') && (
        <Select
          label="Se não responder em"
          value={String(node.replyTimeoutMinutes ?? 0)}
          // Zero significa "sem prazo": todas as camadas testam por valor
          // falsy, então não é preciso remover a chave para desligar.
          onChange={(value) => onChange({ replyTimeoutMinutes: Number(value) })}
          options={[
            { value: '0', label: 'Esperar sem prazo' },
            ...DELAY_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            })),
          ]}
          hint="Com prazo, o bloco ganha a saída “Não respondeu”."
        />
      )}

      {node.kind === 'question' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Opções de resposta</p>
          {choices.map((choice, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                wrapperClassName="flex-1"
                value={choice}
                onChange={(event) => updateChoice(index, event.target.value)}
                maxLength={CHOICE_LABEL_MAX}
              />
              <button
                type="button"
                onClick={() => removeChoice(index)}
                className="cursor-pointer rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700"
              >
                Remover
              </button>
            </div>
          ))}
          {choices.length < CHOICES_MAX && (
            <button
              type="button"
              onClick={() => {
                const next = [...choices, `Opção ${choices.length + 1}`];
                onChange({
                  choices: next,
                  // Passar do teto tira o botão do canal: desliga junto para o
                  // card não ficar prometendo um formato que não existe.
                  ...(next.length > NATIVE_CHOICES_MAX ? { choicesAsButtons: false } : {}),
                });
              }}
              className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400"
            >
              Adicionar opção
            </button>
          )}
          <label
            className={`flex items-center gap-2 text-[13px] ${
              nativeChoicesAllowed
                ? 'cursor-pointer text-slate-600 dark:text-slate-400'
                : 'cursor-not-allowed text-slate-400 dark:text-slate-500'
            }`}
          >
            <input
              type="checkbox"
              disabled={!nativeChoicesAllowed}
              checked={sendsNativeChoices}
              onChange={(event) => onChange({ choicesAsButtons: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600"
            />
            Enviar opções como botão
          </label>
          <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            {nativeChoicesAllowed
              ? sendsNativeChoices
                ? 'As opções chegam como botões de resposta rápida do canal.'
                : 'As opções chegam numeradas no texto da mensagem.'
              : `Acima de ${NATIVE_CHOICES_MAX} opções o WhatsApp não tem botão, então a lista vai numerada no texto.`}
            {' '}Cada opção vira uma saída do bloco. Máximo de {CHOICE_LABEL_MAX} caracteres
            por opção, que é o limite do botão nos dois canais. O contato pode responder
            tocando no botão, escrevendo o nome da opção ou o número dela.
          </p>
        </div>
      )}

      {node.kind === 'delay' && (
        <Select
          label="Esperar"
          value={String(node.delayMinutes ?? 60)}
          onChange={(value) => onChange({ delayMinutes: Number(value) })}
          options={DELAY_OPTIONS.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
          hint="O fluxo continua sozinho quando o tempo acabar."
        />
      )}

      {(node.kind === 'tag' || node.kind === 'untag' || node.kind === 'has_tag') && (
        <Input
          label="Etiqueta"
          value={node.tagName ?? ''}
          onChange={(event) => onChange({ tagName: event.target.value })}
          placeholder="lead-quente"
          maxLength={60}
          hint={
            node.kind === 'tag'
              ? 'Criada automaticamente se ainda não existir.'
              : node.kind === 'untag'
                ? 'Se o contato não tiver a etiqueta, o bloco só segue adiante.'
                : 'Separa quem tem a etiqueta de quem não tem.'
          }
        />
      )}

      {node.kind === 'randomizer' && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Divisão do tráfego</p>
          {weights.map((weight, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-4 shrink-0 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                {BRANCH_LABELS[index] ?? index + 1}
              </span>
              <Input
                wrapperClassName="flex-1"
                type="number"
                min={0}
                max={100}
                value={weight}
                onChange={(event) => updateWeight(index, Number(event.target.value))}
              />
              <span className="text-[13px] text-slate-400">%</span>
            </div>
          ))}

          <div className="flex gap-2">
            {weights.length < RANDOM_BRANCHES_MAX && (
              <button
                type="button"
                onClick={() => onChange({ randomWeights: balancedWeights(weights.length + 1) })}
                className="flex-1 cursor-pointer rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400"
              >
                Adicionar caminho
              </button>
            )}
            {weights.length > 2 && (
              <button
                type="button"
                onClick={() => onChange({ randomWeights: balancedWeights(weights.length - 1) })}
                className="flex-1 cursor-pointer rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 transition-colors hover:text-red-600 dark:border-slate-700 dark:text-slate-400"
              >
                Remover caminho
              </button>
            )}
          </div>

          <p className={`text-xs ${weightsTotal === 100 ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400'}`}>
            {weightsTotal === 100
              ? 'Cada contato entra em um caminho, sorteado por esses pesos.'
              : `A soma está em ${weightsTotal}%. Ajuste para fechar 100%.`}
          </p>
        </div>
      )}

      {node.kind === 'handoff' && (
        <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
          A conversa sai da automação e fica aguardando um atendente na caixa de entrada.
        </p>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="w-full cursor-pointer rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        Excluir bloco
      </button>
    </aside>
  );
}
