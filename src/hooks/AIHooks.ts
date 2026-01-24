'use client';

import { useState } from 'react';

import type { AIChannel, AIRule } from '@/types/AI';

export function useAIConfig() {
  const [segment, setSegment] = useState('Varejo / E-commerce');
  const [tone, setTone] = useState('Amigável e Casual');
  const [products, setProducts] = useState('Roupas femininas, vestidos de festa, moda casual, acessórios e calçados.');

  const [channels, setChannels] = useState<AIChannel[]>([
    { id: 'wa1', name: 'Atendimento Principal', type: 'whatsapp', active: true, identifier: '+55 11 99999-9999' },
    { id: 'wa2', name: 'Vendas Diretas', type: 'whatsapp', active: false, identifier: '+55 11 98888-8888' },
    { id: 'ig1', name: '@loja.oficial', type: 'instagram', active: true, identifier: '@loja.oficial' },
  ]);

  const [rules, setRules] = useState<AIRule[]>([
    {
      id: 'rule1',
      title: 'Responder a todos as novas mensagens',
      description: 'A IA tentará responder a qualquer mensagem recebida.',
      enabled: true,
    },
    {
      id: 'rule2',
      title: 'Silenciar fora do horário comercial',
      description: 'Não enviar respostas automáticas entre 22h e 08h.',
      enabled: false,
    },
    {
      id: 'rule3',
      title: 'Transbordo para humano',
      description: 'Transferir automaticamente se o cliente pedir "falar com atendente".',
      enabled: false,
    },
  ]);

  const toggleChannel = (id: string) => {
    setChannels(channels.map((ch) => (ch.id === id ? { ...ch, active: !ch.active } : ch)));
  };

  const toggleRule = (id: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)));
  };

  const saveConfig = () => {
    // TODO: Implement API call to save configuration
  };

  return {
    segment,
    setSegment,
    tone,
    setTone,
    products,
    setProducts,
    channels,
    toggleChannel,
    rules,
    toggleRule,
    saveConfig,
  };
}
