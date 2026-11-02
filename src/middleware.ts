import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  isPlausibleReferralCode,
  normalizeReferralCode,
} from '@/utils/referralCode';

/** Código vindo de `/r/CODIGO` ou de `?ref=CODIGO` em qualquer página de entrada. */
function referralCodeFrom(request: NextRequest): string | null {
  const { pathname, searchParams } = request.nextUrl;
  const fromPath = pathname.startsWith('/r/') ? pathname.slice(3).split('/')[0] : null;
  const raw = fromPath || searchParams.get('ref');
  if (!raw) return null;
  const code = normalizeReferralCode(decodeURIComponent(raw));
  return isPlausibleReferralCode(code) ? code : null;
}

export function middleware(request: NextRequest) {
  /**
   * Intercepta o probe automático que o Chrome DevTools faz quando você abre
   * o painel de devtools (procurando configuração opcional de workspace).
   * Sem isso, cada abertura de DevTools gera um 404 no log do dev server.
   * Retornamos 204 No Content para que o navegador não tente novamente.
   */
  if (request.nextUrl.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new NextResponse(null, { status: 204 });
  }
  const response = NextResponse.next();
  // Guarda o código do link até o cadastro: a pessoa costuma navegar pela landing antes
  // de clicar em "Criar conta", e os CTAs apontam para /register sem a query.
  const code = referralCodeFrom(request);
  if (code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      path: '/',
      maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
      sameSite: 'lax',
      secure: request.nextUrl.protocol === 'https:',
    });
  }
  return response;
}

export const config = {
  matcher: ['/.well-known/:path*', '/', '/register', '/login', '/diagnostico', '/r/:code*'],
};
