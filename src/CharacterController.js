import * as THREE from "three";

export class CharacterController {
  constructor(girl, camera, enableCameraFollow = true) {
    this.girl = girl;
    this.camera = camera;
    this.enableCameraFollow = enableCameraFollow;

    this.keys = { w: false, a: false, s: false, d: false };
    this.speed = 0.2;

    document.addEventListener("keydown", (e) => this.#onKeyDown(e));
    document.addEventListener("keyup", (e) => this.#onKeyUp(e));
  }

  #onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
  }

  #onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
  }

  update(delta) {
    if (!this.girl) return;

    const direction = new THREE.Vector3();
    if (this.keys.w) direction.z -= 1;
    if (this.keys.s) direction.z += 1;
    if (this.keys.a) direction.x -= 1;
    if (this.keys.d) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      this.girl.position.x += direction.x * this.speed;
      this.girl.position.z += direction.z * this.speed;

      const targetAngle = Math.atan2(direction.x, direction.z);
      this.girl.rotation.y = THREE.MathUtils.lerp(
        this.girl.rotation.y,
        targetAngle,
        0.2
      );
    }

    // Keep the girl on ground
    this.girl.position.y = 2.5;

    // Camera follow
    if (this.enableCameraFollow && this.camera) {
      const offset = new THREE.Vector3(0, 10, 20).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.girl.rotation.y
      );
      const targetPos = this.girl.position.clone().add(offset);
      this.camera.position.lerp(targetPos, 0.1);
      this.camera.lookAt(
        this.girl.position.x,
        this.girl.position.y + 5,
        this.girl.position.z
      );
    }
  }
}
