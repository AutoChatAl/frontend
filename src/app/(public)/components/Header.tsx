'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import BrandLogo from '@/components/BrandLogo';
import { HIDDEN_FEATURES } from '@lib/featureFlags';

const NAV_LINKS = [
  { href: '#funcionalidades', label: 'Como funciona' },
  { href: '#campanhas', label: 'Campanhas' },
  { href: '#funil', label: 'Funil' },
  { href: '#atendimento', label: 'Atendimento' },
  ...(HIDDEN_FEATURES.cartRecovery ? [] : [{ href: '#carrinho', label: 'Recuperação' }]),
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6"
    >
      <div
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-300 sm:px-5 ${
          scrolled
            ? 'border border-slate-200/70 bg-white/80 backdrop-blur-xl'
            : 'border border-transparent'
        }`}
      >
        <Link href="/" className="flex items-center gap-2 group">
          <BrandLogo size={36} on="light" className="transition-transform group-hover:scale-105"/>
          <span className="font-bold text-lg text-slate-900">Synq</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors px-3 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="group flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Teste grátis
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((s) => !s)}
          className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-xl lg:hidden"
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-slate-700 hover:bg-slate-100 px-3 py-2.5 rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2 mt-2 border-t border-slate-100">
              <Link
                href="/login"
                className="flex-1 text-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Teste grátis
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
