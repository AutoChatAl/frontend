'use client';
import { Lock } from 'lucide-react';
import Link from 'next/link';

import Input from '@/components/Input';
import Select from '@/components/Select';
import Textarea from '@/components/Textarea';
import type { Member } from '@/services/collaborator.service';
import {
  FLOW_AI_MODES,
  FLOW_ATTENDANCE_STATUSES,
  FLOW_MEDIA_KINDS,
  type FlowAiMode,
  type FlowAttendanceStatus,
  type FlowMediaKind,
  type FlowNode,
} from '@/types/Flow';
import type { FunnelStageDefinition } from '@/types/Funnel';

import { AI_INTENTS_MAX, AI_INTENT_LABEL_MAX, AI_MODE_LABEL, ATTENDANCE_LABEL, BRANCH_LABELS, CATCH_ALL_DEFAULT_COOLDOWN, COOLDOWN_OPTIONS, DELAY_OPTIONS, KEYWORDS_MAX, MEDIA_KIND_LABEL, NATIVE_CHOICES_MAX, RANDOM_BRANCHES_MAX, balancedWeights, blockMeta } from './blocks';

interface NodeInspectorProps {
  node: FlowNode;
  /** Etapas e equipe do workspace: alimentam os blocos de funil e de atribuição. */
  stages: FunnelStageDefinition[];
  members: Member[];
  /** Falso tranca a edição do bloco que depende do plano de IA. */
  hasAiPlan: boolean;
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
/** Mesmo teto do schema: o WhatsApp corta o nome do anexo bem antes disso. */
const FILE_NAME_MAX = 120;

export default function NodeInspector({ node, stages, members, hasAiPlan, onChange, onRemove, onClose }: NodeInspectorProps) {
  const meta = blockMeta(node.kind);
  const choices = node.choices ?? [];
  const intents = node.aiIntents ?? [];
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

  /** Blocos que separam mensagens por palavra — o gatilho, a condição e o story. */
  const matchesByKeyword = node.kind === 'trigger'
    || node.kind === 'condition'
    || node.kind === 'story_reply';
  /** No story a lista é um filtro a mais, e o bloco funciona sem nenhuma palavra. */
  const keywordsAreOptional = node.kind === 'story_reply';

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

      {node.kind === 'story_reply' && (
        <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
          Vale para os stories do Instagram: o fluxo começa quando o contato manda um
          emoji ou escreve respondendo a um story seu. Sem filtro abaixo, qualquer
          reação entra.
        </p>
      )}

      {matchesByKeyword && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {node.kind === 'trigger'
              ? 'Palavras que iniciam'
              : node.kind === 'story_reply'
                ? 'Só estas reações (opcional)'
                : 'Palavras procuradas'}
          </p>

          {keywords.map((keyword, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                wrapperClassName="flex-1"
                value={keyword}
                onChange={(event) => updateKeyword(index, event.target.value)}
                placeholder={
                  node.kind === 'trigger' ? 'orçamento' : node.kind === 'story_reply' ? '❤️' : 'sim'
                }
                maxLength={200}
              />
              {/* O filtro do story é opcional, então lá dá para zerar a lista. */}
              {(keywords.length > 1 || keywordsAreOptional) && (
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
              {node.kind === 'story_reply' ? 'Adicionar emoji ou palavra' : 'Adicionar palavra'}
            </button>
          )}

          {/* Sem nenhum filtro não há o que casar: as opções abaixo não teriam efeito. */}
          {keywords.length > 0 && (
            <>
              <Select
                label={node.kind === 'story_reply' ? 'A reação precisa' : 'A mensagem precisa'}
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
            </>
          )}
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

      {node.kind === 'welcome' && (
        <>
          <Textarea
            label="Mensagem de boas-vindas"
            rows={4}
            maxLength={4000}
            value={node.text ?? ''}
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder="Oi! Que bom ter você por aqui 👋"
          />
          <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
            Enviada assim que o contato fala pela primeira vez em um dos canais do fluxo,
            não importa o que ele escreva. Cada contato recebe uma única vez, e a partir da
            segunda mensagem valem os gatilhos por palavra.
          </p>
        </>
      )}

      {(node.kind === 'media' || node.kind === 'document') && (
        <>
          {node.kind === 'media' && (
            <Select
              label="Formato"
              value={node.mediaKind ?? 'image'}
              onChange={(value) => onChange({ mediaKind: value as FlowMediaKind })}
              options={FLOW_MEDIA_KINDS.map((kind) => ({ value: kind, label: MEDIA_KIND_LABEL[kind] }))}
            />
          )}

          <Input
            label="Link do arquivo"
            type="url"
            value={node.mediaUrl ?? ''}
            onChange={(event) => onChange({ mediaUrl: event.target.value })}
            placeholder={
              node.kind === 'document' ? 'https://sualoja.com/catalogo.pdf' : 'https://sualoja.com/foto.jpg'
            }
            hint="O endereço precisa ser público: é o canal que baixa o arquivo na hora de enviar."
          />

          {node.kind === 'document' && (
            <Input
              label="Nome do arquivo"
              value={node.fileName ?? ''}
              onChange={(event) => onChange({ fileName: event.target.value })}
              placeholder="catalogo.pdf"
              maxLength={FILE_NAME_MAX}
              hint="É o nome que o contato vê no anexo."
            />
          )}
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

      {node.kind === 'catch_all' && (
        <>
          <Select
            label="Com que frequência pode disparar"
            value={String(node.cooldownMinutes || CATCH_ALL_DEFAULT_COOLDOWN)}
            onChange={(value) => onChange({ cooldownMinutes: Number(value) })}
            options={COOLDOWN_OPTIONS.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
            hint="Conta desde a última vez que este fluxo começou para o mesmo contato."
          />
          <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
            É o último recurso do canal: só entra quando nenhum outro gatilho pegou a
            mensagem. Enquanto ele estiver rodando, a auto-resposta e a IA não respondem —
            por isso vale terminar o fluxo passando para a IA ou para um atendente.
          </p>
        </>
      )}

      {node.kind === 'story_mention' && (
        <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
          Vale para o Instagram: começa quando o contato publica um story citando o seu
          perfil. É outro evento, diferente de reagir a um story seu — a menção costuma
          chegar sem texto nenhum, então o gatilho é o evento em si.
        </p>
      )}

      {node.kind === 'business_hours' && (
        <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
          Usa a agenda de atendimento do workspace, a mesma da tela de Agendamentos, no
          fuso configurado. Sem agenda montada, todo mundo sai por “Dentro do horário”.
        </p>
      )}

      {/*
        * O bloco só chega travado num fluxo montado antes de o plano cair. Editar
        * seria montar algo que o servidor recusa ativar, então aqui sobra explicar
        * e deixar excluir o bloco.
        */}
      {node.kind === 'ai' && !hasAiPlan && (
        <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-600">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            <Lock size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
            Requer um plano de IA
          </p>
          <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
            Este bloco usa o modelo de linguagem e só funciona com um plano de IA ativo. Sem
            ele o fluxo não pode ser ativado, e a conversa segue para a auto-resposta ao
            chegar aqui.
          </p>
          <Link
            href="/plans"
            className="inline-flex cursor-pointer rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Ver planos
          </Link>
        </div>
      )}

      {node.kind === 'ai' && hasAiPlan && (
        <>
          <Select
            label="O que a IA faz aqui"
            value={node.aiMode ?? 'answer'}
            onChange={(value) => onChange({ aiMode: value as FlowAiMode })}
            options={FLOW_AI_MODES.map((mode) => ({ value: mode, label: AI_MODE_LABEL[mode] }))}
          />

          {node.aiMode === 'classify' ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Intenções</p>
              {intents.map((intent, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    wrapperClassName="flex-1"
                    value={intent}
                    onChange={(event) => {
                      const next = [...intents];
                      next[index] = event.target.value;
                      onChange({ aiIntents: next });
                    }}
                    placeholder="quer saber o preço"
                    maxLength={AI_INTENT_LABEL_MAX}
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ aiIntents: intents.filter((_, i) => i !== index) })}
                    className="cursor-pointer rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700"
                  >
                    Remover
                  </button>
                </div>
              ))}
              {intents.length < AI_INTENTS_MAX && (
                <button
                  type="button"
                  onClick={() => onChange({ aiIntents: [...intents, ''] })}
                  className="w-full cursor-pointer rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400"
                >
                  Adicionar intenção
                </button>
              )}
              <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Escreva o que o cliente quer, não o que ele digita: “quer saber o preço” pega
                quem pergunta “quanto custa”, “tá quanto?” ou “valores”. Cada intenção vira uma
                saída, e quem não se encaixa em nenhuma sai por “Nenhuma”.
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
              O fluxo termina aqui e a IA assume a conversa, com a persona, o catálogo e as
              regras da tela de IA. Ela responde esta mensagem e as próximas, até alguém
              pausá-la, um atendente entrar ou outro fluxo ser disparado. Por isso o bloco
              não tem saída.
            </p>
          )}
        </>
      )}

      {node.kind === 'funnel_stage' && (
        <Select
          label="Mover para a etapa"
          value={node.funnelStageId ?? ''}
          onChange={(value) => onChange({ funnelStageId: value })}
          options={[
            { value: '', label: stages.length ? 'Escolha uma etapa' : 'Nenhuma etapa criada' },
            ...stages.map((stage) => ({ value: stage.id, label: stage.name })),
          ]}
          hint="Etapa de ganho ou perda também marca o atendimento como resolvido."
        />
      )}

      {node.kind === 'assign' && (
        <Select
          label="Atendente"
          value={node.assigneeUserId ?? ''}
          onChange={(value) => onChange({ assigneeUserId: value })}
          options={[
            { value: '', label: members.length ? 'Escolha um atendente' : 'Nenhum membro na equipe' },
            ...members.map((member) => ({ value: member.userId, label: member.name || member.email })),
          ]}
          hint="A conversa sai da fila e passa a aparecer para essa pessoa. A IA continua respondendo."
        />
      )}

      {node.kind === 'attendance' && (
        <Select
          label="Marcar atendimento como"
          value={node.attendanceStatus ?? 'IN_PROGRESS'}
          onChange={(value) => onChange({ attendanceStatus: value as FlowAttendanceStatus })}
          options={FLOW_ATTENDANCE_STATUSES.map((status) => ({
            value: status,
            label: ATTENDANCE_LABEL[status],
          }))}
        />
      )}

      {node.kind === 'notify' && (
        <>
          <Textarea
            label="Mensagem do aviso"
            rows={3}
            maxLength={4000}
            value={node.text ?? ''}
            onChange={(event) => onChange({ text: event.target.value })}
            placeholder="Lead pediu orçamento e está esperando retorno"
          />
          <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
            O aviso aparece no sino do painel para o workspace inteiro. O nome do bloco, lá em
            cima, vira o título — e o contato e o fluxo entram automaticamente no fim da
            mensagem.
          </p>
        </>
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
