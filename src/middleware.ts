export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /login
     * - /api/auth (NextAuth routes)
     * - /api/import-connections (Chrome extension — uses API key auth)
     * - /api/health
     * - /_next (Next.js internals)
     * - /favicon.ico, /icon*, /apple-icon* (static assets)
     */
    '/((?!login|api/auth|api/import-connections|api/health|_next|favicon\\.ico|icon|apple-icon).*)',
  ],
};
