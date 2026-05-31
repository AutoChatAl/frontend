'use client';
import { Mic } from 'lucide-react';

import Dropdown from '@/components/Dropdown';
import { tonesOptions } from '@/types/AI';

interface AIToneSelectorProps {
    value?: string;
    onChange?: (value: string) => void;
}
export default function AIToneSelector({ value, onChange }: AIToneSelectorProps) {
  return (<Dropdown label="Tom de Voz" value={value ?? ''} onChange={(v) => onChange?.(v)} leftIcon={<Mic size={16}/>} options={tonesOptions} hint="Define a personalidade da IA nas respostas."/>);
}
