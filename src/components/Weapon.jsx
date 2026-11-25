
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Gunshot sound effect
function playGunSound() {
  const audioContext = new AudioContext();
  const now = audioContext.currentTime;

  // Deep gunshot body
  const bass = audioContext.createOscillator();
  const bassGain = audioContext.createGain();

  bass.type = "sawtooth";
  bass.frequency.setValueAtTime(100, now);
  bass.frequency.exponentialRampToValueAtTime(30, now + 0.2);

  bassGain.gain.setValueAtTime(0.7, now);
  bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  bass.connect(bassGain);
  bassGain.connect(audioContext.destination);

  // Sharp firing crack
  const bufferSize = Math.floor(audioContext.sampleRate * 0.12);
  const buffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] =
      (Math.random() * 2 - 1) *
      Math.pow(1 - i / bufferSize, 2);
  }

  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const crackGain = audioContext.createGain();

  noise.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 900;

  crackGain.gain.setValueAtTime(0.8, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  noise.connect(filter);
  filter.connect(crackGain);
  crackGain.connect(audioContext.destination);

  bass.start(now);
  bass.stop(now + 0.2);

  noise.start(now);
  noise.stop(now + 0.12);

  bass.onended = () => audioContext.close();
}

export default function Weapon() {
  const { camera, scene } = useThree();

  const gunRef = useRef(null);
  const flashRef = useRef(null);
  const lightRef = useRef(null);

  const recoilRef = useRef(0);
  const flashTimerRef = useRef(0);

  useEffect(() => {
    const gun = new THREE.Group();

    function createBox(w, h, d, color, position) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({
          color,
          depthTest: false,
        })
      );

      mesh.position.set(...position);
      mesh.renderOrder = 999;
      gun.add(mesh);

      return mesh;
    }

    function createCylinder(radius, length, color, position) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, length, 12),
        new THREE.MeshBasicMaterial({
          color,
          depthTest: false,
        })
      );

      mesh.position.set(...position);
      mesh.rotation.x = Math.PI / 2;
      mesh.renderOrder = 999;
      gun.add(mesh);

      return mesh;
    }

    // Rifle body
    createBox(0.19, 0.17, 0.48, "#292d30", [0, 0, -0.08]);

    // Barrel
    createCylinder(0.025, 0.55, "#101214", [0, 0.015, -0.55]);

    // Muzzle
    createCylinder(0.04, 0.09, "#17191b", [0, 0.015, -0.87]);

    // Handguard
    createBox(0.17, 0.13, 0.34, "#414640", [0, 0, -0.43]);

    // Stock
    createBox(0.16, 0.14, 0.32, "#66513b", [0, 0, 0.32]);

    // Grip
    const grip = createBox(
      0.11, 0.26, 0.14, "#252525",
      [0, -0.18, 0.08]
    );
    grip.rotation.x = -0.2;

    // Magazine
    const magazine = createBox(
      0.12, 0.32, 0.16, "#303638",
      [0, -0.21, -0.13]
    );
    magazine.rotation.x = -0.12;

    // Rail and sights
    createBox(0.07, 0.035, 0.38, "#17191b", [0, 0.105, -0.18]);
    createBox(0.07, 0.09, 0.07, "#111111", [0, 0.16, 0.05]);
    createBox(0.05, 0.09, 0.06, "#111111", [0, 0.14, -0.58]);

    // Magazine detail
    createBox(0.125, 0.025, 0.17, "#505653", [0, -0.36, -0.13]);

    // Muzzle flash
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshBasicMaterial({
        color: "#ffcc33",
        depthTest: false,
      })
    );

    flash.position.set(0, 0.015, -0.96);
    flash.scale.set(1, 1, 1.8);
    flash.visible = false;
    flash.renderOrder = 1000;

    gun.add(flash);

    // Muzzle light
    const light = new THREE.PointLight("#ff9d22", 0, 2);
    light.position.copy(flash.position);

    gun.add(light);

    // Weapon position
    gun.position.set(0.38, -0.34, -0.9);

    const cameraWasInScene = camera.parent === scene;

    if (!cameraWasInScene) {
      scene.add(camera);
    }

    camera.add(gun);

    gunRef.current = gun;
    flashRef.current = flash;
    lightRef.current = light;

    console.log("Weapon system activated!");

    // Shooting event
    const handleFire = () => {
      playGunSound();

      console.log("WEAPON FIRE EVENT RECEIVED!");

      // Recoil
      recoilRef.current = 0.16;

      // Muzzle flash
      flashTimerRef.current = 0.12;
      flash.visible = true;
      light.intensity = 3;
    };

    window.addEventListener("weapon-fire", handleFire);

    return () => {
      window.removeEventListener("weapon-fire", handleFire);

      camera.remove(gun);

      gunRef.current = null;
      flashRef.current = null;
      lightRef.current = null;

      gun.traverse((object) => {
        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          object.material.dispose();
        }
      });

      if (!cameraWasInScene) {
        scene.remove(camera);
      }
    };
  }, [camera, scene]);

  // Weapon animation
  useFrame((_, delta) => {
    const gun = gunRef.current;

    if (!gun) return;

    // Recoil recovery
    recoilRef.current = THREE.MathUtils.damp(
      recoilRef.current,
      0,
      12,
      delta
    );

    gun.position.z = -0.9 + recoilRef.current;
    gun.position.y = -0.34 - recoilRef.current * 0.25;

    // Muzzle flash timer
    if (flashTimerRef.current > 0) {
      flashTimerRef.current -= delta;

      if (flashTimerRef.current <= 0) {
        if (flashRef.current) {
          flashRef.current.visible = false;
        }

        if (lightRef.current) {
          lightRef.current.intensity = 0;
        }
      }
    }
  });

  return null;
}
