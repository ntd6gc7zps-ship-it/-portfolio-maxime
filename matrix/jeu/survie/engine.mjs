// Simulation indépendante du rendu : positions en unités du monde, durées en secondes.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const WAVES = [6, 9, 12, 15, 18];
export function segmentHitsCircle(ax, ay, bx, by, cx, cy, radius) {
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  const t = length ? clamp(((cx - ax) * dx + (cy - ay) * dy) / length, 0, 1) : 0;
  return Math.hypot(ax + t * dx - cx, ay + t * dy - cy) <= radius;
}
export function createGame(width = 1200, height = 780, random = Math.random) {
  return {
    width, height, random, state: 'playing', wave: 1, remaining: WAVES[0], spawnClock: 1.1,
    enemies: [], bullets: [], hostile: [], particles: [], pickups: [], events: [],
    kills: 0, score: 0, elapsed: 0, intermission: 0, nextId: 1,
    player: { x: width / 2, y: height / 2, hp: 100, radius: 17, invulnerable: 1.5, shotClock: 0, angle: -Math.PI / 2, walk: 0, moving: false, muzzle: 0, slow: 0, charge: 100 }
  };
}
export function resizeWorld(g, width, height) {
  const sx = width / g.width, sy = height / g.height;
  for (const item of [g.player, ...g.enemies, ...g.bullets, ...g.hostile, ...g.particles, ...g.pickups]) {
    item.x *= sx; item.y *= sy;
  }
  g.width = width; g.height = height;
}
export function activateSlow(g) {
  if (g.state !== 'playing' || g.player.charge < 100 || g.player.slow > 0) return false;
  g.player.slow = 2.2; g.player.charge = 0; g.events.push({ type: 'slow' }); return true;
}
function sparks(g, x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = g.random() * Math.PI * 2, speed = 35 + g.random() * 160;
    g.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .3 + g.random() * .35, color });
  }
  if (g.particles.length > 250) g.particles.splice(0, g.particles.length - 250);
}
function spawn(g) {
  const margin = 48, edge = Math.floor(g.random() * 4);
  let x = margin + g.random() * (g.width - margin * 2), y = margin + g.random() * (g.height - margin * 2);
  if (edge === 0) x = margin;
  if (edge === 1) x = g.width - margin;
  if (edge === 2) y = margin;
  if (edge === 3) y = g.height - margin;
  if (distance({ x, y }, g.player) < 260) {
    x = g.player.x < g.width / 2 ? g.width - margin : margin;
    y = g.player.y < g.height / 2 ? g.height - margin : margin;
  }
  const type = (g.nextId % 3 === 0 || (g.wave >= 4 && g.nextId % 2 === 0)) ? 'robot' : 'smith';
  const hp = type === 'robot' ? 4 : 2;
  g.enemies.push({ id: g.nextId++, type, x, y, hp, maxHp: hp, radius: type === 'robot' ? 22 : 17,
    warning: 1, shotClock: 1.8 + g.random() * 1.5, chargeClock: 2 + g.random(), chargeTime: 0, walk: 0, flash: 0 });
  g.remaining--;
}
function hurt(g, amount) {
  const p = g.player;
  if (p.invulnerable > 0 || g.state !== 'playing') return;
  p.hp = Math.max(0, p.hp - amount); p.invulnerable = .85;
  sparks(g, p.x, p.y, '#d9ffb2', 14); g.events.push({ type: 'hurt' });
  if (p.hp === 0) { g.state = 'lost'; g.events.push({ type: 'lost' }); }
}
function kill(g, e) {
  g.kills++; g.score += e.type === 'robot' ? 200 : 100;
  sparks(g, e.x, e.y, e.type === 'robot' ? '#ffb065' : '#78f6a0', 20);
  g.events.push({ type: 'kill', robot: e.type === 'robot' });
  if (g.kills % 7 === 0) g.pickups.push({ x: e.x, y: e.y, life: 18 });
}
export function tick(g, dt, input = {}) {
  if (g.state === 'lost' || g.state === 'won' || dt <= 0) return;
  dt = Math.min(dt, .05);
  const p = g.player, factor = g.width < 900 ? .8 : 1;
  g.elapsed += dt;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.shotClock = Math.max(0, p.shotClock - dt); p.muzzle = Math.max(0, p.muzzle - dt);
  p.slow = Math.max(0, p.slow - dt);
  if (!p.slow) p.charge = Math.min(100, p.charge + dt * 12.5);
  const enemyDt = dt * (p.slow > 0 ? .26 : 1);
  let dx = input.x || 0, dy = input.y || 0, length = Math.hypot(dx, dy);
  p.moving = length > 0;
  if (length) {
    const speed = (input.sprint ? 290 : 230) * factor;
    p.x = clamp(p.x + dx / length * speed * dt, 30, g.width - 30);
    p.y = clamp(p.y + dy / length * speed * dt, 45, g.height - 25);
    p.walk += dt * (input.sprint ? 16 : 11);
  }
  let aim = input.aim;
  if (input.autoAim) {
    let closest = null, best = Infinity;
    for (const e of g.enemies) if (e.hp > 0 && e.warning <= 0 && distance(p, e) < best) { best = distance(p, e); closest = e; }
    if (closest) aim = closest;
  }
  if (aim) p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
  if (input.fire && p.shotClock <= 0 && g.state === 'playing') {
    p.shotClock = .145; p.muzzle = .065;
    const vx = Math.cos(p.angle), vy = Math.sin(p.angle);
    g.bullets.push({ x: p.x + vx * 26, y: p.y + vy * 26, vx: vx * 900 * factor, vy: vy * 900 * factor, life: 1.8 });
    g.events.push({ type: 'shot' });
  }
  if (g.state === 'intermission') {
    g.intermission -= dt;
    if (g.intermission <= 0) {
      g.wave++; g.remaining = WAVES[g.wave - 1]; g.spawnClock = .5; g.state = 'playing';
      g.events.push({ type: 'wave', wave: g.wave });
    }
  } else if (g.state === 'playing') {
    g.spawnClock -= enemyDt;
    if (g.remaining > 0 && g.spawnClock <= 0 && g.enemies.length < 16) {
      spawn(g); g.spawnClock = Math.max(.5, 1.1 - g.wave * .07);
    }
  }
  for (const e of g.enemies) {
    e.flash = Math.max(0, e.flash - dt);
    if (e.warning > 0) { e.warning -= enemyDt; continue; }
    const angle = Math.atan2(p.y - e.y, p.x - e.x), dist = distance(e, p);
    let speed = e.type === 'robot' ? 78 + g.wave * 5 : 90 + g.wave * 6;
    if (e.type === 'robot') {
      e.chargeClock -= enemyDt; e.chargeTime = Math.max(0, e.chargeTime - enemyDt);
      if (e.chargeClock <= 0 && dist < 370) { e.chargeTime = .55; e.chargeClock = 3.5; }
      if (e.chargeTime > 0) speed *= 2.15;
    } else {
      e.shotClock -= enemyDt;
      if (e.shotClock <= 0 && dist < 740) {
        e.shotClock = Math.max(1.7, 3.4 - g.wave * .2) + g.random() * .6;
        g.hostile.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 245 * factor, vy: Math.sin(angle) * 245 * factor, life: 4 });
      }
    }
    if (dist > 24) { e.x += Math.cos(angle) * speed * factor * enemyDt; e.y += Math.sin(angle) * speed * factor * enemyDt; }
    e.walk += enemyDt * 9;
    // Sépare les ennemis pour que leur silhouette et leurs attaques restent lisibles.
    for (const other of g.enemies) {
      if (other.id <= e.id || other.warning > 0) continue;
      const d = distance(e, other), gap = e.radius + other.radius + 3;
      if (d > .01 && d < gap) {
        const push = (gap - d) * .5, nx = (e.x - other.x) / d, ny = (e.y - other.y) / d;
        e.x += nx * push; e.y += ny * push; other.x -= nx * push; other.y -= ny * push;
      }
    }
    e.x = clamp(e.x, 25, g.width - 25); e.y = clamp(e.y, 35, g.height - 25);
    if (distance(e, p) < e.radius + p.radius) hurt(g, e.type === 'robot' ? 22 : 16);
  }
  for (const b of g.bullets) {
    const oldX = b.x, oldY = b.y;
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    let hit = null, best = Infinity;
    for (const e of g.enemies) {
      if (e.hp <= 0 || e.warning > 0 || !segmentHitsCircle(oldX, oldY, b.x, b.y, e.x, e.y, e.radius + 3)) continue;
      const d = Math.hypot(e.x - oldX, e.y - oldY);
      if (d < best) { best = d; hit = e; }
    }
    if (hit) {
      hit.hp--; hit.flash = .1; b.life = 0;
      sparks(g, hit.x, hit.y, '#cfff92', 5);
      if (hit.hp <= 0) kill(g, hit);
    }
  }
  for (const b of g.hostile) {
    const oldX = b.x, oldY = b.y;
    b.x += b.vx * enemyDt; b.y += b.vy * enemyDt; b.life -= enemyDt;
    if (segmentHitsCircle(oldX, oldY, b.x, b.y, p.x, p.y, p.radius + 3)) { b.life = 0; hurt(g, 12); }
  }
  const alive = b => b.life > 0 && b.x > -30 && b.y > -30 && b.x < g.width + 30 && b.y < g.height + 30;
  g.bullets = g.bullets.filter(alive); g.hostile = g.hostile.filter(alive);
  g.enemies = g.enemies.filter(e => e.hp > 0);
  for (const pickup of g.pickups) {
    pickup.life -= dt;
    if (p.hp < 100 && distance(p, pickup) < 35) { p.hp = Math.min(100, p.hp + 25); pickup.life = 0; g.events.push({ type: 'heal' }); }
  }
  g.pickups = g.pickups.filter(i => i.life > 0);
  for (const part of g.particles) { part.x += part.vx * dt; part.y += part.vy * dt; part.life -= dt; }
  g.particles = g.particles.filter(i => i.life > 0);
  if (g.state === 'playing' && g.remaining === 0 && g.enemies.length === 0) {
    g.hostile = []; g.bullets = [];
    if (g.wave === WAVES.length) { g.state = 'won'; g.events.push({ type: 'won' }); }
    else { g.state = 'intermission'; g.intermission = 3.5; p.hp = Math.min(100, p.hp + 18); g.events.push({ type: 'clear', wave: g.wave }); }
  }
}
