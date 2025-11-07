import * as THREE from "three";

export class CharacterController {
  constructor(girl, camera, enableCameraFollow = true) {
    this.girl = girl;
    this.camera = camera;
    this.enableCameraFollow = enableCameraFollow;

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    };

    this.moveSpeed = 0.25;
    this.turnSpeed = 2.0;

    // ✅ camera is behind (-Z) relative to character
    this.cameraOffset = new THREE.Vector3(0, 5, -10);

    document.addEventListener("keydown", (e) => this.#onKeyDown(e));
    document.addEventListener("keyup", (e) => this.#onKeyUp(e));
  }

  #onKeyDown(event) {
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = true;
      event.preventDefault?.();
    }
  }

  #onKeyUp(event) {
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = false;
      event.preventDefault?.();
    }
  }

  update(delta) {
    if (!this.girl) return;

    // ======== ROTATION ========
    if (this.keys.ArrowLeft) this.girl.rotation.y += this.turnSpeed * delta;
    if (this.keys.ArrowRight) this.girl.rotation.y -= this.turnSpeed * delta;

    // ======== MOVEMENT (local forward/back) ========
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.girl.rotation.y);
    forward.normalize();

    if (this.keys.ArrowUp)
      this.girl.position.addScaledVector(forward, this.moveSpeed);
    if (this.keys.ArrowDown)
      this.girl.position.addScaledVector(forward, -this.moveSpeed);

    // ======== TERRAIN HEIGHT ========
    const dist = Math.sqrt(
      this.girl.position.x ** 2 + this.girl.position.z ** 2
    );
    const groundHeight = Math.max(0, 2.5 - dist * 0.08);
    this.girl.position.y = groundHeight + 2.4;

    // ======== CAMERA FOLLOW (always behind character) ========
    if (this.enableCameraFollow && this.camera) {
      const offset = this.cameraOffset
        .clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.girl.rotation.y);
      const desiredPos = this.girl.position.clone().add(offset);

      this.camera.position.lerp(desiredPos, 0.1);
      this.camera.lookAt(
        this.girl.position.x,
        this.girl.position.y + 2,
        this.girl.position.z
      );
    }
  }
}
