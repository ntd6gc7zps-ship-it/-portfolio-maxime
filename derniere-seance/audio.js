'use strict';
let audio, master, noiseBuffer, enabled = true;
function audioReady() {
  if (!enabled) return;
  try {
    if (!audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audio = new Audio();
      master = audio.createGain();
      master.gain.value = .55;
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
    }
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

function pianoNote(frequency, pan=0) {
  if (!enabled || !audio || audio.state !== 'running') return;
  const at=audio.currentTime;
  const output=audio.createGain();
  if (audio.createStereoPanner) {
    const stereo=audio.createStereoPanner();
    stereo.pan.value=clamp(pan,-1,1);
    output.connect(stereo).connect(master);
  } else output.connect(master);
  const partials=[[1,.30,2.8],[2.001,.12,1.8],[3.008,.065,1],[4.016,.035,.65],[6.035,.018,.3]];
  for (const [multiple,level,decay] of partials) {
    const oscillator=audio.createOscillator(), envelope=audio.createGain();
    oscillator.type='sine';
    oscillator.frequency.value=frequency*multiple;
    envelope.gain.setValueAtTime(.001,at);
    envelope.gain.exponentialRampToValueAtTime(level,at+.008);
    envelope.gain.exponentialRampToValueAtTime(.001,at+decay);
    oscillator.connect(envelope).connect(output);
    oscillator.start(at);oscillator.stop(at+decay+.02);
  }
  noise(.045,.08,3200,pan);
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
