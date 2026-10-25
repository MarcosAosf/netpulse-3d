/**
 * NetPulse-3D // Cloud Cluster Manager & Distributed Trace Dispatcher
 */

export class ClusterManager {
  constructor(telemetryEngine, soundEngine, engine3d) {
    this.telemetry = telemetryEngine;
    this.sound = soundEngine;
    this.engine3d = engine3d;

    this.nodes = [
      { id: 'Kube-Core-Cluster', role: 'Microservices Pods', status: 'HEALTHY', metric: '24 Pods | 42% CPU' },
      { id: 'Edge-WAF-Gateway', role: 'Envoy / Cloud Ingress', status: 'HEALTHY', metric: '48.2 MB/s | TLS 1.3' },
      { id: 'Postgres-Primary-DB', role: 'Multi-AZ Database', status: 'BUSY', metric: '38/100 Conns | 2.4k IOPS' },
      { id: 'Kafka-Event-Bus', role: 'Event Stream Broker', status: 'HEALTHY', metric: '12 Partitions | 0 Lag' },
      { id: 'SOC-Security-Sentinel', role: 'eBPF / Falco Runtime', status: 'ALERT', metric: '1 Threat Blocked' }
    ];

    this.traces = [];
    this.filter = 'ALL';
    this.intervalHandle = null;

    this.init();
  }

  async init() {
    this.renderNodes();
    this.setupListeners();

    try {
      const res = await fetch('assets/sample-telemetry.json');
      if (res.ok) {
        this.traces = await res.json();
        this.renderTraces();
      }
    } catch (e) {
      // Mock fallback
    }

    this.startSimulation();
  }

  setupListeners() {
    const pills = document.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filter = pill.dataset.filter;
        this.renderTraces();
      });
    });

    const closeBtn = document.getElementById('modalCloseBtn');
    const modal = document.getElementById('traceModal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }
  }

  startSimulation() {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.intervalHandle = setInterval(() => {
      this.telemetry.tick();

      if (Math.random() > 0.45) {
        this.generateRandomTrace();
      }
    }, 1200);
  }

  generateRandomTrace() {
    const traceTemplates = [
      {
        source: 'Edge-WAF-Gateway',
        target: 'Kube-Core-Cluster',
        protocol: 'HTTP/2',
        status: '200_OK',
        details: 'GET /api/v1/telemetry dispatched to worker-pod-3b.'
      },
      {
        source: 'Kube-Core-Cluster',
        target: 'Postgres-Primary-DB',
        protocol: 'gRPC/SQL',
        status: '200_OK',
        details: 'Batch transaction committed in 3.1ms.'
      },
      {
        source: 'Edge-WAF-Gateway',
        target: 'SOC-Security-Sentinel',
        protocol: 'HTTPS',
        status: '403_BLOCKED',
        details: 'WAF Rule Triggered: Automated bot credential stuffing dropped.'
      },
      {
        source: 'Kube-Core-Cluster',
        target: 'Kafka-Event-Bus',
        protocol: 'Kafka/TCP',
        status: 'PRODUCED',
        details: 'Audit log record pushed to cloud telemetry stream.'
      }
    ];

    const chosen = traceTemplates[Math.floor(Math.random() * traceTemplates.length)];
    const isAlert = chosen.status === '403_BLOCKED';

    this.engine3d.pulseNode(chosen.source);
    if (isAlert) {
      this.sound.playSecurityAlert();
    }

    const newTrace = {
      id: `TRACE-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      source: chosen.source,
      target: chosen.target,
      protocol: chosen.protocol,
      status: chosen.status,
      latencyMs: +(Math.random() * 4 + 1.1).toFixed(1),
      payloadSize: `${(Math.random() * 8 + 0.5).toFixed(1)}KB`,
      details: chosen.details
    };

    this.traces.unshift(newTrace);
    if (this.traces.length > 80) this.traces.pop();
    this.renderTraces();
  }

  renderNodes() {
    const list = document.getElementById('nodeList');
    if (!list) return;

    list.innerHTML = this.nodes.map(n => {
      let statusClass = 'status-healthy';
      if (n.status === 'BUSY') statusClass = 'status-busy';
      if (n.status === 'ALERT') statusClass = 'status-alert';

      return `
        <div class="node-card" onclick="window.netPulse.focusNode('${n.id}')">
          <div class="node-top">
            <span class="node-name">⚙️ ${n.id}</span>
            <span class="node-status-tag ${statusClass}">${n.status}</span>
          </div>
          <div class="node-meta">
            <span>${n.role}</span>
            <span>${n.metric}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderTraces() {
    const stream = document.getElementById('traceStream');
    if (!stream) return;

    const filtered = this.filter === 'ALL'
      ? this.traces
      : this.traces.filter(t => t.status.includes(this.filter) || t.protocol === this.filter);

    stream.innerHTML = filtered.map(t => {
      const time = t.timestamp ? t.timestamp.split('T')[1].replace('Z', '') : '';
      const isBlocked = t.status.includes('403') || t.status.includes('BLOCKED');
      const isWarn = t.status === 'WARN';

      return `
        <div class="trace-entry ${isBlocked ? 'blocked' : ''} ${isWarn ? 'warn' : ''}" onclick="window.netPulse.inspectTrace('${t.id}')">
          <div class="trace-top">
            <span class="trace-route">${t.source} ➔ ${t.target}</span>
            <span class="trace-meta">${t.protocol} | ${t.latencyMs}ms</span>
          </div>
          <div class="trace-desc">${t.details}</div>
        </div>
      `;
    }).join('');
  }

  inspectTrace(traceId) {
    const trace = this.traces.find(t => t.id === traceId);
    if (!trace) return;

    const modal = document.getElementById('traceModal');
    const jsonEl = document.getElementById('traceJsonViewer');
    const titleEl = document.getElementById('modalTraceTitle');

    if (modal && jsonEl && titleEl) {
      titleEl.innerText = `SPAN INSPECTION // ${trace.id}`;
      jsonEl.innerText = JSON.stringify(trace, null, 2);
      modal.style.display = 'flex';
    }
  }
}
