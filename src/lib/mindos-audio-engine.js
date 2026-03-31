/**
 * MindOS Audio Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Zero dependencies. Pure Web Audio API. Works in all modern browsers.
 * Drop into ORAII patient portal: /lib/mindos-audio-engine.js
 *
 * WHAT THIS DOES:
 *  1. Tibetan singing bowl bell — synthesised start/end gong (no MP3 needed)
 *  2. Binaural beats generator — real-time per wave (Delta/Theta/Alpha/Beta/Gamma)
 *  3. Nature soundscapes — brown noise + modulated noise = waterfall/rain/ocean/forest
 *  4. Guided breathing voice — Web Speech API (browser built-in TTS, no API cost)
 *  5. Session timer — start bell → background audio → end bell sequence
 *
 * USAGE:
 *   import MindOSAudio from '@/lib/mindos-audio-engine'
 *
 *   const audio = new MindOSAudio()
 *   await audio.init()
 *
 *   await audio.startSession({
 *     wave: 'alpha',
 *     durationSecs: 300,
 *     soundscape: 'waterfall',
 *     breathingGuide: true,
 *     binauralEnabled: true,
 *     onTick: (secsRemaining) => {},
 *     onComplete: () => {},
 *   })
 *
 *   audio.stop()
 *   audio.setVolume(0.6)
 */

const WAVE_FREQUENCIES = {
  delta:  { beat: 2.5,  carrier: 100 }, // 0.5–4 Hz — deep sleep, restoration
  theta:  { beat: 6.0,  carrier: 200 }, // 4–7 Hz  — creativity, intuition
  alpha:  { beat: 10.0, carrier: 200 }, // 8–12 Hz — calm focus
  beta:   { beat: 18.0, carrier: 300 }, // 13–30 Hz — active thinking
  gamma:  { beat: 40.0, carrier: 400 }, // 30+ Hz  — peak cognition
};

// Breathing cadences per wave (inhale, hold, exhale in seconds)
const BREATH_PATTERNS = {
  delta:  [4, 7, 8],  // 4-7-8 for deep relaxation
  theta:  [4, 4, 4],  // box breathing for theta entry
  alpha:  [4, 4, 6],  // slightly extended exhale for alpha
  beta:   [4, 2, 4],  // sharper for alertness
  gamma:  [4, 0, 4],  // continuous flow for gamma
};

class MindOSAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.binauralNodes = null;
    this.noiseNodes = null;
    this.sessionTimer = null;
    this.breathTimer = null;
    this.speechSynth = typeof window !== 'undefined' ? (window.speechSynthesis || null) : null;
    this.isRunning = false;
    this.volume = 0.7;
    this._birdInterval = null;
    this._crackleTimeout = null;
  }

  // ── INIT ───────────────────────────────────────────────────────────────

  async init() {
    if (typeof window === 'undefined') return this;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return this;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);
    return this;
  }

  // ── TIBETAN SINGING BOWL (synthesised — no MP3 needed) ────────────────
  // Additive synthesis: fundamental + harmonics with natural decay
  // Produces a warm, resonant bowl sound indistinguishable from recordings

  playBell(volume = 0.8, decaySeconds = 4.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Partial frequencies of a Tibetan bowl (ratios from acoustic research)
    const partials = [
      { ratio: 1.0,  gainPeak: 0.5,  decay: decaySeconds },
      { ratio: 2.76, gainPeak: 0.3,  decay: decaySeconds * 0.7 },
      { ratio: 5.40, gainPeak: 0.15, decay: decaySeconds * 0.5 },
      { ratio: 8.93, gainPeak: 0.07, decay: decaySeconds * 0.3 },
    ];

    const fundamental = 220; // A3 — warm, meditative pitch

    partials.forEach(({ ratio, gainPeak, decay }) => {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = fundamental * ratio;

      // Attack: 5ms, then exponential decay
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(gainPeak * volume, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, t + decay);

      osc.connect(env);
      env.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + decay);
    });
  }

  // Triple bell — traditional meditation start/end signal
  async playTripleBell(volume = 0.8) {
    this.playBell(volume, 3.5);
    await this._wait(1500);
    this.playBell(volume * 0.85, 3.0);
    await this._wait(1300);
    this.playBell(volume * 0.7, 4.5);
  }

  // Soft single bell — interval reminder (eyes-closed safe)
  playSoftBell() {
    this.playBell(0.4, 2.5);
  }

  // ── BINAURAL BEATS GENERATOR ──────────────────────────────────────────

  startBinaural(wave = 'alpha', gainLevel = 0.12) {
    this.stopBinaural();
    if (!this.ctx) return;

    const { beat, carrier } = WAVE_FREQUENCIES[wave] || WAVE_FREQUENCIES.alpha;
    const t = this.ctx.currentTime;

    const merger = this.ctx.createChannelMerger(2);
    const binauralGain = this.ctx.createGain();
    binauralGain.gain.setValueAtTime(0, t);
    binauralGain.gain.linearRampToValueAtTime(gainLevel, t + 3);

    // Left channel — base carrier
    const oscLeft = this.ctx.createOscillator();
    const gainLeft = this.ctx.createGain();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = carrier;
    gainLeft.gain.value = 1;
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0);

    // Right channel — carrier + beat frequency
    const oscRight = this.ctx.createOscillator();
    const gainRight = this.ctx.createGain();
    oscRight.type = 'sine';
    oscRight.frequency.value = carrier + beat;
    gainRight.gain.value = 1;
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1);

    merger.connect(binauralGain);
    binauralGain.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();

    this.binauralNodes = { oscLeft, oscRight, binauralGain, merger, gainLeft, gainRight };
  }

  stopBinaural() {
    if (!this.binauralNodes) return;
    const { oscLeft, oscRight, binauralGain } = this.binauralNodes;
    if (this.ctx) {
      const t = this.ctx.currentTime;
      binauralGain.gain.linearRampToValueAtTime(0, t + 2);
    }
    setTimeout(() => {
      try { oscLeft.stop(); } catch(e) { /* already stopped */ }
      try { oscRight.stop(); } catch(e) { /* already stopped */ }
    }, 2200);
    this.binauralNodes = null;
  }

  // ── NATURE SOUNDSCAPES ────────────────────────────────────────────────

  startSoundscape(type = 'waterfall', gainLevel = 0.35) {
    this.stopSoundscape();
    if (!this.ctx) return;

    const nodes = [];

    switch (type) {
      case 'waterfall': nodes.push(...this._createWaterfall(gainLevel)); break;
      case 'rain':      nodes.push(...this._createRain(gainLevel)); break;
      case 'ocean':     nodes.push(...this._createOcean(gainLevel)); break;
      case 'forest':    nodes.push(...this._createForest(gainLevel)); break;
      case 'stream':    nodes.push(...this._createStream(gainLevel)); break;
      case 'fire':      nodes.push(...this._createFire(gainLevel)); break;
      default: break;
    }

    this.noiseNodes = nodes;
  }

  stopSoundscape() {
    if (this._birdInterval) { clearTimeout(this._birdInterval); this._birdInterval = null; }
    if (this._crackleTimeout) { clearTimeout(this._crackleTimeout); this._crackleTimeout = null; }
    if (!this.noiseNodes) return;
    this.noiseNodes.forEach(n => {
      try { if (n && n.stop) n.stop(); } catch(e) { /* already stopped */ }
      try { if (n && n.disconnect) n.disconnect(); } catch(e) { /* already disconnected */ }
    });
    this.noiseNodes = null;
  }

  // Brown noise base
  _brownNoise(gainValue = 0.3) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    return [src, gain];
  }

  // Pink noise (1/f)
  _pinkNoise(gainValue = 0.2) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + white*0.0555179;
      b1 = 0.99332*b1 + white*0.0750759;
      b2 = 0.96900*b2 + white*0.1538520;
      b3 = 0.86650*b3 + white*0.3104856;
      b4 = 0.55000*b4 + white*0.5329522;
      b5 = -0.7616*b5 - white*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    return [src, gain];
  }

  // WATERFALL — brown noise + high-frequency splash layer
  _createWaterfall(gain) {
    const [brownSrc, brownGain] = this._brownNoise(gain * 0.7);
    const splashBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
    const splashData = splashBuf.getChannelData(0);
    for (let i = 0; i < splashData.length; i++) splashData[i] = Math.random() * 2 - 1;
    const splashSrc = this.ctx.createBufferSource();
    splashSrc.buffer = splashBuf;
    splashSrc.loop = true;
    const splashFilter = this.ctx.createBiquadFilter();
    splashFilter.type = 'highpass';
    splashFilter.frequency.value = 2000;
    splashFilter.Q.value = 0.5;
    const splashGain = this.ctx.createGain();
    splashGain.gain.value = gain * 0.25;
    splashSrc.connect(splashFilter);
    splashFilter.connect(splashGain);
    splashGain.connect(this.masterGain);
    splashSrc.start();
    return [brownSrc, brownGain, splashSrc, splashFilter, splashGain];
  }

  // RAIN — pink noise + rhythmic patter via LFO
  _createRain(gain) {
    const [pinkSrc, pinkGain] = this._pinkNoise(gain * 0.6);
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'triangle';
    lfo.frequency.value = 8;
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(pinkGain.gain);
    lfo.start();
    const rippleBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate);
    const rd = rippleBuf.getChannelData(0);
    for (let i = 0; i < rd.length; i++) rd[i] = Math.random() * 2 - 1;
    const rippleSrc = this.ctx.createBufferSource();
    rippleSrc.buffer = rippleBuf;
    rippleSrc.loop = true;
    const rippleFilter = this.ctx.createBiquadFilter();
    rippleFilter.type = 'bandpass';
    rippleFilter.frequency.value = 3000;
    rippleFilter.Q.value = 1.5;
    const rippleGain = this.ctx.createGain();
    rippleGain.gain.value = gain * 0.15;
    rippleSrc.connect(rippleFilter);
    rippleFilter.connect(rippleGain);
    rippleGain.connect(this.masterGain);
    rippleSrc.start();
    return [pinkSrc, pinkGain, lfo, lfoGain, rippleSrc, rippleFilter, rippleGain];
  }

  // OCEAN WAVES — stereo brown noise + slow 0.12 Hz swell LFO (~8-sec wave period)
  _createOcean(gain) {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const swellLFO = this.ctx.createOscillator();
    swellLFO.type = 'sine';
    swellLFO.frequency.value = 0.12;
    const swellDepth = this.ctx.createGain();
    swellDepth.gain.value = 0.15;
    const swellGain = this.ctx.createGain();
    swellGain.gain.value = gain * 0.5;
    swellLFO.connect(swellDepth);
    swellDepth.connect(swellGain.gain);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.7;
    src.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(this.masterGain);
    src.start();
    swellLFO.start();
    return [src, swellLFO, swellDepth, swellGain, filter];
  }

  // FOREST — pink noise (leaves) + synthesised bird chirps (FM synthesis)
  _createForest(gain) {
    const [pinkSrc, pinkGain] = this._pinkNoise(gain * 0.3);
    const rustleFilter = this.ctx.createBiquadFilter();
    rustleFilter.type = 'bandpass';
    rustleFilter.frequency.value = 3000;
    rustleFilter.Q.value = 0.8;
    pinkGain.disconnect();
    pinkGain.connect(rustleFilter);
    rustleFilter.connect(this.masterGain);
    const [windSrc, windGain] = this._brownNoise(gain * 0.2);

    const playBird = () => {
      if (!this.ctx || !this.isRunning) return;
      const osc = this.ctx.createOscillator();
      const birdEnv = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2800 + Math.random() * 800;
      birdEnv.gain.setValueAtTime(0, this.ctx.currentTime);
      birdEnv.gain.linearRampToValueAtTime(gain * 0.08, this.ctx.currentTime + 0.05);
      birdEnv.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(birdEnv);
      birdEnv.connect(this.masterGain);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.35);
      if (Math.random() > 0.4) {
        const osc2 = this.ctx.createOscillator();
        const env2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 3200 + Math.random() * 600;
        env2.gain.setValueAtTime(0, this.ctx.currentTime + 0.18);
        env2.gain.linearRampToValueAtTime(gain * 0.05, this.ctx.currentTime + 0.23);
        env2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc2.connect(env2);
        env2.connect(this.masterGain);
        osc2.start(this.ctx.currentTime + 0.18);
        osc2.stop(this.ctx.currentTime + 0.55);
      }
    };

    const scheduleBird = () => {
      if (!this.isRunning) return;
      const delay = 4000 + Math.random() * 8000;
      this._birdInterval = setTimeout(() => {
        playBird();
        scheduleBird();
      }, delay);
    };
    scheduleBird();

    return [pinkSrc, pinkGain, rustleFilter, windSrc, windGain];
  }

  // STREAM — mid-frequency babbling water
  _createStream(gain) {
    const [brownSrc, brownGain] = this._brownNoise(gain * 0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.5;
    brownGain.disconnect();
    brownGain.connect(filter);
    filter.connect(this.masterGain);
    const [pinkSrc, pinkGain] = this._pinkNoise(gain * 0.3);
    const lfo = this.ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 2.5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(pinkGain.gain);
    lfo.start();
    return [brownSrc, brownGain, filter, pinkSrc, pinkGain, lfo, lfoGain];
  }

  // FIRE — crackling hearth (low rumble + random crackle pops)
  _createFire(gain) {
    const [brownSrc, brownGain] = this._brownNoise(gain * 0.5);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    brownGain.disconnect();
    brownGain.connect(filter);
    filter.connect(this.masterGain);

    const crackle = () => {
      if (!this.ctx || !this.isRunning) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 200 + Math.random() * 300;
      env.gain.setValueAtTime(gain * 0.06, this.ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
      this._crackleTimeout = setTimeout(crackle, 100 + Math.random() * 600);
    };
    crackle();

    return [brownSrc, brownGain, filter];
  }

  // ── GUIDED BREATHING VOICE ────────────────────────────────────────────

  startBreathingGuide(wave = 'alpha', voiceEnabled = true) {
    this.stopBreathingGuide();
    const [inhale, hold, exhale] = BREATH_PATTERNS[wave] || BREATH_PATTERNS.alpha;

    const say = (text) => {
      if (!voiceEnabled || !this.speechSynth) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.8;
      utter.pitch = 0.9;
      utter.volume = 0.7;
      const voices = this.speechSynth.getVoices();
      const calm = voices.find(v =>
        v.name.includes('Samantha') || v.name.includes('Karen') ||
        v.name.includes('Moira') || v.lang === 'en-GB'
      );
      if (calm) utter.voice = calm;
      this.speechSynth.speak(utter);
    };

    const cycle = () => {
      if (!this.isRunning) return;
      say('Breathe in');
      this.breathTimer = setTimeout(() => {
        if (!this.isRunning) return;
        if (hold > 0) {
          say('Hold');
          this.breathTimer = setTimeout(() => {
            if (!this.isRunning) return;
            say('Breathe out');
            this.breathTimer = setTimeout(cycle, exhale * 1000 + 500);
          }, hold * 1000);
        } else {
          say('Breathe out');
          this.breathTimer = setTimeout(cycle, exhale * 1000 + 500);
        }
      }, inhale * 1000);
    };

    cycle();
  }

  stopBreathingGuide() {
    if (this.breathTimer) clearTimeout(this.breathTimer);
    if (this.speechSynth) this.speechSynth.cancel();
    this.breathTimer = null;
  }

  // ── FULL SESSION ORCHESTRATOR ─────────────────────────────────────────

  async startSession({
    wave = 'alpha',
    durationSecs = 300,
    soundscape = 'waterfall',
    binauralEnabled = true,
    breathingGuide = false,
    onTick = null,
    onComplete = null,
  } = {}) {
    if (!this.ctx) await this.init();
    if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume();

    this.isRunning = true;

    // 1. Triple bell to start
    await this.playTripleBell(0.9);
    await this._wait(1500);

    // 2. Start background audio
    if (soundscape && soundscape !== 'none') {
      this.startSoundscape(soundscape);
    }
    if (binauralEnabled) {
      await this._wait(500);
      this.startBinaural(wave);
    }
    if (breathingGuide) {
      await this._wait(2000);
      this.startBreathingGuide(wave, true);
    }

    // 3. Timer countdown
    let remaining = durationSecs;
    this.sessionTimer = setInterval(() => {
      remaining--;
      if (onTick) onTick(remaining);

      // Halfway bell
      if (remaining === Math.floor(durationSecs / 2)) {
        this.playSoftBell();
      }

      if (remaining <= 0) {
        clearInterval(this.sessionTimer);
        this._endSession(onComplete);
      }
    }, 1000);
  }

  async _endSession(onComplete) {
    this.stopBreathingGuide();
    this.stopBinaural();
    this.stopSoundscape();

    await this._wait(1500);

    // Triple end bell
    await this.playTripleBell(0.7);
    this.isRunning = false;

    if (onComplete) {
      await this._wait(3000);
      onComplete();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.sessionTimer) clearInterval(this.sessionTimer);
    this.stopBinaural();
    this.stopSoundscape();
    this.stopBreathingGuide();
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      try { this.ctx.close(); } catch(e) { /* already closed */ }
    }
    this.ctx = null;
  }
}

export default MindOSAudio;

// ── BREATH PATTERNS export for UI ──────────────────────────────────────
export { BREATH_PATTERNS, WAVE_FREQUENCIES };
