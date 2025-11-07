import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CharacterController } from "./CharacterController.js";

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
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 15);

// ======== RENDERER ========
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ======== CONTROLS ========
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = true;
controls.maxPolarAngle = Math.PI / 2.1;
controls.minDistance = 5;
controls.maxDistance = 60;

// ======== LIGHTING ========
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff7cc, 1.3);
sunLight.position.set(40, 60, 30);
sunLight.castShadow = true;
scene.add(sunLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffdd66 })
);
sun.position.set(80, 60, -60);
scene.add(sun);

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

const loader = new GLTFLoader();

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

// ======== HEIGHT FUNCTION (for placing objects accurately) ========
function getIslandHeight(x, z) {
  const dist = Math.sqrt(x * x + z * z);
  const baseHeight = Math.max(0, 4 - dist * 0.08);
  const randomVariation = Math.random() * 0.3;
  return baseHeight + randomVariation;
}

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
sea.position.y = 0.3;
sea.receiveShadow = true;
scene.add(sea);

// ======== MODELS ========

let girlModel,
  girlController,
  chestModel,
  boat,
  dolphins = [];
let gameWon = false;

// ======== GIRL ========
loader.load("models/girl.glb", (gltf) => {
  girlModel = gltf.scene;
  const x = 0,
    z = 8;
  const y = getIslandHeight(x, z) + 2.4;
  girlModel.position.set(x, y, z);
  girlModel.scale.set(1, 1, 1);
  girlModel.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = true;
  });
  scene.add(girlModel);
  girlController = new CharacterController(girlModel, camera, true);
  spawnChestRandomly();
});

// ======== RANDOM CHEST SPAWN ========
function spawnChestRandomly() {
  if (chestModel) scene.remove(chestModel);
  loader.load("models/Chest-with-Gold.glb", (gltf) => {
    chestModel = gltf.scene;
    const angle = Math.random() * Math.PI * 2;
    const radius = 10 + Math.random() * 40;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getIslandHeight(x, z) + 0.7;
    chestModel.position.set(x, y, z);
    chestModel.scale.set(1.5, 1.5, 1.5);
    chestModel.rotation.y = Math.random() * Math.PI * 2;
    chestModel.traverse((o) => {
      if (o.isMesh) o.castShadow = o.receiveShadow = true;
    });
    scene.add(chestModel);
  });
}

// ======== BOAT ========
loader.load("models/Boat.glb", (gltf) => {
  boat = gltf.scene;
  boat.scale.set(1.2, 1.2, 1.2);
  boat.position.set(45, getIslandHeight(45, -20) + 0.5, -20);
  boat.rotation.y = Math.PI / 2.5;
  boat.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  scene.add(boat);
});

// ======== DOLPHINS ========
loader.load("models/Dolphin.glb", (gltf) => {
  const base = gltf.scene;
  base.scale.set(0.25, 0.25, 0.25);
  base.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
  const d1 = base.clone(),
    d2 = base.clone();
  scene.add(d1, d2);
  dolphins.push(d1, d2);
});

// ======== UI ========
const message = document.createElement("div");
message.textContent = "💎 Find the Treasure Chest!";
Object.assign(message.style, {
  position: "absolute",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  color: "#fff",
  fontFamily: "Poppins, sans-serif",
  fontSize: "22px",
  textShadow: "2px 2px 6px rgba(0,0,0,0.5)",
});
document.body.appendChild(message);

// Reset button
const resetBtn = document.createElement("button");
resetBtn.textContent = "🔄 Reset Game";
Object.assign(resetBtn.style, {
  position: "absolute",
  top: "60px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "10px 18px",
  borderRadius: "10px",
  background: "#fff",
  border: "none",
  cursor: "pointer",
});
document.body.appendChild(resetBtn);

resetBtn.onclick = () => {
  gameWon = false;
  message.textContent = "💎 Find the Treasure Chest!";
  message.style.color = "#fff";
  if (girlModel) girlModel.position.set(0, getIslandHeight(0, 8) + 2.4, 8);
  spawnChestRandomly();
};

// ======== CAMERA MODE BUTTONS ========
let overheadMode = false;
let isNight = false;
let moon = null;

const uiContainer = document.createElement("div");
Object.assign(uiContainer.style, {
  position: "absolute",
  top: "20px",
  right: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
});
document.body.appendChild(uiContainer);

// Overhead toggle
const overheadBtn = document.createElement("button");
overheadBtn.textContent = "🌍 Overhead View";
Object.assign(overheadBtn.style, {
  padding: "10px 18px",
  borderRadius: "10px",
  background: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  transition: "0.3s",
});
uiContainer.appendChild(overheadBtn);

// Night/Day toggle (hidden initially)
const nightBtn = document.createElement("button");
nightBtn.textContent = "🌙 Night Mode";
Object.assign(nightBtn.style, {
  padding: "10px 18px",
  borderRadius: "10px",
  background: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  transition: "0.3s",
  display: "none",
});
uiContainer.appendChild(nightBtn);

// ======== NIGHT MODE LOGIC ========
nightBtn.onclick = () => {
  isNight = !isNight;
  if (isNight) {
    // 🌙 Night
    scene.background = new THREE.Color(SKY_NIGHT);
    scene.fog.color = new THREE.Color(SKY_NIGHT);
    ambientLight.intensity = 0.4;
    sunLight.intensity = 0.3;
    sun.visible = false;

    const moonGeo = new THREE.SphereGeometry(4, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xe6f0ff,
      emissive: 0x99ccff,
      emissiveIntensity: 0.7,
    });
    moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(-80, 60, 60);
    scene.add(moon);

    nightBtn.textContent = "☀️ Day Mode";
    nightBtn.style.background = "#222";
    nightBtn.style.color = "#fff";
  } else {
    // ☀️ Day
    scene.background = new THREE.Color(SKY_DAY);
    scene.fog.color = new THREE.Color(SKY_DAY);
    ambientLight.intensity = 0.7;
    sunLight.intensity = 1.3;
    sun.visible = true;
    if (moon) scene.remove(moon);
    moon = null;

    nightBtn.textContent = "🌙 Night Mode";
    nightBtn.style.background = "#fff";
    nightBtn.style.color = "#000";
  }
};

// ======== OVERHEAD MODE LOGIC ========
overheadBtn.onclick = () => {
  overheadMode = !overheadMode;
  if (overheadMode) {
    overheadBtn.textContent = "🎮 Player View";
    nightBtn.style.display = "block";

    controls.dispose();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.minDistance = 20;
    controls.maxDistance = 200;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 0, 0);
    camera.position.set(80, 80, 80);
    camera.lookAt(0, 0, 0);
  } else {
    overheadBtn.textContent = "🌍 Overhead View";
    nightBtn.style.display = "none";
    controls.dispose();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 5;
    controls.maxDistance = 60;
    camera.position.set(0, 10, 15);
  }
};

// ======== ANIMATION LOOP ========
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const t = clock.getElapsedTime();

  controls.update();

  if (girlController && !gameWon && !overheadMode) {
    girlController.update(delta);
    if (chestModel && girlModel) {
      const dist = girlModel.position.distanceTo(chestModel.position);
      if (dist < 5 && !gameWon) {
        gameWon = true;
        message.textContent = "🎉 You found the Treasure!";
        message.style.color = "#FFD700";
      }
    }
  }

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

  if (boat) {
    boat.position.y = getIslandHeight(45, -20) + 0.5 + Math.sin(t * 1.5) * 0.2;
    boat.rotation.z = Math.sin(t * 0.8) * 0.05;
  }

  dolphins.forEach((d, i) => {
    const cycle = t * 0.8 + (i * Math.PI) / 2;
    d.position.set(
      Math.sin(cycle) * 60 + i * 5,
      1.5 + Math.sin(cycle * 2) * 3,
      -100
    );
    d.rotation.y = Math.cos(cycle) > 0 ? Math.PI : 0;
  });

  renderer.render(scene, camera);
}
animate();

// ======== RESIZE ========
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
