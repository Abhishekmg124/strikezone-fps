
import * as THREE from "three";

const raycaster = new THREE.Raycaster();
const bulletMarks = [];

const MAX_BULLET_MARKS = 40;

// Create bullet impact marks
function createBulletMark(scene, hit) {
  const geometry = new THREE.CircleGeometry(0.065, 12);

  const material = new THREE.MeshBasicMaterial({
    color: "#171717",
    side: THREE.DoubleSide,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  const mark = new THREE.Mesh(geometry, material);

  mark.position.copy(hit.point);

  const normal = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    : new THREE.Vector3(0, 0, 1);

  mark.position.addScaledVector(normal, 0.006);

  mark.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal
  );

  scene.add(mark);
  bulletMarks.push(mark);

  if (bulletMarks.length > MAX_BULLET_MARKS) {
    const oldMark = bulletMarks.shift();

    scene.remove(oldMark);
    oldMark.geometry.dispose();
    oldMark.material.dispose();
  }
}

// Create animated impact sparks

function createImpactSparks(scene, hit) {
  const particles = [];

  const normal = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    : new THREE.Vector3(0, 0, 1);

  // Make sure sparks burst toward the player
  const toCamera = new THREE.Vector3()
    .subVectors(
      raycaster.ray.origin,
      hit.point
    )
    .normalize();

  if (normal.dot(toCamera) < 0) {
    normal.negate();
  }

  const geometry = new THREE.SphereGeometry(0.035, 6, 5);

  for (let i = 0; i < 10; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? "#ffff00" : "#ff5500",
      depthTest: false,
      transparent: true,
      opacity: 1,
    });

    const particle = new THREE.Mesh(geometry, material);

    particle.position.copy(hit.point);
    particle.position.addScaledVector(normal, 0.08);
    particle.renderOrder = 1001;

    const velocity = normal.clone().multiplyScalar(2);

    velocity.x += (Math.random() - 0.5) * 5;
    velocity.y += (Math.random() - 0.5) * 5;
    velocity.z += (Math.random() - 0.5) * 5;

    particles.push({ mesh: particle, velocity });
    scene.add(particle);
  }

  const startTime = performance.now();

  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = elapsed / 350;

    if (progress >= 1) {
      particles.forEach(({ mesh }) => {
        scene.remove(mesh);
        mesh.material.dispose();
      });

      geometry.dispose();
      return;
    }

    particles.forEach(({ mesh, velocity }) => {
      mesh.position.addScaledVector(velocity, 0.016);
      velocity.multiplyScalar(0.97);

      mesh.material.opacity = 1 - progress;
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}


export function shoot(camera, scene) {
  camera.updateMatrixWorld(true);
  scene.updateMatrixWorld(true);

  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();

  camera.getWorldPosition(origin);
  camera.getWorldDirection(direction);

  raycaster.set(origin, direction);
  raycaster.far = 100;

  const objects = [];

  scene.traverse((object) => {
    if (!object.isMesh || !object.visible) return;

    // Ignore the weapon attached to the camera
    let parent = object;
    let belongsToCamera = false;

    while (parent) {
      if (parent === camera) {
        belongsToCamera = true;
        break;
      }

      parent = parent.parent;
    }

    if (!belongsToCamera) {
      objects.push(object);
    }
  });

  const hits = raycaster.intersectObjects(objects, false);

  if (hits.length === 0) {
    console.log("SHOT MISSED!");
    return false;
  }

  const hit = hits[0];
  const hitObject = hit.object;

  // Target hit
  if (hitObject.userData.isTarget === true) {
    console.log("TARGET HIT!");

    hitObject.dispatchEvent({ type: "target-hit" });

    window.dispatchEvent(new Event("player-hit"));

    window.dispatchEvent(
      new CustomEvent("score-update", {
        detail: { points: 100 },
      })
    );

    return true;
  }

  // Wall or obstacle hit
  console.log("BULLET IMPACT!");

  //createBulletMark(scene, hit);
  createImpactSparks(scene, hit);

  return true;
}
