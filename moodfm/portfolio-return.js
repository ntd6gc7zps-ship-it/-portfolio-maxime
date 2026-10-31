// Retour vers le portfolio intégré ou vers le portfolio public si Mood.fm est publié seul.
(function () {
  const integrated=/\/moodfm\/(?:index\.html)?$/.test(location.pathname);
  const target=integrated?'../index.html#projets':'https://majestic-haupia-df580b.netlify.app/#projets';
  document.querySelectorAll('[data-portfolio-return]').forEach(link=>link.setAttribute('href',target));
})();
