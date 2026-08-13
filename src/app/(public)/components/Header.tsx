'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Menu, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { HIDDEN_FEATURES } from '@lib/featureFlags';

const NAV_LINKS = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#instagram', label: 'Instagram' },
  { href: '#whatsapp', label: 'WhatsApp' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <Zap size={18} className="text-white" fill="white" />
          </div>
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
            className="group flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-indigo-500/30"
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
          className="lg:hidden border-t border-slate-200 bg-white"
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
                className="flex-1 text-center px-3 py-2 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-colors"
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
