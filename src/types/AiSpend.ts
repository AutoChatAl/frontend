export interface AiSpendRow {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  workspaceId: string;
  /** Centavos de real, com casas decimais — arredonde só na exibição. */
  replyCents: number;
  transcriptionCents: number;
  funnelCents: number;
  totalCents: number;
  totalUsd: number;
  lastSpentAt: string | null;
}
