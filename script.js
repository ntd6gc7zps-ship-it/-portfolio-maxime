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
    caseUrl: 'projets/orbit.html',
    liveUrl: 'orbit/index.html#/home',
    images: [
      ['assets/orbit-case/orbit-desktop-films.webp', 'Catalogue de films Orbit actualisé'],
      ['assets/orbit-home-card.webp', 'Accueil Orbit avec les quatre images de films de la démo'],
      ['assets/orbit-snacks-card.webp', 'Commande de snacks Orbit dans le même système visuel']
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
      ['assets/mood-current-mobile.webp', 'Interface mobile Mood.fm mise à jour'],
      ['assets/mood-current-studio.webp', 'Studio Mood.fm avec réglages et morceaux'],
      ['assets/mood-current-artists.webp', 'Artistes recommandés et morceaux dans Mood.fm'],
      ['assets/mood-current-studio.webp', 'Interface desktop Mood.fm avec réglages réactifs']
    ],
    caseUrl: 'projets/moodfm.html',
    liveUrl: 'moodfm/index.html',
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
  if(live){live.hidden=!project.liveUrl; if(project.liveUrl){live.href=project.liveUrl;live.textContent=project.title.toLowerCase().includes('orbit')?'TESTER ORBIT EN DIRECT ↗':'ESSAYER MOOD.FM EN DIRECT ↗';}}
  const caseLink = document.querySelector('#dialog-case');if(caseLink){caseLink.hidden=!project.caseUrl;if(project.caseUrl)caseLink.href=project.caseUrl;}
  const features = document.querySelector('#dialog-features');
  features.replaceChildren(...project.features.map(label => {
    const li = document.createElement('li'); li.textContent = label; return li;
  }));
  const gallery = document.querySelector('#dialog-gallery');
  gallery.classList.toggle('mood-preview',project.title==='Mood.fm.');
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
    frame.src='moodfm/index.html#studio';frame.loading='lazy';frame.tabIndex=-1;
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


/* Click / tap / keyboard activation: rotate the planet on its own axis.
   The sphere stays in place; its surface rotates as a 3D layer while
   the orbit ring accelerates for a short, repeatable response. */
(() => {
  const button = document.querySelector('.planet-rotate-button');
  const sphere = document.querySelector('.planet-main');
  const ring = document.querySelector('.planet-ring');
  const stage = document.querySelector('.hero-stage');
  if (!button || !sphere || !ring || !stage) return;
  let resetId;
  button.addEventListener('click', () => {
    // Restart on every click, even during an earlier rotation.
    sphere.classList.remove('is-spinning');
    ring.classList.remove('is-spinning');
    stage.classList.remove('planet-activated');
    void sphere.offsetWidth;
    sphere.classList.add('is-spinning');
    ring.classList.add('is-spinning');
    stage.classList.add('planet-activated');
    window.clearTimeout(resetId);
    resetId = window.setTimeout(() => {
      sphere.classList.remove('is-spinning');
      ring.classList.remove('is-spinning');
      stage.classList.remove('planet-activated');
    }, 1750);
  });
})();

/* Motion layers — 1 lightweight canvas for slow-moving stars, another for the
   lilac / blue mouse trail. Native pointer remains visible. Animations stop
   when the tab is hidden and respect prefers-reduced-motion. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const starCanvas = document.querySelector('#starfield');
  const trailCanvas = document.querySelector('#mouse-trail');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let active = !document.hidden && !reduce.matches;
  let stopped = false;
  if (!starCanvas || !trailCanvas || reduce.matches) return;

  function fit(canvas) {
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d', { alpha:true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {ctx, w, h};
  }
  let bg = fit(starCanvas);
  let trail = fit(trailCanvas);
  // Seeded pseudorandom for consistent layout between frames and reloads.
  let seed = 8140726;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  let stars = [];
  function resetStars() {
    const n = Math.min(95, Math.max(28, Math.floor(bg.w * bg.h / 14700)));
    stars = Array.from({ length:n }, (_, i) => ({
      x:random()*bg.w, y:random()*bg.h, radius: .38+random()*1.35,
      speed:.05+random()*.17, twinkle:random()*6.283,
      hue: i%7===0?'139,166,255':'201,194,255', layer:.5+random()*.5
    }));
  }
  resetStars();
  const pointer = {x:-100,y:-100,seen:false,lastTime:0};
  const nodes = [];
  let lastSpawn=0;
  // pointermove provides continuous samples even while native cursor is visible.
  if(finePointer.matches) {
    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const now = performance.now();
      pointer.x = event.clientX; pointer.y = event.clientY;
      pointer.seen=true; pointer.lastTime=now;
      if (now-lastSpawn > 11) {
        nodes.push({x:pointer.x,y:pointer.y,born:now,ttl:650+Math.random()*200,r:2.1+Math.random()*2.3});
        if(nodes.length>44) nodes.shift();
        lastSpawn=now;
      }
    }, {passive:true});
    document.addEventListener('pointerleave', () => {pointer.seen=false;});
  }
  // Individual meteors: glide diagonally, glow briefly, then fade to nothing.
  // Only 1–2 exist at a time so the background stays gentle and cheap to render.
  const shootingStars=[];
  let nextShootingTime=performance.now()+1300;
  function createMeteor(now) {
    const speed=240+random()*200;
    const heading=.32+random()*.28;
    shootingStars.push({
      x:bg.w*(.30+random()*.78),
      y:bg.h*(.025+random()*.52),
      dx:-Math.cos(heading)*speed, dy:Math.sin(heading)*speed,
      length:52+random()*96,
      born:now, ttl:850+random()*630,
      hue:random()>.42?'185,166,255':'143,187,255'
    });
  }
  let prev=0;
  function draw(now) {
    if (stopped) return;
    if (!active) {requestAnimationFrame(draw);return;}
    // Cap to ~30-50fps for modest energy use while keeping motion fluid.
    const delta = Math.min(40, now-prev); if (delta<18) {requestAnimationFrame(draw);return;} prev=now;
    const {ctx:c,w,h} = bg;
    c.clearRect(0,0,w,h);
    // Subtle nebula and sparse stars behind the actual page content.
    const shift=now*.000018;
    for(let i=0;i<stars.length;i++) {
      const p=stars[i];
      p.y+=p.speed*delta*.038;
      if(p.y>h+6){p.y=-5;p.x=random()*w;}
      const opacity=.16 + .44*(.5+.5*Math.sin(now*.00067+p.twinkle));
      c.beginPath();c.arc(p.x + Math.sin(shift+p.twinkle)*7, p.y, p.radius,0,Math.PI*2);
      c.fillStyle=`rgba(${p.hue},${(opacity*p.layer).toFixed(3)})`;c.fill();
    }
    // Shooting stars glow and disappear instead of looping permanently.
    if(now>=nextShootingTime){
      if(shootingStars.length<2)createMeteor(now);
      nextShootingTime=now+1900+random()*3300;
    }
    for(let i=shootingStars.length-1;i>=0;i--){
      const m=shootingStars[i];
      const age=now-m.born;
      if(age>m.ttl){shootingStars.splice(i,1);continue;}
      const t=age/m.ttl;
      const brightness=Math.pow(Math.sin(Math.PI*t),1.65);
      const x=m.x+m.dx*(age/1000), y=m.y+m.dy*(age/1000);
      const magnitude=Math.hypot(m.dx,m.dy),ux=m.dx/magnitude,uy=m.dy/magnitude;
      const tailX=x-ux*m.length,tailY=y-uy*m.length;
      const grad=c.createLinearGradient(tailX,tailY,x,y);
      grad.addColorStop(0,`rgba(${m.hue},0)`);
      grad.addColorStop(.6,`rgba(${m.hue},${(.12*brightness).toFixed(3)})`);
      grad.addColorStop(1,`rgba(246,241,255,${(.88*brightness).toFixed(3)})`);
      c.save();
      c.strokeStyle=grad;c.lineWidth=2.1;c.lineCap='round';
      c.shadowColor='#a68cff';c.shadowBlur=17*brightness;
      c.beginPath();c.moveTo(tailX,tailY);c.lineTo(x,y);c.stroke();
      const halo=c.createRadialGradient(x,y,0,x,y,11);
      halo.addColorStop(0,`rgba(255,255,255,${(.93*brightness).toFixed(3)})`);
      halo.addColorStop(.23,`rgba(${m.hue},${(.72*brightness).toFixed(3)})`);
      halo.addColorStop(1,`rgba(${m.hue},0)`);
      c.fillStyle=halo;c.beginPath();c.arc(x,y,11,0,Math.PI*2);c.fill();
      c.restore();
    }

    const tc=trail.ctx;tc.clearRect(0,0,trail.w,trail.h);
    if(finePointer.matches) {
      for(let i=nodes.length-1;i>=0;i--){
        const p=nodes[i]; const age=now-p.born;
        if(age>=p.ttl){nodes.splice(i,1);continue;}
        const a=Math.pow(1-age/p.ttl,1.4)*.87;
        const rad=p.r*(.55+age/p.ttl*.9);
        tc.beginPath();tc.arc(p.x,p.y,rad*3.4,0,Math.PI*2);
        const glow=tc.createRadialGradient(p.x,p.y,0,p.x,p.y,rad*3.4);
        glow.addColorStop(0,`rgba(154,124,255,${(a*.47).toFixed(3)})`);
        glow.addColorStop(1,'rgba(103,135,255,0)');
        tc.fillStyle=glow;tc.fill();
        tc.beginPath();tc.arc(p.x,p.y,rad,0,Math.PI*2);
        tc.fillStyle=`rgba(${i%4?'165,133,255':'117,157,255'},${a.toFixed(3)})`;tc.fill();
      }
    }
    requestAnimationFrame(draw);
  }
  const resize=()=>{bg=fit(starCanvas);trail=fit(trailCanvas);shootingStars.length=0;resetStars()};
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{active=!document.hidden&&!reduce.matches;});
  reduce.addEventListener?.('change',(event)=>{if(event.matches){stopped=true;bg.ctx.clearRect(0,0,bg.w,bg.h);trail.ctx.clearRect(0,0,trail.w,trail.h);}else if(stopped){window.location.reload();}});
  requestAnimationFrame(draw);
})();
