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
    const count = document.querySelector('#terminal-count');
    if (count) count.textContent = `${visible} projet${visible === 1 ? '' : 's'} affiché${visible === 1 ? '' : 's'}`;
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
  let raf = 0, last = 0, phase = 0;
  let width = 0, height = 0, gw = 0, gh = 0;
  let streams = [];
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ012345789<>:/+*';
  let seed = 747;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
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
    streams = Array.from({ length:Math.ceil(width/18) }, (_, i) => ({ x:i*18+8, offset:random()*(height+420), speed:18+random()*42, length:12+Math.floor(random()*15), key:Math.floor(random()*997) }));
    draw();
  }
  function drawRain() {
    r.clearRect(0,0,width,height);
    r.font = '14px "IBM Plex Mono", monospace';
    r.textAlign = 'center';
    for (const stream of streams) {
      const y = (stream.offset + phase * stream.speed / 1000) % (height+400) - 90;
      for (let j = 0; j < stream.length; j++) {
        const yy = y-j*19; if (yy < -20 || yy > height+20) continue;
        const intensity = (1-j/stream.length);
        r.fillStyle = j===0 ? 'rgba(187,255,175,.7)' : `rgba(69,225,94,${(.48*intensity*intensity).toFixed(3)})`;
        const glyph = (stream.key+j*17+Math.floor(phase/(j===0?190:1300)))%chars.length;
        r.fillText(chars[glyph],stream.x,yy);
      }
    }
  }
  // A twelve-second loop: anticipation, backbend, suspended bullets, recovery.
  let sceneStart = -2700;
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = (a,b,t) => { const x=Math.max(0,Math.min(1,(t-a)/(b-a))); return x*x*(3-2*x); };
  function drawGlobe() {
    g.clearRect(0,0,gw,gh);
    g.save();
    const scale=Math.min(gw/400,gh/360);
    g.translate((gw-400*scale)/2,(gh-360*scale)/2);
    g.scale(scale,scale);
    const t=((phase-sceneStart)%12000)/1000;
    const bend=smooth(.9,2.7,t)*(1-smooth(8.4,10.3,t));
    const float=Math.sin(t*2)*bend*1.5;
    const hip={x:220,y:242+5*bend};
    const shoulder={x:mix(217,141,bend),y:mix(136,207,bend)+float};
    const head={x:mix(220,104,bend),y:mix(104,204,bend)+float};
    const neck={x:mix(218,129,bend),y:mix(128,207,bend)+float};
    const nearKnee={x:mix(208,241,bend),y:297};
    const farKnee={x:mix(244,266,bend),y:296};
    const palm={x:mix(252,98,bend),y:mix(224,266,bend)};
    const elbow={x:mix(238,133,bend),y:mix(184,247,bend)};
    // Faint perspective grid and floor halo.
    const halo=g.createRadialGradient(198,215,15,198,215,180);
    halo.addColorStop(0,'rgba(41,137,72,.16)');halo.addColorStop(1,'rgba(5,20,10,0)');
    g.fillStyle=halo;g.fillRect(0,0,400,360);
    g.lineWidth=.6;g.strokeStyle='#183c27';
    for(let i=-5;i<=5;i++){g.beginPath();g.moveTo(200+i*10,277);g.lineTo(200+i*94,354);g.stroke();}
    for(const y of [281,291,309,337]){g.beginPath();g.moveTo(0,y);g.lineTo(400,y);g.stroke();}
    g.fillStyle='rgba(95,255,126,.09)';g.beginPath();g.ellipse(230,337,90,8,0,0,Math.PI*2);g.fill();
    function line(points,width,color){g.beginPath();g.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))g.lineTo(p.x,p.y);g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.strokeStyle=color;g.stroke();}
    function leg(knee,foot,dark){line([hip,knee,foot],dark?16:19,dark?'#10271c':'#1e3d2b');line([{x:hip.x+5,y:hip.y+8},{x:knee.x+5,y:knee.y},{x:foot.x+4,y:foot.y-6}],1,'#5d9d6c');line([{x:foot.x-5,y:foot.y},{x:foot.x+16,y:foot.y}],10,'#08130d');line([{x:foot.x-5,y:foot.y+4},{x:foot.x+19,y:foot.y+4}],1,'#86c58a');}
    leg(farKnee,{x:286,y:332},true);
    // Long coat, with the hem suspended behind the torso.
    g.beginPath();g.moveTo(shoulder.x-9,shoulder.y-8);
    g.bezierCurveTo(shoulder.x-31,shoulder.y+29,hip.x-63,hip.y+45,hip.x-64-32*bend,321-13*bend);
    g.quadraticCurveTo(hip.x-31,318-10*bend,hip.x+9,277);
    g.lineTo(hip.x+19,hip.y-2);g.lineTo(shoulder.x+14,shoulder.y+5);g.closePath();
    const coat=g.createLinearGradient(120,190,245,275);coat.addColorStop(0,'#07110c');coat.addColorStop(.52,'#183424');coat.addColorStop(1,'#09170f');
    g.fillStyle=coat;g.fill();g.strokeStyle='#538f60';g.lineWidth=1.2;g.stroke();
    leg(nearKnee,{x:211,y:334},false);
    // Torso and lapel contours make the silhouette readable in the dark.
    line([shoulder,{x:mix(219,176,bend),y:mix(185,224,bend)},hip],28,'#132b1d');
    line([{x:shoulder.x-10,y:shoulder.y-3},{x:hip.x-14,y:hip.y+3}],1.5,'#7bb884');
    line([{x:shoulder.x+10,y:shoulder.y+4},{x:mix(227,168,bend),y:mix(164,213,bend)},{x:hip.x+7,y:hip.y}],1,'#3e7650');
    // Far arm, then foreground sleeve and hand.
    line([{x:shoulder.x+5,y:shoulder.y+6},{x:mix(195,170,bend),y:mix(182,256,bend)},{x:mix(192,147,bend),y:mix(222,275,bend)}],10,'#102219');
    line([shoulder,elbow,palm],13,'#244831');
    line([{x:shoulder.x-4,y:shoulder.y+3},{x:elbow.x-4,y:elbow.y},{x:palm.x-4,y:palm.y}],1,'#85bd8c');
    line([palm,{x:palm.x-5*bend,y:palm.y+9}],7,'#86ad80');
    line([neck,head],11,'#68906b');
    // Head follows the backbend; tiny sunglasses remain distinct.
    g.save();g.translate(head.x,head.y);g.rotate(-1.25*bend);
    g.fillStyle='#92b98a';g.beginPath();g.ellipse(0,0,13,18,.08,0,Math.PI*2);g.fill();
    g.fillStyle='#08150e';g.beginPath();g.moveTo(-13,1);g.bezierCurveTo(-17,-20,5,-25,13,-9);g.lineTo(4,-10);g.lineTo(-3,-4);g.lineTo(-6,8);g.closePath();g.fill();
    g.fillStyle='#070c08';g.fillRect(1,-6,14,6);g.strokeStyle='#bdffad';g.lineWidth=1;g.beginPath();g.moveTo(2,-6);g.lineTo(14,-6);g.stroke();
    g.fillStyle='#aac89b';g.beginPath();g.moveTo(12,-2);g.lineTo(17,3);g.lineTo(12,5);g.closePath();g.fill();g.restore();
    // Three staggered projectiles, long wakes and compressed air rings.
    for(let i=0;i<3;i++){
      const age=t-(1.7+i*.68);if(age<0||age>6.35)continue;
      const p=age/6.35;
      const x=470-p*600,y=140+i*23;
      const trail=g.createLinearGradient(x,0,x+140,0);
      trail.addColorStop(0,'rgba(186,255,169,.6)');trail.addColorStop(.2,'rgba(90,255,122,.22)');trail.addColorStop(1,'rgba(90,255,122,0)');
      g.fillStyle=trail;g.fillRect(x,y-1,140,2);
      g.strokeStyle='rgba(133,255,152,.17)';g.lineWidth=1;
      for(let j=1;j<=4;j++){g.beginPath();g.ellipse(x+j*24,y,3+j,6+j*1.5,0,0,Math.PI*2);g.stroke();}
      g.shadowColor='#b5ff9e';g.shadowBlur=10;g.fillStyle='#d9ffd0';
      g.beginPath();g.moveTo(x-6,y);g.quadraticCurveTo(x-1,y-4,x+10,y-3);g.lineTo(x+11,y+3);g.quadraticCurveTo(x-1,y+4,x-6,y);g.fill();g.shadowBlur=0;
    }
    // Restrained film-frame details, no flashing or sound.
    g.strokeStyle='#44794e';g.lineWidth=1;
    for(const [x,y,sx,sy] of [[20,20,1,1],[380,20,-1,1],[20,344,1,-1],[380,344,-1,-1]]){g.beginPath();g.moveTo(x,y+sy*10);g.lineTo(x,y);g.lineTo(x+sx*10,y);g.stroke();}
    g.font='9px "IBM Plex Mono",monospace';g.textAlign='left';g.fillStyle='#7eaa87';g.fillText('BULLET TIME',30,38);
    g.textAlign='right';g.fillStyle=bend>.9?'#bdff9f':'#7eaa87';g.fillText(bend>.9?'0.1 ×  /  SLOW MOTION':'1.0 ×  /  MATRIX',370,38);
    g.restore();
  }
  function draw(){drawRain();drawGlobe();}
  function frame(now){
    raf=0;if(!enabled||document.hidden)return;
    if(!last)last=now;
    const dt=now-last;
    if(dt>=32){phase+=Math.min(dt,80);last=now;draw();}
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
  trigger.addEventListener('click',()=>{sceneStart=enabled?phase:phase-4500;draw();});
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
