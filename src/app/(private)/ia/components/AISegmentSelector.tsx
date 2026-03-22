'use client';

import { Briefcase } from 'lucide-react';

import Select from '@/components/Select';

interface AISegmentSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const segments = [
  { value: '', label: 'Selecione um segmento...' },
  'Varejo / E-commerce',
  'Serviços Profissionais',
  'Restaurante / Delivery',
  'Saúde e Bem-estar',
  'Educação e Cursos',
  'Imobiliária',
  'Outro',
];

export default function AISegmentSelector({ value, onChange }: AISegmentSelectorProps) {
  return (
    <Select
      label="Segmento do Negócio"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      leftIcon={<Briefcase size={16} />}
      options={segments}
      hint="Ajuda a IA a entender o contexto das conversas."
    />
  );
}
