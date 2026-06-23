'use client';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5533999865046';
const WHATSAPP_MESSAGE =
  'Olá! Vim pelo site da Synq e gostaria de tirar uma dúvida sobre a plataforma. Pode me ajudar?';

export default function WhatsAppFloatingButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com o suporte da Synq no WhatsApp"
        className="group flex items-center"
      >
        <span className="pointer-events-none mr-3 hidden whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 sm:block">
          Precisa de ajuda? Fale conosco
        </span>
        <span className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-200 hover:scale-105 hover:bg-emerald-600 active:scale-95">
            <MessageCircle size={28} />
          </span>
        </span>
      </a>
    </motion.div>
  );
}
