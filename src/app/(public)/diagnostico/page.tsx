import type { Metadata, Viewport } from 'next';

import DiagnosticChat from './components/DiagnosticChat';

export const metadata: Metadata = {
  title: 'Diagnóstico da sua operação no WhatsApp e Instagram | Synq',
  description:
    'Descubra em 3 minutos onde seu atendimento no WhatsApp e no Instagram está perdendo vendas — e o caminho para resolver.',
};

export const viewport: Viewport = {
  // Pinta a barra do navegador no celular com o mesmo verde do cabeçalho (emerald-700).
  themeColor: '#047857',
  // No Android, o teclado encolhe a página em vez de cobrir o campo de resposta.
  interactiveWidget: 'resizes-content',
};

export default function DiagnosticoPage() {
  return <DiagnosticChat />;
}
