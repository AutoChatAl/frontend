import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Synq - Atendimento Inteligente para WhatsApp e Instagram',
  description: 'Automatize conversas, gerencie campanhas e aumente suas vendas com inteligência artificial. Tudo em uma única plataforma.',
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="min-h-screen">{children}</main>;
}
