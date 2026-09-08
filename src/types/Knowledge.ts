/**
 * Uma pergunta frequente com a resposta oficial do negócio. É o que a IA usa
 * para o que não está no catálogo de produtos — frete, troca, garantia, pagamento.
 */
export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  /** Sinônimos e jeitos alternativos de perguntar, separados por vírgula. */
  keywords: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeEntryPayload {
  question: string;
  answer: string;
  keywords?: string;
  enabled?: boolean;
}

export interface KnowledgePage {
  entries: KnowledgeEntry[];
  total: number;
  page: number;
  pageSize: number;
  maxEntries: number;
}

/** O que a IA receberia se o cliente mandasse a mensagem de teste. */
export interface KnowledgePreview {
  matches: Array<{ id: string; question: string; answer: string }>;
  total: number;
  /** Falso quando a mensagem é só cumprimento — nem chega a consultar a base. */
  searched: boolean;
}
