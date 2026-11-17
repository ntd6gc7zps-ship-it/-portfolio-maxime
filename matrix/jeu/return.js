(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('from') !== 'matrix-game') return;
  const gameURL = new URL('./', document.currentScript.src);
  const rootURL = new URL('../../', gameURL);
  const returnPaths = new Set([rootURL.pathname, rootURL.pathname + 'index.html', rootURL.pathname + 'matrix/', rootURL.pathname + 'matrix/index.html']);
  function updateLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.href, location.href);
      if (url.origin !== rootURL.origin || !returnPaths.has(url.pathname)) return;
      if (url.hash && url.hash !== '#projets') return;
      link.href = gameURL.href;
      link.removeAttribute('target');
      link.setAttribute('aria-label', 'Retour à la Matrice');
      if (!link.classList.contains('brand')) link.textContent = '← Retour à la Matrice';
    });
  }
  updateLinks();
  new MutationObserver(updateLinks).observe(document.body, { childList: true, subtree: true });
})();
