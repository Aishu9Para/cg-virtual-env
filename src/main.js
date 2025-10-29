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

// Visible sun sphere
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

// Gentle island bump
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
loader.load("models/dolphin.glb", (gltf) => {
  const base = gltf.scene;
  base.scale.set(0.6, 0.6, 0.6);
  base.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = new THREE.MeshStandardMaterial({
        color: 0x9cd9ff,
        metalness: 0.3,
        roughness: 0.4,
      });
    }
  });

  const dolphin1 = base.clone();
  dolphin1.position.set(-6, 1.2, -16);
  const dolphin2 = base.clone();
  dolphin2.position.set(6, 1.2, -18);
  scene.add(dolphin1);
  scene.add(dolphin2);
  dolphins.push(dolphin1, dolphin2);
});

// === Boat ===
loader.load(
  "models/Boat.glb",
  (gltf) => {
    boat = gltf.scene;
    boat.scale.set(1.0, 1.0, 1.0); // smaller
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

  // Sea waves
  const posSea = seaGeom.attributes.position;
  for (let i = 0; i < posSea.count; i++) {
    const x = posSea.getX(i),
      z = posSea.getY(i);
    const wave =
      Math.sin(x * 0.05 + t * 0.8) * 0.05 + Math.cos(z * 0.07 + t * 0.6) * 0.05;
    posSea.setZ(i, wave);
  }
  posSea.needsUpdate = true;

  if (girlMixer) girlMixer.update(delta);

  // Dolphins move gently
  dolphins.forEach((d, i) => {
    const zPos = -16 - i * 2;
    const hop = Math.abs(Math.sin(t * 1.5 + i)) * 1.0;
    const xMove = Math.sin(t * 0.4 + i * 0.5) * 6;
    d.position.set(xMove + i * 2, 1.1 + hop, zPos);
    d.rotation.y = xMove > 0 ? Math.PI : 0;
  });

  // Boat motion
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

// === Day/Night Toggle Button ===
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

    const moonLight = new THREE.DirectionalLight(0x99ccff, 0.5);
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