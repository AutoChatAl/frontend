import type { Metadata } from 'next';

import { normalizeReferralCode } from '@/utils/referralCode';

import InviteLanding from './InviteLanding';

const TITLE = 'Você ganhou 5% de desconto no Synq';
const DESCRIPTION = 'Teste grátis por 7 dias e ganhe 5% de desconto na primeira fatura. Atendimento com IA no WhatsApp e no Instagram.';

export const metadata: Metadata = {
  // Sem isto a URL da imagem OG sai como localhost e a prévia do link no WhatsApp quebra.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.synq.app.br'),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  robots: { index: false },
};

/**
 * Destino do link de indicação (`/r/CODIGO`). O middleware já guardou o código em cookie;
 * esta página só apresenta o convite e leva para o cadastro.
 */
export default async function ReferralInvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <InviteLanding code={normalizeReferralCode(decodeURIComponent(code))}/>;
}
