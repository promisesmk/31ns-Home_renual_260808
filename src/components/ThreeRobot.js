import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * ThreeRobot Component (Vertical Up-Down Roaming & Strict Mesh Click Engine)
 * - Vertical (Up-Down Y: -4.0 to +4.0) + Horizontal (Left-Right X: -8.0 to +8.0) Full-Screen Roaming
 * - Clicking outside HUD closes menu without jumping & focuses back on gold mining immediately
 * - Only actual 3D Mesh hit triggers Jump + HUD opening
 * - 0% GitHub Push, Safe Local Development
 */
export class ThreeRobot {
  constructor() {
    this.holder = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    this.robot = null;
    this.backpack = null;
    this.goldIngot = null;
    this.goldCount = 0;
    this.goldCounterHUD = null;
    this.starsContainer = null;
    this.hudTimer = null;

    this.mixer = null;
    this.actions = {};
    this.currentAction = null;
    this.clock = new THREE.Clock();

    this.amberLight = null;
    this.cyanLight = null;
    this.floorRing = null;

    this.px = 0;
    this.py = 0;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.animFrameId = null;

    this.hudModal = null;
    this.tipBox = null;

    // State Machine: 'wandering' | 'mining' | 'clicked'
    this.robotState = 'wandering';
    this.targetPos = new THREE.Vector3();

    // 50 RF Tips Database for Random Tip Feature
    this.rfTips = [
      { ko: "💡 2.4GHz 대역 와이파이/블루투스 혼선 방지: BPF 필터 적용 및 안테나 편파를 직교로 배치하세요.", en: "💡 2.4GHz Coexistence: Apply BPF filter and arrange antenna polarizations orthogonally." },
      { ko: "💡 초소형 센서 보드: PCB 공간 부족 시 기구물 내벽 FPCB 입체 안테나 설계를 적용하세요.", en: "💡 Micro Sensor Boards: Use 3D inner wall FPCB antenna when PCB space is restricted." },
      { ko: "💡 50옴 임피던스 매칭: VNA S11 스미스 차트를 분석하고 Pi/T 네트워크 소자값을 튜닝합니다.", en: "💡 50Ω Matching: Analyze VNA S11 Smith chart and tune Pi/T network L/C values." },
      { ko: "💡 플라스틱 기구물 유전율: 안테나 공진 주파수가 낮아지므로 튜닝 시 타겟 주파수를 약간 높게 설정하세요.", en: "💡 Plastic Permittivity: Offsets resonant frequency lower; compensate target higher during bare-board tuning." },
      { ko: "💡 Nordic nRF52840 저전력: 미사용 GPIO 핀 플로팅 방지 및 내부 DC-DC 컨버터를 활성화하세요.", en: "💡 nRF52840 Low Power: Prevent unused GPIO floating leakage & enable internal DC-DC converter." },
      { ko: "💡 96dB 소방 PASS 경보기: High-Voltage Piezo Driver 스위칭 앰프 회로로 고출력 음압을 확보합니다.", en: "💡 96dB Firefighting PASS: High-Voltage Piezo Driver switching amp secures high sound pressure." }
    ];

    this.modelPath = '/assets/RobotExpressive.glb';
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

    // Interactive HUD Companion Modal Overlay
    const isEn = window.location.pathname.includes('/en');
    let hud = document.getElementById('robot-hud-modal');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'robot-hud-modal';
      hud.className = 'robot-hud-container';
      hud.innerHTML = `
        <div class="hud-header">
          <span class="hud-title">🤖 31NS 3D GOLD MINER BOT</span>
          <button class="hud-close-btn" id="hud-close-btn">&times;</button>
        </div>
        <div class="hud-gold-counter">
          <i class="fas fa-coins" style="color:#ffd700; font-size:1.1rem; filter:drop-shadow(0 0 6px #ffd700);"></i>
          <span>${isEn ? 'Gold Backpack:' : '채굴한 금괴 가방:'} <b id="gold-bag-count" style="color:#ffd700;">0</b> BAR</span>
        </div>
        <div class="hud-body">
          <button class="hud-action-btn" id="hud-btn-inquiry">
            <i class="fas fa-paper-plane"></i>
            <span>${isEn ? 'Quick Project Inquiry' : '프로젝트 빠른 의뢰'}</span>
          </button>
          <button class="hud-action-btn" id="hud-btn-faq">
            <i class="fas fa-question-circle"></i>
            <span>${isEn ? '50 RF Engineering Q&A' : '50개 RF Q&A 아카이브'}</span>
          </button>
          <button class="hud-action-btn" id="hud-btn-tip">
            <i class="fas fa-lightbulb"></i>
            <span>${isEn ? 'Today\'s RF Circuit Tip' : '오늘의 RF 회로 설계 팁'}</span>
          </button>
          <button class="hud-action-btn" id="hud-btn-lang">
            <i class="fas fa-globe"></i>
            <span>${isEn ? '한글 페이지로 전환 (KO)' : 'Switch to English (EN)'}</span>
          </button>
        </div>
        <div class="hud-tip-box" id="hud-tip-box" style="display:none;"></div>
      `;
      document.body.appendChild(hud);
    }
    this.hudModal = hud;
    this.tipBox = document.getElementById('hud-tip-box');
    this.goldCounterHUD = document.getElementById('gold-bag-count');

    // Floating Gold Mining Toast Notification Badge
    let goldPop = document.getElementById('robot-gold-pop-badge');
    if (!goldPop) {
      goldPop = document.createElement('div');
      goldPop.id = 'robot-gold-pop-badge';
      goldPop.className = 'gold-pop-badge';
      goldPop.innerHTML = `<i class="fas fa-coins"></i> <span>+1 GOLD MINED!</span>`;
      document.body.appendChild(goldPop);
    }
    this.goldPopBadge = goldPop;

    // Twinkling Stars Sparkle Container
    let stars = document.getElementById('gold-stars-sparkle-box');
    if (!stars) {
      stars = document.createElement('div');
      stars.id = 'gold-stars-sparkle-box';
      stars.className = 'gold-stars-sparkle-box';
      stars.innerHTML = `
        <span class="star s1">✨</span>
        <span class="star s2">⭐</span>
        <span class="star s3">🌟</span>
        <span class="star s4">✨</span>
      `;
      document.body.appendChild(stars);
    }
    this.starsContainer = stars;
  }

  setupScene() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.holder.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0.8, 18.0);

    // Soft Studio Lighting
    this.scene.add(new THREE.HemisphereLight(0x9fd0ff, 0x0a0e14, 1.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(6, 8, 6);
    this.scene.add(keyLight);

    const initialX = this.getResponsiveX();

    this.amberLight = new THREE.PointLight(0xffd700, 25, 25);
    this.amberLight.position.set(initialX - 1, 2, 4);
    this.scene.add(this.amberLight);

    this.cyanLight = new THREE.PointLight(0x3dd7d0, 18, 25);
    this.cyanLight.position.set(initialX + 2, 1, 2);
    this.scene.add(this.cyanLight);

    // Transparent Neon Green Floor Ring (#33FF00 / Opacity 0.45)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1.4, 64),
      new THREE.MeshBasicMaterial({ color: 0x33ff00, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(initialX, -1.2, 0);
    this.scene.add(ring);
    this.floorRing = ring;

    // Create 1/2 Size Rectangular Gold Ingot matching Star Icon Yellow (#FFD700)
    const goldGeo = new THREE.BoxGeometry(0.35, 0.16, 0.55);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,       // Star Icon Yellow-Gold (#FFD700)
      metalness: 1.0,
      roughness: 0.01,
      emissive: 0xffd700,
      emissiveIntensity: 0.95
    });
    this.goldIngot = new THREE.Mesh(goldGeo, goldMat);
    this.goldIngot.visible = false;
    this.scene.add(this.goldIngot);
  }

  getResponsiveX() {
    const w = window.innerWidth;
    const aspect = w / window.innerHeight;
    
    if (w > 1400) return aspect * 3.7;
    if (w > 1100) return aspect * 3.4;
    if (w > 768) return aspect * 2.8;
    return aspect * 1.6;
  }

  getResponsiveScale() {
    const w = window.innerWidth;
    if (w > 1100) return 0.36;
    if (w > 768) return 0.30;
    return 0.22;
  }

  generateNextRandomPosition() {
    // Vertical Up-Down (Y: -4.0 ~ +4.0) + Horizontal Left-Right (X: -8.0 ~ +8.0) Full-Screen Roaming!
    const aspect = window.innerWidth / window.innerHeight;
    const rx = (Math.random() - 0.5) * (aspect * 10.0); // Horizontal X span (-8.0 ~ +8.0)
    const ry = (Math.random() - 0.5) * 8.0;             // Full Vertical Y span (-4.0 ~ +4.0) Up to Top & Down to Bottom!
    const rz = (Math.random() - 0.5) * 6.0;             // Z depth span (-3.0 ~ +3.0)

    this.targetPos.set(rx, ry, rz);
  }

  loadModel(customPath = null) {
    const loader = new GLTFLoader();
    const pathToUse = customPath || this.modelPath;

    loader.load(
      pathToUse,
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

        this.generateNextRandomPosition();

        // Attach Cyberpunk Deep Blue Backpack (#2563EB) onto Robot's Back!
        const packGeo = new THREE.BoxGeometry(1.4, 1.6, 0.95);
        const packMat = new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          metalness: 0.6,
          roughness: 0.3,
          emissive: 0x1e40af,
          emissiveIntensity: 0.4
        });
        this.backpack = new THREE.Mesh(packGeo, packMat);
        this.backpack.position.set(0, 2.2, -0.9);
        this.robot.add(this.backpack);

        this.scene.add(this.robot);

        this.mixer = new THREE.AnimationMixer(this.robot);
        gltf.animations.forEach((c) => {
          this.actions[c.name] = this.mixer.clipAction(c);
        });

        // Start initial Wave greeting, then begin Vertical & Horizontal Random Wandering!
        this.playAction('Wave', 0);
        setTimeout(() => {
          this.startWanderingState();
        }, 2600);

        this.animate();
      },
      undefined,
      (err) => {
        console.warn(`Primary 3D path [${pathToUse}] failed, trying fallback path...`, err);
        if (!customPath && pathToUse.startsWith('/')) {
          this.loadModel('assets/RobotExpressive.glb');
        }
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

  startWanderingState() {
    if (this.robotState === 'clicked') {
      this.robotState = 'wandering';
    } else {
      this.robotState = 'wandering';
    }
    this.playAction('Running', 0.3);
  }

  executeGoldMiningAtCurrentSpot() {
    if (this.robotState === 'clicked') return;
    this.robotState = 'mining';

    // 1. Robot turns 180° AROUND so its BLUE backpack faces the camera!
    this.robot.rotation.y = Math.PI;

    // 2. Halved Size Star-Yellow Rectangular Gold Ingot appears on floor
    const rPos = this.robot.position;
    if (this.goldIngot) {
      this.goldIngot.position.set(rPos.x, rPos.y + 0.2, rPos.z - 0.4);
      this.goldIngot.visible = true;
      this.goldIngot.scale.set(0.1, 0.1, 0.1);
    }

    // 3. Robot performs digging/mining action (`Punch` action)
    this.playAction('Punch', 0.2);

    // 4. Trigger Sparkling Stars Effect around Gold
    this.triggerTwinklingStars();

    // 5. Bright Star-Yellow Gold Ingot floats up into the BLUE Backpack on its back!
    let elapsed = 0;
    const flyInterval = setInterval(() => {
      if (this.robotState === 'clicked') {
        clearInterval(flyInterval);
        if (this.goldIngot) this.goldIngot.visible = false;
        return;
      }

      elapsed += 0.05;
      if (this.goldIngot) {
        this.goldIngot.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.15);
        this.goldIngot.position.y += 0.09;
        this.goldIngot.position.z += 0.04;
        this.goldIngot.rotation.y += 0.25;
      }

      if (elapsed >= 0.85) {
        clearInterval(flyInterval);
        if (this.goldIngot) this.goldIngot.visible = false;

        // Increase gold counter!
        this.goldCount += 1;
        if (this.goldCounterHUD) this.goldCounterHUD.textContent = this.goldCount;

        // Show floating +1 GOLD MINED Toast
        this.showGoldPopToast();

        // Celebration & pick a NEW unconstrained random position across full vertical/horizontal screen!
        this.playAction('ThumbsUp', 0.3);

        setTimeout(() => {
          if (this.robotState === 'clicked') return;
          this.generateNextRandomPosition();
          this.robot.rotation.y = 0;
          this.startWanderingState();
        }, 1300);
      }
    }, 50);
  }

  triggerTwinklingStars() {
    if (!this.starsContainer || !this.robot || !this.camera) return;

    const vector = new THREE.Vector3();
    this.robot.getWorldPosition(vector);
    vector.project(this.camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    this.starsContainer.style.left = `${x}px`;
    this.starsContainer.style.top = `${y - 20}px`;
    this.starsContainer.classList.add('stars-active');

    setTimeout(() => {
      this.starsContainer.classList.remove('stars-active');
    }, 1800);
  }

  showGoldPopToast() {
    if (!this.goldPopBadge) return;
    this.goldPopBadge.classList.add('pop-active');
    setTimeout(() => {
      this.goldPopBadge.classList.remove('pop-active');
    }, 2000);
  }

  bindEvents() {
    this._onResize = () => this.onResize();
    this._onPointerMove = (e) => {
      this.px = e.clientX / window.innerWidth - 0.5;
      this.py = e.clientY / window.innerHeight - 0.5;
    };
    this._onCanvasClick = (e) => this.onCanvasClick(e);

    window.addEventListener('resize', this._onResize);
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });

    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.pointerEvents = 'none';
    }

    // Global Click Handler:
    // 1. Allows all underlying HTML links/buttons/inputs/accordions to receive clicks without obstruction
    // 2. Raycasts for 3D Robot Mesh click when user clicks on background/robot area
    this._onDocumentClick = (e) => {
      const isClickInsideHUD = this.hudModal && this.hudModal.contains(e.target);
      const isInteractiveHTML = e.target.closest(
        'a, button, input, textarea, select, label, .faq-accordion-item, .portfolio-luxe-card, .nav-container, .filter-tab-btn, .blog-card-luxe, #site-header, .hud-action-btn'
      );

      // If user clicked inside HUD or on another interactive HTML element, do not raycast 3D robot
      if (isClickInsideHUD || isInteractiveHTML) {
        return;
      }

      // Check 3D Robot Mesh intersection
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.robot ? this.raycaster.intersectObjects(this.robot.children, true) : [];

      if (intersects.length > 0) {
        // 3D Robot mesh was clicked!
        this.robotState = 'clicked';
        this.robot.rotation.y = 0.0;
        if (this.goldIngot) this.goldIngot.visible = false;
        this.playAction('Jump', 0.15);
        this.toggleHUD();
      } else if (this.hudModal && this.hudModal.classList.contains('active')) {
        // Clicked outside HUD and not on robot: close HUD
        this.closeHUDAndResumeMining();
      }
    };
    document.addEventListener('click', this._onDocumentClick);

    // HUD Modal Button Event Handlers
    document.getElementById('hud-close-btn')?.addEventListener('click', () => this.closeHUDAndResumeMining());

    document.getElementById('hud-btn-inquiry')?.addEventListener('click', () => {
      this.closeHUDAndResumeMining();
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('hud-btn-faq')?.addEventListener('click', () => {
      this.closeHUDAndResumeMining();
      const el = document.getElementById('rf-faq');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('hud-btn-tip')?.addEventListener('click', () => {
      this.showRandomRFTip();
    });

    document.getElementById('hud-btn-lang')?.addEventListener('click', () => {
      const isEn = window.location.pathname.includes('/en');
      window.location.href = isEn ? '/' : '/en/';
    });
  }

  toggleHUD() {
    if (this.hudModal) {
      this.hudModal.classList.toggle('active');
    }
  }

  closeHUDAndResumeMining() {
    if (this.hudModal) {
      this.hudModal.classList.remove('active');
    }

    this.robotState = 'wandering';
    this.generateNextRandomPosition();
    this.startWanderingState();
  }

  showRandomRFTip() {
    if (!this.tipBox) return;
    const isEn = window.location.pathname.includes('/en');
    const randomItem = this.rfTips[Math.floor(Math.random() * this.rfTips.length)];
    const text = isEn ? randomItem.en : randomItem.ko;

    this.tipBox.style.display = 'block';
    this.tipBox.innerHTML = `<span>${text}</span>`;
  }

  onResize() {
    this.generateNextRandomPosition();
    const targetScale = this.getResponsiveScale();

    if (this.robot) {
      this.robot.scale.set(targetScale, targetScale, targetScale);
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();
    // Normalize delta to 60fps base so speed is identical on 60Hz / 120Hz / 144Hz monitors
    const deltaFactor = Math.min(dt * 60, 2);

    if (this.mixer) this.mixer.update(dt);

    const lerp = (a, b, t) => a + (b - a) * Math.min(t * deltaFactor, 1);

    if (this.robot) {
      if (this.robotState === 'wandering') {
        const dist = this.robot.position.distanceTo(this.targetPos);

        if (dist > 0.3) {
          const dir = new THREE.Vector3().subVectors(this.targetPos, this.robot.position).normalize();
          this.robot.position.addScaledVector(dir, 0.068 * deltaFactor);

          const targetAngle = Math.atan2(dir.x, dir.z);
          this.robot.rotation.y = lerp(this.robot.rotation.y, targetAngle, 0.14);
        } else {
          this.executeGoldMiningAtCurrentSpot();
        }
      }

      if (this.floorRing) {
        this.floorRing.position.x = this.robot.position.x;
        this.floorRing.position.y = this.robot.position.y;
        this.floorRing.position.z = this.robot.position.z;
      }
    }

    // Camera pointer parallax
    this.camera.position.x = lerp(this.camera.position.x, this.px * 0.3, 0.05);
    this.camera.position.y = lerp(this.camera.position.y, 0.8 + -this.py * 0.2, 0.05);
    this.camera.position.z = 18.0;

    this.camera.lookAt(0, 0.8, 0);

    if (this.amberLight && this.robot) {
      this.amberLight.position.x = this.robot.position.x + Math.sin(this.clock.elapsedTime * 0.6) * 1.5;
      this.amberLight.position.y = this.robot.position.y + 1.0;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove);
    if (this._onDocumentClick) document.removeEventListener('click', this._onDocumentClick);
    if (this._onCanvasClick && this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('click', this._onCanvasClick);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}

