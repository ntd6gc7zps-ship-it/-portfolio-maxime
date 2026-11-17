(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const canvas = $('world');
  const ctx = canvas.getContext('2d');
  const map = $('map').getContext('2d');
  const projects = [
    { id: 'orbit', name: 'Orbit', x: 390, y: 390, color: '#bba2ff' },
    { id: 'mood', name: 'Mood.fm', x: 1110, y: 390, color: '#f0accf' },
    { id: 'seance', name: 'Dernière Séance', x: 390, y: 850, color: '#dbba82' },
    { id: 'apwap', name: 'APWAP', x: 1110, y: 850, color: '#e1d7ac' }
  ].map(p => ({ ...p, element: document.querySelector(`.portal[data-project="${p.id}"]`) }));
  const storageKey = 'maxime-matrix-game-v1';
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(storageKey) || '{}') || {}; } catch (_) {}
  const visited = new Set(Array.isArray(saved.visited) ? saved.visited.filter(id => projects.some(p => p.id === id)) : []);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const player = { x: 750, y: 620, facing: 1, walking: false, step: 0 };
  if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    player.x = clamp(saved.x, 130, 1370); player.y = clamp(saved.y, 230, 1030);
  }
  const camera = { x: player.x, y: player.y - 50 };
  let width = 0, height = 0, zoom = 1, pixelRatio = 1, mobileLayout = false;
  let leavingProject = null;
  let target = null, nearest = null, transfer = null, cooldown = 1.5, previousTime = 0, frameId = 0;
  let introVisible = !saved.started;
  let animated = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const keys = new Set();
  const touch = new Set();
  const motionKeys = new Set(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','z','q','shift']);
  const padButtons = [...document.querySelectorAll('.pad')];
  const rain = Array.from({ length: 74 }, (_, i) => ({ x: (i * 73 % 997) / 997, y: (i * 127 % 991) / 991, speed: 14 + i % 23, length: 8 + i % 17 }));
  const glyphs = 'アイウエオカキクケコサシスセソ012345789';
  const servers = [ [170,270,30], [250,170,55], [560,185,33], [940,185,55], [1250,170,42], [1330,270,30], [155,610,60], [1345,610,60], [180,1010,40], [580,1060,50], [920,1060,50], [1320,1010,40] ];

  function storePosition(x = player.x, y = player.y) {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ x: mobileLayout ? 750 + (x - 750) * 720 / 250 : x, y, visited: [...visited], started: !introVisible })); } catch (_) {}
  }
  function updateVisited() {
    $('visited-count').textContent = `${visited.size} / 4 explorés`;
    projects.forEach(p => p.element.classList.toggle('visited', visited.has(p.id)));
  }
  function start() {
    introVisible = false; $('intro-hint').hidden = true;
    storePosition();
  }
  function clearInput() {
    keys.clear(); touch.clear(); target = null; player.walking = false;
    padButtons.forEach(b => b.classList.remove('is-down'));
  }
  function isDialogOpen() { return $('directory').open || $('help').open; }
  function announce(message) { $('game-status').textContent = message; }
  function saveVisit(p) {
    visited.add(p.id); updateVisited();
    storePosition(p.x, p.y + 112);
  }
  function cancelTransfer() {
    if (!transfer) return;
    transfer = null; cooldown = 2; clearInput(); $('transfer').hidden = true;
    canvas.focus({ preventScroll: true }); announce('Connexion annulée. Tu peux continuer à explorer.');
  }
  function enter(p) {
    if (!p || transfer) return;
    start(); clearInput(); transfer = { project: p, elapsed: 0, startedAt: performance.now() };
    $('transfer-name').textContent = p.name;
    $('transfer-progress').style.width = '0%'; $('transfer').hidden = false;
    $('cancel-transfer').focus({ preventScroll: true });
    announce(`Ouverture de ${p.name}. Échap pour annuler.`);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const compact = width < 600;
    if (compact !== mobileLayout) {
      player.x = 750 + (player.x - 750) * (compact ? 250 / 720 : 720 / 250);
      projects.forEach((p, i) => { p.x = compact ? (i % 2 ? 875 : 625) : (i % 2 ? 1110 : 390); });
      mobileLayout = compact; clearInput();
    }
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
    zoom = width < 600 ? .82 : clamp(Math.min(width / 1300, height / 820), .50, .95);
  }
  function screen(x, y) { return { x: (x - camera.x) * zoom + width / 2, y: (y - camera.y) * zoom + height / 2 }; }
  function move(dt) {
    const dx = Number(keys.has('arrowright') || keys.has('d') || touch.has('right')) - Number(keys.has('arrowleft') || keys.has('a') || keys.has('q') || touch.has('left'));
    const dy = Number(keys.has('arrowdown') || keys.has('s') || touch.has('down')) - Number(keys.has('arrowup') || keys.has('w') || keys.has('z') || touch.has('up'));
    let vx = dx, vy = dy;
    if (dx || dy) target = null;
    else if (target) {
      vx = target.x - player.x; vy = target.y - player.y;
      if (Math.hypot(vx, vy) < 4) { target = null; vx = 0; vy = 0; }
    }
    const length = Math.hypot(vx, vy), speed = keys.has('shift') ? 340 : 215;
    player.walking = length > 0;
    if (length) {
      const distance = target ? Math.min(length, speed * dt) : speed * dt;
      player.x = clamp(player.x + vx / length * distance, mobileLayout ? 550 : 130, mobileLayout ? 950 : 1370);
      player.y = clamp(player.y + vy / length * distance, mobileLayout ? 300 : 230, mobileLayout ? 960 : 1030);
      if (Math.abs(vx) > .1) player.facing = vx < 0 ? -1 : 1;
      player.step += dt * (keys.has('shift') ? 16 : 11);
    }
    const factor = 1 - Math.exp(-8 * dt);
    const halfW = width / zoom / 2, halfH = height / zoom / 2;
    const desiredX = mobileLayout || halfW >= 650 ? 750 : clamp(player.x, 100 + halfW, 1400 - halfW);
    const desiredY = mobileLayout || halfH >= 480 ? 610 : clamp(player.y - 50, 130 + halfH, 1090 - halfH);
    camera.x += (desiredX - camera.x) * factor;
    camera.y += (desiredY - camera.y) * factor;
    const candidate = projects.find(p => Math.hypot(p.x - player.x, p.y - player.y) < 145) || null;
    if (candidate !== nearest) {
      nearest = candidate;
      projects.forEach(p => p.element.classList.toggle('is-near', p === nearest));
      $('nearby-label').textContent = nearest ? `PORTAIL / ${nearest.name.toUpperCase()}` : 'QUATRE PORTAILS À EXPLORER';
      $('interact-button').disabled = !nearest;
      $('interact-button').replaceChildren(document.createTextNode(nearest ? `Ouvrir ${nearest.name}` : 'Approche d’un projet'));
      const key = document.createElement('span'); key.textContent = 'E'; $('interact-button').append(key);
      if (nearest) announce(`${nearest.name} à proximité. Appuie sur E ou marche sur le cercle pour ouvrir le projet.`);
    }
    if (cooldown <= 0 && nearest && Math.hypot(nearest.x - player.x, nearest.y - player.y) < 35) enter(nearest);
  }
  function line(points, color, thickness = 1) {
    ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.stroke();
  }
  function ellipse(x,y,rx,ry,fill,stroke) {
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function polygon(points, fill, stroke) {
    ctx.beginPath(); points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
  }
  function drawServer(x,y,h,index) {
    ellipse(x+9,y+9,39,13,'#0008');
    polygon([[x-17,y-h],[x+17,y-h],[x+17,y],[x-17,y]], '#0a1b12','#2b5639');
    polygon([[x+17,y-h],[x+29,y-h-10],[x+29,y-10],[x+17,y]],'#07120c','#21402a');
    polygon([[x-17,y-h],[x-5,y-h-10],[x+29,y-h-10],[x+17,y-h]],'#163423','#356847');
    for(let yy=y-h+9;yy<y-5;yy+=9) {
      line([[x-10,yy],[x+10,yy]],'#245b36',2);
      ctx.fillStyle=index%3?'#8eea80':'#c0efaa';ctx.fillRect(x-10,yy-1,3,2);
    }
  }
  function drawNeo() {
    const {x,y,facing,step,walking}=player;
    const stride=walking?Math.sin(step)*7:0;
    const bob=walking?Math.abs(Math.sin(step))*1.2:0;
    ctx.save();ctx.translate(x,y);ctx.scale(facing,1);
    ellipse(0,3,25,9,'#000b','#346540');
    ctx.shadowColor='#a5ff8b';ctx.shadowBlur=9;
    line([[-6,-20],[-7-stride*.6,-6],[-10-stride,0]],'#162b20',7);
    line([[6,-20],[7+stride*.6,-6],[11+stride,0]],'#162b20',7);
    ctx.shadowBlur=0;
    line([[-13-stride,1],[-5-stride,1]],'#92b39a',2);
    line([[7+stride,1],[15+stride,1]],'#92b39a',2);
    ctx.translate(0,-bob);
    polygon([[-10,-48],[8,-49],[13,-34],[19+stride*.35,-10],[2,-15],[-16,-10],[-12,-33]],'#0b1711','#65806a');
    polygon([[-2,-44],[7,-44],[7,-17],[0,-19]],'#14281c');
    line([[0,-43],[-1,-17]],'#60806a');
    line([[-10,-44],[-17,-29-stride*.4],[-14,-23-stride*.4]],'#0c1912',7);
    line([[9,-44],[17,-32+stride*.4],[14,-24+stride*.4]],'#0c1912',7);
    line([[-14,-24-stride*.4],[-14,-20-stride*.4]],'#b7c9ac',3);
    line([[14,-25+stride*.4],[14,-21+stride*.4]],'#b7c9ac',3);
    ctx.fillStyle='#b4c0a6';ctx.fillRect(-7,-65,15,16);
    polygon([[-8,-60],[-9,-67],[-4,-71],[7,-69],[9,-62],[3,-64],[-4,-63]],'#08120c','#65806a');
    ctx.fillStyle='#030806';ctx.fillRect(-8,-59,7,5);ctx.fillRect(2,-59,7,5);
    line([[-2,-57],[3,-57]],'#050c08',2);
    line([[-7,-59],[-3,-59]],'#8bd2ae');line([[3,-59],[7,-59]],'#8bd2ae');
    line([[0,-52],[5,-52]],'#5e7461');
    ctx.restore();
    ctx.font='8px "IBM Plex Mono", monospace';ctx.textAlign='center';ctx.fillStyle='#b4eaa2';
    ctx.fillText('NÉO / VOUS',x,y+23);
  }
  function drawWorld(time) {
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    ctx.fillStyle='#030a06';ctx.fillRect(0,0,width,height);
    const glow=ctx.createRadialGradient(width*.5,height*.5,20,width*.5,height*.5,width*.7);
    glow.addColorStop(0,'#163a2244');glow.addColorStop(1,'#02060400');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
    // Digital rain is screen-space decoration; the walkable world sits above it.
    ctx.font='11px monospace';ctx.textAlign='center';
    rain.forEach((r,i)=>{
      const y=(r.y*(height+300)+(animated?time*.001*r.speed:0))%(height+300)-120;
      for(let j=0;j<r.length;j++){
        ctx.fillStyle=j===0?'#9ee99463':`rgba(49,180,85,${.14*(1-j/r.length)})`;
        ctx.fillText(glyphs[(i*7+j*3+Math.floor(animated?time/1500:0))%glyphs.length],r.x*width,y-j*14);
      }
    });
    ctx.save();ctx.translate(width/2-camera.x*zoom,height/2-camera.y*zoom);ctx.scale(zoom,zoom);
    ctx.fillStyle='#06110cb0';ctx.fillRect(100,130,1300,960);
    for(let x=100;x<=1400;x+=50)line([[x,130],[x,1090]],x%100===0?'#1c3b2670':'#17341f50');
    for(let y=140;y<=1090;y+=50)line([[100,y],[1400,y]],y%100===40?'#1c3b2670':'#17341f50');
    line([[100,130],[1400,130],[1400,1090],[100,1090],[100,130]],'#477c4e',2);
    line([[115,145],[1385,145],[1385,1075],[115,1075],[115,145]],'#254a31');
    // Twin luminous rails connect the plaza to each project.
    projects.forEach(p=>{
      const middle=(p.y+620)/2;
      line([[750,620],[750,middle],[p.x,middle],[p.x,p.y]],'#0e2317',24);
      ctx.setLineDash([4,13]);line([[750,620],[750,middle],[p.x,middle],[p.x,p.y]],'#57875a80',1.4);ctx.setLineDash([]);
    });
    ellipse(750,620,115,65,'#0d251644','#31583b');
    ellipse(750,620,104,59,null,'#22462e');
    ctx.font='10px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#61866a';
    ctx.fillText('CONSTRUCT / 001',750,703);
    ctx.font='32px "Share Tech Mono",monospace';ctx.fillStyle='#68aa7530';ctx.fillText('FOLLOW THE GREEN LIGHT',750,250);
    projects.forEach((p,i)=>{
      const isNear=p===nearest;
      const pulse=animated?Math.sin(time*.002+i)*3:0;
      ctx.shadowColor=p.color;ctx.shadowBlur=isNear?25:10;
      ellipse(p.x,p.y,58+pulse,31+pulse*.5,'#112b1c80',isNear?'#c3ffa7':'#5b9b65');
      ctx.shadowBlur=0;
      ellipse(p.x,p.y,46,24,'#14322180','#90cc8170');
      ellipse(p.x,p.y,34,17,null,p.color+'90');
      ctx.font='10px "IBM Plex Mono",monospace';ctx.fillStyle=p.color;ctx.fillText(String(i+1).padStart(2,'0'),p.x,p.y+4);
      ctx.font='7px "IBM Plex Mono",monospace';ctx.fillStyle='#7aa382';ctx.fillText(visited.has(p.id)?'CONNEXION VISITÉE':'MARCHE ICI POUR ENTRER',p.x,p.y+52);
    });
    const sorted=servers.map((s,i)=>({y:s[1],draw:()=>drawServer(...s,i)}));
    sorted.push({y:player.y,draw:drawNeo});sorted.sort((a,b)=>a.y-b.y).forEach(item=>item.draw());
    if(target){ellipse(target.x,target.y,10,6,null,'#b5ff8d');line([[target.x-15,target.y],[target.x+15,target.y]],'#b5ff8d');}
    ctx.restore();
    projects.forEach(p=>{
      const pos=screen(p.x,p.y-32);
      p.element.style.transform=`translate(${pos.x-102}px,${pos.y-p.element.offsetHeight}px) scale(${zoom})`;
      p.element.style.zIndex=String(Math.round(p.y));
    });
  }
  function drawMap() {
    map.clearRect(0,0,180,120);
    map.strokeStyle='#25422d';map.lineWidth=1;map.strokeRect(10,8,160,104);
    const project=(x,y)=>[10+(x-100)/1300*160,8+(y-130)/960*104];
    for(const p of projects){const[x,y]=project(p.x,p.y);map.fillStyle=visited.has(p.id)?'#bdffa1':'#5f8e67';map.fillRect(x-3,y-3,6,6);map.font='6px monospace';map.textAlign='center';map.fillText(p.name==='Dernière Séance'?'SÉANCE':p.name.toUpperCase(),x,y-7);}
    const[x,y]=project(player.x,player.y);map.fillStyle='#cbffad';map.beginPath();map.arc(x,y,3,0,Math.PI*2);map.fill();
    map.strokeStyle='#7eb96a55';map.strokeRect(x-width/zoom/1300*80,y-height/zoom/960*52,width/zoom/1300*160,height/zoom/960*104);
  }
  function frame(time) {
    const dt=Math.min((time-previousTime)/1000 || 0,.04);previousTime=time;
    cooldown=Math.max(0,cooldown-dt);
    if(transfer){
      transfer.elapsed=(time-transfer.startedAt)/1000;
      $('transfer-progress').style.width=`${Math.min(100,transfer.elapsed/.85*100)}%`;
      if(transfer.elapsed>=.85){const p=transfer.project;saveVisit(p);location.assign(p.element.href);return;}
    } else if(!isDialogOpen()) move(dt);
    drawWorld(time);drawMap();
    $('position-label').textContent=`X ${Math.round(player.x).toString().padStart(4,'0')} / Y ${Math.round(player.y).toString().padStart(4,'0')}`;
    frameId=requestAnimationFrame(frame);
  }
  $('start-button').addEventListener('click',()=>{start();canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||transfer||isDialogOpen())return;
    start();canvas.focus({preventScroll:true});const rect=canvas.getBoundingClientRect();
    target={x:clamp((e.clientX-rect.left-width/2)/zoom+camera.x,mobileLayout?550:130,mobileLayout?950:1370),y:clamp((e.clientY-rect.top-height/2)/zoom+camera.y,mobileLayout?300:230,mobileLayout?960:1030)};
  });
  window.addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    if(key==='escape'&&transfer){e.preventDefault();cancelTransfer();return;}
    if(isDialogOpen()||transfer||e.ctrlKey||e.metaKey||e.altKey)return;
    // Arrow keys on focused menu links keep their native browser behavior.
    if(e.target.closest('button,a,input,textarea,select'))return;
    if(motionKeys.has(key)){e.preventDefault();keys.add(key);start();}
    if(key==='e'&&!e.repeat&&nearest){e.preventDefault();enter(nearest);}
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',clearInput);
  padButtons.forEach(button=>{
    const release=()=>{touch.delete(button.dataset.direction);button.classList.remove('is-down');};
    button.addEventListener('pointerdown',e=>{if(transfer||isDialogOpen())return;e.preventDefault();start();target=null;button.setPointerCapture(e.pointerId);touch.add(button.dataset.direction);button.classList.add('is-down');});
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  $('interact-button').addEventListener('click',()=>enter(nearest));
  $('cancel-transfer').addEventListener('click',cancelTransfer);
  for(const id of ['directory','help']){
    $(id+'-button').addEventListener('click',()=>{clearInput();if(transfer)cancelTransfer();$(id).showModal();});
    $(id).querySelector('[data-close]').addEventListener('click',()=>$(id).close());
    $(id).addEventListener('close',()=>{clearInput();canvas.focus({preventScroll:true});});
    $(id).addEventListener('click',e=>{if(e.target===$(id)){const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$(id).close();}});
  }
  document.querySelectorAll('a[data-project]').forEach(link=>link.addEventListener('click',e=>{start();const p=projects.find(p=>p.id===link.dataset.project);saveVisit(p);if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey)leavingProject=p;}));
  function motionLabel(){ $('motion-button').setAttribute('aria-pressed',String(animated));$('motion-button').textContent=`FOND ANIMÉ : ${animated?'OUI':'NON'}`; }
  $('motion-button').addEventListener('click',()=>{animated=!animated;motionLabel();});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{animated=!e.matches;motionLabel();});
  window.addEventListener('pagehide',()=>{clearInput();cancelAnimationFrame(frameId);if(!transfer&&!leavingProject)storePosition();});
  window.addEventListener('pageshow',e=>{if(e.persisted){transfer=null;$('transfer').hidden=true;clearInput();cooldown=2;if(leavingProject){player.x=leavingProject.x;player.y=leavingProject.y+112;leavingProject=null;}const p=projects.find(p=>Math.hypot(player.x-p.x,player.y-p.y)<50);if(p)player.y=p.y+112;previousTime=performance.now();cancelAnimationFrame(frameId);frameId=requestAnimationFrame(frame);}});
  document.addEventListener('visibilitychange',()=>{clearInput();if(document.hidden){cancelAnimationFrame(frameId);previousTime=0;}else{previousTime=performance.now();cancelAnimationFrame(frameId);frameId=requestAnimationFrame(frame);}});
  window.addEventListener('resize',resize);new ResizeObserver(resize).observe($('game-shell'));
  $('intro-hint').hidden=!introVisible;updateVisited();motionLabel();resize();
  if(!ctx||!map){$('intro-hint').hidden=true;$('directory').showModal();announce('Le mode graphique est indisponible. Les projets restent accessibles dans ce menu.');return;}
  frameId=requestAnimationFrame(frame);
})();
