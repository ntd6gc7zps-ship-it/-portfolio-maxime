'use strict';
const el = id => document.getElementById(id);
const canvas = el('view'), ctx = canvas.getContext('2d');
const FOV = .72, SIZE = 35, DURATION = 480;
let W = canvas.width, H = canvas.height;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const map = Array.from({length:SIZE},()=>Array(SIZE).fill('#'));
function carve(x,y,w,h) {
  for(let row=y;row<y+h;row++) for(let col=x;col<x+w;col++) map[row][col]='.';
}
const rooms = [
  {x:2,y:26,w:9,h:7,name:'Hall / Billetterie'},
  {x:2,y:15,w:7,h:7,name:'Confiserie'},
  {x:2,y:2,w:9,h:8,name:'Salle 01'},
  {x:15,y:13,w:6,h:7,name:'Régie'},
  {x:25,y:2,w:8,h:8,name:'Salle 02'},
  {x:26,y:15,w:7,h:6,name:'Bureau'},
  {x:25,y:27,w:8,h:6,name:'Réserve'}
];
rooms.forEach(r=>carve(r.x,r.y,r.w,r.h));
// Two connected loops allow a player to escape a pursuit without cornering every route.
[[5,8,2,20],[9,28,19,2],[17,18,2,12],[7,17,12,2],[28,8,2,22],
 [9,5,19,2],[17,5,2,10],[19,16,9,2],[9,10,5,2],[12,10,2,9],
 [21,22,9,2],[21,16,2,8],[2,23,5,2],[2,21,2,4]].forEach(r=>carve(...r));
const walls = (x,y) => map[Math.floor(y)]?.[Math.floor(x)] !== '.';
const startPosition = {x:6.5,y:30.5,a:-Math.PI/2};
const p = {...startPosition};
const keys = new Set();
let depth = new Float32Array(W);
function resizeView() {
  W = canvas.width = 640;
  H = canvas.height = Math.round(clamp(640 * innerHeight / innerWidth, 270, 780));
  depth = new Float32Array(W);
}
window.addEventListener('resize',resizeView);
resizeView();
const exit = {x:3.5,y:31.6,type:'exit',scale:1.2};
const generator = {x:18.5,y:14.5,type:'generator',scale:.85};
const officeKey = {x:31.2,y:17.5,type:'key',scale:.16,lift:.35};
const fuseLocations = [
  {x:3.7,y:3.8,room:'Salle 01'},
  {x:30.6,y:7.7,room:'Salle 02'},
  {x:30.7,y:30.7,room:'Réserve'}
];
const decor = [exit,generator,
  {x:4.5,y:28,type:'counter',scale:.8},
  {x:3.5,y:16.5,type:'popcorn',scale:1},
  {x:7.6,y:19.5,type:'popcorn',scale:1},
  {x:16,y:15,type:'projector',scale:.75},
  {x:30.5,y:19,type:'counter',scale:.65},
  {x:27,y:29,type:'projector',scale:.7},
  {x:27,y:31,type:'seat',scale:.55}
];
for(const room of [rooms[2],rooms[4]]) {
  decor.push({x:room.x+room.w/2,y:room.y+.65,type:'screen',scale:1.9});
  for(let y=room.y+3;y<room.y+room.h-1;y+=1.35) {
    for(let x=room.x+1;x<room.x+room.w-1;x+=1.4) {
      if(Math.abs(x-(room.x+room.w/2))<.85) continue;
      decor.push({x,y,type:'seat',scale:.55});
    }
  }
}
const signs = rooms.map(r=>({...r,image:sign(r.name.toUpperCase())}));
let state='intro', pausedFrom='play', time=DURATION, elapsed=0, last=performance.now();
let fuses=[], monsters=[], fuseCount=0, power=false, hasKey=false, repair=0;
let lamp=true, battery=100, stamina=100, moving=false, sprinting=false;
let nextStep=0,nextNoise=3,nextHeartbeat=0,nextHaunt=25;
let nextScare=120, nonfatalScares=0;
let scare=null, apparition=null, message='',messageUntil=0, nearest=null, threat=Infinity;
let lastHud='',lastSecond=-1;
function say(text,duration=5) {message=text;messageUntil=elapsed+duration;}
function clearLine(a,b) {
  const steps=Math.ceil(distance(a,b)*10);
  for(let i=1;i<steps;i++) if(walls(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps)) return false;
  return true;
}
function nextTile(a,b) {
  const ax=Math.floor(a.x),ay=Math.floor(a.y),bx=Math.floor(b.x),by=Math.floor(b.y);
  const queue=[[ax,ay,null]],seen=new Set([ay*SIZE+ax]);
  for(let i=0;i<queue.length;i++) {
    const [x,y,first]=queue[i];
    if(x===bx&&y===by) return first;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy,id=ny*SIZE+nx;
      if(walls(nx,ny)||seen.has(id)) continue;
      seen.add(id);queue.push([nx,ny,first||{x:nx+.5,y:ny+.5}]);
    }
  }
  return null;
}
function slide(actor,dx,dy,r) {
  const fits=(x,y)=>!walls(x-r,y-r)&&!walls(x+r,y-r)&&!walls(x-r,y+r)&&!walls(x+r,y+r);
  if(fits(actor.x+dx,actor.y)) actor.x+=dx;
  if(fits(actor.x,actor.y+dy)) actor.y+=dy;
}
function makeMonster(type,x,y,wake) {
  return {type,x,y,scale:type==='nun'?1.05:.58,wake,target:null,destination:null,repath:0,alertUntil:0,patrol:0,stunnedUntil:0,nextStun:0};
}
function start() {
  audioReady();Object.assign(p,startPosition);keys.clear();
  fuses=fuseLocations.map(f=>({...f,type:'fuse',scale:.23,lift:.3,taken:false}));
  monsters=[makeMonster('nun',28.5,5.5,20),makeMonster('crawler',28.5,29.5,65)];
  fuseCount=0;power=false;hasKey=false;repair=0;time=DURATION;elapsed=0;
  lamp=true;battery=100;stamina=100;nextStep=0;nextNoise=4;nextHeartbeat=0;
  nextHaunt=22;nextScare=100+Math.random()*40;nonfatalScares=0;scare=null;apparition=null;nearest=null;threat=Infinity;
  state='play';document.body.classList.remove('scaring');lastSecond=-1;lastHud='';last=performance.now();
  el('overlay').hidden=true;
  for(const id of ['hud','touch','cross','actions']) el(id).hidden=false;
  say('La note du gardien mentionne la salle 01, la salle 02 et la réserve.',9);
  if(matchMedia('(pointer:fine)').matches) lockPointer();
}
function finish(result) {
  state=result;keys.clear();scare=null;document.body.classList.remove('scaring');
  if(document.pointerLockElement) document.exitPointerLock();
  for(const id of ['hud','touch','cross','actions']) el(id).hidden=true;
  el('overlay').hidden=false;
  const victory=result==='win';
  el('tag').textContent=victory?'Le Rialto · À l’aube':'Le Rialto · Fin de projection';
  el('title').innerHTML=victory?'Enfin<br><em>dehors.</em>':result==='caught'?'Elle était<br><em>derrière.</em>':'Noir<br><em>total.</em>';
  el('copy').textContent=victory?`Tu as quitté le cinéma en ${Math.floor(elapsed/60)} min ${Math.floor(elapsed%60)} s. Le projecteur s’est rallumé après ton départ.`:result==='caught'?'Tu peux la ralentir avec le faisceau de la lampe, puis t’échapper par un autre couloir. Courir attire les créatures.':'Le dernier circuit a cédé. La porte de secours restera fermée jusqu’au matin.';
  el('start').textContent='Recommencer';el('start').focus();
}
function triggerScare(kind,fatal=false) {
  if(state!=='play'||scare) return;
  if(!fatal) {
    if(nonfatalScares>=2) return;
    nonfatalScares++;
    nextScare=elapsed+150+Math.random()*45;
  }
  scare={kind,fatal,age:0,duration:fatal?1.25:.65};
  state='scare';document.body.classList.add('scaring');keys.clear();scream(kind);apparition=null;
}
function pause() {
  if(state==='paused') {
    state=pausedFrom;el('overlay').hidden=true;last=performance.now();lockPointer();return;
  }
  if(!['play','scare'].includes(state)) return;
  pausedFrom=state;state='paused';keys.clear();
  if(document.pointerLockElement) document.exitPointerLock();
  el('overlay').hidden=false;el('tag').textContent='Le Rialto · Pause';el('title').innerHTML='Retiens<br><em>ton souffle.</em>';
  el('copy').textContent='Les créatures et le compte à rebours sont en pause.';
  el('start').textContent='Reprendre';
}
function toggleLamp() {
  if(state!=='play') return;
  lamp=!lamp;tone(180,80,.06,.08,'triangle');
}
function interaction() {
  if(state!=='play'||!nearest) return;
  if(nearest.type==='fuse') {
    nearest.taken=true;fuseCount++;noise(.2,.4,1100);tone(340,220,.08,.2);
    say(`Fusible ${fuseCount}/3. ${fuseCount===3?'Retourne à la régie.':'Il y a du mouvement dans le couloir.'}`,6);
  } else if(nearest===generator) {
    if(fuseCount<3) say('Il manque des fusibles. Fouille les deux salles et la réserve.');
    else if(!power&&repair===0) {repair=12;say('Le générateur démarre. Reste dans la régie pendant 12 secondes.',12);noise(.5,1.3,170);}
  } else if(nearest===officeKey) {
    hasKey=true;say('Clé de secours récupérée. Retourne à la sortie du hall.',7);tone(360,680,.13,.3);nextHaunt=elapsed+6;
  } else if(nearest===exit) {
    if(hasKey&&power) finish('win');
    else say(power?'La clé de secours est dans le bureau.':'La porte est bloquée. Rétablis le courant à la régie.');
  }
  nearest=null;
}
const patrolPoints=[{x:5.5,y:5.5},{x:5.5,y:18.5},{x:18.5,y:17.5},{x:28.5,y:5.5},{x:29.5,y:18.5},{x:28.5,y:29.5},{x:18.5,y:29.5}];
function updateMonsters(dt) {
  threat=Infinity;
  for(const m of monsters) {
    if(elapsed<m.wake) continue;
    const range=distance(m,p),visible=range<10&&clearLine(m,p);
    const seesPlayer=visible&&(lamp||range<2.7);
    const hearsPlayer=moving&&range<(sprinting?10:3.7);
    if(seesPlayer||hearsPlayer) {m.alertUntil=elapsed+6;m.destination={x:p.x,y:p.y};}
    if(elapsed>m.alertUntil&&(!m.destination||distance(m,m.destination)<.5)) {
      m.patrol=(m.patrol+1)%patrolPoints.length;m.destination=patrolPoints[m.patrol];
    }
    const relative=Math.atan2(m.y-p.y,m.x-p.x)-p.a;
    const inBeam=lamp&&battery>10&&visible&&Math.cos(relative)>.96&&range<4.2;
    if(inBeam&&elapsed>m.nextStun) {m.stunnedUntil=elapsed+1.7;m.nextStun=elapsed+8;noise(.24,.7,1100,Math.sin(relative));}
    if(elapsed>m.repath&&m.destination) {m.target=nextTile(m,m.destination)||m.destination;m.repath=elapsed+.4;}
    if(m.target&&elapsed>m.stunnedUntil) {
      const target=clearLine(m,m.destination)?m.destination:m.target;
      const heading=Math.atan2(target.y-m.y,target.x-m.x);
      const speed=elapsed<m.alertUntil?(m.type==='crawler'?1.64:1.23):.65;
      const step=Math.min(distance(m,target),dt*speed);
      slide(m,Math.cos(heading)*step,Math.sin(heading)*step,.15);
    }
    threat=Math.min(threat,range);
    if(range<.43) {triggerScare(m.type,true);return;}
  }
}
function spawnCorridorRunner() {
  // A crossing needs open space on both sides of a visible point ahead.
  const horizontal=Math.abs(Math.cos(p.a))>Math.abs(Math.sin(p.a));
  const forwardX=horizontal?Math.sign(Math.cos(p.a)):0;
  const forwardY=horizontal?0:Math.sign(Math.sin(p.a));
  const sideX=-forwardY, sideY=forwardX;
  for(const range of [6,7,8,5,9,10]) {
    const center={x:Math.floor(p.x+forwardX*range)+.5,y:Math.floor(p.y+forwardY*range)+.5};
    const bearing=Math.atan2(center.y-p.y,center.x-p.x)-p.a;
    if(walls(center.x,center.y)||!clearLine(p,center)||Math.cos(bearing)<.93) continue;
    let left=0, right=0;
    while(left<2.6&&!walls(center.x-sideX*(left+.35),center.y-sideY*(left+.35))) left+=.2;
    while(right<2.6&&!walls(center.x+sideX*(right+.35),center.y+sideY*(right+.35))) right+=.2;
    if(left+right<1.4) continue;
    const direction=Math.random()<.5?-1:1;
    const startOffset=direction===1?-left:right;
    apparition={
      x:center.x+sideX*startOffset, y:center.y+sideY*startOffset,
      type:'runner', scale:1.03, runner:true, heard:false,
      vx:sideX*direction*4.3, vy:sideY*direction*4.3,
      life:(left+right)/4.3
    };
    return true;
  }
  return false;
}
function haunt(dt) {
  if(apparition) {
    apparition.x+=apparition.vx*dt;
    apparition.y+=apparition.vy*dt;
    apparition.life-=dt;
    const bearing=Math.atan2(apparition.y-p.y,apparition.x-p.x)-p.a;
    if(!apparition.heard&&Math.cos(bearing)>.85&&clearLine(p,apparition)) {
      apparition.heard=true;
      pianoNote(138.59, Math.sin(bearing));
      noise(.16,.28,550,Math.sin(bearing));
    }
    if(apparition.life<=0) apparition=null;
  }
  if(elapsed>=nextHaunt&&!apparition) {
    const spawned=spawnCorridorRunner();
    nextHaunt=elapsed+(spawned?30+Math.random()*20:4);
  }
  // Two rare exploration scares at most, separated by several minutes.
  if(elapsed>=nextScare&&nonfatalScares<2&&!apparition&&threat>3) {
    triggerScare(nonfatalScares===0?'nun':'crawler');
  }
}
function updateHud() {
  const second=Math.ceil(time);
  if(lastSecond!==second) {
    lastSecond=second;el('clock').textContent=String(Math.floor(second/60)).padStart(2,'0')+':'+String(second%60).padStart(2,'0');
    el('clock').classList.toggle('urgent',second<60);
    el('battery').textContent=`LAMPE ${Math.ceil(battery)} %${lamp?'':' · ÉTEINTE'}`;
    el('stamina').textContent=`SOUFFLE ${Math.ceil(stamina)} %`;
  }
  const objective=hasKey?'Rejoins la sortie du hall':power?'Récupère la clé dans le bureau':fuseCount===3?'Relance le générateur de la régie':`Fusibles ${fuseCount}/3 · Salle 01 / Salle 02 / Réserve`;
  if(objective!==lastHud){lastHud=objective;el('objective').textContent=objective;}
  const prompt=nearest?nearest.type==='fuse'?'E · Prendre le fusible':nearest===officeKey?'E · Prendre la clé':nearest===generator?'E · Générateur':'E · Ouvrir la sortie':'';
  el('hint').textContent=prompt||(messageUntil>elapsed?message:'');
  el('interact').classList.toggle('active',!!nearest);
  el('interact').textContent=prompt||'E · Fouiller';
  el('flashlight').textContent=lamp?'F · Éteindre':'F · Allumer';
}
function update(dt) {
  if(state==='scare') {
    scare.age+=dt;
    if(scare.age>=scare.duration) {
      if(scare.fatal) finish('caught');
      else {scare=null;state='play';document.body.classList.remove('scaring');}
    }
    return;
  }
  if(state!=='play') return;
  elapsed+=dt;time=Math.max(0,DURATION-elapsed);
  if(time===0) {scream('nun');finish('blackout');return;}
  const pressed=(...names)=>names.some(name=>keys.has(name));
  p.a+=dt*1.9*(Number(pressed('arrowright'))-Number(pressed('arrowleft')));
  const forward=Number(pressed('z','w','arrowup'))-Number(pressed('s','arrowdown'));
  const sideways=Number(pressed('d'))-Number(pressed('q','a'));
  moving=Boolean(forward||sideways);sprinting=moving&&keys.has('shift')&&stamina>2;
  stamina=clamp(stamina+(sprinting?-23:13)*dt,0,100);
  battery=clamp(battery+(lamp?-.43:.8)*dt,0,100);
  if(moving) {
    const speed=(sprinting?2.45:1.42)*dt/Math.hypot(forward,sideways);
    slide(p,(Math.cos(p.a)*forward-Math.sin(p.a)*sideways)*speed,(Math.sin(p.a)*forward+Math.cos(p.a)*sideways)*speed,.2);
    if(elapsed>=nextStep) {noise(sprinting?.32:.18,.16,420);nextStep=elapsed+(sprinting?.28:.47);}
  }
  const nearby=[...fuses.filter(f=>!f.taken),generator,exit,...(power&&!hasKey?[officeKey]:[])];
  nearest=nearby.filter(o=>distance(o,p)<1.15&&clearLine(p,o)).sort((a,b)=>distance(a,p)-distance(b,p))[0]||null;
  if(repair>0&&distance(p,generator)<5) {
    repair=Math.max(0,repair-dt);
    say(`Démarrage du générateur… ${Math.ceil(repair)} s`,1);
    if(repair===0) {power=true;say('Courant rétabli. Le casier du bureau est déverrouillé.',7);noise(.6,1.5,270);nextHaunt=elapsed+4;}
  }
  updateMonsters(dt);
  if(state!=='play') return;
  haunt(dt);
  if(elapsed>nextNoise) {
    const closest=monsters.reduce((a,b)=>distance(p,a)<distance(p,b)?a:b);
    const bearing=Math.atan2(closest.y-p.y,closest.x-p.x)-p.a;
    noise(threat<6?.42:.14,1.1,threat<6?950:1900,Math.sin(bearing));
    tone(62,34,threat<6?.10:.035,.9,'triangle');
    nextNoise=elapsed+(threat<4?1.7:5+Math.random()*4);
  }
  if(threat<4&&elapsed>nextHeartbeat) {tone(63,29,.13,.16);nextHeartbeat=elapsed+.48;}
  updateHud();
}
function roomAt(x,y) {
  return rooms.find(r=>x>=r.x-1&&x<=r.x+r.w&&y>=r.y-1&&y<=r.y+r.h);
}
function render(now) {
  const bob=moving&&state==='play'&&!reduced?Math.sin(now/(sprinting?70:115))*1.4:0;
  const horizon=H/2+bob;
  ctx.fillStyle='#181d1d';ctx.fillRect(0,0,W,horizon);
  const carpet=ctx.createLinearGradient(0,horizon,0,H);
  carpet.addColorStop(0,'#0d1113');carpet.addColorStop(1,'#4b292d');
  ctx.fillStyle=carpet;ctx.fillRect(0,horizon,W,H-horizon);
  const dirX=Math.cos(p.a),dirY=Math.sin(p.a),planeX=-dirY*FOV,planeY=dirX*FOV;
  // Fine carpet bands and scratches recede toward the horizon.
  for(let y=Math.ceil(horizon)+3;y<H;y+=3) {
    const dist=H*.5/(y-horizon);
    ctx.fillStyle=Math.floor(dist+p.x*dirX+p.y*dirY)%2?'#b59b7520':'#080b0b22';
    ctx.fillRect(0,y,W,1);
  }
  for(let col=0;col<W;col++) {
    const screen=2*col/W-1,rayX=dirX+planeX*screen,rayY=dirY+planeY*screen;
    let mx=Math.floor(p.x),my=Math.floor(p.y),side=0;
    const dx=Math.abs(1/rayX),dy=Math.abs(1/rayY),sx=rayX<0?-1:1,sy=rayY<0?-1:1;
    let tx=(rayX<0?p.x-mx:mx+1-p.x)*dx,ty=(rayY<0?p.y-my:my+1-p.y)*dy;
    while(!walls(mx,my)) {
      if(tx<ty){tx+=dx;mx+=sx;side=0;}else{ty+=dy;my+=sy;side=1;}
    }
    const d=Math.max(.025,side?ty-dy:tx-dx);depth[col]=d;
    const ht=H/d,y=horizon-ht/2;
    let u=side?p.x+rayX*d:p.y+rayY*d;u-=Math.floor(u);
    ctx.drawImage(wallTexture,Math.floor(u*127),0,1,128,col,y,1,ht);
    const room=signs.find(r=>mx>=r.x-1&&mx<=r.x+r.w&&my>=r.y-1&&my<=r.y+r.h);
    const orient=(side?rayY>0:rayX<0)?1-u:u;
    if((mx*5+my*3+side)%4===0&&u>.16&&u<.84) {
      const poster=posters[(mx+my)%posters.length];
      const source=clamp(Math.floor((orient-.16)/.68*poster.width),0,poster.width-1);
      ctx.drawImage(poster,source,0,1,poster.height,col,y+ht*.18,1,ht*.49);
    } else if(room&&(mx+my+side)%3===0&&u>.05&&u<.95) {
      const source=clamp(Math.floor((orient-.05)/.9*240),0,239);
      ctx.drawImage(room.image,source,0,1,70,col,y+ht*.27,1,ht*.19);
    }
    ctx.fillStyle=`rgba(0,5,9,${clamp(1-1/(1+d*d*.07)+(side?.07:0),.05,.97)})`;
    ctx.fillRect(col,y,1,ht+1);
    if((mx+my*3)%13===0&&u>.43&&u<.57) {
      ctx.fillStyle='#4e1e1866';ctx.fillRect(col,y+ht*.15,1,ht*.03);
    }
  }
  const project=o=>{
    const rx=o.x-p.x,ry=o.y-p.y,z=rx*dirX+ry*dirY;
    return {o,z,x:W/2*(1+(-rx*dirY+ry*dirX)/(FOV*z))};
  };
  const entities=[...decor,...fuses.filter(f=>!f.taken),...(power&&!hasKey?[officeKey]:[]),...monsters.filter(m=>elapsed>=m.wake),...(apparition?[apparition]:[])];
  for(const {o,x,z} of entities.map(project).filter(o=>o.z>.12).sort((a,b)=>b.z-a.z)) {
    const image=o.runner?art[Math.floor(elapsed*13)%2?'runnerStep':'runner']:art[o.type],height=H/z*(o.scale||1),width=height*image.width/image.height;
    const sway=reduced?0:o.runner?Math.sin(elapsed*29)*H*.025/z:o.type==='nun'?Math.sin(now/300)*2/z:0;
    const y=horizon+H*.48/z-height-H*(o.lift||0)/z+sway,left=x-width/2;
    ctx.globalAlpha=clamp(1/(1+z*z*.055),.03,1);
    if(o===apparition) ctx.globalAlpha=Math.max(.65,ctx.globalAlpha);
    for(let col=Math.max(0,Math.ceil(left));col<Math.min(W,left+width);col++) {
      if(z>depth[col]) continue;
      const source=clamp(Math.floor((col-left)/width*image.width),0,image.width-1);
      ctx.drawImage(image,source,0,1,image.height,col,y,1,height);
    }
    ctx.globalAlpha=1;
  }
  const showBeam=lamp||state==='intro';
  const beamStrength=battery>10?1:.55+battery*.045;
  if(showBeam) {
    const tremor=reduced?0:Math.sin(now/760)*3;
    const radius=Math.min(W,H*1.15)*(state==='intro'?.8:beamStrength);
    const mask=ctx.createRadialGradient(W*.5+tremor,H*.51,8,W*.5,H*.51,radius);
    mask.addColorStop(0,'rgba(0,2,4,.06)');mask.addColorStop(.22,'rgba(0,2,4,.15)');
    mask.addColorStop(.46,'rgba(0,2,4,.57)');mask.addColorStop(.73,'rgba(0,2,4,.92)');mask.addColorStop(1,'rgba(0,2,4,.985)');
    ctx.fillStyle=mask;ctx.fillRect(0,0,W,H);
  } else {ctx.fillStyle='rgba(0,2,4,.955)';ctx.fillRect(0,0,W,H);}
  if(state==='play'||state==='scare') {
    // The torch stays visible at the bottom of the view.
    ctx.save();ctx.translate(W*.73+bob,H*.96+bob);
    path(ctx,[[-20,25],[8,-44],[32,-38],[41,25]],'#111519');
    ellipse(ctx,20,-41,19,10,'#555d59');ellipse(ctx,20,-43,13,6,showBeam?'#bfc6a2':'#171c1c');
    path(ctx,[[-30,34],[-14,-3],[9,-2],[25,36]],'#544e40');
    ctx.restore();
  }
  if(scare) {
    const faceImage=faces[scare.kind];
    const progress=scare.age/scare.duration;
    ctx.fillStyle='#020303';ctx.fillRect(0,0,W,H);
    const zoom=reduced?1.5:1.4+Math.min(progress*2,.9);
    const height=H*zoom,width=height*.8;
    const shake=reduced?0:Math.sin(now*.12)*8*(1-progress);
    ctx.drawImage(faceImage,W/2-width/2+shake,H/2-height*.46,width,height);
    ctx.fillStyle=`rgba(40,0,0,${.08+progress*.17})`;ctx.fillRect(0,0,W,H);
  }
}
function frame(now) {
  const dt=Math.min((now-last)/1000,.1);last=now;
  update(dt);render(now);requestAnimationFrame(frame);
}
const accepted=['z','q','s','d','w','a','arrowup','arrowdown','arrowleft','arrowright','shift'];
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(key==='escape'&&!e.repeat) {pause();return;}
  if(state!=='play') return;
  if(accepted.includes(key)) {e.preventDefault();keys.add(key);}
  if(!e.repeat&&key==='e') interaction();
  if(!e.repeat&&key==='f') toggleLamp();
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(state==='play'||state==='scare') pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['play','scare'].includes(state)) pause();});
document.addEventListener('mousemove',e=>{if(state==='play'&&document.pointerLockElement===canvas)p.a+=e.movementX*.0027;});
function lockPointer() {
  if(!matchMedia('(pointer:fine)').matches)return;
  try{canvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}
}
canvas.addEventListener('click',()=>{if(state==='play'&&!document.pointerLockElement)lockPointer();});
for(const button of document.querySelectorAll('[data-key]')) {
  const key=button.dataset.key;
  button.addEventListener('pointerdown',e=>{button.setPointerCapture(e.pointerId);keys.add(key);});
  button.addEventListener('lostpointercapture',()=>keys.delete(key));
}
el('sound').addEventListener('click',()=>{
  enabled=!enabled;if(enabled)audioReady();if(master)master.gain.value=enabled?.55:0;
  el('sound').textContent=enabled?'Son activé':'Son coupé';el('sound').setAttribute('aria-pressed',String(enabled));
});
el('interact').addEventListener('click',interaction);
el('flashlight').addEventListener('click',toggleLamp);
el('pause').addEventListener('click',pause);
el('start').addEventListener('click',()=>state==='paused'?pause():start());
requestAnimationFrame(frame);
