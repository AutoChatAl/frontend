'use client';
import { Building2, UserRound } from 'lucide-react';

import Card from '@/components/Card';
import Input from '@/components/Input';

import AISectionHeader from './AISectionHeader';
import AISegmentSelector from './AISegmentSelector';
import AIToneSelector from './AIToneSelector';

interface AIIdentitySectionProps {
    segment: string;
    businessName: string;
    assistantName: string;
    tone: string;
    onSegmentChange: (value: string) => void;
    onBusinessNameChange: (value: string) => void;
    onAssistantNameChange: (value: string) => void;
    onToneChange: (value: string) => void;
}

/**
 * Só a identidade: o catálogo virou aba própria porque a tabela de produtos
 * tomava a tela inteira e escondia estes quatro campos.
 */
export default function AIIdentitySection({ segment, businessName, assistantName, tone, onSegmentChange, onBusinessNameChange, onAssistantNameChange, onToneChange }: AIIdentitySectionProps) {
  return (
    <Card className="p-4">
      <AISectionHeader
        title="Identidade do assistente"
        hint="Quem a IA diz que é e em que contexto ela responde. Tudo aqui entra no prompt de cada conversa."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nome do negócio"
          value={businessName}
          onChange={(e) => onBusinessNameChange(e.target.value)}
          leftIcon={<Building2 size={16}/>}
          placeholder="Ex: Clínica Vida Leve"
          hint="Opcional. Se vazio, a apresentação da IA continua genérica."
        />
        <Input
          label="Nome do assistente"
          value={assistantName}
          onChange={(e) => onAssistantNameChange(e.target.value)}
          leftIcon={<UserRound size={16}/>}
          placeholder="Ex: Ana, assistente virtual"
          hint="Opcional. Se vazio, a IA se apresenta como assistente virtual."
        />
        <AISegmentSelector value={segment} onChange={onSegmentChange}/>
        <AIToneSelector value={tone} onChange={onToneChange}/>
      </div>
    </Card>
  );
}
