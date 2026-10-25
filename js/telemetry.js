/**
 * NetPulse-3D // 60 FPS HTML5 Canvas Telemetry & SRE Metrics Visualizer
 */

export class TelemetryEngine {
  constructor(canvasId, soundEngine) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.sound = soundEngine;

    this.history = [];
    this.maxPoints = 40;
    this.currentRps = 1420;
    this.currentLatencyMs = 2.4;

    this.stats = {
      totalRequests: 148920,
      uptimePct: 99.98,
      errorRate: 0.04,
      p99Latency: 6.8,
      networkIngressMb: 48.2
    };

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    for (let i = 0; i < this.maxPoints; i++) {
      this.history.push({
        rps: Math.floor(1200 + Math.random() * 500),
        latency: +(2.0 + Math.random() * 2.5).toFixed(1)
      });
    }
    this.render();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.render();
  }

  tick() {
    const deltaRps = (Math.random() - 0.48) * 80;
    this.currentRps = Math.max(800, Math.min(3200, Math.floor(this.currentRps + deltaRps)));
    this.currentLatencyMs = +(2.0 + (this.currentRps / 1000) * 0.8 + (Math.random() - 0.5)).toFixed(1);

    this.history.push({
      rps: this.currentRps,
      latency: this.currentLatencyMs
    });
    if (this.history.length > this.maxPoints) this.history.shift();

    this.stats.totalRequests += Math.floor(this.currentRps / 10);
    this.updateDom();
    this.render();

    if (Math.random() > 0.6) {
      this.sound.playPacketPing();
    }
  }

  updateDom() {
    const rpsEl = document.getElementById('metricRps');
    if (rpsEl) rpsEl.innerText = `${this.currentRps.toLocaleString()} req/s`;

    const latEl = document.getElementById('metricLatency');
    if (latEl) latEl.innerText = `${this.currentLatencyMs} ms`;

    const reqsEl = document.getElementById('metricTotalReqs');
    if (reqsEl) reqsEl.innerText = this.stats.totalRequests.toLocaleString();

    const errEl = document.getElementById('metricErrors');
    if (errEl) errEl.innerText = `${this.stats.errorRate}%`;
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);
    if (this.history.length === 0) return;

    const chartHeight = height - 40;
    const stepX = (width - 60) / (this.maxPoints - 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = (chartHeight / 3) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 55, y);
      ctx.stroke();

      const rpsLabel = Math.floor(3000 - (3000 / 3) * i);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(`${rpsLabel}`, width - 50, y + 3);
    }

    // Gradient fill under RPS curve
    const grad = ctx.createLinearGradient(0, 0, 0, chartHeight);
    grad.addColorStop(0, 'rgba(0, 243, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 243, 255, 0.0)');

    ctx.beginPath();
    this.history.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (pt.rps / 3000) * chartHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo((this.history.length - 1) * stepX, chartHeight);
    ctx.lineTo(0, chartHeight);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.history.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = chartHeight - (pt.rps / 3000) * chartHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Pulse dot at current point
    const lastX = (this.history.length - 1) * stepX;
    const lastY = chartHeight - (this.currentRps / 3000) * chartHeight;
    ctx.fillStyle = '#00ff7f';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
