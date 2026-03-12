'use client';

import { Mic } from 'lucide-react';

import Select from '@/components/Select';
import { tonesOptions } from '@/types/AI';

interface AIToneSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function AIToneSelector({ value, onChange }: AIToneSelectorProps) {
  return (
    <Select
      label="Tom de Voz"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      leftIcon={<Mic size={16} />}
      options={tonesOptions}
      hint="Define a personalidade da IA nas respostas."
    />
  );
}
