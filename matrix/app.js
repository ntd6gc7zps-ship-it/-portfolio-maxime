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

  // Pointer decoration uses the existing animation clock; native cursor remains usable.
  const cursorCanvas=document.querySelector('#matrix-cursor');
  const cursorContext=cursorCanvas?.getContext('2d');
  const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  const cursorState={x:0,y:0,active:false,hover:false,clicked:-9999};
  const cursorTrail=Array.from({length:7},()=>({x:0,y:0}));
  function clearCursor(){cursorState.active=false;cursorContext?.clearRect(0,0,width,height);}
  document.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||!finePointer.matches||!enabled){clearCursor();return;}
    if(!cursorState.active)cursorTrail.forEach(p=>{p.x=e.clientX;p.y=e.clientY;});
    cursorState.x=e.clientX;cursorState.y=e.clientY;cursorState.active=true;
    cursorState.hover=!!e.target.closest?.('a,button,input,summary,[role="button"]');
  },{passive:true});
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')cursorState.clicked=phase;},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget||e.relatedTarget.tagName==='IFRAME')clearCursor();});
  document.addEventListener('keydown',e=>{if(e.key==='Tab')clearCursor();});
  window.addEventListener('blur',clearCursor);
  finePointer.addEventListener?.('change',clearCursor);
  function drawCursor(){
    if(!cursorContext)return;
    const c=cursorContext;c.clearRect(0,0,width,height);
    if(!enabled||!cursorState.active||!finePointer.matches)return;
    let previous=cursorState;
    cursorTrail.forEach((p,i)=>{
      p.x+=(previous.x-p.x)*.45;p.y+=(previous.y-p.y)*.45;previous=p;
      c.fillStyle='rgba(121,255,130,'+(.3*(1-i/7))+')';
      c.fillRect(p.x-1.2,p.y-1.2,2.4,2.4);
    });
    const x=cursorState.x,y=cursorState.y,radius=cursorState.hover?16:10;
    c.lineWidth=1;c.strokeStyle='rgba(147,255,120,.65)';
    c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.stroke();
    c.fillStyle='#b7ff9e';c.fillRect(x-1,y-1,2,2);
    const age=phase-cursorState.clicked;
    if(age>=0&&age<420){c.strokeStyle='rgba(169,255,143,'+(.5*(1-age/420))+')';c.beginPath();c.arc(x,y,10+age/20,0,Math.PI*2);c.stroke();}
  }

  function canvasSize(canvas, context, w, h) {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, 2048 / w);
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }
  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    canvasSize(rain, r, width, height);
    if(cursorContext)canvasSize(cursorCanvas,cursorContext,width,height);
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

  // Start upright; rotate an articulated skeleton instead of sliding its limbs.
  let sceneClock=0, sceneVisible=true;

  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,t)=>{const q=Math.max(0,Math.min(1,(t-a)/(b-a)));return q*q*q*(q*(q*6-15)+10);};
  const shift=(p,x,y)=>({x:p.x+x,y:p.y+y});
  const bone=(p,length,angle)=>shift(p,-Math.sin(angle)*length,-Math.cos(angle)*length);
  function kneeFor(hip,ankle){
    const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy);
    const h=Math.sqrt(Math.max(0,61*61-d*d/4));
    return {x:(hip.x+ankle.x)/2+dy/d*h,y:(hip.y+ankle.y)/2-dx/d*h};
  }
  function poseAt(t){
    const bend=smooth(2.2,4.8,t)*(1-smooth(9.5,12.6,t));
    const anticipation=smooth(1.8,2.4,t)*(1-smooth(2.4,3.2,t));
    const hip={x:248-12*bend,y:226+32*bend+4*anticipation};
    const waist=bone(hip,35,1.25*bend);
    const shoulder=bone(waist,58,1.65*bend);
    const neck=bone(shoulder,12,1.77*bend);
    const head=bone(neck,22,1.82*bend);
    const nearFoot={x:245,y:343},farFoot={x:285,y:343};
    const farHip=shift(hip,8,2);
    const nearKnee=kneeFor(hip,nearFoot),farKnee=kneeFor(farHip,farFoot);
    // Arms rotate at the shoulder and elbow; their lengths stay fixed.
    const elbow=shift(shoulder,Math.sin(.08-.6*bend)*43,Math.cos(.08-.6*bend)*43);
    const hand=shift(elbow,Math.sin(-.1-.8*bend)*39,Math.cos(-.1-.8*bend)*39);
    const farShoulder=shift(shoulder,8,1);
    const farElbow=shift(farShoulder,Math.sin(.19+.55*bend)*41,Math.cos(.19+.55*bend)*41);
    const farHand=shift(farElbow,Math.sin(.1+.8*bend)*38,Math.cos(.1+.8*bend)*38);
    return {bend,hip,waist,shoulder,neck,head,nearFoot,farFoot,farHip,nearKnee,farKnee,elbow,hand,farShoulder,farElbow,farHand};
  }

  function drawGlobe(){
    g.clearRect(0,0,gw,gh);g.save();
    const scale=Math.min(gw/440,gh/380);
    g.translate((gw-440*scale)/2,(gh-380*scale)/2);g.scale(scale,scale);
    const t=(sceneClock%15000)/1000;
    const p=poseAt(t),{bend,hip,waist,shoulder,neck,head}=p;
    const halo=g.createRadialGradient(225,235,10,225,235,190);
    halo.addColorStop(0,'rgba(43,147,76,.18)');halo.addColorStop(1,'rgba(4,13,8,0)');
    g.fillStyle=halo;g.fillRect(0,0,440,380);
    g.strokeStyle='#183c27';g.lineWidth=.6;
    for(let i=-6;i<=6;i++){g.beginPath();g.moveTo(225+i*12,290);g.lineTo(225+i*85,356);g.stroke();}
    for(const y of [294,304,323,351]){g.beginPath();g.moveTo(8,y);g.lineTo(432,y);g.stroke();}
    g.fillStyle='rgba(88,255,120,.08)';g.beginPath();g.ellipse(250,350,92,8,0,0,Math.PI*2);g.fill();
    function line(points,width,color){g.beginPath();g.moveTo(points[0].x,points[0].y);for(const q of points.slice(1))g.lineTo(q.x,q.y);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.stroke();}
    function ribbon(points,widths,fill,edge){
      const left=[],right=[];
      points.forEach((q,i)=>{const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1;
        left.push(shift(q,-dy/len*widths[i],dx/len*widths[i]));right.push(shift(q,dy/len*widths[i],-dx/len*widths[i]));});
      g.beginPath();g.moveTo(left[0].x,left[0].y);for(const q of left.slice(1))g.lineTo(q.x,q.y);for(const q of right.reverse())g.lineTo(q.x,q.y);g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=edge;g.lineWidth=1;g.lineJoin='round';g.stroke();
    }
    function boot(foot,dark){g.fillStyle=dark?'#07110d':'#0b1911';g.beginPath();g.moveTo(foot.x-7,foot.y-10);g.lineTo(foot.x+5,foot.y-10);g.quadraticCurveTo(foot.x+10,foot.y-4,foot.x+21,foot.y-3);g.quadraticCurveTo(foot.x+27,foot.y+1,foot.x+22,foot.y+4);g.lineTo(foot.x-8,foot.y+4);g.closePath();g.fill();line([shift(foot,-8,4),shift(foot,23,4)],1,'#6b9b73');}
    ribbon([p.farHip,p.farKnee,p.farFoot],[12,9,6],'#12271c','#345c41');boot(p.farFoot,true);
    ribbon([p.farShoulder,p.farElbow,p.farHand],[9,7,4],'#10271b','#30543d');
    line([p.farHand,shift(p.farHand,3,9)],6,'#61846a');
    // The coat hangs vertically when standing, then trails behind the backbend.
    const lag=poseAt(Math.max(0,t-.22)).bend;
    const hemA=shift(hip,-26-60*lag,91-19*lag),hemB=shift(hip,17-21*lag,88-8*lag);
    const fabric=g.createLinearGradient(hip.x-65,hip.y,hip.x+30,hip.y+90);
    fabric.addColorStop(0,'#10251a');fabric.addColorStop(.5,'#234631');fabric.addColorStop(1,'#09170f');
    g.beginPath();g.moveTo(waist.x-12,waist.y+7);
    g.bezierCurveTo(hip.x-21,hip.y+20,hemA.x+12,hemA.y-25,hemA.x,hemA.y);
    g.quadraticCurveTo(hip.x-8,hemA.y+5,hemB.x,hemB.y);
    g.lineTo(hip.x+17,hip.y-1);g.lineTo(waist.x+12,waist.y);g.closePath();g.fillStyle=fabric;g.fill();g.strokeStyle='#54855d';g.lineWidth=1;g.stroke();
    line([shift(hip,-9,20),shift(hemA,18,-8)],1,'#3c6748');
    ribbon([hip,p.nearKnee,p.nearFoot],[13,10,6],'#1a3424','#679674');boot(p.nearFoot,false);
    const jacket=g.createLinearGradient(shoulder.x-10,shoulder.y,hip.x+15,hip.y);jacket.addColorStop(0,'#254a33');jacket.addColorStop(.5,'#142c1e');jacket.addColorStop(1,'#0a1910');
    ribbon([shoulder,waist,hip],[17,14,15],jacket,'#77a580');
    const up={x:-Math.sin(1.65*bend),y:-Math.cos(1.65*bend)};
    const side={x:-up.y,y:up.x};
    const front=(q,n)=>shift(q,side.x*n,side.y*n);
    line([front(shoulder,8),front(waist,7),front(hip,9)],1,'#4c7956');
    line([front(shoulder,10),front(shift(shoulder,-up.x*22,-up.y*22),3),front(waist,8)],1.4,'#8eaf8a');
    // Neck and an upward-facing profile with dark hair and glasses.
    line([shoulder,neck,head],10,'#779b74');
    g.save();g.translate(head.x,head.y);g.rotate(-1.82*bend);
    const skin=g.createLinearGradient(-11,-8,14,9);skin.addColorStop(0,'#587c61');skin.addColorStop(1,'#b3c99a');
    g.beginPath();g.moveTo(-10,-11);g.quadraticCurveTo(5,-22,12,-9);g.lineTo(13,-2);g.lineTo(17,3);g.lineTo(12,5);g.quadraticCurveTo(11,16,4,17);g.lineTo(-6,12);g.quadraticCurveTo(-14,4,-10,-11);g.fillStyle=skin;g.fill();
    g.fillStyle='#08140c';g.beginPath();g.moveTo(-10,8);g.bezierCurveTo(-20,-17,2,-25,12,-11);g.lineTo(11,-7);g.quadraticCurveTo(1,-13,-5,-3);g.lineTo(-6,8);g.closePath();g.fill();
    g.fillStyle='#060c08';g.beginPath();g.moveTo(-1,-6);g.lineTo(14,-5);g.lineTo(13,1);g.lineTo(1,1);g.closePath();g.fill();line([{x:-7,y:-4},{x:13,y:-5}],1,'#c0dfb1');
    line([{x:8,y:10},{x:11,y:10}],.8,'#4e7055');g.restore();
    ribbon([shoulder,p.elbow,p.hand],[10,8,5],'#234631','#88ae86');
    line([p.hand,shift(p.hand,-4*bend,8)],7,'#a2bd90');
    for(let i=0;i<3;i++)line([shift(p.hand,-2+i*2,4),shift(p.hand,-5*bend-2+i*2,12)],1.2,'#b7cea0');
    // Bullets arrive only once the backwards movement has begun.
    for(let i=0;i<3;i++){
      const age=t-(3.2+i*.55);if(age<0||age>5.5)continue;
      const x=480-age/5.5*600,y=145+i*33;
      const trail=g.createLinearGradient(x,0,x+130,0);
      trail.addColorStop(0,'rgba(186,255,169,.65)');trail.addColorStop(.25,'rgba(90,255,122,.2)');trail.addColorStop(1,'rgba(90,255,122,0)');
      g.fillStyle=trail;g.fillRect(x,y-1,130,2);g.strokeStyle='rgba(133,255,152,.2)';g.lineWidth=.8;
      for(let j=1;j<=4;j++){g.beginPath();g.ellipse(x+j*21,y,2+j,5+j*2,0,0,Math.PI*2);g.stroke();}
      g.shadowColor='#a7ff9a';g.shadowBlur=9;g.fillStyle='#d8f8b9';g.beginPath();g.moveTo(x-6,y);g.quadraticCurveTo(x-1,y-4,x+9,y-3);g.lineTo(x+10,y+3);g.quadraticCurveTo(x-1,y+4,x-6,y);g.fill();g.shadowBlur=0;
    }
    g.strokeStyle='#3d6947';g.lineWidth=1;
    for(const [x,y,sx,sy] of [[19,18,1,1],[421,18,-1,1],[19,357,1,-1],[421,357,-1,-1]]){g.beginPath();g.moveTo(x,y+sy*9);g.lineTo(x,y);g.lineTo(x+sx*9,y);g.stroke();}
    g.font='9px "IBM Plex Mono",monospace';g.textAlign='left';g.fillStyle='#91b299';g.fillText('BULLET TIME',30,37);
    g.textAlign='right';g.fillStyle='#bdff9f';g.fillText(t<2.2?'01 / DEBOUT':t<4.8?'02 / ESQUIVE':t<9.5?'03 / RALENTI':t<12.6?'04 / RETOUR':'01 / DEBOUT',410,37);
    g.restore();
  }
  function draw(){drawRain();drawGlobe();drawCursor();}
  function frame(now){
    raf=0;if(!enabled||document.hidden)return;
    if(!last)last=now;
    const dt=now-last;
    if(dt>=32){phase+=Math.min(dt,80);if(sceneVisible)sceneClock+=Math.min(dt,80);last=now;draw();}
    raf=requestAnimationFrame(frame);
  }
  function sync(){
    cancelAnimationFrame(raf);raf=0;last=0;
    if(!enabled||document.hidden)clearCursor();
    document.body.classList.toggle('matrix-static',!enabled);
    toggle.setAttribute('aria-pressed',String(enabled));
    toggle.setAttribute('aria-label',enabled?'Mettre les animations en pause':'Activer les animations');
    toggle.querySelector('.motion-label').textContent=enabled?'PAUSE':'ANIMER';
    toggle.querySelector('.motion-icon').textContent=enabled?'Ⅱ':'▷';
    draw();if(enabled&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  toggle.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('maxime-matrix-motion',enabled?'on':'off');}catch(_){}sync();});
  trigger.addEventListener('click',()=>{sceneClock=0;draw();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{sceneVisible=entries[0].isIntersecting;},{threshold:.15}).observe(globe);
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
