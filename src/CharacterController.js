import * as THREE from "three";

/**
 * CharacterController
 * - ArrowUp: move forward
 * - ArrowDown: move backward
 * - ArrowLeft: turn left
 * - ArrowRight: turn right
 * - Camera follows behind smoothly
 */
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

    // Movement parameters
    this.moveSpeed = 0.25;
    this.turnSpeed = 2.0; // radians per second
    this.cameraOffset = new THREE.Vector3(0, 5, 8); // relative camera position behind girl

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

    // ======== ROTATION (Left/Right Arrows) ========
    if (this.keys.ArrowLeft) {
      this.girl.rotation.y += this.turnSpeed * delta;
    }
    if (this.keys.ArrowRight) {
      this.girl.rotation.y -= this.turnSpeed * delta;
    }

    // ======== MOVEMENT (Forward/Backward) ========
    const direction = new THREE.Vector3(
      Math.sin(this.girl.rotation.y),
      0,
      Math.cos(this.girl.rotation.y)
    );

    if (this.keys.ArrowUp) {
      this.girl.position.addScaledVector(direction, this.moveSpeed);
    }
    if (this.keys.ArrowDown) {
      this.girl.position.addScaledVector(direction, -this.moveSpeed);
    }

    // ======== Keep Girl on Terrain ========
    const dist = Math.sqrt(
      this.girl.position.x ** 2 + this.girl.position.z ** 2
    );
    const groundHeight = Math.max(0, 2.5 - dist * 0.08);
    this.girl.position.y = groundHeight + 2.4;

    // ======== CAMERA FOLLOW ========
    if (this.enableCameraFollow && this.camera) {
      // camera offset behind the girl based on her facing
      const offsetRotated = this.cameraOffset
        .clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), this.girl.rotation.y);

      const desiredPos = this.girl.position.clone().add(offsetRotated);
      this.camera.position.lerp(desiredPos, 0.15);

      this.camera.lookAt(
        this.girl.position.x,
        this.girl.position.y + 2,
        this.girl.position.z
      );
    }
  }
}
