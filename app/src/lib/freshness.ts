/**
 * GitHub Pages lets browsers cache index.html for up to ten minutes, so a phone can keep showing an
 * older build after a release. On load and when the app comes back to the foreground, fetch the page
 * fresh and reload once if it points at a different app bundle.
 */
export function keepFresh() {
  if (typeof window === 'undefined' || !/^https?:$/.test(location.protocol) || location.hostname === 'localhost') return;
  const mine = document.querySelector<HTMLScriptElement>('script[type="module"][src]')?.getAttribute('src');
  if (!mine) return;
  const check = async () => {
    try {
      const html = await (await fetch(`${location.pathname}?fresh=${Date.now()}`, { cache: 'no-store' })).text();
      const latest = html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1];
      if (latest && latest !== mine && sessionStorage.getItem('within-reloaded') !== latest) {
        sessionStorage.setItem('within-reloaded', latest);
        location.reload();
      }
    } catch {
      // Offline or blocked: keep the version we have.
    }
  };
  void check();
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void check());
}
