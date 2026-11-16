'use strict';

const menuButton = document.querySelector('.mobile-menu-toggle');
const menu = document.querySelector('.primary-nav');
function closeMenu() {
  if (!menu || !menuButton) return;
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Ouvrir le menu');
}
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !menuButton.contains(e.target)) closeMenu();
  });
}
const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

// Animations au défilement : désactivées quand l'utilisateur préfère moins de mouvement.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealed = document.querySelectorAll('[data-reveal]');
if (!reducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  revealed.forEach((el, index) => {
    if (el.closest('.project-grid') || el.closest('.steps-grid')) {
      el.style.transitionDelay = `${(index % 4) * 65}ms`;
    }
    observer.observe(el);
  });
} else {
  revealed.forEach(el => el.classList.add('is-visible'));
}

// Barre de progression discrète ; une seule lecture par frame.
const progress = document.querySelector('#scroll-progress');
let ticking = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (progress) progress.style.width = `${(ratio * 100).toFixed(2)}%`;
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { window.requestAnimationFrame(updateProgress); ticking = true; }
}, { passive: true });
window.addEventListener('resize', updateProgress, { passive: true });
updateProgress();

const filters = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.project-card[data-categories]')];
const noResults = document.querySelector('#empty-filter');
for (const button of filters) {
  button.addEventListener('click', () => {
    const current = button.dataset.filter;
    filters.forEach(b => {
      const active = b === button;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    let visible = 0;
    cards.forEach(card => {
      const match = current === 'all' || card.dataset.categories.split(/\s+/).includes(current);
      card.hidden = !match;
      if (match) visible++;
    });
    if (noResults) noResults.hidden = visible > 0;
  });
}

const projectContent = {
  seance: {
    tag: '03 / JEU D’HORREUR — GAME DESIGN & EXPLORATION IA',
    title: 'Dernière Séance.',
    intro: 'Explorer un cinéma abandonné, avec une lampe torche et huit minutes avant le black-out.',
    concept: 'Un projet personnel de jeu en vue subjective, développé avec l’aide de l’IA. Les itérations ont porté sur le rythme de l’exploration, la lisibilité dans l’obscurité et les indices sonores. Le cinéma devient un terrain de jeu où le silence, la lumière et les apparitions entretiennent la tension.',
    features: [
      'Fouiller les salles, trouver trois fusibles et rétablir le courant',
      'Gérer sa lampe torche et son souffle pendant les poursuites',
      'Apercevoir des silhouettes traverser les couloirs sur une note de piano',
      'Surprendre le joueur avec deux screamers de couloir et des notes qui accompagnent les poursuites'
    ],
    liveUrl: '../derniere-seance/index.html',
    liveLabel: 'JOUER À DERNIÈRE SÉANCE ↗',
    images: [
      ['../assets/derniere-seance-gameplay.jpg', 'Vue du cinéma Le Rialto pendant une partie de Dernière Séance']
    ],
    notice: 'Jeu expérimental en HTML, Canvas et JavaScript, avec piano enregistré et bruitages créés avec Web Audio. Jouable sur ordinateur et mobile. Ambiance horrifique, apparitions soudaines et cris.'
  },
  orbit: {
    tag: '01 / APPLICATION CINÉMA — UX/UI & IDENTITÉ VISUELLE',
    title: 'Orbit.',
    intro: 'Une application cinéma où chaque film devient une planète à découvrir.',
    concept: 'Le cinéma est imaginé comme un voyage spatial : les genres deviennent des univers, les notes des étoiles et la réservation un parcours fluide. La direction visuelle associe bleu nuit, violets lumineux, planètes et formes arrondies.',
    features: [
      'Explorer des films et leurs univers cinématographiques',
      'Découvrir les séances et réserver sa sortie',
      'Commander des snacks à récupérer au cinéma',
      'Consulter des informations utiles depuis une interface mobile'
    ],
    caseUrl: '../projets/orbit.html',
    liveUrl: '../orbit/index.html#/home',
    images: [
      ['../assets/orbit-case/orbit-desktop-films.webp', 'Catalogue de films Orbit actualisé'],
      ['../assets/orbit-home-card.webp', 'Accueil Orbit avec les quatre images de films de la démo'],
      ['../assets/orbit-snacks-card.webp', 'Commande de snacks Orbit dans le même système visuel']
    ],
    notice: 'Mockups actualisés à partir des mêmes illustrations de films que la démonstration Orbit incluse. Application de cinéma conceptuelle, pas de réservation réelle.'
  },
  mood: {
    tag: '02 / PLAYLISTS & AMBIANCES — UX/UI & EXPLORATION IA',
    title: 'Mood.fm.',
    intro: 'Un générateur de playlists qui s’adapte à l’ambiance que l’on veut créer.',
    concept: 'Mood.fm permet de choisir une humeur (Focus, Nuit, Road trip, Pluie, Soirée, Chill) et d’ajuster énergie, positivité et tempo. Le prototype, développé à partir de Figma avec l’aide de l’IA, fait évoluer les couleurs et les visuels selon le mood.',
    features: [
      'Choix parmi six ambiances et réglage de trois curseurs',
      '160 véritables titres réorganisés instantanément à chaque réglage, avec liens Spotify',
      'Parcours Explorer, Bibliothèque, favoris et sauvegarde',
      'Interfaces mobile et desktop, notes musicales animées et interaction en direct'
    ],
    images: [
      ['../assets/mood-current-mobile.webp', 'Interface mobile Mood.fm mise à jour'],
      ['../assets/mood-current-studio.webp', 'Studio Mood.fm avec réglages et morceaux'],
      ['../assets/mood-current-artists.webp', 'Artistes recommandés et morceaux dans Mood.fm'],
      ['../assets/mood-current-studio.webp', 'Interface desktop Mood.fm avec réglages réactifs']
    ],
    caseUrl: '../projets/moodfm.html',
    liveUrl: '../moodfm/index.html',
    notice: 'Mood.fm contient 160 vrais titres ; les profils de vibe et tempos sont estimés pour le prototype. Portraits chargés depuis Wikipédia / Wikimedia Commons, sans lecture musicale intégrée.'
  }
};

const dialog = document.querySelector('#project-dialog');
const closeButton = dialog?.querySelector('.dialog-close');
let lastTrigger = null;
function renderProject(project) {
  document.querySelector('#dialog-tag').textContent = project.tag;
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-intro').textContent = project.intro;
  document.querySelector('#dialog-concept').textContent = project.concept;
  document.querySelector('#dialog-notice').textContent = project.notice;
  const live = document.querySelector('#dialog-live');
  if(live){live.hidden=!project.liveUrl; if(project.liveUrl){live.href=project.liveUrl;live.textContent=project.liveLabel || (project.title.toLowerCase().includes('orbit')?'TESTER ORBIT EN DIRECT ↗':'ESSAYER MOOD.FM EN DIRECT ↗');}}
  const caseLink = document.querySelector('#dialog-case');if(caseLink){caseLink.hidden=!project.caseUrl;if(project.caseUrl)caseLink.href=project.caseUrl;}
  const features = document.querySelector('#dialog-features');
  features.replaceChildren(...project.features.map(label => {
    const li = document.createElement('li'); li.textContent = label; return li;
  }));
  const gallery = document.querySelector('#dialog-gallery');
  gallery.classList.toggle('mood-preview',project.title==='Mood.fm.');
  gallery.classList.toggle('seance-preview',project.title==='Dernière Séance.');
  gallery.replaceChildren(...project.images.map(([src, alt]) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.loading = 'lazy';
    if (src.includes('desktop') || src.includes('studio') || src.includes('artists')) img.classList.add('landscape');
    return img;
  }));
  if(project.title === 'Mood.fm.'){
    // Aperçu véritable de l'application actuelle : toujours synchronisé avec la démo.
    const live=document.createElement('div');live.className='dialog-live-preview';
    const frame=document.createElement('iframe');frame.title='Aperçu en direct de Mood.fm';
    frame.src='../moodfm/index.html#studio';frame.loading='lazy';frame.tabIndex=-1;
    frame.setAttribute('aria-hidden','true');frame.setAttribute('scrolling','no');
    live.append(frame);gallery.replaceChildren(live);
  }
}
if (dialog && typeof dialog.showModal === 'function') {
  document.querySelectorAll('[data-project]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const p = projectContent[trigger.dataset.project];
      if (!p) return;
      lastTrigger = trigger;
      renderProject(p);
      dialog.showModal();
    });
  });
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus({ preventScroll: true }); });
  dialog.querySelector('.dialog-contact')?.addEventListener('click', () => dialog.close());
}



/* Matrix ambience: one animation loop, bounded canvases, explicit pause control. */
(() => {
  'use strict';
  const rain = document.querySelector('#matrix-rain');
  const globe = document.querySelector('#matrix-globe');
  const toggle = document.querySelector('#motion-toggle');
  const trigger = document.querySelector('#matrix-globe-button');
  if (!rain || !globe || !toggle) return;
  const r = rain.getContext('2d', { alpha: true });
  const g = globe.getContext('2d', { alpha: true });
  if (!r || !g) { toggle.hidden = true; return; }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !reduce.matches;
  try { if (!reduce.matches && localStorage.getItem('maxime-matrix-motion') === 'off') enabled = false; } catch (_) {}
  let raf = 0, last = 0, phase = 0, pulse = 0;
  let width = 0, height = 0, gw = 0, gh = 0;
  let streams = [];
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789<>:/+*';
  let seed = 747;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const points = [];
  for (let latitude = 1; latitude < 18; latitude++) {
    const a = Math.PI * latitude / 18;
    for (let longitude = 0; longitude < 34; longitude++) {
      const b = Math.PI * 2 * longitude / 34;
      points.push({ x:Math.sin(a)*Math.cos(b), y:Math.cos(a), z:Math.sin(a)*Math.sin(b), glyph:chars[(latitude*11+longitude*7)%chars.length] });
    }
  }
  const pointer = { x: 0, y: 0 };
  function canvasSize(canvas, context, w, h) {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, 2048 / w);
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvasSize(rain, r, width, height);
    const box = globe.getBoundingClientRect(); gw = Math.max(1, box.width); gh = Math.max(1, box.height);
    canvasSize(globe, g, gw, gh);
    seed = 747;
    streams = Array.from({ length:Math.ceil(width/24) }, (_, i) => ({ x:i*24+8, offset:random()*(height+420), speed:18+random()*42, length:9+Math.floor(random()*12), key:Math.floor(random()*997) }));
    draw();
  }
  function drawRain() {
    r.clearRect(0,0,width,height);
    r.font = '13px "IBM Plex Mono", monospace';
    r.textAlign = 'center';
    for (const stream of streams) {
      const y = (stream.offset + phase * stream.speed / 1000) % (height+400) - 90;
      for (let j = 0; j < stream.length; j++) {
        const yy = y-j*19; if (yy < -20 || yy > height+20) continue;
        const intensity = (1-j/stream.length);
        r.fillStyle = j===0 ? 'rgba(187,255,175,.55)' : `rgba(69,225,94,${(.33*intensity*intensity).toFixed(3)})`;
        const glyph = (stream.key+j*17+Math.floor(phase/(j===0?190:1300)))%chars.length;
        r.fillText(chars[glyph],stream.x,yy);
      }
    }
  }
  function drawGlobe() {
    g.clearRect(0,0,gw,gh);
    const cx=gw/2, cy=gh*.43, radius=Math.min(gw*.41,gh*.39);
    const gradient=g.createRadialGradient(cx,cy,0,cx,cy,radius*1.25);
    gradient.addColorStop(0,'rgba(31,111,53,.12)'); gradient.addColorStop(1,'rgba(7,20,11,0)');
    g.fillStyle=gradient;g.fillRect(0,0,gw,gh);
    const angle=phase*.00012+pointer.x*.2;
    const tilt=-.18+pointer.y*.12;
    const ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);
    const projected=points.map((p) => {
      const x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca;
      return {x,y:p.y*ct-z*st,z:p.y*st+z*ct,glyph:p.glyph};
    }).sort((a,b)=>a.z-b.z);
    g.textAlign='center';g.textBaseline='middle';
    for(const p of projected){
      const scale=2.8/(2.8-p.z);
      const wave=1+pulse*.055*Math.sin((p.y+1)*7-phase*.006);
      const alpha=.07+Math.pow((p.z+1)/2,2)*.72;
      g.font=`${Math.round(7+3*scale)}px "IBM Plex Mono",monospace`;
      g.fillStyle=`rgba(${p.z>.85?'183,255,159':'80,230,112'},${Math.min(.95,alpha+pulse*.08).toFixed(3)})`;
      g.fillText(p.glyph,cx+p.x*radius*scale*wave,cy+p.y*radius*scale*wave);
    }
  }
  function draw(){drawRain();drawGlobe();}
  function frame(now){
    raf=0;if(!enabled||document.hidden)return;
    if(!last)last=now;
    const dt=now-last;
    if(dt>=32){phase+=Math.min(dt,80);pulse=Math.max(0,pulse-dt/1300);last=now;draw();}
    raf=requestAnimationFrame(frame);
  }
  function sync(){
    cancelAnimationFrame(raf);raf=0;last=0;
    document.body.classList.toggle('matrix-static',!enabled);
    toggle.setAttribute('aria-pressed',String(enabled));
    toggle.setAttribute('aria-label',enabled?'Mettre les animations en pause':'Activer les animations');
    toggle.querySelector('.motion-label').textContent=enabled?'PAUSE':'ANIMER';
    toggle.querySelector('.motion-icon').textContent=enabled?'Ⅱ':'▷';
    draw();if(enabled&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  toggle.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('maxime-matrix-motion',enabled?'on':'off');}catch(_){}sync();});
  trigger.addEventListener('click',()=>{if(enabled){pulse=1;}else{phase+=950;draw();}});
  trigger.addEventListener('pointermove',(e)=>{if(e.pointerType==='touch')return;const b=trigger.getBoundingClientRect();pointer.x=(e.clientX-b.left)/b.width-.5;pointer.y=(e.clientY-b.top)/b.height-.5;});
  trigger.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
  document.addEventListener('visibilitychange',sync);
  reduce.addEventListener?.('change',e=>{enabled=!e.matches;sync();});
  let resizeFrame=0;
  window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);},{passive:true});
  resize();sync();
})();

(() => {
  const button=document.querySelector('#copy-email');
  const status=document.querySelector('#copy-feedback');
  if(!button||!status)return;
  button.addEventListener('click',async()=>{
    try{
      await navigator.clipboard.writeText('maximehamer922@gmail.com');
      status.textContent='Adresse e-mail copiée.';
      button.textContent='E-MAIL COPIÉ';
    }catch(_){
      const range=document.createRange();range.selectNodeContents(document.querySelector('.matrix-email'));
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      status.textContent='Adresse sélectionnée : utilise Copier pour la récupérer.';
    }
  });
})();
