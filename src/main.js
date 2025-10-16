import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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
camera.position.set(15, 10, 25);
camera.lookAt(0, 5, 0);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 50;
controls.target.set(0, 3, 0);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
scene.add(sunLight);

// === Materials ===
const toonMat = (color) => new THREE.MeshToonMaterial({ color });

// === Sand ===
const sandGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
const sandMaterial = toonMat(0xffe4b5);
const sand = new THREE.Mesh(sandGeometry, sandMaterial);
sand.rotation.x = -Math.PI / 2;
sand.receiveShadow = true;
scene.add(sand);

// === Sea ===
const seaGeometry = new THREE.PlaneGeometry(200, 80, 100, 100);
const seaMaterial = toonMat(0x1ca3ec);
const sea = new THREE.Mesh(seaGeometry, seaMaterial);
sea.rotation.x = -Math.PI / 2;
sea.position.set(0, 0.1, -35); // Closer to trees
sea.castShadow = false;
scene.add(sea);

// === Sun ===
const sunGeo = new THREE.CircleGeometry(4, 32);
const sunMat = toonMat(0xfff080);
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.set(0, 25, -80);
scene.add(sun);

// === Clouds ===
function createCloud(x, y, z) {
  const cloud = new THREE.Group();
  const cloudMat = toonMat(0xffffff);
  const parts = [
    new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), cloudMat),
    new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), cloudMat),
    new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), cloudMat),
  ];
  parts[0].position.x = -2.5;
  parts[2].position.x = 2.5;
  parts.forEach((p) => cloud.add(p));
  cloud.position.set(x, y, z);
  scene.add(cloud);
}

createCloud(-10, 20, -70);
createCloud(10, 22, -75);

// === Palm Tree ===
function createPalm(x, z) {
  const palm = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 8);
  const trunkMat = toonMat(0x8b5a2b);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  trunk.position.y = 4;
  palm.add(trunk);

  // Leaves
  const leafMat = toonMat(0x228b22);
  const leafGeo = new THREE.CylinderGeometry(0, 0.3, 5, 3, 1);
  const leaves = [];
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 8;
    leaf.rotation.z = Math.PI / 3;
    leaf.rotation.y = (i * Math.PI) / 3;
    leaf.castShadow = true;
    palm.add(leaf);
    leaves.push(leaf);
  }

  palm.position.set(x, 0, z);
  palm.userData = { trunk, leaves, swayOffset: Math.random() * Math.PI * 2 };
  scene.add(palm);

  return palm;
}

// Two palms
const palms = [];
palms.push(createPalm(-7, -10));
palms.push(createPalm(7, -10));

// === Animation Variables ===
let clock = new THREE.Clock();

// === Animate ===
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Animate sea waves
  const pos = seaGeometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const wave =
      Math.sin(x * 0.1 + t * 2) * 0.2 + Math.cos(y * 0.1 + t * 1.5) * 0.2;
    pos.setZ(i, wave);
  }
  pos.needsUpdate = true;

  // Palm tree sway
  palms.forEach((palm) => {
    const sway = Math.sin(t * 1.2 + palm.userData.swayOffset) * 0.05;
    palm.rotation.z = sway;
    palm.userData.leaves.forEach((leaf, i) => {
      leaf.rotation.z = Math.PI / 3 + Math.sin(t * 2 + i) * 0.1;
    });
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// === Resize Handler ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
