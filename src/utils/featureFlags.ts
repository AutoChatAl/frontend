// Features temporariamente bloqueadas na interface. Para reativar, mude para false.
// - campaigns: aba de Campanhas (cadeado na sidebar + rota redireciona).
// - iaTriggers: switches da seção "Gatilhos e Regras" da IA (desabilitados).
export const LOCKED_FEATURES: { campaigns: boolean; iaTriggers: boolean } = {
  campaigns: true,
  iaTriggers: true,
};

// Features apenas OCULTAS da interface. Nada e removido nem deletado: o codigo
// continua no projeto, o backend segue ativo e as rotas continuam funcionando
// por URL direta. Elas so deixam de aparecer na navegacao, no onboarding, nos
// planos/faturamento e na landing page. Para voltar a exibir, mude para false.
// - cartRecovery: aba "Recuperacao" (Recuperacao de Carrinhos, rota /cart-recovery).
export const HIDDEN_FEATURES: { cartRecovery: boolean } = {
  cartRecovery: true,
};
