/*
 * Soft intermittent cursor glow — Orbit / Mood.fm / Portfolio.
 * Preserves the native cursor and click targets, supports keyboard / touch,
 * and disables itself when reduced motion is requested.
 */
(() => {
  'use strict';
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  const root = document.documentElement;
  const path = location.pathname.toLowerCase();
  const kind = path.includes('/moodfm/') || document.querySelector('#note-sky') ? 'mood' :
    path.includes('/orbit/') || document.querySelector('#shooting-layer') ? 'orbit' : 'portfolio';
  const css = `
    .cg-glimmer {
      --cg-rgb: 201, 158, 255;
      position: fixed; width: 0; height: 0; left: 0; top: 0;
      z-index: 2147483000; pointer-events: none;
      transform: translate3d(-500px,-500px,0);
      isolation: isolate; contain: layout style;
      opacity: 0; will-change: transform,opacity;
      transition: opacity 160ms ease;
    }
    .cg-glimmer[data-kind="mood"] { --cg-rgb: 255, 146, 187; }
    .cg-glimmer[data-kind="orbit"] { --cg-rgb: 198, 158, 255; }
    .cg-glimmer[data-kind="portfolio"] { --cg-rgb: 225, 162, 255; }
    .cg-glimmer.cg-show { opacity: 1; }
    .cg-glimmer__halo,
    .cg-glimmer__ring,
    .cg-glimmer__spark { position: absolute; pointer-events: none; }
    .cg-glimmer__halo {
      left: -48px; top: -48px; width: 96px; height: 96px;
      border-radius: 50%;
      background: radial-gradient(circle,
        rgba(255,255,255,.85) 0%,
        rgba(var(--cg-rgb),.45) 11%,
        rgba(var(--cg-rgb),.19) 36%,
        rgba(var(--cg-rgb),0) 70%);
      filter: blur(2.5px);
      transform: scale(.28); opacity: 0;
    }
    .cg-glimmer__ring {
      left: -15px; top: -15px; width: 30px; height: 30px;
      border: 1px solid rgba(var(--cg-rgb), .65);
      border-radius: 50%;
      box-shadow: 0 0 14px rgba(var(--cg-rgb),.23);
      transform: scale(.2); opacity: 0;
    }
    .cg-glimmer__spark {
      width: 4px; height: 4px; border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 8px 2px rgba(var(--cg-rgb),.65);
      opacity: 0; transform: scale(.2);
    }
    .cg-glimmer__spark:nth-child(3) { left: -7px; top: -7px; }
    .cg-glimmer__spark:nth-child(4) { left: 6px; top: 5px; }
    .cg-glimmer__spark:nth-child(5) { left: -2px; top: 9px; }
    .cg-glimmer.cg-pulse .cg-glimmer__halo { animation: cg-shine 1.55s ease-out both; }
    .cg-glimmer.cg-pulse .cg-glimmer__ring { animation: cg-ring 1.4s cubic-bezier(.18,.68,.26,1) both; }
    .cg-glimmer.cg-pulse .cg-glimmer__spark:nth-child(3) { animation: cg-spark-a 1.3s ease-out both; }
    .cg-glimmer.cg-pulse .cg-glimmer__spark:nth-child(4) { animation: cg-spark-b 1.3s ease-out both; }
    .cg-glimmer.cg-pulse .cg-glimmer__spark:nth-child(5) { animation: cg-spark-c 1.3s ease-out both; }
    @keyframes cg-shine {
      0% { opacity: 0; transform: scale(.25); }
      28% { opacity: .86; transform: scale(.85); }
      53% { opacity: .48; transform: scale(1.1); }
      100% { opacity: 0; transform: scale(1.4); }
    }
    @keyframes cg-ring {
      0% { opacity: 0; transform: scale(.2); }
      34% { opacity: .76; }
      100% { opacity: 0; transform: scale(2.55); }
    }
    @keyframes cg-spark-a {
      0% { opacity: 0; transform: translate(0,0) scale(.2); }
      35% { opacity: .9; }
      100% { opacity: 0; transform: translate(-25px,-23px) scale(.45); }
    }
    @keyframes cg-spark-b {
      0% { opacity: 0; transform: translate(0,0) scale(.2); }
      35% { opacity: .85; }
      100% { opacity: 0; transform: translate(23px,17px) scale(.55); }
    }
    @keyframes cg-spark-c {
      0% { opacity: 0; transform: translate(0,0) scale(.2); }
      35% { opacity: .9; }
      100% { opacity: 0; transform: translate(-7px,25px) scale(.4); }
    }
    @media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
      .cg-glimmer { display: none !important; }
    }
  `;
  const stylesheet = document.createElement('style');
  stylesheet.textContent = css;
  document.head.append(stylesheet);

  const glow = document.createElement('span');
  glow.className = 'cg-glimmer';
  glow.dataset.kind = kind;
  glow.setAttribute('aria-hidden','true');
  glow.innerHTML = '<span class="cg-glimmer__halo"></span><span class="cg-glimmer__ring"></span><span class="cg-glimmer__spark"></span><span class="cg-glimmer__spark"></span><span class="cg-glimmer__spark"></span>';
  document.body.append(glow);

  let x = -500, y = -500, timer = null, finish = null;
  let hasPosition = false;
  function clearGlow() {
    glow.classList.remove('cg-show','cg-pulse');
    if (finish !== null) { clearTimeout(finish); finish = null; }
  }
  function schedule() {
    if (timer !== null || !hasPosition || document.hidden || reducedMotion.matches) return;
    const interval = 10000 + Math.random() * 5000;
    timer = window.setTimeout(() => {
      timer = null;
      if (!hasPosition || document.hidden || !finePointer.matches || reducedMotion.matches) return;
      glow.classList.remove('cg-pulse');
      void glow.offsetWidth; // Restart the CSS effect.
      glow.classList.add('cg-show','cg-pulse');
      finish = window.setTimeout(() => { glow.classList.remove('cg-show','cg-pulse'); finish = null; }, 1550);
      schedule();
    }, interval);
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    x = event.clientX;
    y = event.clientY;
    glow.style.transform = `translate3d(${x}px,${y}px,0)`;
    hasPosition = true;
    schedule();
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (event.relatedTarget === null) {
      hasPosition = false;
      clearGlow();
      if (timer !== null) { clearTimeout(timer); timer = null; }
    }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearGlow();
      if (timer !== null) { clearTimeout(timer); timer = null; }
    } else schedule();
  });
  // Treat a runtime reduction of motion as an opt-out as well.
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      clearGlow();
      if (timer !== null) { clearTimeout(timer); timer = null; }
    } else schedule();
  });
  // Allows deterministic manual QA without waiting for a timer.
  document.addEventListener('cursor-glow-preview', () => {
    if (!hasPosition || reducedMotion.matches) return;
    glow.classList.remove('cg-pulse');
    void glow.offsetWidth;
    glow.classList.add('cg-show','cg-pulse');
    if (finish !== null) clearTimeout(finish);
    finish = window.setTimeout(() => { glow.classList.remove('cg-show','cg-pulse'); finish = null; }, 1550);
  });
})();
