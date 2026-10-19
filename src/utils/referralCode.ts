/**
 * Código de indicação capturado no link (`/r/CODIGO` ou `?ref=`) e guardado em cookie até o
 * cadastro. O middleware grava; o cadastro lê e apaga. Vale a última indicação antes do cadastro.
 */
export const REFERRAL_COOKIE = 'synq_ref';
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** "diego-7k4p " → "DIEGO7K4P"; mesmo critério do backend. */
export function normalizeReferralCode(raw: string): string {
  return raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 40);
}

export function isPlausibleReferralCode(code: string): boolean {
  return /^[A-Z0-9]{4,40}$/.test(code);
}

export function readReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const entry = document.cookie.split('; ').find((part) => part.startsWith(`${REFERRAL_COOKIE}=`));
  if (!entry) return null;
  const code = normalizeReferralCode(decodeURIComponent(entry.slice(REFERRAL_COOKIE.length + 1)));
  return isPlausibleReferralCode(code) ? code : null;
}

export function clearReferralCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${REFERRAL_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
