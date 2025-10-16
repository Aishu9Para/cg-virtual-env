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

// Add visible "sun" sphere
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

// === Palms ===
function createPalm(x, z) {
  const palm = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 8, 8),
    toonMat(0x8b5a2b)
  );
  trunk.position.y = 4;
  palm.add(trunk);

  const leafGeo = new THREE.CylinderGeometry(0, 0.3, 5, 3, 1);
  const leafMat = toonMat(0x228b22);
  palm.userData = { leaves: [] };
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 8;
    leaf.rotation.z = Math.PI / 3;
    leaf.rotation.y = (i * Math.PI) / 3;
    palm.add(leaf);
    palm.userData.leaves.push(leaf);
  }

  palm.position.set(x, 0.5, z);
  scene.add(palm);
  return palm;
}

const palms = [];
const palmPositions = [
  [-8, -6],
  [6, -5],
  [-3, 3],
  [5, 2],
  [0, -8],
  [-10, 2],
];
palmPositions.forEach(([x, z]) => palms.push(createPalm(x, z)));

// === Load Models ===
const loader = new GLTFLoader();
let girl, girlMixer;
const dolphins = [];
let boat;

// === Girl (shoreline) ===
loader.load(
  "models/girl.glb",
  (gltf) => {
    girl = gltf.scene;
    girl.scale.set(1, 1, 1);
    girl.position.set(0, 2.5, 15); // standing on the beach
    girl.rotation.y = Math.PI; // facing the sea
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

// === Dolphins (hop together in straight line far in sea) ===
loader.load(
  "models/Dolphin.glb",
  (gltf) => {
    const base = gltf.scene;
    base.scale.set(0.25, 0.25, 0.25); // smaller dolphins
    base.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // Create two dolphins next to each other
    const d1 = base.clone();
    const d2 = base.clone();
    scene.add(d1);
    scene.add(d2);
    dolphins.push(d1, d2);
  },
  undefined,
  (err) => console.error("Dolphin load error:", err)
);

// === Boat (floating near island) ===
loader.load(
  "models/Boat.glb",
  (gltf) => {
    boat = gltf.scene;
    boat.scale.set(1.3, 1.3, 1.3); // Smaller boat
    boat.position.set(10, 1.2, -25); // clearly visible near island
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

  // Gentle sea movement
  const posSea = seaGeom.attributes.position;
  for (let i = 0; i < posSea.count; i++) {
    const x = posSea.getX(i),
      z = posSea.getY(i);
    const waveHeight =
      Math.sin(x * 0.05 + t * 0.8) * 0.05 + Math.cos(z * 0.07 + t * 0.6) * 0.05;
    posSea.setZ(i, waveHeight);
  }
  posSea.needsUpdate = true;

  // Girl animation
  if (girlMixer) girlMixer.update(delta);

  // Dolphins hop gently in a straight line far in sea
  dolphins.forEach((d, i) => {
    const baseZ = -80; // farther away from island
    const speed = 1.5;
    const hop = Math.abs(Math.sin(t * 2)) * 2; // up-down hopping
    const xMove = Math.sin(t * 0.6) * 25; // left-right straight motion
    d.position.set(xMove + i * 5, 1.5 + hop, baseZ);
    d.rotation.y = xMove > 0 ? Math.PI : 0;
  });

  // Boat gentle bobbing
  if (boat) {
    boat.position.y = 1.2 + Math.sin(t * 1.5) * 0.3;
    boat.rotation.z = Math.sin(t * 0.8) * 0.05;
  }

  // Palm sway
  palms.forEach((p) => {
    const sway = Math.sin(t * 1.2 + p.position.x) * 0.08;
    p.rotation.z = sway;
  });

  renderer.render(scene, camera);
}

animate();

// === Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
