export type BusinessType = 'local' | 'ecommerce' | 'infoproduct';

export const BUSINESS_TYPES: BusinessType[] = ['local', 'ecommerce', 'infoproduct'];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  local: 'Negócio local',
  ecommerce: 'Loja virtual',
  infoproduct: 'Infoprodutor',
};

export const BUSINESS_TYPE_DESCRIPTIONS: Record<BusinessType, string> = {
  local: 'Loja física, restaurante, clínica, salão ou prestador de serviço.',
  ecommerce: 'Vendo produtos pela internet, com loja virtual ou catálogo.',
  infoproduct: 'Vendo cursos, mentorias ou produtos digitais, com lançamentos pelo Instagram.',
};

export function isBusinessType(value: string | null | undefined): value is BusinessType {
  return value === 'local' || value === 'ecommerce' || value === 'infoproduct';
}
