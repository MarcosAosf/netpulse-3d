/**
 * NetPulse-3D // Three.js 3D Cloud Network Topology Engine
 */

export class Engine3D {
  constructor(containerId, onNodeClickCallback) {
    this.container = document.getElementById(containerId);
    this.onNodeClick = onNodeClickCallback;
    this.nodes = [];
    this.lines = [];
    this.packetMeshes = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredNode = null;

    this.init();
  }

  init() {
    if (!this.container || typeof THREE === 'undefined') return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 15, 28);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f3ff, 2.5, 60);
    pointLight.position.set(0, 12, 10);
    this.scene.add(pointLight);

    // Isometric Holographic Grid Floor
    const grid = new THREE.GridHelper(32, 24, 0x00f3ff, 0x1e293b);
    grid.position.y = -4;
    this.scene.add(grid);

    this.setupInfrastructureNodes();
    this.setupNetworkPackets();

    // Listeners
    window.addEventListener('resize', () => this.onResize());
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('click', (e) => this.onClick(e));

    this.clock = new THREE.Clock();
    this.animate();
  }

  setupInfrastructureNodes() {
    const topology = [
      { id: 'Kube-Core-Cluster', label: 'KUBERNETES CORE', color: 0x00f3ff, geom: new THREE.IcosahedronGeometry(2.2, 1), pos: [0, 1, 0] },
      { id: 'Edge-WAF-Gateway', label: 'EDGE WAF / INGRESS', color: 0x00ff7f, geom: new THREE.OctahedronGeometry(1.6, 0), pos: [-9, 0, 4] },
      { id: 'Postgres-Primary-DB', label: 'DATABASE CLUSTER', color: 0xffb703, geom: new THREE.CylinderGeometry(1.4, 1.4, 2.2, 12), pos: [9, 0, 4] },
      { id: 'Kafka-Event-Bus', label: 'KAFKA EVENT BUS', color: 0x9d4edd, geom: new THREE.TorusGeometry(1.3, 0.45, 8, 16), pos: [0, 3, -9] },
      { id: 'SOC-Security-Sentinel', label: 'SOC SECURITY ENGINE', color: 0xff2a5f, geom: new THREE.DodecahedronGeometry(1.5, 0), pos: [-7, 2, -7] }
    ];

    topology.forEach((cfg) => {
      const wireMat = new THREE.MeshBasicMaterial({ color: cfg.color, wireframe: true, transparent: true, opacity: 0.85 });
      const coreMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.color,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.4
      });

      const mesh = new THREE.Mesh(cfg.geom, coreMat);
      const wire = new THREE.Mesh(cfg.geom, wireMat);
      mesh.add(wire);

      mesh.position.set(...cfg.pos);
      mesh.userData = { id: cfg.id, color: cfg.color };

      this.scene.add(mesh);
      this.nodes.push(mesh);
    });

    // Network links to Kube-Core-Cluster (Node 0)
    const center = this.nodes[0];
    for (let i = 1; i < this.nodes.length; i++) {
      const target = this.nodes[i];
      const points = [center.position, target.position];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x00f3ff,
        dashSize: 0.6,
        gapSize: 0.3,
        transparent: true,
        opacity: 0.5
      });
      const line = new THREE.Line(lineGeom, lineMat);
      line.computeLineDistances();
      this.scene.add(line);
      this.lines.push(line);
    }
  }

  setupNetworkPackets() {
    const packetCount = 200;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(packetCount * 3);

    for (let i = 0; i < packetCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 44;
      positions[i + 1] = Math.random() * 20 - 4;
      positions[i + 2] = (Math.random() - 0.5) * 44;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00f3ff, size: 0.22, transparent: true, opacity: 0.65 });
    this.packets = new THREE.Points(geom, mat);
    this.scene.add(this.packets);
  }

  pulseNode(nodeId) {
    const node = this.nodes.find(n => n.userData.id === nodeId);
    if (!node) return;
    node.scale.set(1.4, 1.4, 1.4);
    setTimeout(() => { node.scale.set(1, 1, 1); }, 200);
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / this.container.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.nodes);

    if (hits.length > 0) {
      this.container.style.cursor = 'pointer';
      this.hoveredNode = hits[0].object;
    } else {
      this.container.style.cursor = 'default';
      this.hoveredNode = null;
    }
  }

  onClick() {
    if (this.hoveredNode && this.onNodeClick) {
      this.pulseNode(this.hoveredNode.userData.id);
      this.onNodeClick(this.hoveredNode.userData.id);
    }
  }

  onResize() {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsed = this.clock.getElapsedTime();

    this.camera.position.x = Math.sin(elapsed * 0.12) * 5;
    this.camera.lookAt(0, 0, 0);

    this.nodes.forEach((node, idx) => {
      node.rotation.y += 0.008 * (idx + 1);
      node.rotation.x += 0.004;
      node.position.y += Math.sin(elapsed * 2 + idx) * 0.003;
    });

    if (this.packets) {
      this.packets.rotation.y = elapsed * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
