
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const obstacles = [
  { x: 4, z: -5, width: 3, depth: 2 },
  { x: -5, z: -10, width: 4, depth: 2 },
  { x: 8, z: -12, width: 3, depth: 3 },
];
const PLAYER_RADIUS = 0.4;

function checkCollision(x, z) {
  if (
    x < -19 + PLAYER_RADIUS ||
    x > 19 - PLAYER_RADIUS ||
    z < -19 + PLAYER_RADIUS ||
    z > 19 - PLAYER_RADIUS
  ) {
    return true;
  }

  for (const obstacle of obstacles) {
    const minX = obstacle.x - obstacle.width / 2;
    const maxX = obstacle.x + obstacle.width / 2;
    const minZ = obstacle.z - obstacle.depth / 2;
    const maxZ = obstacle.z + obstacle.depth / 2;

    const closestX = THREE.MathUtils.clamp(x, minX, maxX);
    const closestZ = THREE.MathUtils.clamp(z, minZ, maxZ);

    const dx = x - closestX;
    const dz = z - closestZ;

    if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) {
      return true;
    }
  }

  return false;
}

export default function Player() {
  const { camera } = useThree();

  const keys = useRef({});
  const mobileMove = useRef({ x: 0, y: 0 });
  const sensitivity = useRef(0.5);

  const velocityY = useRef(0);
  const canJump = useRef(true);
  const paused = useRef(false);

  const speed = 5;
  const gravity = 18;
  const jumpForce = 7;

  useEffect(() => {
    camera.position.set(0, 1.7, 5);
    camera.rotation.order = "YXZ";

    const handlePause = (event) => {
      paused.current = event.detail.paused;

      // Clear movement inputs when pausing
      if (paused.current) {
        keys.current = {};
        mobileMove.current = { x: 0, y: 0 };
      }
    };

    const handleKeyDown = (e) => {
      if (paused.current) return;

      keys.current[e.code] = true;

      if (e.code === "Space" && canJump.current) {
        velocityY.current = jumpForce;
        canJump.current = false;
      }
    };

    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    const handleMobileMove = (e) => {
      if (paused.current) return;

      mobileMove.current = {
        x: THREE.MathUtils.clamp(e.detail.x, -1, 1),
        y: THREE.MathUtils.clamp(e.detail.y, -1, 1),
      };
    };

    const handleMobileLook = (e) => {
      if (paused.current) return;

      const mobileSensitivity = 0.003 * (sensitivity.current / 0.5);

      camera.rotation.y -= e.detail.deltaX * mobileSensitivity;
      camera.rotation.x -= e.detail.deltaY * mobileSensitivity;

      camera.rotation.x = THREE.MathUtils.clamp(
        camera.rotation.x,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05
      );
    };

    const handleMobileJump = () => {
      if (paused.current) return;

      if (canJump.current) {
        velocityY.current = jumpForce;
        canJump.current = false;
      }
    };

    const handleSettings = (event) => {
      sensitivity.current = event.detail.sensitivity ?? 0.5;
    };

    window.addEventListener("game-pause-state", handlePause);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mobile-move", handleMobileMove);
    window.addEventListener("mobile-look", handleMobileLook);
    window.addEventListener("mobile-jump", handleMobileJump);
    window.addEventListener("game-settings-update", handleSettings);

    return () => {
      window.removeEventListener("game-pause-state", handlePause);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mobile-move", handleMobileMove);
      window.removeEventListener("mobile-look", handleMobileLook);
      window.removeEventListener("mobile-jump", handleMobileJump);
      window.removeEventListener("game-settings-update", handleSettings);
    };
  }, [camera]);

  useFrame((state, delta) => {
    // Freeze player completely while paused
    if (paused.current) return;

    const dt = Math.min(delta, 0.05);

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.copy(forward).cross(camera.up).normalize();

    const direction = new THREE.Vector3();

    // Desktop movement
    if (keys.current["KeyW"]) direction.add(forward);
    if (keys.current["KeyS"]) direction.sub(forward);
    if (keys.current["KeyD"]) direction.add(right);
    if (keys.current["KeyA"]) direction.sub(right);

    // Mobile joystick movement
    direction.addScaledVector(forward, -mobileMove.current.y);
    direction.addScaledVector(right, mobileMove.current.x);

    if (direction.lengthSq() > 0) {
      direction.normalize();

      const moveX = direction.x * speed * dt;
      const moveZ = direction.z * speed * dt;

      const nextX = camera.position.x + moveX;

      if (!checkCollision(nextX, camera.position.z)) {
        camera.position.x = nextX;
      }

      const nextZ = camera.position.z + moveZ;

      if (!checkCollision(camera.position.x, nextZ)) {
        camera.position.z = nextZ;
      }
    }

    // Gravity
    velocityY.current -= gravity * dt;
    camera.position.y += velocityY.current * dt;

    // Ground detection
    if (camera.position.y <= 1.7) {
      camera.position.y = 1.7;
      velocityY.current = 0;
      canJump.current = true;
    }
  });

  return null;
}
