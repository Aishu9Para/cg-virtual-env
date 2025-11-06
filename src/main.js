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
const islandGeom = new THREE.CircleGeometry(30, 84);
const islandMat = new THREE.MeshToonMaterial({ color: 0xffe4b5 });
const island = new THREE.Mesh(islandGeom, islandMat);
island.rotation.x = -Math.PI / 2;
island.receiveShadow = true;
scene.add(island);

const pos = islandGeom.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i),
    y = pos.getY(i);
  const dist = Math.sqrt(x * x + y * y);
  const height = Math.max(0, 1.2 - dist * 0.08);
  pos.setZ(i, height);
}
pos.needsUpdate = true;

// ======== SEA ========
const seaGeom = new THREE.PlaneGeometry(250, 250, 100, 100);
const seaMat = new THREE.MeshPhongMaterial({
  color: SEA_COLOR,
  shininess: 100,
  transparent: true,
  opacity: 0.95,
  flatShading: true,
});
const sea = new THREE.Mesh(seaGeom, seaMat);
sea.rotation.x = -Math.PI / 2;
sea.position.y = 0.1;
sea.receiveShadow = true;
scene.add(sea);

// ======== TREES ========
function createCoconutTree(x, z) {
  const tree = new THREE.Group();
  const trunkHeight = 14 + Math.random() * 3;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, trunkHeight, 12),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
  );
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  tree.add(trunk);

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
    leaf.castShadow = true;
    tree.add(leaf);
  }

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
    nut.castShadow = true;
    tree.add(nut);
  }

  tree.position.set(x, 0.5, z);
  tree.castShadow = true;
  scene.add(tree);
}

for (let i = 0; i < 8; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 10 + Math.random() * 8;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (z > 10 && Math.abs(x) < 5) continue;
  createCoconutTree(x, z);
}

// ======== MODELS ========
const loader = new GLTFLoader();
let girlMixer;
const dolphins = [];
let boat;

// Girl
loader.load("models/girl.glb", (gltf) => {
  const girl = gltf.scene;
  girl.scale.set(1, 1, 1);
  girl.position.set(0, 2.5, 15);
  girl.rotation.y = Math.PI;
  girl.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
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
