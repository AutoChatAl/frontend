import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Intercepta o probe automático que o Chrome DevTools faz quando você abre
 * o painel de devtools (procurando configuração opcional de workspace).
 * Sem isso, cada abertura de DevTools gera um 404 no log do dev server.
 * Retornamos 204 No Content para que o navegador não tente novamente.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/.well-known/:path*'],
};
