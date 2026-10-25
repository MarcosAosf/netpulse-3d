/**
 * NetPulse-3D // Web Audio API Procedural Synthesizer
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.04) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio failsafe
    }
  }

  playPacketPing() {
    this.playTone(987.77, 'sine', 0.04, 0.02);
  }

  playNodeHealthy() {
    this.playTone(659.25, 'triangle', 0.06, 0.03);
  }

  playSecurityAlert() {
    if (this.muted) return;
    this.playTone(220, 'sawtooth', 0.15, 0.08);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.2, 0.09), 100);
  }
}

export const sound = new SoundEngine();
