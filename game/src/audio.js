// Synthesised sound: no audio files, everything is WebAudio oscillators and noise.
// Footsteps (yours and the guards', quieter with distance), alert sting, pickup
// chime, win and lose motifs. Safe to construct before any user gesture.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (err) {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  // Short filtered-noise tick. `pan` is -1 (left) to 1 (right), `volume` 0..1.
  footstep(pan, volume, low) {
    if (!this.ctx || this.muted || volume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const dur = 0.07;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = low ? 320 : 700;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        src.connect(filter).connect(gain).connect(panner).connect(this.master);
      } else {
        src.connect(filter).connect(gain).connect(this.master);
      }
      src.start(t);
    } catch (err) { /* audio is cosmetic; never break the game */ }
  }

  tone(freq, dur, type, volume, when = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (err) { /* cosmetic */ }
  }

  alertSting() {
    this.tone(196, 0.16, 'sawtooth', 0.16);
    this.tone(147, 0.24, 'sawtooth', 0.16, 0.12);
  }

  pickup() {
    this.tone(880, 0.1, 'sine', 0.2);
    this.tone(1318, 0.16, 'sine', 0.18, 0.08);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.2, i * 0.13));
  }

  lose() {
    [330, 262, 196, 131].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.14, i * 0.16));
  }
}
