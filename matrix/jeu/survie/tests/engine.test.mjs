import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, tick, activateSlow, resizeWorld, segmentHitsCircle, WAVES } from '../engine.mjs';
const random = () => { let value=12345;return()=>((value=(value*1664525+1013904223)>>>0)/4294967296); };
const enemy = (x,y,hp=2) => ({id:1,type:'smith',x,y,hp,maxHp:hp,radius:17,warning:0,shotClock:100,chargeClock:100,chargeTime:0,walk:0,flash:0});
function step(g, seconds, input={}) { for(let i=0;i<Math.ceil(seconds*60);i++) tick(g,1/60,input); }
test('Une balle rapide touche sa cible même entre deux images',()=>{
  assert.equal(segmentHitsCircle(0,0,100,0,50,0,8),true);
  assert.equal(segmentHitsCircle(0,0,100,0,50,30,8),false);
  const g=createGame();g.remaining=0;g.enemies=[enemy(700,390,1)];g.bullets=[{x:650,y:390,vx:3000,vy:0,life:1}];
  tick(g,1/30);assert.equal(g.kills,1);assert.equal(g.score,100);assert.equal(g.enemies.length,0);
});
test('Le ralenti ralentit les ennemis sans ralentir Néo et nécessite une recharge',()=>{
  const normal=createGame(),slow=createGame();
  for(const g of [normal,slow]){g.remaining=0;g.enemies=[enemy(150,150)];}
  assert.equal(activateSlow(slow),true);assert.equal(activateSlow(slow),false);
  step(normal,.5,{x:1});step(slow,.5,{x:1});
  assert.equal(normal.player.x,slow.player.x);assert.ok(slow.enemies[0].x<normal.enemies[0].x);
  assert.equal(activateSlow(slow),false);
});
test('Les dégâts ont une invulnérabilité, la mort est définitive pour cette partie',()=>{
  const g=createGame();g.remaining=0;g.player.invulnerable=0;g.enemies=[enemy(g.player.x,g.player.y)];
  tick(g,1/60);assert.equal(g.player.hp,84);step(g,.4);assert.equal(g.player.hp,84);
  step(g,8);assert.equal(g.state,'lost');const elapsed=g.elapsed;tick(g,1);assert.equal(g.elapsed,elapsed);
});
test('Les cinq vagues progressent, soignent et aboutissent à une victoire',()=>{
  const g=createGame();g.player.hp=50;
  for(let wave=1;wave<=WAVES.length;wave++){
    assert.equal(g.wave,wave);g.remaining=0;g.enemies=[];tick(g,1/60);
    if(wave<WAVES.length){assert.equal(g.state,'intermission');step(g,3.6);assert.equal(g.state,'playing');}
  }
  assert.equal(g.state,'won');assert.equal(g.player.hp,100);
});
test('Les apparitions sont annoncées et éloignées du joueur, les tableaux restent bornés',()=>{
  const g=createGame(720,1000,random());g.player.x=48;g.player.y=48;g.spawnClock=0;tick(g,1/60);
  assert.equal(g.enemies.length,1);assert.ok(g.enemies[0].warning>0);assert.ok(Math.hypot(g.enemies[0].x-48,g.enemies[0].y-48)>260);
  step(g,60,{fire:true,autoAim:true});assert.ok(g.particles.length<=250);assert.ok(g.bullets.length<30);assert.ok(g.enemies.length<=16);
});
test('Le redimensionnement conserve les positions relatives, rejouer réinitialise tout',()=>{
  const g=createGame();g.enemies=[enemy(300,195)];resizeWorld(g,720,1000);
  assert.equal(g.player.x,360);assert.ok(Math.abs(g.player.y-500)<1e-8);assert.equal(g.enemies[0].x,180);assert.ok(Math.abs(g.enemies[0].y-250)<1e-8);
  g.player.hp=0;g.state='lost';g.score=1000;const fresh=createGame(720,1000);
  assert.equal(fresh.player.hp,100);assert.equal(fresh.state,'playing');assert.equal(fresh.wave,1);assert.equal(fresh.score,0);assert.equal(fresh.enemies.length,0);
});
