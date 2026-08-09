import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * ThreeRobot Component (Far-Right Screen Edge 3D Optics Fix)
 * - Camera looks at (0, 0.8, 0)
 * - Robot is offset to far-right margin (+6.5) so it NEVER sits in screen center
 * - Constant Z distance (18.0) preventing zooming in on scroll
 */
export class ThreeRobot {
  constructor() {
    this.holder = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    this.robot = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.clock = new THREE.Clock();

    this.amberLight = null;
    this.cyanLight = null;
    this.floorRing = null;

    this.targetP = 0;
    this.curP = 0;
    this.activeIdx = 0;
    this.px = 0;
    this.py = 0;

    // Section rotation and animation targets
    this.sectionsConfig = [
      { id: 'hero', anim: 'Idle', cam: { y: 0.8, z: 18.0, ry: -0.25, look: 0.8 } },
      { id: 'philosophy', anim: 'Yes', cam: { y: 0.8, z: 18.0, ry: 0.3, look: 0.8 } },
      { id: 'capabilities', anim: 'ThumbsUp', cam: { y: 0.8, z: 18.0, ry: -0.4, look: 0.8 } },
      { id: 'portfolio', anim: 'Dance', cam: { y: 0.8, z: 18.0, ry: 0.0, look: 0.8 } },
      { id: 'blog', anim: 'Idle', cam: { y: 0.8, z: 18.0, ry: 0.2, look: 0.8 } },
      { id: 'rf-faq', anim: 'Yes', cam: { y: 0.8, z: 18.0, ry: -0.3, look: 0.8 } },
      { id: 'contact', anim: 'ThumbsUp', cam: { y: 0.8, z: 18.0, ry: 0.0, look: 0.8 } }
    ];

    this.modelPath = 'assets/RobotExpressive.glb';
  }

  init() {
    this.createDOM();
    this.setupScene();
    this.loadModel();
    this.bindEvents();
  }

  createDOM() {
    let sceneDiv = document.getElementById('three-robot-scene');
    if (!sceneDiv) {
      sceneDiv = document.createElement('div');
      sceneDiv.id = 'three-robot-scene';
      document.body.appendChild(sceneDiv);
    }
    this.holder = sceneDiv;
  }

  setupScene() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.holder.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0.8, 18.0);

    // Soft Studio Lighting
    this.scene.add(new THREE.HemisphereLight(0x9fd0ff, 0x0a0e14, 1.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(6, 8, 6);
    this.scene.add(keyLight);

    const initialX = this.getResponsiveX();

    this.amberLight = new THREE.PointLight(0xffb347, 20, 25);
    this.amberLight.position.set(initialX - 1, 2, 4);
    this.scene.add(this.amberLight);

    this.cyanLight = new THREE.PointLight(0x3dd7d0, 18, 25);
    this.cyanLight.position.set(initialX + 2, 1, 2);
    this.scene.add(this.cyanLight);

    // Floor Glow Ring under Robot
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1.6, 64),
      new THREE.MeshBasicMaterial({ color: 0x3dd7d0, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(initialX, -1.2, 0);
    this.scene.add(ring);
    this.floorRing = ring;
  }

  getResponsiveX() {
    const w = window.innerWidth;
    const aspect = w / window.innerHeight;
    
    // Position robot in the far right margin outside 1280px content area
    if (w > 1400) return aspect * 3.7;     // Far right edge on ultra-wide PC
    if (w > 1100) return aspect * 3.4;     // Far right edge on standard PC
    if (w > 768) return aspect * 2.8;      // iPad right side
    return aspect * 1.6;                   // Mobile right corner
  }

  getResponsiveScale() {
    const w = window.innerWidth;
    if (w > 1100) return 0.36;       // PC scale (1/3 size)
    if (w > 768) return 0.30;        // iPad scale
    return 0.22;                     // Mobile compact scale
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      this.modelPath,
      (gltf) => {
        this.robot = gltf.scene;
        this.robot.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = true;
            o.frustumCulled = false;
          }
        });

        const initialX = this.getResponsiveX();
        const initialScale = this.getResponsiveScale();

        this.robot.scale.set(initialScale, initialScale, initialScale);
        this.robot.position.set(initialX, -1.2, 0);

        this.scene.add(this.robot);

        this.mixer = new THREE.AnimationMixer(this.robot);
        gltf.animations.forEach((c) => {
          this.actions[c.name] = this.mixer.clipAction(c);
        });

        // Play Wave greeting first, then Idle
        this.playAction('Wave', 0);
        setTimeout(() => this.playAction('Idle', 0.4), 2600);

        this.animate();
      },
      undefined,
      (err) => {
        console.error('Failed to load 3D Robot model:', err);
      }
    );
  }

  playAction(name, fade = 0.3) {
    const next = this.actions[name];
    if (!next || next === this.currentAction) return;

    next.reset().fadeIn(fade).play();
    if (this.currentAction) this.currentAction.fadeOut(fade);
    this.currentAction = next;
  }

  bindEvents() {
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    window.addEventListener('resize', () => this.onResize());

    window.addEventListener('pointermove', (e) => {
      this.px = e.clientX / window.innerWidth - 0.5;
      this.py = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    // IntersectionObserver to trigger animations on section scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const secId = e.target.id;
        const idx = this.sectionsConfig.findIndex((s) => s.id === secId);
        if (idx !== -1) {
          this.activeIdx = idx;
          const config = this.sectionsConfig[idx];
          if (this.robot && config) {
            this.playAction(config.anim, 0.4);
          }
        }
      });
    }, { threshold: 0.3 });

    this.sectionsConfig.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) io.observe(el);
    });
  }

  onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.targetP = Math.max(0, Math.min(1, window.scrollY / max));
  }

  onResize() {
    const targetX = this.getResponsiveX();
    const targetScale = this.getResponsiveScale();

    if (this.robot) {
      this.robot.position.x = targetX;
      this.robot.scale.set(targetScale, targetScale, targetScale);
    }
    if (this.floorRing) {
      this.floorRing.position.x = targetX;
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();
    if (this.mixer) this.mixer.update(dt);

    const lerp = (a, b, t) => a + (b - a) * t;
    this.curP = lerp(this.curP, this.targetP, 0.06);

    const totalSegs = this.sectionsConfig.length - 1;
    const seg = this.curP * totalSegs;
    const i = Math.floor(seg);
    const f = seg - i;

    const a = this.sectionsConfig[i].cam;
    const b = this.sectionsConfig[Math.min(i + 1, totalSegs)].cam;

    const targetX = this.getResponsiveX();
    const cy = lerp(a.y, b.y, f);
    const cz = lerp(a.z, b.z, f); // Constant z = 18.0 (No zooming in!)
    const ry = lerp(a.ry, b.ry, f);
    const clook = lerp(a.look, b.look, f);

    // Keep camera looking centered (0, clook, 0) so targetX (+6.5) renders at far-right screen edge!
    this.camera.position.x = lerp(this.camera.position.x, this.px * 0.3, 0.05);
    this.camera.position.y = lerp(this.camera.position.y, cy + -this.py * 0.2, 0.05);
    this.camera.position.z = lerp(this.camera.position.z, cz, 0.05);

    if (this.robot) {
      this.robot.position.x = lerp(this.robot.position.x, targetX, 0.05);
      if (this.floorRing) this.floorRing.position.x = this.robot.position.x;

      const targetRot = ry + this.px * 0.4;
      this.robot.rotation.y = lerp(this.robot.rotation.y, targetRot, 0.05);
      this.robot.position.y = -1.2 + Math.sin(this.clock.elapsedTime * 1.5) * 0.04;
    }

    this.camera.lookAt(0, clook, 0);

    if (this.amberLight) this.amberLight.position.x = targetX + Math.sin(this.clock.elapsedTime * 0.6) * 2;
    if (this.cyanLight) this.cyanLight.position.x = targetX + Math.cos(this.clock.elapsedTime * 0.5) * 2;

    this.renderer.render(this.scene, this.camera);
  }
}
