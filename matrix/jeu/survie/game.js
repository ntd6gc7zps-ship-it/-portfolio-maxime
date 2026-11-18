import { createGame, tick, activateSlow, resizeWorld, clamp, WAVES } from './engine.mjs';

const $ = id => document.getElementById(id);
const canvas = $('world'), ctx = canvas.getContext('2d');
const coarse = matchMedia('(pointer: coarse)');
let width = 0, height = 0, scale = 1, ox = 0, oy = 0, dpr = 1, compact = false;
let game = createGame(), started = false, paused = false, frameId = 0, lastTime = 0, accumulator = 0;
let pointer = null, mouseFire = false, touchFire = false, animated = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let soundEnabled = true, audioContext = null, master = null, noiseBuffer = null, bannerTime = 0, damageFlash = 0, endShown = false;
const keys = new Set(), directions = new Set();
const moveKeys = new Set(['w','a','s','d','z','q','arrowup','arrowleft','arrowdown','arrowright','shift','j',' ']);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const rain = Array.from({length:65},(_,i)=>({x:(i*73%997)/997,y:(i*127%991)/991,speed:18+i%20,length:8+i%13}));
const glyphs='アイウエオカキクケコサシスセソ012345789';

function resize() {
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  compact=width<=650;resizeWorld(game,compact?720:1200,compact?1000:780);
  const top=compact?94:100,bottom=(compact||coarse.matches)?134:38;
  scale=Math.min((width-24)/game.width,Math.max(180,height-top-bottom)/game.height);
  ox=(width-game.width*scale)/2;oy=top+(height-top-bottom-game.height*scale)/2;
}
function clearInput(){keys.clear();directions.clear();mouseFire=false;touchFire=false;document.querySelectorAll('.is-down').forEach(b=>b.classList.remove('is-down'));}
function announce(text){$('live-status').textContent=text;}
function banner(text,duration=2.4){$('wave-banner').textContent=text;bannerTime=duration;}
function initAudio(){
  if(!soundEnabled)return;
  try{
    if(!audioContext){
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      audioContext=new Audio();master=audioContext.createGain();master.gain.value=.18;master.connect(audioContext.destination);
      noiseBuffer=audioContext.createBuffer(1,audioContext.sampleRate*.15,audioContext.sampleRate);
      const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    }
    if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  }catch(_){soundEnabled=false;updateSound();}
}
function tone(frequency,length=.12,volume=.12,type='sine',end=frequency){
  if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
  const t=audioContext.currentTime,osc=audioContext.createOscillator(),gain=audioContext.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+length);
  gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.001,t+length);
  osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+length+.02);
  osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function shotSound(){
  if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
  const t=audioContext.currentTime,source=audioContext.createBufferSource(),filter=audioContext.createBiquadFilter(),gain=audioContext.createGain();
  source.buffer=noiseBuffer;filter.type='highpass';filter.frequency.value=1700;gain.gain.setValueAtTime(.15,t);gain.gain.exponentialRampToValueAtTime(.001,t+.055);
  source.connect(filter);filter.connect(gain);gain.connect(master);source.start(t);source.stop(t+.065);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};tone(145,.07,.16,'triangle',45);
}
function updateSound(){ $('sound').textContent=`SON : ${soundEnabled?'OUI':'NON'}`;$('sound').setAttribute('aria-pressed',String(soundEnabled));$('sound').setAttribute('aria-label',soundEnabled?'Désactiver le son':'Activer le son');if(master)master.gain.value=soundEnabled?.18:0; }
function startGame(){
  clearInput();game=createGame(compact?720:1200,compact?1000:780);started=true;paused=false;endShown=false;damageFlash=0;accumulator=0;lastTime=performance.now();
  $('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='PAUSE Ⅱ';canvas.focus({preventScroll:true});
  initAudio();banner('VAGUE 01 / 05\nÉlimine les agents et les Sentinelles.');announce('Partie lancée. Vague 1 sur 5.');
}
function pauseGame(){
  if(!started||paused||endShown)return;
  paused=true;clearInput();$('overlay-eyebrow').textContent='CONNEXION EN ATTENTE';$('overlay-title').textContent='SIMULATION EN PAUSE';
  $('overlay-copy').textContent='Reprends quand tu es prêt. Les ennemis t’attendent.';
  $('enemy-preview').hidden=true;$('controls-guide').hidden=false;$('results').hidden=true;
  $('start').textContent='REPRENDRE →';$('restart').hidden=false;$('overlay-note').textContent='Échap ou P pour reprendre · J pour tirer avec visée automatique';
  $('overlay').hidden=false;$('start').focus();$('pause').textContent='REPRENDRE';announce('Jeu en pause.');
}
function resumeGame(){
  if(!paused)return;paused=false;clearInput();accumulator=0;lastTime=performance.now();$('overlay').hidden=true;$('pause').textContent='PAUSE Ⅱ';canvas.focus({preventScroll:true});initAudio();
}
function finish(){
  if(endShown)return;endShown=true;clearInput();$('pause').disabled=true;
  const won=game.state==='won';$('overlay-eyebrow').textContent=won?'LES CINQ VAGUES SONT NEUTRALISÉES':'LA MATRICE A REPRIS LE CONTRÔLE';
  $('overlay-title').textContent=won?'CONNEXION LIBÉRÉE.':'CONNEXION PERDUE.';
  $('overlay-copy').textContent=won?'Les agents sont tombés. Les Sentinelles sont hors ligne. Tu as survécu.':'Les agents ont fini par te rattraper. Bouge, garde tes distances et utilise le ralenti.';
  $('enemy-preview').hidden=true;$('controls-guide').hidden=true;$('results').hidden=false;
  $('results').replaceChildren();
  for(const[label,value]of[['VAGUE',`${game.wave} / ${WAVES.length}`],['ÉLIMINATIONS',game.kills],['SCORE',game.score]]){const item=document.createElement('div');item.textContent=label;const b=document.createElement('b');b.textContent=value;item.append(b);$('results').append(item);}
  $('start').textContent='REJOUER →';$('restart').hidden=true;$('overlay-note').textContent='Une nouvelle partie commence à la première vague.';$('overlay').hidden=false;$('start').focus();
  announce(won?'Victoire ! Tu as survécu aux cinq vagues.':`Partie terminée. ${game.kills} ennemis éliminés.`);
}
function processEvents(){
  for(const event of game.events){
    if(event.type==='shot')shotSound();
    if(event.type==='kill')tone(event.robot?95:220,.12,.12,'triangle',45);
    if(event.type==='hurt'){damageFlash=.22;tone(75,.19,.22,'sawtooth',35);}
    if(event.type==='heal')tone(440,.25,.1,'sine',880);
    if(event.type==='slow'){banner('BULLET TIME\nLe système ralentit.',1.4);tone(160,.5,.16,'sine',50);}
    if(event.type==='wave'){banner(`VAGUE 0${event.wave} / 05\nConnexion hostile détectée.`);tone(220,.35,.13,'triangle',440);announce(`Vague ${event.wave} sur cinq.`);}
    if(event.type==='clear'){banner(`VAGUE 0${event.wave} TERMINÉE\n+18 points de vie · Respire.`,3.4);tone(330,.4,.15,'sine',660);}
    if(event.type==='won')tone(440,.7,.18,'triangle',880);
    if(event.type==='lost')tone(100,.7,.2,'sine',25);
  }
  game.events.length=0;
}
function inputs(){return{
  x:Number(keys.has('d')||keys.has('arrowright')||directions.has('right'))-Number(keys.has('a')||keys.has('q')||keys.has('arrowleft')||directions.has('left')),
  y:Number(keys.has('s')||keys.has('arrowdown')||directions.has('down'))-Number(keys.has('w')||keys.has('z')||keys.has('arrowup')||directions.has('up')),
  sprint:keys.has('shift'),fire:mouseFire||touchFire||keys.has('j'),autoAim:touchFire||keys.has('j'),aim:pointer
};}
function hud(){
  const p=game.player;$('health-number').textContent=Math.ceil(p.hp);$('health-fill').style.width=`${p.hp}%`;$('health-fill').style.background=p.hp<=30?'#ff927b':'#b2ff8b';
  document.querySelector('.health-track').setAttribute('aria-valuenow',String(Math.ceil(p.hp)));
  $('wave-number').innerHTML=`0${game.wave} <small>/ 05</small>`;$('kills').textContent=String(game.kills).padStart(2,'0');$('score').textContent=String(game.score).padStart(5,'0');
  $('slow-fill').style.width=`${p.slow>0?p.slow/2.2*100:p.charge}%`;
  $('slow-label').textContent=p.slow>0?'ACTIF':p.charge>=100?(compact?'PRÊT':'PRÊT · ESPACE'):`${Math.floor(p.charge)} %`;
  $('slow-touch').disabled=p.charge<100||p.slow>0||!started||paused||endShown;
}
function line(points,color,thickness=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();}
function ellipse(x,y,rx,ry,fill,stroke){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function poly(points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function server(x,y,h){ellipse(x+6,y+5,29,10,'#0009');poly([[x-14,y-h],[x+14,y-h],[x+14,y],[x-14,y]],'#0a1b12','#2b5639');poly([[x+14,y-h],[x+24,y-h-8],[x+24,y-8],[x+14,y]],'#07120c','#21402a');poly([[x-14,y-h],[x-4,y-h-8],[x+24,y-h-8],[x+14,y-h]],'#163423','#356847');for(let yy=y-h+8;yy<y-5;yy+=9){line([[x-8,yy],[x+7,yy]],'#285c38',2);ctx.fillStyle='#8fca7b';ctx.fillRect(x-8,yy,3,2);}}
function human(x,y,angle,step,moving,smith=false,flash=false){
  const stride=moving?Math.sin(step)*6:0;ctx.save();ctx.translate(x,y+24);
  ellipse(0,2,22,8,'#000a');
  if(flash){ctx.shadowBlur=15;ctx.shadowColor='#d4ffbb';}
  line([[-6,-21],[-7-stride*.5,-8],[-9-stride,0]],smith?'#20322b':'#172c20',7);
  line([[6,-21],[7+stride*.5,-8],[9+stride,0]],smith?'#20322b':'#172c20',7);
  line([[-12-stride,1],[-5-stride,1]],'#83a18b',2);line([[6+stride,1],[14+stride,1]],'#83a18b',2);
  if(smith){poly([[-11,-46],[9,-46],[13,-19],[-13,-19]],flash?'#9bbfaa':'#15231d','#62746a');poly([[-5,-45],[5,-45],[0,-29]],'#c8d3bb');line([[0,-42],[0,-31]],'#15221b',3);}
  else{poly([[-11,-47],[9,-47],[13,-31],[18+stride*.3,-9],[2,-14],[-17,-9],[-12,-31]],flash?'#8bbf92':'#0a1810','#77927a');poly([[0,-43],[7,-43],[7,-17],[0,-19]],'#1e3925');line([[-1,-42],[-1,-17]],'#8bae80');}
  line([[-11,-42],[-16,-27],[-12,-22]],'#15271b',7);line([[-12,-24],[-12,-20]],'#a8bba3',3);
  ctx.fillStyle='#b8c5ad';ctx.fillRect(-7,-63,15,16);poly([[-8,-60],[-8,-66],[-3,-69],[7,-67],[9,-61],[3,-63]],smith?'#242d23':'#06130b','#6a826b');
  ctx.fillStyle='#030806';ctx.fillRect(-8,-58,7,5);ctx.fillRect(2,-58,7,5);line([[-2,-56],[3,-56]],'#030806',2);line([[-7,-58],[-3,-58]],smith?'#b49680':'#a3e2b8');line([[3,-58],[7,-58]],smith?'#b49680':'#a3e2b8');
  ctx.restore();
  ctx.save();ctx.translate(x,y-2);ctx.rotate(angle);line([[4,0],[20,0]],smith?'#73877b':'#a6c9a4',7);ctx.fillStyle=smith?'#334239':'#253d2b';ctx.fillRect(16,-4,15,7);line([[18,-4],[31,-4]],'#9db59e',1.5);ctx.restore();
}
function robot(e,time){
  const bob=animated?Math.sin(time*.004+e.id)*3:0;ctx.save();ctx.translate(e.x,e.y-7+bob);ellipse(0,25-bob,29,10,'#0009');
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+(animated?Math.sin(time*.002+e.id)*.08:0);const wiggle=animated?Math.sin(time*.005+i)*7:0;const pts=[[Math.cos(a)*12,Math.sin(a)*8],[Math.cos(a)*30,Math.sin(a)*25],[Math.cos(a)*43+wiggle,Math.sin(a)*33+9]];line(pts,e.chargeTime>0?'#c2946a':'#607c6c',3);line(pts,'#162c22',1);ellipse(pts[1][0],pts[1][1],3,3,'#91a296');}
  ctx.shadowBlur=12;ctx.shadowColor=e.flash>0?'#e4ffad':'#db614a';
  const metal=ctx.createRadialGradient(-7,-9,2,0,0,22);metal.addColorStop(0,e.flash>0?'#c9f4be':'#71897b');metal.addColorStop(1,'#0b1c14');ellipse(0,0,22,18,metal,'#82978b');ctx.shadowBlur=0;
  ellipse(0,1,13,9,'#120d0b','#9b5345');ellipse(0,1,6,5,'#ff8d70');ellipse(-2,-1,2,2,'#ffe2bc');ctx.restore();
}
function drawEnemy(e,time){
  if(e.warning>0){
    const r=26+(animated?Math.sin(time*.014)*5:0);ellipse(e.x,e.y,r,r*.55,'#49231f40','#de8c69');
    ctx.font='9px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#dfa480';ctx.fillText(e.type==='robot'?'SENTINELLE':'AGENT SMITH',e.x,e.y-40);
    ctx.globalAlpha=.3;
  }
  if(e.type==='robot')robot(e,time);else human(e.x,e.y,Math.atan2(game.player.y-e.y,game.player.x-e.x),e.walk,true,true,e.flash>0);
  ctx.globalAlpha=1;
  if(e.hp<e.maxHp&&e.warning<=0){ctx.fillStyle='#492b22';ctx.fillRect(e.x-18,e.y-53,36,3);ctx.fillStyle='#e7a487';ctx.fillRect(e.x-18,e.y-53,36*e.hp/e.maxHp,3);}
}
function draw(time){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#030a06';ctx.fillRect(0,0,width,height);ctx.font='11px monospace';ctx.textAlign='center';
  const clock=animated?time:0;
  for(let i=0;i<rain.length;i++){const r=rain[i],y=(r.y*(height+300)+clock*.001*r.speed)%(height+300)-120;for(let j=0;j<r.length;j++){ctx.fillStyle=j===0?'#a2f59b70':`rgba(49,180,85,${.2*(1-j/r.length)})`;ctx.fillText(glyphs[(i*7+j*3+Math.floor(clock/1500))%glyphs.length],r.x*width,y-j*14);}}
  ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);const w=game.width,h=game.height;
  ctx.fillStyle='#07140dd9';ctx.fillRect(0,0,w,h);
  for(let x=0;x<=w;x+=50)line([[x,0],[x,h]],'#1f412978');for(let y=0;y<=h;y+=50)line([[0,y],[w,y]],'#1f412978');
  line([[0,0],[w,0],[w,h],[0,h],[0,0]],game.player.slow>0?'#a2ecd5':'#52845a',2);
  line([[12,12],[w-12,12],[w-12,h-12],[12,h-12],[12,12]],'#24492e');
  line([[w*.24,h*.25],[w*.5,h*.25],[w*.5,h*.75],[w*.76,h*.75]],'#102b1b',18);
  line([[w*.76,h*.25],[w*.5,h*.25],[w*.5,h*.75],[w*.24,h*.75]],'#102b1b',18);
  ellipse(w/2,h/2,112,62,'#16332250','#3d6446');ellipse(w/2,h/2,102,56,null,'#2c4e35');
  ctx.textAlign='center';ctx.font='26px "Share Tech Mono",monospace';ctx.fillStyle='#659d6c40';ctx.fillText('THERE IS NO SPOON.',w/2,h*.16);
  ctx.font='10px "IBM Plex Mono",monospace';ctx.fillStyle='#6f927650';ctx.fillText('CONSTRUCT / COMBAT SIMULATION',w/2,h/2+91);
  for(const[x,y]of[[68,85],[w-68,85],[65,h-45],[w-65,h-45]])server(x,y,40);
  for(const pickup of game.pickups){ellipse(pickup.x,pickup.y,17,11,'#274d2988','#c6ffa3');line([[pickup.x-6,pickup.y],[pickup.x+6,pickup.y]],'#c6ffa3',3);line([[pickup.x,pickup.y-6],[pickup.x,pickup.y+6]],'#c6ffa3',3);}
  if(!started){drawEnemy({id:1,type:'smith',x:w*.24,y:h*.43,walk:0,hp:2,maxHp:2,warning:0,flash:0},time);drawEnemy({id:2,type:'robot',x:w*.76,y:h*.43,hp:4,maxHp:4,warning:0,flash:0,chargeTime:0},time);}
  const p=game.player;
  const entities=game.enemies.map(e=>({y:e.y,draw:()=>drawEnemy(e,time)}));
  entities.push({y:p.y,draw:()=>{
    if(p.invulnerable>.1&&started&&Math.floor(time/90)%2===0)ctx.globalAlpha=.6;
    if(p.slow>0){ellipse(p.x,p.y+24,36,13,'#9de7d520','#a2ecd5');}
    human(p.x,p.y,p.angle,p.walk,p.moving,false,p.invulnerable>.1&&started);ctx.globalAlpha=1;
    ctx.font='9px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillStyle='#befba8';ctx.fillText('NÉO',p.x,p.y+45);
    if(p.muzzle>0){ctx.save();ctx.translate(p.x+Math.cos(p.angle)*34,p.y+Math.sin(p.angle)*34-2);ctx.rotate(p.angle);poly([[0,-7],[17,0],[0,7],[4,0]],'#e9ffc0');ctx.restore();}
  }});entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  for(const b of game.bullets){line([[b.x-b.vx*.013,b.y-b.vy*.013],[b.x,b.y]],'#d8ff9a',3);}
  for(const b of game.hostile){ctx.shadowBlur=9;ctx.shadowColor='#ff9570';line([[b.x-b.vx*.025,b.y-b.vy*.025],[b.x,b.y]],'#ffac7d',3);ellipse(b.x,b.y,4,4,'#ffd3a0');ctx.shadowBlur=0;}
  for(const part of game.particles){ctx.globalAlpha=clamp(part.life*2.5,0,1);ctx.fillStyle=part.color;ctx.fillRect(part.x-2,part.y-2,4,4);}ctx.globalAlpha=1;
  if(pointer&&started&&!paused&&!endShown&&!compact){line([[pointer.x-12,pointer.y],[pointer.x-5,pointer.y]],'#c4f6a8');line([[pointer.x+5,pointer.y],[pointer.x+12,pointer.y]],'#c4f6a8');line([[pointer.x,pointer.y-12],[pointer.x,pointer.y-5]],'#c4f6a8');line([[pointer.x,pointer.y+5],[pointer.x,pointer.y+12]],'#c4f6a8');ellipse(pointer.x,pointer.y,3,3,null,'#c4f6a8');}
  ctx.restore();
  if(p.slow>0){ctx.fillStyle='#8ee1cb08';ctx.fillRect(0,0,width,height);}
  if(damageFlash>0&&!reduced.matches){ctx.strokeStyle=`rgba(238,118,85,${damageFlash*2})`;ctx.lineWidth=14;ctx.strokeRect(7,7,width-14,height-14);}
}
function frame(time){
  const dt=Math.min((time-lastTime)/1000||0,.2);lastTime=time;
  if(started&&!paused&&!endShown){
    accumulator+=dt;
    while(accumulator>=1/60){tick(game,1/60,inputs());accumulator-=1/60;}
    processEvents();bannerTime-=dt;if(bannerTime<=0)$('wave-banner').textContent='';damageFlash=Math.max(0,damageFlash-dt);
    if(game.state==='won'||game.state==='lost')finish();
  }
  draw(time);hud();frameId=requestAnimationFrame(frame);
}
$('start').addEventListener('click',()=>paused?resumeGame():startGame());$('restart').addEventListener('click',startGame);
$('pause').addEventListener('click',()=>paused?resumeGame():pauseGame());
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;updateSound();if(soundEnabled)initAudio();});
function updateMotion(){$('motion').textContent=`FOND ANIMÉ : ${animated?'OUI':'NON'}`;$('motion').setAttribute('aria-pressed',String(animated));}
$('motion').addEventListener('click',()=>{animated=!animated;updateMotion();});reduced.addEventListener('change',e=>{animated=!e.matches;updateMotion();});
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(e.metaKey||e.ctrlKey||e.altKey)return;
  if((key==='escape'||key==='p')&&!e.repeat){if(started&&!endShown){e.preventDefault();paused?resumeGame():pauseGame();}return;}
  if(!started||paused||endShown||e.target.closest('button,a,input,textarea,select'))return;
  if(moveKeys.has(key)){e.preventDefault();keys.add(key);if(key===' '&&!e.repeat)activateSlow(game);}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function aimAt(e){const rect=canvas.getBoundingClientRect();pointer={x:(e.clientX-rect.left-ox)/scale,y:(e.clientY-rect.top-oy)/scale};}
canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')aimAt(e);});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!started||paused||endShown)return;e.preventDefault();canvas.focus({preventScroll:true});aimAt(e);mouseFire=true;canvas.setPointerCapture(e.pointerId);initAudio();});
canvas.addEventListener('pointerup',()=>mouseFire=false);canvas.addEventListener('pointercancel',()=>mouseFire=false);canvas.addEventListener('lostpointercapture',()=>mouseFire=false);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('pointerup',()=>mouseFire=false);
for(const button of document.querySelectorAll('[data-dir]')){
  const end=()=>{directions.delete(button.dataset.dir);button.classList.remove('is-down');};
  button.addEventListener('pointerdown',e=>{if(!started||paused||endShown)return;e.preventDefault();button.setPointerCapture(e.pointerId);directions.add(button.dataset.dir);button.classList.add('is-down');});
  button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
}
$('fire-touch').addEventListener('pointerdown',e=>{if(!started||paused||endShown)return;e.preventDefault();$('fire-touch').setPointerCapture(e.pointerId);touchFire=true;$('fire-touch').classList.add('is-down');initAudio();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('fire-touch').addEventListener(type,()=>{touchFire=false;$('fire-touch').classList.remove('is-down');});
$('slow-touch').addEventListener('click',()=>{activateSlow(game);canvas.focus({preventScroll:true});});
window.addEventListener('blur',()=>{clearInput();pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pauseGame();clearInput();cancelAnimationFrame(frameId);}else{lastTime=performance.now();accumulator=0;cancelAnimationFrame(frameId);frameId=requestAnimationFrame(frame);}});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);clearInput();});
window.addEventListener('pageshow',e=>{if(e.persisted){pauseGame();lastTime=performance.now();cancelAnimationFrame(frameId);frameId=requestAnimationFrame(frame);}});
new ResizeObserver(resize).observe($('arena'));window.addEventListener('resize',resize);
resize();updateMotion();updateSound();
if(ctx)frameId=requestAnimationFrame(frame);else{$('overlay-copy').textContent='Le rendu du jeu est indisponible dans ce navigateur. Essaie une version récente de Chrome, Firefox ou Safari.';$('start').disabled=true;}
