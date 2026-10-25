/**
 * NetPulse-3D // Main Application Bootstrap
 */

import { sound } from './audio.js';
import { Engine3D } from './engine3d.js';
import { TelemetryEngine } from './telemetry.js';
import { ClusterManager } from './cluster.js';

class NetPulseApp {
  constructor() {
    this.sound = sound;
    this.engine3d = null;
    this.telemetry = null;
    this.cluster = null;
    this.crtActive = false;
  }

  bootstrap() {
    this.telemetry = new TelemetryEngine('telemetryChart', this.sound);
    this.engine3d = new Engine3D('three-container', (nodeId) => {
      this.focusNode(nodeId);
    });
    this.cluster = new ClusterManager(this.telemetry, this.sound, this.engine3d);

    this.setupUI();
    console.log('%c[NetPulse-3D] Cloud & Network Observability Mesh Initialized.', 'color: #00f3ff; font-weight: bold;');
  }

  setupUI() {
    const crtBtn = document.getElementById('crtToggleBtn');
    if (crtBtn) {
      crtBtn.addEventListener('click', () => {
        this.crtActive = !this.crtActive;
        document.body.classList.toggle('crt-active', this.crtActive);
        crtBtn.classList.toggle('active', this.crtActive);
        crtBtn.innerText = this.crtActive ? 'CRT: ON' : 'CRT: OFF';
      });
    }

    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = this.sound.toggleMute();
        audioBtn.classList.toggle('active', !muted);
        audioBtn.innerText = muted ? 'AUDIO: MUTED' : 'AUDIO: ON';
      });
    }

    window.addEventListener('click', () => {
      this.sound.init();
    }, { once: true });
  }

  focusNode(nodeId) {
    if (this.engine3d) {
      this.engine3d.pulseNode(nodeId);
    }
  }

  inspectTrace(traceId) {
    if (this.cluster) {
      this.cluster.inspectTrace(traceId);
    }
  }
}

const app = new NetPulseApp();
window.netPulse = app;

window.addEventListener('DOMContentLoaded', () => {
  app.bootstrap();
});
