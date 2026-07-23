// Features temporariamente bloqueadas na interface. Para reativar, mude para false.
// - campaigns: aba de Campanhas (cadeado na sidebar + rota redireciona).
// - iaTriggers: switches da seção "Gatilhos e Regras" da IA (desabilitados).
export const LOCKED_FEATURES: { campaigns: boolean; iaTriggers: boolean } = {
  campaigns: true,
  iaTriggers: true,
};
