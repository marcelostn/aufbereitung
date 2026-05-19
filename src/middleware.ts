import { defineMiddleware } from 'astro:middleware';
import { hashPasswort } from './lib/auth';

const ADMIN_BACK_BUTTON = `
<a href="/admin" style="
  position:fixed;bottom:1.25rem;left:1.25rem;z-index:99999;
  background:#1e2125;border:1px solid #2c3036;color:#c7ccd3;
  font-family:'Inter',system-ui,sans-serif;font-size:0.8rem;font-weight:600;
  padding:0.5rem 0.85rem;border-radius:0.6rem;text-decoration:none;
  display:flex;align-items:center;gap:0.4rem;
  box-shadow:0 4px 16px rgba(0,0,0,0.5);
  transition:border-color 0.15s,color 0.15s;
" onmouseover="this.style.borderColor='#c9a86a';this.style.color='#c9a86a'"
   onmouseout="this.style.borderColor='#2c3036';this.style.color='#c7ccd3'">
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
  </svg>
  Admin
</a>`;

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const istGeschuetzt =
    (pathname.startsWith('/keystatic') || pathname.startsWith('/admin')) &&
    !pathname.startsWith('/admin-login');
  if (!istGeschuetzt) {
    return next();
  }

  const passwort = import.meta.env.CMS_PASSWORT;
  if (!passwort) {
    // Kein Passwort konfiguriert:
    //  - lokal (Dev-Server): durchlassen — nur auf diesem PC erreichbar, Komfort
    //  - Produktion: NICHT durchlassen, sonst ist der Admin-/CMS-Bereich
    //    für jeden im Internet offen (fail-closed statt fail-open).
    if (import.meta.env.DEV) {
      return next();
    }
    return new Response(
      `<!doctype html><html lang="de"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<title>Admin gesperrt</title></head>` +
        `<body style="font-family:system-ui,sans-serif;background:#0f1113;color:#f2f3f5;` +
        `display:flex;align-items:center;justify-content:center;min-height:100vh;` +
        `margin:0;padding:1.5rem;text-align:center">` +
        `<div style="max-width:34rem">` +
        `<h1 style="font-size:1.4rem;margin:0 0 .75rem">Admin-Bereich nicht freigeschaltet</h1>` +
        `<p style="color:#9aa0a8;line-height:1.6;margin:0">Es ist kein Admin-Passwort ` +
        `konfiguriert. Aus Sicherheitsgründen ist dieser Bereich gesperrt. Setze die ` +
        `Umgebungsvariable <code>CMS_PASSWORT</code> in den Projekteinstellungen, ` +
        `um ihn freizuschalten.</p></div></body></html>`,
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
  }

  const cookie = context.cookies.get('cms_auth');
  const erwartet = await hashPasswort(passwort);

  if (cookie?.value !== erwartet) {
    const loginUrl = new URL('/admin-login', context.url);
    loginUrl.searchParams.set('weiter', pathname);
    return context.redirect(loginUrl.toString());
  }

  const response = await next();

  // Floating "← Admin" button in Keystatic-Seiten einblenden
  if (
    pathname.startsWith('/keystatic') &&
    response.headers.get('content-type')?.includes('text/html')
  ) {
    const html = await response.text();
    // Keystatic hat kein </body> — einfach ans Ende anhängen
    const patched = html + ADMIN_BACK_BUTTON;
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(patched, { status: response.status, headers });
  }

  return response;
});
