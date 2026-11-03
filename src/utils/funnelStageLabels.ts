import type { Funnel, FunnelStageDefinition } from '@/types/Funnel';

/**
 * As colunas de vários funis numa lista só — para escolher uma etapa fora da tela do
 * funil. Com mais de um funil, o nome da coluna leva o do funil na frente, porque
 * "Entrada" ou "Ganho" podem existir em todos.
 */
export function stagesAcrossFunnels(funnels: Funnel[]): FunnelStageDefinition[] {
  const prefixed = funnels.length > 1;
  return funnels.flatMap((funnel) =>
    funnel.stages.map((stage) => (prefixed ? { ...stage, name: `${funnel.name} › ${stage.name}` } : stage)),
  );
}
