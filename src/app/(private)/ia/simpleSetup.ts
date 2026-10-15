import type { AiPriceSource, AiSimpleSetupAnswers } from '@/types/AI';

const BLOCK_START = 'Informações do negócio:';
const BLOCK_END = 'Fim das informações do negócio.';

const LABELS = {
  about: 'Sobre o negócio:',
  hours: 'Horário de atendimento:',
  priceLink: 'Onde o cliente vê os preços (envie este link quando perguntarem preço):',
  priceList: 'Lista de preços (use somente estes valores):',
} as const;

type SectionKey = keyof typeof LABELS;

const SECTION_KEYS = Object.keys(LABELS) as SectionKey[];

export const EMPTY_SIMPLE_SETUP: AiSimpleSetupAnswers = {
  about: '',
  hours: '',
  priceSource: 'link',
  priceLink: '',
  priceList: '',
};

export interface ParsedCustomRules {
  answers: AiSimpleSetupAnswers;
  otherRules: string;
}

function labelOf(line: string): SectionKey | null {
  const trimmed = line.trim();
  return SECTION_KEYS.find((key) => trimmed.startsWith(LABELS[key])) ?? null;
}

export function parseCustomRules(customRules: string): ParsedCustomRules {
  const lines = customRules.split('\n');
  const start = lines.findIndex((line) => line.trim() === BLOCK_START);
  const end = start >= 0 ? lines.findIndex((line, index) => index > start && line.trim() === BLOCK_END) : -1;
  if (start < 0 || end < 0) {
    return { answers: { ...EMPTY_SIMPLE_SETUP }, otherRules: customRules };
  }
  const sections: Record<SectionKey, string[]> = { about: [], hours: [], priceLink: [], priceList: [] };
  let current: SectionKey | null = null;
  for (const line of lines.slice(start + 1, end)) {
    const label = labelOf(line);
    if (label) {
      current = label;
      const rest = line.trim().slice(LABELS[label].length).trim();
      if (rest) {
        sections[label].push(rest);
      }
      continue;
    }
    if (current) {
      sections[current].push(line);
    }
  }
  const read = (key: SectionKey): string => sections[key].join('\n').trim();
  const priceList = read('priceList');
  const priceLink = read('priceLink');
  const priceSource: AiPriceSource = priceList && !priceLink ? 'list' : 'link';
  const otherRules = [...lines.slice(0, start), ...lines.slice(end + 1)].join('\n').trim();
  return {
    answers: { about: read('about'), hours: read('hours'), priceSource, priceLink, priceList },
    otherRules,
  };
}

export function hasSimpleAnswers(answers: AiSimpleSetupAnswers): boolean {
  const price = answers.priceSource === 'link' ? answers.priceLink : answers.priceList;
  return !!(answers.about.trim() || answers.hours.trim() || price.trim());
}

export function composeCustomRules(answers: AiSimpleSetupAnswers, otherRules: string): string {
  const rest = otherRules.trim();
  if (!hasSimpleAnswers(answers)) {
    return rest;
  }
  const block: string[] = [BLOCK_START];
  if (answers.about.trim()) {
    block.push(`${LABELS.about} ${answers.about.trim()}`);
  }
  if (answers.hours.trim()) {
    block.push(`${LABELS.hours} ${answers.hours.trim()}`);
  }
  if (answers.priceSource === 'link' && answers.priceLink.trim()) {
    block.push(`${LABELS.priceLink} ${answers.priceLink.trim()}`);
  }
  if (answers.priceSource === 'list' && answers.priceList.trim()) {
    block.push(LABELS.priceList, answers.priceList.trim());
  }
  block.push(BLOCK_END);
  return rest ? `${block.join('\n')}\n\n${rest}` : block.join('\n');
}

export function isValidPriceLink(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  }
  catch {
    return false;
  }
}
