import type { ReactNode } from 'react';

import ConnectStepList, { StepHighlight } from './ConnectStepList';

const SWITCH_STEPS: ReactNode[] = [
  <>No app do Instagram, abra o seu <StepHighlight>perfil</StepHighlight> e toque no <StepHighlight>menu</StepHighlight> (as três linhas no canto de cima).</>,
  <>Entre em <StepHighlight>Tipo de conta e ferramentas</StepHighlight> e toque em <StepHighlight>Mudar para conta profissional</StepHighlight>.</>,
  <>Escolha <StepHighlight>Comercial</StepHighlight> (empresas e lojas) ou <StepHighlight>Criador de conteúdo</StepHighlight> e siga as telas até o fim.</>,
];

export default function InstagramProfessionalSteps() {
  return <ConnectStepList steps={SWITCH_STEPS} tone="fuchsia"/>;
}
