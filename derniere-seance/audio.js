'use strict';
let audio, master, noiseBuffer, enabled = true;
let pianoBus, tensionBus, pianoLoad, audioSceneActive = false;
const pianoSamples = [
  {frequency:65.4064, url:'audio/piano-c2.mp3', buffer:null},
  {frequency:130.8128, url:'audio/piano-c3.mp3', buffer:null}
];
const pianoVoices = new Set();
function applyAudioVolume() {
  if (!master) return;
  const at=audio.currentTime;
  master.gain.cancelScheduledValues(at);
  master.gain.setTargetAtTime(enabled&&audioSceneActive ? .55 : 0,at,.035);
}
function setAudioScene(active) {
  audioSceneActive=active;
  applyAudioVolume();
}
function loadPianoSamples() {
  if (pianoLoad || !audio) return;
  pianoLoad=Promise.all(pianoSamples.map(async sample=>{
    try {
      const response=await fetch(sample.url);
      if (!response.ok) return;
      sample.buffer=await audio.decodeAudioData(await response.arrayBuffer());
    } catch { /* The synthesized fallback keeps offline play audible. */ }
  }));
}
function setupPiano() {
  pianoBus=audio.createGain();
  tensionBus=audio.createGain();
  tensionBus.gain.value=0;
  tensionBus.connect(pianoBus);
  pianoBus.connect(master);
  const room=audio.createConvolver(), wet=audio.createGain();
  const impulse=audio.createBuffer(2,Math.floor(audio.sampleRate*2.6),audio.sampleRate);
  for(let channel=0;channel<2;channel++) {
    const data=impulse.getChannelData(channel);
    let smoothed=0;
    for(let i=0;i<data.length;i++) {
      smoothed=smoothed*.65+(Math.random()*2-1)*.35;
      data[i]=i<audio.sampleRate*.025?0:smoothed*Math.pow(1-i/data.length,2.8);
    }
  }
  room.buffer=impulse;wet.gain.value=.28;
  pianoBus.connect(room).connect(wet).connect(master);
  loadPianoSamples();
}
function setThreatLevel(level) {
  if (tensionBus) tensionBus.gain.setTargetAtTime(clamp(level*1.4,0,1),audio.currentTime,.12);
}
function stopPiano() {
  for(const source of pianoVoices) {try {source.stop();} catch {}}
  pianoVoices.clear();
  setThreatLevel(0);
}
function audioReady() {
  if (!enabled) return;
  try {
    if (!audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audio = new Audio();
      master = audio.createGain();
      master.gain.value = 0;
      const limiter = audio.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.ratio.value = 10;
      master.connect(limiter).connect(audio.destination);
      noiseBuffer = audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let previous = 0;
      for (let i=0;i<data.length;i++) {
        previous = (previous + (Math.random()-.5)*.12)*.96;
        data[i] = previous;
      }
      setupPiano();
    }
    applyAudioVolume();
    audio.resume().catch(()=>{});
  } catch { /* Playable with visual cues when audio is unavailable. */ }
}
function noise(volume, duration, cutoff, pan=0) {
  if (!enabled || !audio || audio.state !== 'running') return;
  const at = audio.currentTime, source = audio.createBufferSource();
  const filter = audio.createBiquadFilter(), gain = audio.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(.001,at);
  gain.gain.exponentialRampToValueAtTime(volume,at+.035);
  gain.gain.exponentialRampToValueAtTime(.001,at+duration);
  source.connect(filter).connect(gain);
  if (audio.createStereoPanner) {
    const stereo = audio.createStereoPanner();
    stereo.pan.value = clamp(pan,-1,1);
    gain.connect(stereo).connect(master);
  } else gain.connect(master);
  source.start(at,Math.random()*.45);
  source.stop(at+duration);
}
function tone(hz,end,volume,duration,type='sine') {
  if (!enabled || !audio || audio.state !== 'running') return;
  const at = audio.currentTime, source = audio.createOscillator(), gain = audio.createGain();
  source.type = type;
  source.frequency.setValueAtTime(hz,at);
  source.frequency.exponentialRampToValueAtTime(end,at+duration);
  gain.gain.setValueAtTime(volume,at);
  gain.gain.exponentialRampToValueAtTime(.001,at+duration);
  source.connect(gain).connect(master);
  source.start(at);
  source.stop(at+duration);
}

function pianoNote(frequency=65.4064, pan=0, {level=.82,duration=5,delay=0,tension=false}={}) {
  if (!enabled || !audio || audio.state !== 'running') return;
  const at=audio.currentTime+delay;
  const output=audio.createGain(), destination=tension?tensionBus:pianoBus;
  let stereo;
  if (audio.createStereoPanner) {
    stereo=audio.createStereoPanner();
    stereo.pan.value=clamp(pan,-1,1);
    output.connect(stereo).connect(destination);
  } else output.connect(destination);
  const sample=pianoSamples.filter(s=>s.buffer).sort((a,b)=>
    Math.abs(Math.log2(frequency/a.frequency))-Math.abs(Math.log2(frequency/b.frequency)))[0];
  if(sample) {
    const source=audio.createBufferSource(), filter=audio.createBiquadFilter();
    source.buffer=sample.buffer;source.playbackRate.value=frequency/sample.frequency;
    filter.type='lowpass';filter.frequency.value=tension?3500:5200;
    output.gain.setValueAtTime(0,at);
    output.gain.linearRampToValueAtTime(level,at+.006);
    output.gain.setValueAtTime(level,at+Math.max(.02,duration-.8));
    output.gain.exponentialRampToValueAtTime(.001,at+duration);
    source.connect(filter).connect(output);pianoVoices.add(source);
    source.onended=()=>{pianoVoices.delete(source);source.disconnect();filter.disconnect();output.disconnect();stereo?.disconnect();};
    source.start(at);source.stop(at+duration+.02);
    return;
  }
  // Only used if sample loading fails; the normal voice is a recorded grand piano.
  const partials=[[1,.30,4.2],[2.001,.17,2.9],[3.008,.085,1.7],[4.016,.045,1],[6.035,.025,.45]];
  output.gain.value=level;
  let remaining=partials.length;
  for (const [multiple,level,decay] of partials) {
    const oscillator=audio.createOscillator(), envelope=audio.createGain();
    oscillator.type='sine';
    oscillator.frequency.value=frequency*multiple;
    envelope.gain.setValueAtTime(.001,at);
    envelope.gain.exponentialRampToValueAtTime(level,at+.008);
    envelope.gain.exponentialRampToValueAtTime(.001,at+Math.min(decay,duration));
    oscillator.connect(envelope).connect(output);
    pianoVoices.add(oscillator);
    oscillator.onended=()=>{
      pianoVoices.delete(oscillator);oscillator.disconnect();envelope.disconnect();
      if(--remaining===0){output.disconnect();stereo?.disconnect();}
    };
    oscillator.start(at);oscillator.stop(at+Math.min(decay,duration)+.02);
  }
}
function threatNote(intensity,pan,beat) {
  const pattern=[65.4064,69.2957,65.4064,92.4986];
  pianoNote(pattern[beat%pattern.length],pan,{level:.32+intensity*.3,duration:1.4,tension:true});
  if(intensity>.42) {
    pianoNote(beat%2?138.5913:130.8128,-pan*.5,{level:.16+intensity*.16,duration:1.1,delay:.14,tension:true});
  }
}
function scream(kind='nun') {
  if (!enabled || !audio || audio.state !== 'running') return;
  const at=audio.currentTime, duration=1.35;
  const voice=audio.createOscillator(), vibrato=audio.createOscillator();
  const pitch=audio.createGain(), envelope=audio.createGain();
  voice.type='sawtooth';
  voice.frequency.setValueAtTime(kind==='nun'?410:280,at);
  voice.frequency.exponentialRampToValueAtTime(540,at+.09);
  voice.frequency.exponentialRampToValueAtTime(115,at+duration);
  vibrato.frequency.value=32;pitch.gain.value=23;
  vibrato.connect(pitch).connect(voice.frequency);
  envelope.gain.setValueAtTime(.001,at);
  envelope.gain.exponentialRampToValueAtTime(.5,at+.025);
  envelope.gain.exponentialRampToValueAtTime(.001,at+duration);
  envelope.connect(master);
  // Vocal formants make the sound resemble a strained open-vowel cry.
  for(const [from,to,level] of [[900,540,.7],[1450,1080,.5],[2850,1900,.23]]) {
    const filter=audio.createBiquadFilter(), gain=audio.createGain();
    filter.type='bandpass';filter.Q.value=5;
    filter.frequency.setValueAtTime(from,at);
    filter.frequency.exponentialRampToValueAtTime(to,at+duration);
    gain.gain.value=level;
    voice.connect(filter).connect(gain).connect(envelope);
  }
  voice.start(at);vibrato.start(at);
  voice.stop(at+duration);vibrato.stop(at+duration);
  noise(.36,1.2,3600);
  tone(49,24,.17,1.35,'triangle');
}
