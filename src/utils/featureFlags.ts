// Features temporariamente bloqueadas na interface. Para bloquear de novo, mude para true.
// - campaigns: LIBERADA. A aba de Campanhas volta a aparecer sem cadeado e a rota
//   /campaigns para de redirecionar. O disparo roda pela API Oficial do WhatsApp.
// - iaTriggers: switches da seção "Gatilhos e Regras" da IA (desabilitados).
export const LOCKED_FEATURES: { campaigns: boolean; iaTriggers: boolean } = {
  campaigns: false,
  iaTriggers: true,
};

// Features apenas OCULTAS da interface. Nada e removido nem deletado: o codigo
// continua no projeto, o backend segue ativo e as rotas continuam funcionando
// por URL direta. Elas so deixam de aparecer na navegacao, no onboarding, nos
// planos/faturamento e na landing page. Para voltar a exibir, mude para false.
// - cartRecovery: aba "Recuperacao" (Recuperacao de Carrinhos, rota /cart-recovery).
// - campaignNonOfficialChannels: em Campanhas, a opção de escolher canal WhatsApp NÃO
//   oficial (UAZAPI/Evolution) ou Instagram. Toda a implementação de disparo por esses
//   canais continua intacta no front e no back — a campanha apenas não consegue mais
//   selecioná-los, então só sobra a API Oficial (que exige template aprovado da Meta).
export const HIDDEN_FEATURES: { cartRecovery: boolean; campaignNonOfficialChannels: boolean } = {
  cartRecovery: true,
  campaignNonOfficialChannels: true,
};
