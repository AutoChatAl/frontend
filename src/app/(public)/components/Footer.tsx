'use client';
import Link from 'next/link';

import BrandLogo from '@/components/BrandLogo';
import { HIDDEN_FEATURES } from '@lib/featureFlags';

const LINKS = {
  produto: [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Funil de vendas', href: '#funil' },
    ...(HIDDEN_FEATURES.cartRecovery ? [] : [{ label: 'Recuperação de carrinho', href: '#carrinho' }]),
    { label: 'Preços', href: '#precos' },
  ],
  empresa: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Login', href: '/login' },
    { label: 'Criar conta', href: '/register' },
  ],
  legal: [
    { label: 'Política de privacidade', href: '/privacidade' },
    { label: 'Termos de uso', href: '/termos' },
    { label: 'Exclusão de dados', href: '/exclusao-de-dados' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 pt-16 pb-10 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BrandLogo size={36} on="light"/>
              <span className="font-bold text-lg text-slate-900">Synq</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {HIDDEN_FEATURES.cartRecovery
                ? 'Atendimento e vendas no automático para WhatsApp e Instagram.'
                : 'Atendimento e vendas no automático para WhatsApp, Instagram e recuperação de carrinho.'}
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-4">Produto</h4>
            <ul className="space-y-2.5 text-sm">
              {LINKS.produto.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-indigo-600 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-4">Conta</h4>
            <ul className="space-y-2.5 text-sm">
              {LINKS.empresa.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-indigo-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              {LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-indigo-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Synq. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
