'use client';
import { Briefcase } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Dropdown from '@/components/Dropdown';
import Input from '@/components/Input';
import { AI_LEGACY_SEGMENT_OPTIONS, AI_SEGMENT_OPTIONS } from '@/types/AI';

interface AISegmentSelectorProps {
    value?: string;
    onChange?: (value: string) => void;
}
const OTHER_VALUE = '__OTHER__';
export default function AISegmentSelector({ value, onChange }: AISegmentSelectorProps) {
  const [selectedSegment, setSelectedSegment] = useState('');
  const [otherSegment, setOtherSegment] = useState('');
  const currentValue = value || '';
  const legacySelected = AI_LEGACY_SEGMENT_OPTIONS.includes(currentValue);
  const segments = useMemo(() => [
    { value: '', label: 'Selecione um segmento...' },
    ...AI_SEGMENT_OPTIONS,
    ...(legacySelected ? [currentValue] : []),
    { value: OTHER_VALUE, label: 'Outro' },
  ], [legacySelected, currentValue]);
  const predefinedValues = useMemo(() => new Set([...AI_SEGMENT_OPTIONS, ...AI_LEGACY_SEGMENT_OPTIONS]), []);
  useEffect(() => {
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
    setSelectedSegment(OTHER_VALUE);
    setOtherSegment(currentValue);
  }, [currentValue, predefinedValues]);
  return (<div className="space-y-3">
    <Dropdown label="Segmento do Negócio" value={selectedSegment} onChange={(nextValue) => {
      setSelectedSegment(nextValue);
      if (nextValue === OTHER_VALUE) {
        onChange?.(otherSegment.trim());
        return;
      }
      setOtherSegment('');
      onChange?.(nextValue);
    }} leftIcon={<Briefcase size={16}/>} options={segments} hint="Ajuda a IA a entender o contexto das conversas."/>

    {selectedSegment === OTHER_VALUE && (<Input label="Qual é o segmento?" value={otherSegment} onChange={(e) => {
      const customSegment = e.target.value;
      setOtherSegment(customSegment);
      onChange?.(customSegment);
    }} placeholder="Digite o segmento do negócio"/>)}
  </div>);
}
