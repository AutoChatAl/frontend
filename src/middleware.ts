import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Corrige URLs com duplo slash (ex: //oauth/callback → /oauth/callback)
  // Causado pelo backend redirecionando com slash inicial numa URL base que já termina com /
  if (pathname.startsWith('//')) {
    const fixedUrl = request.nextUrl.clone();
    fixedUrl.pathname = pathname.replace(/^\/+/, '/');
    return NextResponse.redirect(fixedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
