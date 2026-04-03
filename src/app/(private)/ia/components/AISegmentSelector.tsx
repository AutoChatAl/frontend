'use client';

import { Briefcase } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Input from '@/components/Input';
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
  { value: '__OTHER__', label: 'Outro' },
];

export default function AISegmentSelector({ value, onChange }: AISegmentSelectorProps) {
  const [selectedSegment, setSelectedSegment] = useState('');
  const [otherSegment, setOtherSegment] = useState('');

  const predefinedValues = useMemo(
    () => new Set(segments.map((s) => (typeof s === 'string' ? s : s.value)).filter((v) => v && v !== '__OTHER__')),
    [],
  );

  useEffect(() => {
    const currentValue = value || '';
    if (!currentValue) {
      setSelectedSegment('');
      setOtherSegment('');
      return;
    }
    if (predefinedValues.has(currentValue)) {
      setSelectedSegment(currentValue);
      setOtherSegment('');
      return;
    }
    setSelectedSegment('__OTHER__');
    setOtherSegment(currentValue);
  }, [value, predefinedValues]);

  return (
    <div className="space-y-3">
      <Select
        label="Segmento do Negócio"
        value={selectedSegment}
        onChange={(e) => {
          const nextValue = e.target.value;
          setSelectedSegment(nextValue);
          if (nextValue === '__OTHER__') {
            onChange?.(otherSegment.trim());
            return;
          }
          setOtherSegment('');
          onChange?.(nextValue);
        }}
        leftIcon={<Briefcase size={16} />}
        options={segments}
        hint="Ajuda a IA a entender o contexto das conversas."
      />

      {selectedSegment === '__OTHER__' && (
        <Input
          label="Qual é o segmento?"
          value={otherSegment}
          onChange={(e) => {
            const customSegment = e.target.value;
            setOtherSegment(customSegment);
            onChange?.(customSegment);
          }}
          placeholder="Digite o segmento do negócio"
        />
      )}
    </div>
  );
}
