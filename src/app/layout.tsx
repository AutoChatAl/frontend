import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';

import GoogleTagManager from '@/components/GoogleTagManager';
import GtmPageView from '@/components/GtmPageView';
import '@/app/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

export const metadata: Metadata = {
  title: 'Synq - Multi-Channel Messaging Platform',
  description: 'Sistema de gerenciamento multi-canal',
};
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) {
  return (<html lang="pt-br" suppressHydrationWarning>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {gtmId && (
        <Suspense fallback={null}>
          <GtmPageView />
        </Suspense>
      )}
      {children}
    </body>
  </html>);
}
