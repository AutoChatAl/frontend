import type { LucideIcon } from 'lucide-react';

export interface AIChannel {
  id: string;
  name: string;
  type: 'whatsapp' | 'instagram';
  active: boolean;
  identifier: string;
}

export interface AIRule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface AITab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const tonesOptions = [
  'Profissional e Formal',
  'Amigável e Casual',
  'Entusiasta e Vendedor',
  'Empático e Prestativo',
  'Direto e Objetivo',
];
