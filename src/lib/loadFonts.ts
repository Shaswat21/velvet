/**
 * Dynamic Google Fonts Loader
 *
 * Uses the Google Fonts CSS API v2.  Each font family is loaded via
 * its own <link> element so that a single missing font can never
 * prevent the others from loading.
 *
 * We track loaded families by checking the DOM for existing <link>
 * elements rather than an in-memory Set, so the tracker survives
 * Vite HMR refreshes.
 */

function isAlreadyLoaded(family: string): boolean {
  const links = document.querySelectorAll<HTMLLinkElement>(
    'link[rel="stylesheet"][data-gfont]'
  );
  for (const link of links) {
    if (link.dataset.gfont === family) return true;
  }
  return false;
}

/**
 * Load a list of Google Font families dynamically.
 * Each font gets its own <link> tag so one unavailable font
 * can't break loading for the others.
 */
export function loadGoogleFonts(families: string[]): void {
  for (const family of families) {
    if (isAlreadyLoaded(family)) continue;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.gfont = family;
    link.href =
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;

    link.onerror = () => {
      console.warn(`[loadFonts] Failed to load font: "${family}"`);
      // Remove broken link so it can be retried later
      link.remove();
    };

    document.head.appendChild(link);
  }
}

/**
 * Preconnect to Google Fonts servers early (call once in app bootstrap).
 */
export function preconnectGoogleFonts(): void {
  if (document.querySelector('link[href*="fonts.gstatic.com"][rel="preconnect"]'))
    return;

  const preconn = document.createElement('link');
  preconn.rel = 'preconnect';
  preconn.href = 'https://fonts.gstatic.com';
  preconn.crossOrigin = 'anonymous';
  document.head.appendChild(preconn);
}
