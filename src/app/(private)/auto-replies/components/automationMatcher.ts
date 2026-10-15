import type { AutomationDraft, KeywordLogic, MatchMode } from './automationForm';
import { isCommentLike, type AutomationKind } from './automationMeta';

interface MatchConfig {
  keywords: string[];
  keywordLogic: KeywordLogic;
  matchMode: MatchMode;
  caseSensitive: boolean;
}

export type SimulationTone = 'success' | 'warning';

export interface SimulationResult {
  fires: boolean;
  tone: SimulationTone;
  title: string;
  detail: string;
}

function cleanKeywords(list: string[]): string[] {
  return list.map((entry) => entry.trim()).filter(Boolean);
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function keywordHits(text: string, keyword: string, config: MatchConfig): boolean {
  const compare = config.caseSensitive ? text : text.toLowerCase();
  const target = config.caseSensitive ? keyword : keyword.toLowerCase();
  if (config.matchMode === 'EXACT') return compare === target;
  if (config.matchMode === 'STARTS_WITH') return compare.startsWith(target);
  return compare.includes(target);
}

export function matchesKeywords(rawText: string, config: MatchConfig): boolean {
  const keywords = cleanKeywords(config.keywords);
  if (keywords.length === 0) return false;
  const text = rawText.trim();
  const hits = (keyword: string) => keywordHits(text, keyword, config);
  return config.keywordLogic === 'ALL' ? keywords.every(hits) : keywords.some(hits);
}

function quoteList(list: string[], joiner: 'ou' | 'e'): string {
  const quoted = list.map((entry) => `“${entry}”`);
  if (quoted.length <= 1) return quoted.join('');
  return `${quoted.slice(0, -1).join(', ')} ${joiner} ${quoted[quoted.length - 1]}`;
}

function configOf(draft: AutomationDraft): MatchConfig {
  return {
    keywords: draft.keywords,
    keywordLogic: draft.keywordLogic,
    matchMode: draft.matchMode,
    caseSensitive: draft.caseSensitive,
  };
}

const MODE_PHRASE: Record<MatchMode, string> = {
  CONTAINS: 'tiver',
  EXACT: 'for exatamente',
  STARTS_WITH: 'começar com',
};

export function triggerSummary(draft: AutomationDraft, kind: AutomationKind): string {
  const subject = isCommentLike(kind) ? 'o comentário' : 'a mensagem';
  if (isCommentLike(kind) && draft.triggerOnAnyComment) {
    return kind === 'LIVE'
      ? 'Responde a qualquer comentário feito durante a live.'
      : 'Responde a qualquer comentário, sem depender de palavra.';
  }
  const keywords = cleanKeywords(draft.keywords);
  if (keywords.length === 0) return '';
  const joiner = draft.keywordLogic === 'ALL' ? 'e' : 'ou';
  const caseNote = draft.caseSensitive
    ? 'diferenciando maiúsculas de minúsculas'
    : 'com letra maiúscula ou minúscula';
  return `Responde quando ${subject} ${MODE_PHRASE[draft.matchMode]} ${quoteList(keywords, joiner)}, ${caseNote}.`;
}

export function simulateTrigger(draft: AutomationDraft, kind: AutomationKind, rawText: string): SimulationResult | null {
  const text = rawText.trim();
  if (!text) return null;

  const what = isCommentLike(kind) ? 'Este comentário' : 'Esta mensagem';

  if (isCommentLike(kind) && draft.triggerOnAnyComment) {
    return {
      fires: true,
      tone: 'success',
      title: `${what} dispararia a automação.`,
      detail: 'Qualquer comentário dispara, sem depender de palavra.',
    };
  }

  const keywords = cleanKeywords(draft.keywords);
  if (keywords.length === 0) {
    return {
      fires: false,
      tone: 'warning',
      title: `${what} não dispararia.`,
      detail: 'Adicione ao menos uma palavra em "Quando responder?" para a automação saber quando agir.',
    };
  }

  const config = configOf(draft);
  if (matchesKeywords(text, config)) {
    const hit = keywords.filter((keyword) => keywordHits(text, keyword, config));
    return {
      fires: true,
      tone: 'success',
      title: `${what} dispararia a automação.`,
      detail: draft.keywordLogic === 'ALL'
        ? `Tem todas as palavras: ${quoteList(hit, 'e')}.`
        : `Encontrou ${quoteList(hit, 'e')}.`,
    };
  }

  const plainText = stripAccents(text);
  if (matchesKeywords(plainText, { ...config, keywords: keywords.map(stripAccents) })) {
    const accented = keywords.find((keyword) => stripAccents(keyword) !== keyword && keywordHits(plainText, stripAccents(keyword), config));
    return {
      fires: false,
      tone: 'warning',
      title: `${what} não dispararia por causa do acento.`,
      detail: accented
        ? `Para a automação, “${accented}” e “${stripAccents(accented)}” são palavras diferentes. Adicione também “${stripAccents(accented)}” na lista.`
        : 'Para a automação, “preço” e “preco” são palavras diferentes. Adicione também a palavra com acento na lista.',
    };
  }

  if (draft.caseSensitive && matchesKeywords(text, { ...config, caseSensitive: false })) {
    return {
      fires: false,
      tone: 'warning',
      title: `${what} não dispararia por causa das maiúsculas.`,
      detail: 'Está ligado "Diferenciar maiúsculas de minúsculas" em Mais opções. Desligue para aceitar a palavra de qualquer jeito.',
    };
  }

  if (draft.matchMode !== 'CONTAINS' && matchesKeywords(text, { ...config, matchMode: 'CONTAINS' })) {
    return {
      fires: false,
      tone: 'warning',
      title: `${what} não dispararia.`,
      detail: draft.matchMode === 'EXACT'
        ? 'A palavra aparece, mas a regra pede que a mensagem seja só a palavra. Em Mais opções, escolha "Tem a palavra".'
        : 'A palavra aparece, mas não no começo. Em Mais opções, escolha "Tem a palavra".',
    };
  }

  if (draft.keywordLogic === 'ALL' && keywords.length > 1) {
    const missing = keywords.filter((keyword) => !keywordHits(text, keyword, config));
    return {
      fires: false,
      tone: 'warning',
      title: `${what} não dispararia.`,
      detail: `A regra pede todas as palavras e faltou ${quoteList(missing, 'e')}.`,
    };
  }

  return {
    fires: false,
    tone: 'warning',
    title: `${what} não dispararia.`,
    detail: `Nenhuma das palavras (${quoteList(keywords, 'ou')}) aparece no texto.`,
  };
}
