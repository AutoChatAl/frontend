import { getRecipe, recipesForBusiness, type AutomationRecipe, type RecipeId } from '@/app/(private)/auto-replies/recipes';
import { aiService } from '@/services/ai.service';
import { autoReplyService } from '@/services/auto-reply.service';
import { cartRecoveryService } from '@/services/cart-recovery.service';
import { channelsService } from '@/services/channels.service';
import { commentAutomationService } from '@/services/comment-automation.service';
import { flowService } from '@/services/flow.service';
import { liveAutomationService } from '@/services/live-automation.service';
import { setupOnboardingService } from '@/services/setup-onboarding.service';
import { whatsappOfficialService } from '@/services/whatsapp-official.service';
import type { AiConfig } from '@/types/AI';
import type { BusinessType } from '@/types/BusinessType';

export type SetupStepId = 'channel' | 'ai' | 'ai-test' | 'recipe';

export const SETUP_STEP_IDS: SetupStepId[] = ['channel', 'ai', 'ai-test', 'recipe'];

export const SETUP_STEP_TITLES: Record<SetupStepId, string> = {
  channel: 'Conecte seu WhatsApp ou Instagram',
  ai: 'Conte para a IA sobre seu negócio',
  'ai-test': 'Teste a IA agora',
  recipe: 'Ative a primeira automação do seu negócio',
};

export const LEGACY_STEP_IDS: Record<SetupStepId, string[]> = {
  channel: ['whatsapp', 'instagram'],
  ai: [],
  'ai-test': [],
  recipe: ['auto-reply', 'comment-automation'],
};

const CONNECTED = 'CONNECTED';

const PREFERRED_RECIPES: Record<BusinessType, RecipeId[]> = {
  local: ['address-hours', 'catalog-link', 'price-reply'],
  ecommerce: ['comment-link', 'catalog-link'],
  infoproduct: ['comment-link', 'buyer-welcome'],
};

export function isAiConfigured(config: Pick<AiConfig, 'enabled' | 'businessName' | 'segment' | 'customRules'>): boolean {
  return config.enabled || !!(config.businessName?.trim() || config.segment?.trim() || config.customRules?.trim());
}

export async function hasConnectedChannel(): Promise<boolean> {
  const [whatsapp, official, instagram] = await Promise.all([
    channelsService.getWhatsAppInstances().catch(() => []),
    whatsappOfficialService.getInstances().catch(() => []),
    channelsService.getInstagramAccounts().catch(() => []),
  ]);
  return [...whatsapp, ...official, ...instagram].some((channel) => channel.status === CONNECTED);
}

export async function hasConfiguredAi(): Promise<boolean> {
  try {
    const { aiConfig } = await aiService.getConfig();
    return isAiConfigured(aiConfig);
  } catch {
    return false;
  }
}

export async function hasAnyAutomation(): Promise<boolean> {
  const lists = await Promise.all([
    autoReplyService.list().catch(() => []),
    commentAutomationService.list().catch(() => []),
    liveAutomationService.list().catch(() => []),
    flowService.list().catch(() => []),
    cartRecoveryService.listIntegrations().catch(() => []),
  ]);
  return lists.some((list) => list.length > 0);
}

function fitsChannels(recipe: AutomationRecipe, hasInstagram: boolean): boolean {
  if (recipe.target.type !== 'automation') return false;
  return recipe.target.kind === 'DM' || hasInstagram;
}

export function pickStarterRecipe(businessType: BusinessType | null, hasInstagram: boolean): AutomationRecipe | null {
  const ordered = recipesForBusiness(businessType);
  const preferred = businessType
    ? PREFERRED_RECIPES[businessType]
      .map((id) => getRecipe(id))
      .find((recipe): recipe is AutomationRecipe => !!recipe && fitsChannels(recipe, hasInstagram))
    : undefined;
  return preferred
    ?? ordered.find((recipe) => fitsChannels(recipe, hasInstagram))
    ?? ordered[0]
    ?? null;
}

export function trackStepCompleted(step: SetupStepId, businessType: BusinessType | null): void {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event: 'onboarding_step_completed', step, businessType });
}

export const AI_SETUP_STEP_IDS: SetupStepId[] = ['ai', 'ai-test'];

export function activeSetupSteps(hasAiPlan: boolean): SetupStepId[] {
  return hasAiPlan ? SETUP_STEP_IDS : SETUP_STEP_IDS.filter((step) => !AI_SETUP_STEP_IDS.includes(step));
}

const completingSteps = new Set<SetupStepId>();

export async function completeSetupStep(step: SetupStepId): Promise<void> {
  if (completingSteps.has(step)) return;
  completingSteps.add(step);
  try {
    const state = await setupOnboardingService.fetch();
    if (state.completedSteps.includes(step)) return;
    await setupOnboardingService.update({ completeStep: step });
    trackStepCompleted(step, state.businessType);
  } catch {
    completingSteps.delete(step);
  }
}
