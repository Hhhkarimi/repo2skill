import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, isLocale } from '@/lib/i18n/config';

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com https://raw.githubusercontent.com",
    "worker-src 'self' blob:",
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/') {
    const url = request.nextUrl.clone(); url.pathname = `/${defaultLocale}`; return NextResponse.redirect(url, 307);
  }
  const first = pathname.split('/').filter(Boolean)[0];
  if (first && !isLocale(first) && !pathname.startsWith('/_next/') && !pathname.includes('.')) {
    const url = request.nextUrl.clone(); url.pathname = `/${defaultLocale}${pathname}`; return NextResponse.redirect(url, 307);
  }
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
export const config = { matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }, { type: 'header', key: 'purpose', value: 'prefetch' }] }] };
