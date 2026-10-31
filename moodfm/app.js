'use strict';
// Catalogue de vrais titres sélectionnés ; indicateurs d'énergie et de tempo estimés, aucun streaming intégré.
const data = Array.isArray(window.MOODFM_TRACKS) ? window.MOODFM_TRACKS : [];
const moodLabels = {focus:'Focus', nuit:'Nuit', roadtrip:'Road trip', pluie:'Pluie', soiree:'Soirée', chill:'Chill'};
const moodNames = {focus:'Focus & flow', nuit:'Après minuit', roadtrip:'Road trip radio', pluie:'Pluie & café', soiree:'Soirée électrique', chill:'Chill du soir'};
const presets = {focus:[43,58,98], nuit:[45,42,86], roadtrip:[76,78,125], pluie:[27,39,82], soiree:[88,82,132], chill:[30,68,86]};
const glyphs = ['♫','☾','✧','♬','✺','♪','✦','☁'];
const byId = id => document.getElementById(id);
const energy = byId('energy'), positivity = byId('positivity'), tempo = byId('tempo'), search = byId('search-tracks');
const list = byId('tracks'), summary = byId('playlist-summary'), loadMore = byId('load-more'), dialog = byId('track-modal');
const artistGrid = byId('artist-grid'), artistCount = byId('artist-count'), libraryMood = byId('library-mood-label'), libraryVisible = byId('library-visible');
const moodThemes = {
  chill:    {a:'#f6a5d5', b:'#8ea1ff', c:'#241629', d:'#ffe7f3', icon:'☁'},
  focus:    {a:'#8ae7d6', b:'#7aa4ff', c:'#142528', d:'#e9fffb', icon:'✦'},
  nuit:     {a:'#7f7af8', b:'#7bc9ff', c:'#131523', d:'#eef2ff', icon:'☾'},
  roadtrip: {a:'#ffb17c', b:'#ff7b8f', c:'#2a1b16', d:'#fff1e6', icon:'➵'},
  pluie:    {a:'#80a7ff', b:'#c2c7ff', c:'#152039', d:'#eef4ff', icon:'☂'},
  soiree:   {a:'#ff7bc8', b:'#ffb36d', c:'#2b1321', d:'#fff0f8', icon:'✺'}
};
let currentMood = 'chill', visible = 48, filtered = [], lastSignature = '', saved = [];
let selectedTrackId = null;
let visualAnimationActive = true;

const artistPhotos = new Map();
const articleTitles = {
 'Daft Punk':'Daft Punk','The Weeknd':'The Weeknd','Dua Lipa':'Dua Lipa','Billie Eilish':'Billie Eilish',
 'Coldplay':'Coldplay','Tame Impala':'Tame Impala','SZA':'SZA (singer)','Lana Del Rey':'Lana Del Rey',
 'Ariana Grande':'Ariana Grande','Stromae':'Stromae','Kendrick Lamar':'Kendrick Lamar',
 'Taylor Swift':'Taylor Swift','Angèle':'Angèle (singer)','M83':'M83 (band)',
 'Beyoncé':'Beyoncé','ODESZA':'Odesza'
};
// Portraits vérifiés sur Wikimedia Commons pour le repli; source conservée, pas de copie locale.
const portraitFallback={
 'Daft Punk':'Daft Punk in 2013.jpg',
 'Dua Lipa':'Dua Lipa.jpg',
 'The Weeknd':'The Weeknd 2015.jpg',
 'Taylor Swift':'Taylor swift.jpg',
 'Stromae':'Stromae, Rock en Seine Festival 2022, Paris (52391597894).jpg',
 'Tame Impala':'Tame Impala 2022 1.jpg'
};
function portraitFallbackUrl(artist){return portraitFallback[artist]
 ? 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(portraitFallback[artist])+'?width=320' : '';}
function portraitOf(artist){return artistPhotos.get(artist) || portraitFallbackUrl(artist) || '';}
function applyPortraits(){
 document.querySelectorAll('[data-artist-photo]').forEach(el=>{
  const name=el.dataset.artistPhoto, url=portraitOf(name);
  if(url && el.getAttribute('src')!==url) {el.src=url;el.hidden=false;}
 });
 document.querySelectorAll('[data-artist-backdrop]').forEach(el=>{
  const url=portraitOf(el.dataset.artistBackdrop);
  if(url) el.style.backgroundImage=`linear-gradient(0deg,rgba(8,5,16,.35),rgba(8,5,16,.02)),url("${url}")`;
 });
}
async function loadArtistPortraits(){
 try{
  const titles=Object.values(articleTitles);
  const url='https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*&redirects=1&titles='+encodeURIComponent(titles.join('|'));
  const res=await fetch(url,{mode:'cors'});
  if(!res.ok) throw Error('Wikipedia API '+res.status);
  const info=await res.json();
  const pages=Object.values(info?.query?.pages||{});
  for(const [artist,title] of Object.entries(articleTitles)){
   const page=pages.find(p=>p.title?.toLocaleLowerCase('en')===title.toLocaleLowerCase('en'));
   const src=page?.thumbnail?.source;
   if(src && src.startsWith('https://')) artistPhotos.set(artist,src);
  }
  applyPortraits();
 }catch(err){applyPortraits();}
}

try { saved = JSON.parse(localStorage.getItem('moodfm_saved_2026') || '[]'); if (!Array.isArray(saved)) saved = []; } catch (e) { saved = []; }

function hash(value){ let h = 2166136261; for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function clamp(num, min, max){ return Math.max(min, Math.min(max, Math.round(num))); }
function svgUrl(svg){ return `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`; }
function initials(name){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join(''); }

function score(t, e, p, b, seed){
  const affinity = (t.mood === currentMood ? 37 : 0);
  const related = (currentMood === 'soiree' && t.mood === 'roadtrip' && p > 75 ? 12 : 0)
    + (currentMood === 'chill' && t.mood === 'pluie' ? 10 : 0)
    + (currentMood === 'focus' && t.mood === 'nuit' ? 7 : 0);
  const distance = Math.abs(t.energy - e) * .91 + Math.abs(t.positivity - p) * 1.07 + Math.abs(t.tempo - b) * .32;
  const variety = ((hash(t.id + '-' + seed) % 2000) / 2000 - .5) * 17;
  return affinity + related - distance + variety;
}
function currentSignature(){ return `${currentMood}:${energy.value}:${positivity.value}:${tempo.value}:${search.value.trim().toLowerCase()}`; }
function getRecommended(){
  const e = Number(energy.value), p = Number(positivity.value), b = Number(tempo.value);
  const seed = `${Math.round(e / 2)}-${Math.round(p / 2)}-${Math.round(b / 2)}`;
  const phrase = search.value.trim().toLocaleLowerCase('fr');
  return data.filter(t => !phrase || (t.title + ' ' + t.artist + ' ' + moodLabels[t.mood]).toLocaleLowerCase('fr').includes(phrase))
    .map(t => ({t, score: score(t, e, p, b, seed)}))
    .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id))
    .map(entry => entry.t);
}
function updateRangeOutputs(){
  for (const id of ['energy','positivity','tempo']) {
    const el = byId(id), out = byId(id + '-out');
    if (out) out.textContent = el.value + (id === 'tempo' ? ' BPM' : ' %');
    const pct = 100 * (Number(el.value) - Number(el.min)) / (Number(el.max) - Number(el.min));
    el.style.setProperty('--range-pct', pct + '%');
  }
}
function coverArtwork(track){
  const theme = moodThemes[track.mood] || moodThemes.chill;
  const seed = hash(track.id + track.title + track.artist);
  const variant = seed % 6;
  const p1x = 16 + (seed % 42), p1y = 14 + (seed % 24), p2x = 88 + (seed % 38), p2y = 16 + (seed % 26);
  const title = track.title.slice(0, 15).replace(/&/g,'&amp;');
  const artist = track.artist.slice(0, 14).replace(/&/g,'&amp;');
  const badge = moodLabels[track.mood].toUpperCase();
  const rainDetail = Array.from({length:7}, (_, i) => `<path d="M${24 + i * 18} 26 L${19 + i * 18} 42" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/>`).join('');
  const eq = Array.from({length:9}, (_, i) => {
    const h = 14 + ((seed >> i) % 34);
    return `<rect x="${19 + i * 14}" y="${85 - h}" width="8" height="${h}" rx="4" fill="rgba(255,255,255,.18)"/>`;
  }).join('');
  const scenes = [
    `<path d="M0 84 C24 65 44 58 63 61 C84 64 97 79 118 81 C134 82 146 78 164 67 L164 116 L0 116 Z" fill="rgba(255,255,255,.18)"/><path d="M0 96 C26 77 43 76 62 82 C84 89 105 95 164 74 L164 116 L0 116 Z" fill="rgba(9,9,18,.22)"/><circle cx="${122 + seed % 18}" cy="28" r="14" fill="rgba(255,244,214,.86)"/>`,
    `<rect x="16" y="56" width="16" height="40" rx="4" fill="rgba(255,255,255,.16)"/><rect x="38" y="48" width="14" height="48" rx="4" fill="rgba(255,255,255,.12)"/><rect x="58" y="34" width="22" height="62" rx="4" fill="rgba(255,255,255,.18)"/><rect x="86" y="46" width="17" height="50" rx="4" fill="rgba(255,255,255,.13)"/><rect x="109" y="26" width="24" height="70" rx="4" fill="rgba(255,255,255,.2)"/><rect x="138" y="42" width="11" height="54" rx="4" fill="rgba(255,255,255,.12)"/><path d="M0 88 Q34 72 69 83 T164 76" stroke="rgba(255,255,255,.38)" fill="none" stroke-width="2"/>`,
    `<circle cx="122" cy="59" r="30" fill="rgba(255,255,255,.14)"/><ellipse cx="122" cy="59" rx="43" ry="12" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3" transform="rotate(-20 122 59)"/><circle cx="43" cy="30" r="4" fill="rgba(255,255,255,.7)"/><circle cx="58" cy="49" r="2" fill="rgba(255,255,255,.5)"/><circle cx="148" cy="25" r="3" fill="rgba(255,255,255,.75)"/>`,
    `<path d="M20 84 C34 62 48 60 60 82 C72 104 90 102 103 80 C116 58 130 57 144 86" stroke="rgba(255,255,255,.58)" fill="none" stroke-width="2.4" stroke-linecap="round"/><g opacity=".55">${rainDetail}</g>`,
    `<path d="M16 90 L148 90" stroke="rgba(255,255,255,.22)" stroke-width="2"/><path d="M22 84 C45 65 58 63 78 73 C98 83 121 77 144 58" stroke="rgba(255,255,255,.58)" fill="none" stroke-width="2.4"/><circle cx="46" cy="34" r="21" fill="rgba(255,255,255,.14)"/><circle cx="46" cy="34" r="8" fill="rgba(255,255,255,.3)"/><rect x="102" y="23" width="12" height="48" rx="6" fill="rgba(255,255,255,.25)"/><rect x="121" y="34" width="12" height="37" rx="6" fill="rgba(255,255,255,.18)"/>`,
    `<circle cx="132" cy="24" r="17" fill="rgba(255,255,255,.12)"/>${eq}<path d="M18 86 Q58 70 86 79 T146 71" stroke="rgba(255,255,255,.52)" fill="none" stroke-width="2"/>`
  ];
  return svgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="164" height="116" viewBox="0 0 164 116">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.a}"/>
          <stop offset="100%" stop-color="${theme.b}"/>
        </linearGradient>
      </defs>
      <rect width="164" height="116" rx="16" fill="url(#g)"/>
      <rect width="164" height="116" rx="16" fill="${theme.c}" opacity=".48"/>
      <circle cx="${p1x}" cy="${p1y}" r="27" fill="rgba(255,255,255,.11)"/>
      <circle cx="${p2x}" cy="${p2y}" r="18" fill="rgba(255,255,255,.14)"/>
      <rect x="10" y="10" width="60" height="18" rx="9" fill="rgba(7,5,11,.34)"/>
      ${scenes[variant]}
      <text x="18" y="23" fill="${theme.d}" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="1.4">${badge}</text>
      <text x="16" y="88" fill="white" font-family="Arial, sans-serif" font-size="12.5" font-weight="700">${title}</text>
      <text x="16" y="103" fill="rgba(255,255,255,.8)" font-family="Arial, sans-serif" font-size="10">${artist}</text>
    </svg>
  `);
}
function artistArtwork(name, mood){
  const theme = moodThemes[mood] || moodThemes.chill;
  const seed = hash(name + mood);
  const x = 28 + seed % 50, y = 18 + seed % 30;
  return svgUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${theme.a}"/><stop offset="100%" stop-color="${theme.b}"/></linearGradient></defs>
      <rect width="320" height="200" rx="28" fill="url(#g)"/>
      <rect width="320" height="200" rx="28" fill="${theme.c}" opacity=".42"/>
      <circle cx="${x}" cy="${y}" r="36" fill="rgba(255,255,255,.16)"/>
      <circle cx="245" cy="48" r="26" fill="rgba(255,255,255,.12)"/>
      <path d="M0 152 C58 126 101 130 146 155 C200 185 246 187 320 128 L320 200 L0 200 Z" fill="rgba(255,255,255,.16)"/>
      <text x="24" y="34" fill="${theme.d}" font-family="Arial, sans-serif" font-size="11" font-weight="700" letter-spacing="1.8">${moodLabels[mood].toUpperCase()}</text>
      <text x="24" y="110" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="700">${initials(name)}</text>
    </svg>
  `);
}
function makeTrack(t, i){
  const btn = document.createElement('button');
  btn.className = 'track-row'; btn.type = 'button'; btn.dataset.id = t.id;
  btn.setAttribute('aria-label', 'Détails : ' + t.title + ', ' + t.artist);
  btn.style.animationDelay = '0ms';

  const cover = document.createElement('span');
  cover.className = 'track-cover';
  cover.style.backgroundImage = coverArtwork(t);
  cover.setAttribute('aria-hidden', 'true');
  const photo=document.createElement('img'); photo.className='track-artist-photo';
  photo.dataset.artistPhoto=t.artist; photo.alt=''; photo.loading='lazy'; photo.decoding='async';
  const portrait=portraitOf(t.artist); if(portrait) photo.src=portrait; else photo.hidden=true;
  photo.onerror=()=>{photo.hidden=true};
  cover.append(photo);
  const tag = document.createElement('span'); tag.className = 'track-cover-tag'; tag.textContent = moodLabels[t.mood];
  const icon = document.createElement('span'); icon.className = 'track-cover-icon'; icon.textContent = moodThemes[t.mood].icon || glyphs[t.cover % glyphs.length];
  cover.append(tag, icon);

  const info = document.createElement('span'); info.className = 'track-text';
  const title = document.createElement('strong'); title.textContent = t.title;
  const artist = document.createElement('small'); artist.textContent = t.artist;
  const meta = document.createElement('span'); meta.className = 'track-meta'; meta.textContent = `${t.tempo} BPM · ${t.energy}% énergie`;
  info.append(title, artist, meta);

  const duration = document.createElement('span'); duration.className = 'track-duration';
  duration.innerHTML = `<span>↗</span><i>${moodLabels[t.mood]}</i>`;

  btn.append(cover, info, duration);
  btn.addEventListener('click', () => { selectTrack(t); showDetails(t); });
  return btn;
}
function renderTracks(full = true){
  if (full) list.replaceChildren();
  const start = full ? 0 : list.childElementCount;
  const to = Math.min(filtered.length, visible);
  const frag = document.createDocumentFragment();
  for (let i = start; i < to; i++) frag.appendChild(makeTrack(filtered[i], i));
  list.appendChild(frag);
  loadMore.hidden = true;
  loadMore.textContent = 'Tous les titres affichés';
  if (libraryVisible) libraryVisible.textContent = String(Math.min(filtered.length, visible));
  applyPortraits();
}
function getArtistPicks(){
  const source = filtered.slice(0, Math.max(visible, 48));
  const savedTracks = saved.slice(0, 4).flatMap(item => (item.trackIds || []).map(id => data.find(x => x.id === id)).filter(Boolean));
  const combo = [...source, ...savedTracks];
  const map = new Map();
  combo.forEach((track, index) => {
    if (!map.has(track.artist)) {
      map.set(track.artist, { artist: track.artist, count: 0, moods: {}, sample: track, score: 0 });
    }
    const entry = map.get(track.artist);
    entry.count += 1;
    entry.moods[track.mood] = (entry.moods[track.mood] || 0) + 1;
    entry.score += Math.max(0, 60 - index);
    if (index < 10) entry.sample = track;
  });
  const picks = [...map.values()].map(entry => {
    const dominantMood = Object.entries(entry.moods).sort((a,b)=>b[1]-a[1])[0]?.[0] || currentMood;
    return {...entry, dominantMood};
  }).sort((a,b)=>b.score-a.score || b.count-a.count || a.artist.localeCompare(b.artist)).slice(0, 6);
  return picks;
}
function renderArtistGrid(){
  if (!artistGrid) return;
  artistGrid.replaceChildren();
  const picks = getArtistPicks();
  if (artistCount) artistCount.textContent = String(picks.length);
  if (libraryMood) libraryMood.textContent = moodLabels[currentMood];
  picks.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'artist-card';
    btn.style.animationDelay = `${index * 45}ms`;
    const art = document.createElement('span'); art.className = 'artist-art'; art.style.backgroundImage = artistArtwork(item.artist, item.dominantMood);
    art.dataset.artistBackdrop=item.artist;
    const badge = document.createElement('span'); badge.className = 'artist-badge'; badge.textContent = moodLabels[item.dominantMood]; art.appendChild(badge);
    const text = document.createElement('span'); text.className = 'artist-copy';
    text.innerHTML = `<strong>${item.artist}</strong><small>${item.count} morceau${item.count > 1 ? 'x' : ''} proche${item.count > 1 ? 's' : ''} de ta sélection</small><em>Cliquer pour filtrer la playlist</em>`;
    btn.append(art, text);
    btn.addEventListener('click', () => {
      search.value = item.artist;
      updatePlaylist(false);
      byId('updated-status').textContent = '✦ Filtre artiste activé';
      document.querySelector('.playlist-panel')?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
    });
    artistGrid.appendChild(btn);
  });
  applyPortraits();
}
function updatePlaylist(changed = true){
  const sig = currentSignature(); if (sig === lastSignature) return; lastSignature = sig;
  updateRangeOutputs(); filtered = getRecommended(); visible = filtered.length;
  byId('playlist-title').textContent = moodNames[currentMood];
  summary.textContent = `${filtered.length} titres réels · artistes authentiques · ajustement instantané`;
  byId('updated-status').textContent = changed ? '✦ Playlist actualisée' : '♪ Recherche en direct';
  renderTracks(true);
  if (selectedTrackId) list.querySelectorAll('.track-row').forEach(btn => btn.classList.toggle('selected-track', btn.dataset.id === selectedTrackId));
  renderArtistGrid();
  syncNoteSkyHeight();
  const saveBtn = byId('save-playlist'); saveBtn.classList.remove('saved'); saveBtn.textContent = '♡ Sauvegarder';
}
function chooseMood(mood, scroll = false){
  if (!presets[mood]) return;
  currentMood = mood; document.body.dataset.mood = mood;
  [energy.value, positivity.value, tempo.value] = presets[mood].map(String);
  document.querySelectorAll('[data-preset]').forEach(btn => {
    const sel = btn.dataset.preset === mood;
    btn.classList.toggle('active', sel);
    btn.setAttribute('aria-pressed', String(sel));
  });
  lastSignature = '';
  updatePlaylist();
  if (scroll) byId('studio').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}
for (const el of [energy, positivity, tempo]) el.addEventListener('input', () => updatePlaylist());
search.addEventListener('input', () => updatePlaylist(false));
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => chooseMood(button.dataset.preset, !!button.closest('#mood-cards'))));
document.querySelectorAll('.step').forEach(btn => btn.addEventListener('click', () => {
  const el = byId(btn.dataset.var);
  el.value = String(clamp(Number(el.value) + Number(btn.dataset.delta), Number(el.min), Number(el.max)));
  el.dispatchEvent(new Event('input', {bubbles: true}));
}));
function loadNext(){
  if (list.childElementCount >= filtered.length) return;
  visible = Math.min(visible + 24, filtered.length);
  renderTracks(false);
  summary.textContent = `${filtered.length} titres disponibles · ${list.childElementCount} affichés · ajustement instantané`;
}
// Liste complète dès le départ : pas d'append au scroll, pas de saut de mise en page.
function showDetails(t){
  byId('detail-title').textContent = t.title;
  byId('detail-artist').textContent = t.artist;
  const photoSource=byId('artist-source-link');if(photoSource) photoSource.href='https://en.wikipedia.org/wiki/'+encodeURIComponent(articleTitles[t.artist]||t.artist).replace(/%20/g,'_');
  const listen=byId('listen-real-track');
  if(listen) listen.href=t.searchUrl;
  const photo=byId('detail-artist-photo');
  if(photo){const url=portraitOf(t.artist);photo.hidden=!url;if(url)photo.src=url;photo.alt='Portrait de '+t.artist;}
  byId('detail-icon').textContent = moodThemes[t.mood].icon || glyphs[t.cover % glyphs.length];
  const d = byId('detail-data'); d.replaceChildren();
  for (const text of [moodLabels[t.mood], `Énergie indicative ${t.energy} %`, `Festif indicatif ${t.positivity} %`, `Tempo suggéré ${t.tempo} BPM`]) {
    const sp = document.createElement('span'); sp.textContent = text; d.appendChild(sp);
  }
  if (typeof dialog.showModal === 'function') dialog.showModal();
}
byId('close-track').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
function renderSaved(){
  byId('saved-message').textContent = saved.length ? `${saved.length} sélection${saved.length > 1 ? 's' : ''} enregistrée${saved.length > 1 ? 's' : ''} sur cet appareil.` : 'Tes sélections sauvegardées apparaîtront ici.';
}
byId('save-playlist').addEventListener('click', () => {
  const item = { id: Date.now(), name: moodNames[currentMood], settings: [energy.value, positivity.value, tempo.value], trackIds: filtered.slice(0, 48).map(x => x.id), savedAt: new Date().toISOString() };
  saved.unshift(item); saved = saved.slice(0, 20);
  try { localStorage.setItem('moodfm_saved_2026', JSON.stringify(saved)); } catch (e) {}
  renderSaved(); renderArtistGrid();
  const btn = byId('save-playlist'); btn.classList.add('saved'); btn.textContent = '♥ Enregistrée';
});
byId('view-saved').addEventListener('click', () => {
  if (!saved.length) { byId('saved-message').textContent = 'Choisis tes réglages dans le studio, puis clique sur « Sauvegarder ». '; return; }
  const item = saved[0]; const keys = ['energy','positivity','tempo'];
  currentMood = Object.keys(moodNames).find(x => moodNames[x] === item.name) || 'chill';
  document.body.dataset.mood = currentMood;
  keys.forEach((key, i) => byId(key).value = item.settings[i]);
  lastSignature = ''; search.value = ''; updatePlaylist(false);
  byId('studio').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  byId('updated-status').textContent = '♥ Réglages sauvegardés chargés';
});
// Affichage d'un ciel de notes musical discret sur toutes les tailles d'écran. Motion réduite respectée en CSS.
const notes = byId('note-sky'), chars = ['♪','♫','♬','♩','✦'];

function syncNoteSkyHeight(){
  if (!notes) return;
  notes.style.height = '100%';
}
for (let i = 0; i < 18; i++) {
  const n = document.createElement('span');
  n.className = 'float-note';
  n.textContent = chars[i % chars.length];
  n.style.cssText = `--x:${(i * 29 + 12) % 98}%;--y:${(i * 53 + 6) % 96}%;--size:${17 + (i * 7 % 20)}px;--speed:${7 + (i * 3 % 7)}s;--delay:-${i * .67}s`;
  notes.appendChild(n);
}
syncNoteSkyHeight();
window.addEventListener('resize', syncNoteSkyHeight, {passive:true});
window.addEventListener('load', syncNoteSkyHeight, {once:true});
renderSaved();
chooseMood('chill');
loadArtistPortraits();
byId('updated-status').textContent = '♪ Ajuste un curseur';


// Mini-lecteur de démonstration : aucune diffusion audio, seulement la navigation et l'animation.
function selectTrack(t) {
  if (!t) return;
  selectedTrackId = t.id;
  const player = byId('mini-player');
  player.hidden = false;
  byId('player-art').style.backgroundImage = portraitOf(t.artist)?`url("${portraitOf(t.artist)}")`:coverArtwork(t);
  byId('player-art').textContent = '';
  byId('player-title').textContent = t.title;
  byId('player-artist').textContent = t.artist;
  byId('player-label').textContent = 'SÉLECTION VISUELLE · ' + moodLabels[t.mood].toUpperCase();
  list.querySelectorAll('.track-row').forEach(btn => btn.classList.toggle('selected-track', btn.dataset.id === t.id));
  byId('player-toggle').textContent = visualAnimationActive ? 'Ⅱ' : '▶';
  player.classList.toggle('paused', !visualAnimationActive);
}
function moveTrack(direction) {
  const pool = filtered.length ? filtered : data;
  if (!pool.length) return;
  const index = pool.findIndex(t => t.id === selectedTrackId);
  const next = (index + direction + pool.length) % pool.length;
  selectTrack(pool[next]);
}
byId('player-prev')?.addEventListener('click', () => moveTrack(-1));
byId('player-next')?.addEventListener('click', () => moveTrack(1));
byId('player-toggle')?.addEventListener('click', () => {
  visualAnimationActive = !visualAnimationActive;
  const el = byId('mini-player');
  el.classList.toggle('paused', !visualAnimationActive);
  byId('player-toggle').textContent = visualAnimationActive ? 'Ⅱ' : '▶';
  byId('player-toggle').setAttribute('aria-label', visualAnimationActive ? "Mettre en pause l'animation" : "Relancer l'animation");
});
byId('player-close')?.addEventListener('click', () => {
  byId('mini-player').hidden = true;
  selectedTrackId = null;
  list.querySelectorAll('.track-row').forEach(btn => btn.classList.remove('selected-track'));
});
