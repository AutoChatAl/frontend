'use client';
import { FlaskConical, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/Button';
import Callout from '@/components/Callout';
import Card from '@/components/Card';
import Input from '@/components/Input';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonRows } from '@/components/Skeleton';
import Textarea from '@/components/Textarea';
import { ToastContainer, useToast } from '@/components/Toast';
import ToggleRow from '@/components/ToggleRow';
import ToggleSwitch from '@/components/ToggleSwitch';
import { knowledgeService } from '@/services/knowledge.service';
import type { KnowledgeEntry, KnowledgePreview } from '@/types/Knowledge';

const PAGE_SIZE = 20;

interface DraftState {
  /** Vazio significa entrada nova; preenchido é edição da entrada com este id. */
  id: string | null;
  question: string;
  answer: string;
  keywords: string;
}

const EMPTY_DRAFT: DraftState = { id: null, question: '', answer: '', keywords: '' };

/**
 * Base de conhecimento: as respostas oficiais do negócio para o que não está no
 * catálogo de produtos.
 *
 * A seção cuida do próprio estado em vez de entrar no `useAIConfig`: nada aqui
 * é rascunho salvo junto com a configuração da IA — cada pergunta é gravada por
 * conta própria, como acontece no catálogo.
 */
interface AIKnowledgeSectionProps {
  /** Interruptor geral do perfil de IA ativo. */
  knowledgeEnabled: boolean;
  onToggleKnowledge: (enabled: boolean) => void;
}

export default function AIKnowledgeSection({ knowledgeEnabled, onToggleKnowledge }: AIKnowledgeSectionProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [maxEntries, setMaxEntries] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [preview, setPreview] = useState<KnowledgePreview | null>(null);
  const [testing, setTesting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const load = useCallback(async (targetPage: number, term: string) => {
    setLoading(true);
    try {
      const result = await knowledgeService.list({ page: targetPage, pageSize: PAGE_SIZE, search: term });
      setEntries(result.entries);
      setTotal(result.total);
      setMaxEntries(result.maxEntries);
      setPage(result.page);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // A busca dispara sozinha, com folga para o usuário terminar de digitar.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { load(1, search); }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, load]);

  const submitDraft = useCallback(async () => {
    if (!draft) return;
    const question = draft.question.trim();
    const answer = draft.answer.trim();
    if (question.length < 3 || !answer) {
      addToast('error', 'Preencha a pergunta e a resposta.');
      return;
    }
    setSaving(true);
    try {
      if (draft.id) {
        await knowledgeService.update(draft.id, { question, answer, keywords: draft.keywords.trim() });
        addToast('success', 'Pergunta atualizada.');
      } else {
        await knowledgeService.create({ question, answer, keywords: draft.keywords.trim() });
        addToast('success', 'Pergunta cadastrada.');
      }
      setDraft(null);
      await load(draft.id ? page : 1, search);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }, [draft, page, search, load, addToast]);

  const setEntryEnabled = useCallback(async (entry: KnowledgeEntry, enabled: boolean) => {
    // Otimista: a chave responde na hora e volta sozinha se a API recusar.
    setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, enabled } : item)));
    try {
      await knowledgeService.update(entry.id, { enabled });
    } catch (err) {
      setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, enabled: !enabled } : item)));
      addToast('error', err instanceof Error ? err.message : 'Falha ao alterar.');
    }
  }, [addToast]);

  const remove = useCallback(async (entry: KnowledgeEntry) => {
    setSaving(true);
    try {
      await knowledgeService.remove(entry.id);
      addToast('success', 'Pergunta removida.');
      await load(page, search);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao remover.');
    } finally {
      setSaving(false);
    }
  }, [page, search, load, addToast]);

  const runTest = useCallback(async () => {
    const message = testMessage.trim();
    if (!message) return;
    setTesting(true);
    try {
      setPreview(await knowledgeService.preview(message));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Falha ao testar.');
    } finally {
      setTesting(false);
    }
  }, [testMessage, addToast]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const atLimit = maxEntries > 0 && total >= maxEntries;

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <ToggleRow
          title="Usar a base de conhecimento"
          description="Desligado, a IA nunca consulta as respostas abaixo e nada é anexado ao prompt — o custo por resposta volta a ser o mesmo de antes da base existir. As perguntas continuam cadastradas."
          checked={knowledgeEnabled}
          onChange={onToggleKnowledge}
        >
          {!knowledgeEnabled && (
            <Callout tone="warning" className="mt-2">
              A base está desligada para este perfil de IA. O que você cadastrar aqui não será usado até religar.
            </Callout>
          )}
        </ToggleRow>
      </Card>

      <Card className="p-4">
        <SectionHeader
          title="Base de conhecimento"
          hint="As respostas oficiais para o que não está no catálogo: frete, troca, garantia, formas de pagamento."
          action={
            <Button
              size="sm"
              icon={<Plus size={14}/>}
              onClick={() => setDraft(EMPTY_DRAFT)}
              disabled={saving || atLimit || draft !== null}
            >
              Nova pergunta
            </Button>
          }
        />

        {atLimit && (
          <Callout tone="warning" className="mb-3">
            Você chegou ao limite de {maxEntries} perguntas. Remova alguma para cadastrar outra.
          </Callout>
        )}

        {draft && (
          <div className="mb-3 space-y-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-500/30 dark:bg-indigo-500/5">
            <Input
              label="Pergunta"
              placeholder="Qual o prazo de entrega?"
              value={draft.question}
              maxLength={200}
              onChange={(event) => setDraft({ ...draft, question: event.target.value })}
              hint="Escreva como o cliente costuma perguntar."
            />
            <Textarea
              label="Resposta oficial"
              rows={4}
              maxLength={4000}
              placeholder="De 3 a 5 dias úteis para todo o Brasil, contados a partir da confirmação do pagamento."
              value={draft.answer}
              onChange={(event) => setDraft({ ...draft, answer: event.target.value })}
              hint="A IA responde com as próprias palavras, mas nunca contraria nem inventa além do que estiver aqui."
            />
            <Input
              label="Outros jeitos de perguntar (opcional)"
              placeholder="frete, envio, chega quando, demora quanto"
              value={draft.keywords}
              maxLength={300}
              onChange={(event) => setDraft({ ...draft, keywords: event.target.value })}
              hint="Separe por vírgula. Quando o cliente usa um destes termos, esta resposta é encontrada mesmo que a pergunta dele seja bem diferente."
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={saving} icon={<X size={14}/>}>
                Cancelar
              </Button>
              <Button size="sm" onClick={submitDraft} loading={saving} loadingText="Salvando...">
                {draft.id ? 'Salvar alteração' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        )}

        <Input
          placeholder="Buscar nas perguntas cadastradas"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16}/>}
          wrapperClassName="mb-3"
        />

        {loading ? (
          <div className="animate-pulse" aria-busy="true"><SkeletonRows count={4} avatar={false}/></div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
            {search
              ? 'Nenhuma pergunta encontrada com esse termo.'
              : 'Nenhuma pergunta cadastrada. Comece pelas três que mais chegam no seu atendimento.'}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                <div className={`min-w-0 ${entry.enabled ? '' : 'opacity-50'}`}>
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{entry.question}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {entry.answer}
                  </p>
                  {entry.keywords && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Também encontra por: {entry.keywords}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="mr-1" title={entry.enabled ? 'Ativa — a IA pode usar' : 'Desativada — a IA ignora'}>
                    <ToggleSwitch
                      checked={entry.enabled}
                      onChange={(checked) => setEntryEnabled(entry, checked)}
                      disabled={saving}
                      ariaLabel={`${entry.enabled ? 'Desativar' : 'Ativar'} ${entry.question}`}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Editar ${entry.question}`}
                    onClick={() => setDraft({ id: entry.id, question: entry.question, answer: entry.answer, keywords: entry.keywords })}
                    disabled={saving}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
                  >
                    <Pencil size={15}/>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${entry.question}`}
                    onClick={() => remove(entry)}
                    disabled={saving}
                    className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  >
                    <Trash2 size={15}/>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {total} {total === 1 ? 'pergunta' : 'perguntas'} · página {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => load(page - 1, search)} disabled={page <= 1 || loading}>
                Anterior
              </Button>
              <Button variant="ghost" size="sm" onClick={() => load(page + 1, search)} disabled={page >= totalPages || loading}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Testar é o que fecha o ciclo: sem isso, só se descobre que a entrada não
          é encontrada quando um cliente real faz a pergunta. */}
      <Card className="p-4">
        <SectionHeader
          title="Testar"
          hint="Escreva uma pergunta como um cliente escreveria e veja o que a IA receberia. Não envia nada a ninguém."
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="quanto tempo demora pra chegar?"
            value={testMessage}
            maxLength={1000}
            onChange={(event) => setTestMessage(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') runTest(); }}
            wrapperClassName="flex-1"
          />
          <Button onClick={runTest} loading={testing} loadingText="Testando..." disabled={!testMessage.trim()} icon={<FlaskConical size={16}/>}>
            Testar
          </Button>
        </div>

        {preview && (
          <div className="mt-3">
            {preview.total === 0 ? (
              <Callout tone="warning">Sua base ainda está vazia — cadastre a primeira pergunta acima.</Callout>
            ) : !preview.searched ? (
              <Callout tone="info">
                Essa mensagem é só um cumprimento, então a base nem chega a ser consultada. É o comportamento esperado:
                nada é anexado e nenhum token extra é gasto.
              </Callout>
            ) : preview.matches.length === 0 ? (
              <Callout tone="warning">
                Nenhuma resposta seria anexada. Se alguma das suas perguntas deveria responder isso,
                acrescente o termo que você usou aqui no campo &quot;outros jeitos de perguntar&quot; dela.
              </Callout>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A IA receberia {preview.matches.length} {preview.matches.length === 1 ? 'resposta' : 'respostas'} como fonte de verdade:
                </p>
                {preview.matches.map((match) => (
                  <div key={match.id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                    <p className="text-[13px] font-semibold text-slate-900 dark:text-white">{match.question}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{match.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <ToastContainer toasts={toasts} onRemove={removeToast}/>
    </div>
  );
}
