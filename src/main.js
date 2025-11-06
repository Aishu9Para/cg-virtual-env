import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ======== CONSTANTS ========
const SKY_DAY = 0x87ceeb;
const SKY_NIGHT = 0x0a0a1a;
const SEA_COLOR = 0x1e90ff;

// ======== SCENE ========
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY_DAY);
scene.fog = new THREE.FogExp2(SKY_DAY, 0.004);

// ======== CAMERA ========
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(25, 15, 35);
camera.lookAt(0, 4, 0);

// ======== RENDERER ========
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ======== CONTROLS ========
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 4, 0);
// Update your OrbitControls setup
controls.enableDamping = true;
controls.enablePan = true;
controls.enableZoom = true;
controls.maxPolarAngle = Math.PI; // full 360 vertical movement
controls.enableRotate = true;

controls.minDistance = 10;
controls.maxDistance = 150;

// ======== LIGHTING ========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff7cc, 1.3);
sunLight.position.set(40, 60, 30);
sunLight.castShadow = true;
Object.assign(sunLight.shadow.camera, {
  near: 10,
  far: 200,
  left: -60,
  right: 60,
  top: 60,
  bottom: -60,
});
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// ======== SUN OBJECT ========
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffdd66 })
);
sun.position.set(80, 60, -60);
scene.add(sun);

// ======== CLOUDS ========
function createCloud(x, y, z, scale = 1) {
  const cloud = new THREE.Group();
  const puffMat = new THREE.MeshToonMaterial({ color: 0xffffff });
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(3 * scale, 16, 16),
      puffMat
    );
    puff.position.set(i * 3 * scale, Math.random() * 1, Math.random() * 2);
    cloud.add(puff);
  }
  cloud.position.set(x, y, z);
  scene.add(cloud);
}

[
  [-40, 35, -50, 1.2],
  [30, 38, -30, 1.0],
  [60, 42, -70, 1.5],
  [-70, 45, -40, 1.3],
].forEach(([x, y, z, s]) => createCloud(x, y, z, s));

// ======== ISLAND ========
// ======== BIGGER ISLAND ========
// Make island bigger and bumpier
const islandGeom = new THREE.CircleGeometry(60, 120);
const islandMat = new THREE.MeshToonMaterial({ color: 0xffe4b5 });
const island = new THREE.Mesh(islandGeom, islandMat);
island.rotation.x = -Math.PI / 2;
island.receiveShadow = true;
scene.add(island);

// Create simple terrain height variation
const pos = islandGeom.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const y = pos.getY(i);
  const dist = Math.sqrt(x * x + y * y);
  const height = Math.max(0, 3 - dist * 0.08) + Math.random() * 0.3;
  pos.setZ(i, height);
}
pos.needsUpdate = true;

// ======== ADDITIONAL MODELS ON ISLAND ========
// ======== ADDITIONAL MODELS ON ISLAND ========
const loader = new GLTFLoader();

// Helper: get island height at any (x, z)
function getIslandHeight(x, z) {
  const dist = Math.sqrt(x * x + z * z);
  // This matches the formula you used to create the island terrain
  const baseHeight = Math.max(0, 3 - dist * 0.08) + Math.random() * 0.3;
  return baseHeight;
}

const objects = [
  { file: "Campfire.glb", scale: 1.5, pos: [5, 0, 6], rotY: 0 },
  { file: "Chest.glb", scale: 1.5, pos: [-8, 0, -5], rotY: Math.PI / 3 },
  {
    file: "Chest-with-Gold.glb",
    scale: 1.3,
    pos: [-12, 0, 10],
    rotY: -Math.PI / 4,
  },
  { file: "Coin.glb", scale: 0.7, pos: [-10, 0, 12], rotY: 0 },
  { file: "Parchment.glb", scale: 1.2, pos: [2, 0, 10], rotY: 0 },
  { file: "Scroll.glb", scale: 1.1, pos: [3, 0, 9], rotY: 0 },
  { file: "Statue.glb", scale: 2.5, pos: [10, 0, -10], rotY: Math.PI / 1.5 },
  { file: "Rock.glb", scale: 3.0, pos: [14, 0, 8], rotY: 0 },
  { file: "Rocks.glb", scale: 3.5, pos: [-15, 0, -12], rotY: 0 },
];

objects.forEach((obj) => {
  loader.load(`models/${obj.file}`, (gltf) => {
    const model = gltf.scene;
    const [x, , z] = obj.pos;
    const y = getIslandHeight(x, z) + 0.5; // lift slightly above terrain
    model.position.set(x, y, z);
    model.scale.set(obj.scale, obj.scale, obj.scale);
    model.rotation.y = obj.rotY;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(model);
  });
});

// ======== TREES & ROCKS ACROSS ISLAND ========
function createCoconutTree(x, z, heightBoost = 0) {
  const tree = new THREE.Group();
  const trunkHeight = 14 + Math.random() * 3 + heightBoost;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, trunkHeight, 12),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
  );
  trunk.position.y = trunkHeight / 2;
  tree.add(trunk);

  // Leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x1f6b2b,
    emissive: 0x143d18,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const leafGeo = new THREE.PlaneGeometry(8, 2, 8, 1);
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = trunkHeight;
    leaf.rotation.y = (i * Math.PI * 2) / 8;
    leaf.rotation.z = -Math.PI / 4;
    const pos = leaf.geometry.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const x = pos.getX(j);
      pos.setZ(j, Math.sin((x / 8) * Math.PI) * 0.7);
    }
    pos.needsUpdate = true;
    tree.add(leaf);
  }

  // Coconuts
  const coconutGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const coconutMat = new THREE.MeshStandardMaterial({ color: 0xa8d47a });
  for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
    const nut = new THREE.Mesh(coconutGeo, coconutMat);
    const angle = (i * Math.PI * 2) / 3;
    nut.position.set(
      Math.sin(angle) * 0.7,
      trunkHeight - 1.0,
      Math.cos(angle) * 0.7
    );
    tree.add(nut);
  }

  tree.position.set(x, 1.5, z); // keep above terrain
  scene.add(tree);
}

// Generate 20 trees randomly across island
for (let i = 0; i < 35; i++) {
  // instead of 20
  const angle = Math.random() * Math.PI * 2;
  const radius = 8 + Math.random() * 40;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (Math.sqrt(x * x + z * z) < 50) createCoconutTree(x, z);
}

for (let i = 0; i < 15; i++) {
  // instead of 8
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(3 + Math.random() * 2),
    new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 1.0,
      metalness: 0.2,
    })
  );
  const angle = Math.random() * Math.PI * 2;
  const radius = 15 + Math.random() * 40;
  rock.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}

// ======== MODELS ========

let girlMixer;
const dolphins = [];
let boat;

// Girl
loader.load("models/girl.glb", (gltf) => {
  const girl = gltf.scene;
  const x = 0;
  const z = 15;
  const y = getIslandHeight(x, z) + 2.0; // lift slightly above terrain

  girl.position.set(x, y, z);
  girl.scale.set(1, 1, 1);
  girl.rotation.y = Math.PI;

  girl.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  scene.add(girl);

  if (gltf.animations.length) {
    girlMixer = new THREE.AnimationMixer(girl);
    girlMixer.clipAction(gltf.animations[0]).play();
  }
});

// Dolphins
loader.load("models/Dolphin.glb", (gltf) => {
  const base = gltf.scene;
  base.scale.set(0.25, 0.25, 0.25);
  base.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  const d1 = base.clone(),
    d2 = base.clone();
  scene.add(d1, d2);
  dolphins.push(d1, d2);
});

// Boat
loader.load("models/Boat.glb", (gltf) => {
  boat = gltf.scene;
  boat.scale.set(1.3, 1.3, 1.3);
  boat.position.set(10, 1.2, -25);
  boat.rotation.y = Math.PI / 5;
  boat.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(boat);
});

// ======== SEA ========
const seaGeom = new THREE.PlaneGeometry(300, 300, 100, 100);
const seaMat = new THREE.MeshStandardMaterial({
  color: SEA_COLOR,
  transparent: true,
  opacity: 0.9,
  roughness: 0.8,
  metalness: 0.2,
});
const sea = new THREE.Mesh(seaGeom, seaMat);
sea.rotation.x = -Math.PI / 2;
sea.position.y = 0.5;
sea.receiveShadow = true;
scene.add(sea);

// ======== ANIMATION LOOP ========
const clock = new THREE.Clock();
let moon = null;
let moonLight = null;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const delta = clock.getDelta();

  controls.update();
  if (girlMixer) girlMixer.update(delta);

  // Sea motion
  const posSea = seaGeom.attributes.position;
  for (let i = 0; i < posSea.count; i++) {
    const x = posSea.getX(i),
      y = posSea.getY(i);
    posSea.setZ(
      i,
      Math.sin(x * 0.05 + t * 0.8) * 0.08 + Math.cos(y * 0.06 + t * 0.7) * 0.06
    );
  }
  posSea.needsUpdate = true;

  // Dolphins
  dolphins.forEach((d, i) => {
    const cycle = t * 0.8 + (i * Math.PI) / 2;
    d.position.set(
      Math.sin(cycle) * 40 + i * 5,
      0.1 + Math.sin(cycle * 2) * 3,
      -80
    );
    d.rotation.y = Math.cos(cycle) > 0 ? Math.PI : 0;
  });

  // Boat bob
  if (boat) {
    boat.position.y = 1.2 + Math.sin(t * 1.5) * 0.3;
    boat.rotation.z = Math.sin(t * 0.8) * 0.05;
  }

  // Moon motion
  if (moon) {
    moon.position.y = 60 + Math.sin(t * 0.1) * 5;
    moon.position.x = -80 + Math.cos(t * 0.1) * 10;
  }

  renderer.render(scene, camera);
}
animate();

// ======== GIRL MOVEMENT CONTROLS ========
let moveEnabled = false;
let moveSpeed = 0.25;
const keyState = {};

// Track pressed keys
window.addEventListener(
  "keydown",
  (e) => (keyState[e.key.toLowerCase()] = true)
);
window.addEventListener(
  "keyup",
  (e) => (keyState[e.key.toLowerCase()] = false)
);

// Toggle movement control using 'm'
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    moveEnabled = !moveEnabled;
    console.log(`Girl movement: ${moveEnabled ? "ON" : "OFF"}`);
  }
});

function moveGirl(delta) {
  if (!moveEnabled || !window.girlModel) return;

  const direction = new THREE.Vector3();
  const moveVector = new THREE.Vector3();

  // Forward/backward (W/S)
  if (keyState["w"]) moveVector.z -= 1;
  if (keyState["s"]) moveVector.z += 1;

  // Left/right (A/D)
  if (keyState["a"]) moveVector.x -= 1;
  if (keyState["d"]) moveVector.x += 1;

  if (moveVector.length() > 0) {
    moveVector.normalize();

    // Rotate girl to face move direction
    const targetAngle = Math.atan2(moveVector.x, moveVector.z);
    window.girlModel.rotation.y = targetAngle;

    // Apply movement
    const speed = moveSpeed * delta * 60; // frame-rate independent
    window.girlModel.position.x += moveVector.x * speed;
    window.girlModel.position.z += moveVector.z * speed;

    // Adjust height to island surface
    const x = window.girlModel.position.x;
    const z = window.girlModel.position.z;
    const y = getIslandHeight(x, z) + 2.0;
    window.girlModel.position.y = y;
  }
}

// ======== DAY/NIGHT TOGGLE (🌙 Moon Included) ========
const button = document.createElement("button");
button.textContent = "🌙 Toggle Night Mode";
Object.assign(button.style, {
  position: "absolute",
  top: "20px",
  right: "20px",
  padding: "10px 18px",
  background: "#fff",
  border: "none",
  borderRadius: "12px",
  fontSize: "14px",
  cursor: "pointer",
  transition: "all 0.4s ease",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
});
document.body.appendChild(button);

let isNight = false;

button.onclick = () => {
  isNight = !isNight;

  scene.background = new THREE.Color(isNight ? SKY_NIGHT : SKY_DAY);
  scene.fog.color = new THREE.Color(isNight ? SKY_NIGHT : SKY_DAY);
  ambientLight.intensity = isNight ? 0.5 : 0.7;
  sunLight.intensity = isNight ? 0.4 : 1.3;
  sun.visible = !isNight;

  if (isNight) {
    // Moon
    const moonGeo = new THREE.SphereGeometry(4, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xe6f0ff,
      emissive: 0x99ccff,
      emissiveIntensity: 0.6,
      roughness: 0.8,
    });
    moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-80, 60, 60);
    moon.name = "moon";
    scene.add(moon);

    // Moonlight
    moonLight = new THREE.DirectionalLight(0x99ccff, 0.7);
    moonLight.position.set(-20, 60, 30);
    moonLight.castShadow = true;
    moonLight.name = "moonLight";
    scene.add(moonLight);

    button.textContent = "☀ Toggle Day Mode";
    button.style.background = "#222";
    button.style.color = "#fff";
  } else {
    if (moon) scene.remove(moon);
    if (moonLight) scene.remove(moonLight);
    moon = null;
    moonLight = null;

    button.textContent = "🌙 Toggle Night Mode";
    button.style.background = "#fff";
    button.style.color = "#000";
  }
};

// ======== RESIZE ========
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
