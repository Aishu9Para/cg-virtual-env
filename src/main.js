import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// === Scene setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// === Camera ===
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(25, 15, 35);
camera.lookAt(0, 4, 0);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 4, 0);

// === Lighting & Sun ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff7cc, 1.3);
sunLight.position.set(40, 60, 30);
sunLight.castShadow = true;
scene.add(sunLight);

// 🌞 Realistic shadow configuration
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -60;
sunLight.shadow.bias = -0.001;

// Visible "sun"
const sunGeo = new THREE.SphereGeometry(4, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd66 });
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(80, 60, -60);
scene.add(sun);

// === Clouds ===
function createCloud(x, y, z, scale = 1) {
  const cloud = new THREE.Group();
  const puffMat = new THREE.MeshToonMaterial({ color: 0xffffff });
  const puffGeo = new THREE.SphereGeometry(3 * scale, 16, 16);
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.set(i * 3 * scale, Math.random() * 1, Math.random() * 2);
    cloud.add(puff);
  }
  cloud.position.set(x, y, z);
  scene.add(cloud);
  return cloud;
}

const clouds = [
  createCloud(-40, 35, -50, 1.2),
  createCloud(30, 38, -30, 1.0),
  createCloud(60, 42, -70, 1.5),
  createCloud(-70, 45, -40, 1.3),
];

// === Helper material ===
const toonMat = (color) => new THREE.MeshToonMaterial({ color });

// === Island ===
const islandGeom = new THREE.CircleGeometry(30, 84);
const islandMat = toonMat(0xffe4b5);
const island = new THREE.Mesh(islandGeom, islandMat);
island.rotation.x = -Math.PI / 2;
island.receiveShadow = true;
scene.add(island);

// Gentle island shape
{
  const pos = islandGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i);
    const dist = Math.sqrt(x * x + y * y);
    const height = Math.max(0, 1.2 - dist * 0.08);
    pos.setZ(i, height);
  }
  pos.needsUpdate = true;
}

// === Sea ===
const seaGeom = new THREE.PlaneGeometry(250, 250, 150, 150);
const seaMat = new THREE.MeshPhongMaterial({
  color: 0x1e90ff,
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

// === 🌴 Improved Coconut Trees (smaller + spaced) ===
function createCoconutTree(x, z) {
  const tree = new THREE.Group();

  // Shorter Trunk
  const trunkHeight = 16 + Math.random() * 2; // reduced overall height
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, trunkHeight, 12),
    new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.8,
      metalness: 0.1,
    })
  );
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // 🌿 Realistic Coconut Fronds
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x1f6b2b, // deep green
    emissive: 0x143d18,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const leafGeo = new THREE.PlaneGeometry(8, 2, 8, 1); // smaller fronds
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
    leaf.receiveShadow = true;
    tree.add(leaf);
  }

  // 🥥 Light-green Coconuts
  const coconutMat = new THREE.MeshStandardMaterial({
    color: 0xa8d47a, // lighter green coconuts
    roughness: 0.4,
  });
  const coconutGeo = new THREE.SphereGeometry(0.45, 16, 16);

  const numCoconuts = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numCoconuts; i++) {
    const nut = new THREE.Mesh(coconutGeo, coconutMat);
    const angle = (i * Math.PI * 2) / numCoconuts;
    nut.position.set(Math.sin(angle) * 0.7, trunkHeight - 1.0, Math.cos(angle) * 0.7);
    nut.castShadow = true;
    tree.add(nut);
  }

  tree.position.set(x, 0.5, z);
  tree.castShadow = true;
  tree.receiveShadow = true;
  scene.add(tree);
  return tree;
}

// 🌴 Randomly spaced trees around island (avoid girl area)
const trees = [];
for (let i = 0; i < 8; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 10 + Math.random() * 8;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  // Skip tree positions near the girl (front area)
  if (z > 10 && Math.abs(x) < 5) continue;

  trees.push(createCoconutTree(x, z));
}

// === Load Models ===
const loader = new GLTFLoader();
let girl, girlMixer;
const dolphins = [];
let boat;

// === Girl ===
loader.load(
  "models/girl.glb",
  (gltf) => {
    girl = gltf.scene;
    girl.scale.set(1, 1, 1);
    girl.position.set(0, 2.5, 15);
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
      const action = girlMixer.clipAction(gltf.animations[0]);
      action.play();
    }
  },
  undefined,
  (err) => console.error("Girl load error:", err)
);

// === Dolphins ===
loader.load(
  "models/Dolphin.glb",
  (gltf) => {
    const base = gltf.scene;
    base.scale.set(0.25, 0.25, 0.25);
    base.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const d1 = base.clone();
    const d2 = base.clone();
    scene.add(d1);
    scene.add(d2);
    dolphins.push(d1, d2);
  },
  undefined,
  (err) => console.error("Dolphin load error:", err)
);

// === Boat ===
loader.load(
  "models/Boat.glb",
  (gltf) => {
    boat = gltf.scene;
    boat.scale.set(1.3, 1.3, 1.3);
    boat.position.set(10, 1.2, -25);
    boat.rotation.y = Math.PI / 5;
    boat.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(boat);
  },
  undefined,
  (err) => console.error("Boat load error:", err)
);

// === Animation ===
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const delta = clock.getDelta();

  controls.update();

  // Sea movement
  const posSea = seaGeom.attributes.position;
  for (let i = 0; i < posSea.count; i++) {
    const x = posSea.getX(i),
      z = posSea.getY(i);
    const waveHeight =
      Math.sin(x * 0.05 + t * 0.8) * 0.05 + Math.cos(z * 0.07 + t * 0.6) * 0.05;
    posSea.setZ(i, waveHeight);
  }
  posSea.needsUpdate = true;

  if (girlMixer) girlMixer.update(delta);

  // Dolphins
  dolphins.forEach((d, i) => {
    const baseZ = -80;
    const speed = 0.8;
    const cycle = t * speed + (i * Math.PI) / 2;
    const xMove = Math.sin(cycle) * 40;
    const yMove = Math.sin(cycle * 2) * 3;
    const waterLevel = 0.1;
    d.position.set(xMove + i * 5, waterLevel + yMove, baseZ);
    d.rotation.y = Math.cos(cycle) > 0 ? Math.PI : 0;
    d.rotation.z = Math.sin(cycle * 2) * 0.3;
  });

  // Boat gentle bobbing
  if (boat) {
    boat.position.y = 1.2 + Math.sin(t * 1.5) * 0.3;
    boat.rotation.z = Math.sin(t * 0.8) * 0.05;
  }

  renderer.render(scene, camera);
}

animate();

// === 🌗 Day/Night Toggle Button ===
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
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
});
document.body.appendChild(button);

let isNight = false;
button.onclick = () => {
  isNight = !isNight;
  if (isNight) {
    scene.background = new THREE.Color(0x0a0a1a);
    ambientLight.intensity = 0.5;
    sunLight.intensity = 0.4;
    sun.visible = false;
    const moonLight = new THREE.DirectionalLight(0x99ccff, 0.6);
    moonLight.position.set(-20, 50, 30);
    moonLight.name = "moonLight";
    scene.add(moonLight);
    button.textContent = "☀ Toggle Day Mode";
    button.style.background = "#222";
    button.style.color = "#fff";
  } else {
    scene.background = new THREE.Color(0x87ceeb);
    ambientLight.intensity = 0.7;
    sunLight.intensity = 1.3;
    sun.visible = true;
    const oldMoon = scene.getObjectByName("moonLight");
    if (oldMoon) scene.remove(oldMoon);
    button.textContent = "🌙 Toggle Night Mode";
    button.style.background = "#fff";
    button.style.color = "#000";
  }
};

// === Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
