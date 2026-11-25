
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Target({ position = [0, 3.2, -16] }) {
  const [health, setHealth] = useState(100);
  const [active, setActive] = useState(true);
  const [destroying, setDestroying] = useState(false);

  const groupRef = useRef();
  const bodyMaterialRef = useRef();

  const healthRef = useRef(100);
  const respawnTimer = useRef(null);
  const hideTimer = useRef(null);

  const hitTimer = useRef(0);
  const particleTimer = useRef(0);
  const shakeTimer = useRef(0);

  const particleRefs = useRef([]);
  const particleVelocities = useRef([]);

  // Independent random movement for each target
  const movement = useRef({
    offset: 0,
    direction: 1,
    speed: 1.5,
    changeIn: 2,
  });

  // Animate movement and hit effects
  useFrame((_, delta) => {
    if (!active || !groupRef.current) return;

    const group = groupRef.current;
    const motion = movement.current;

    if (!destroying) {
      motion.changeIn -= delta;

      if (motion.changeIn <= 0) {
        motion.direction = Math.random() < 0.5 ? -1 : 1;
        motion.speed = 1.1 + Math.random() * 1.4;
        motion.changeIn = 1.2 + Math.random() * 1.8;
      }

      motion.offset += motion.direction * motion.speed * delta;

      if (motion.offset >= 2.2) {
        motion.offset = 2.2;
        motion.direction = -1;
      }

      if (motion.offset <= -2.2) {
        motion.offset = -2.2;
        motion.direction = 1;
      }

      group.position.x = position[0] + motion.offset;
    }

    // Red hit flash
    if (hitTimer.current > 0) {
      hitTimer.current -= delta;

      if (bodyMaterialRef.current) {
        bodyMaterialRef.current.color.set("#ff3333");
      }
    } else if (bodyMaterialRef.current && !destroying) {
      bodyMaterialRef.current.color.set("#b52b25");
    }

    // Shake effect
    if (shakeTimer.current > 0) {
      shakeTimer.current -= delta;
      group.rotation.z = Math.sin(shakeTimer.current * 60) * 0.08;
    } else {
      group.rotation.z = 0;
    }

    // Particles
    if (particleTimer.current > 0) {
      particleTimer.current -= delta;

      particleRefs.current.forEach((particle, index) => {
        if (!particle) return;

        const velocity = particleVelocities.current[index];
        if (!velocity) return;

        particle.visible = true;
        particle.position.addScaledVector(velocity, delta);
        velocity.multiplyScalar(0.96);

        if (particle.material) {
          particle.material.opacity = Math.max(
            0,
            particleTimer.current / 0.35
          );
        }
      });
    } else {
      particleRefs.current.forEach((particle) => {
        if (particle) particle.visible = false;
      });
    }

    // Destruction animation
    if (destroying) {
      const scale = Math.max(0.05, group.scale.x - delta * 2.2);
      group.scale.setScalar(scale);
      group.rotation.y += delta * 5;
    }
  });

  // Reset movement when target respawns
  useEffect(() => {
    if (!active) return;

    movement.current = {
      offset: 0,
      direction: Math.random() < 0.5 ? 1 : -1,
      speed: 1.1 + Math.random() * 1.4,
      changeIn: 1.2 + Math.random() * 1.8,
    };
  }, [active, position]);

  // Listen for hits on every part of the target board
  useEffect(() => {
    if (!active || !groupRef.current) return;

    const targetMeshes = [];

    const handleHit = () => {
      if (healthRef.current <= 0 || destroying) return;

      const nextHealth = Math.max(0, healthRef.current - 25);

      healthRef.current = nextHealth;
      setHealth(nextHealth);

      hitTimer.current = 0.18;
      particleTimer.current = 0.35;
      shakeTimer.current = 0.18;

      particleRefs.current.forEach((particle, index) => {
        if (!particle) return;

        particle.position.set(0, 0, 0.16);
        particle.visible = true;

        particleVelocities.current[index] = new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          Math.random() * 3
        );
      });

      console.log("Target health:", nextHealth);

      if (nextHealth === 0) {
        console.log("Target destroyed!");

        setDestroying(true);

        hideTimer.current = setTimeout(() => {
          setActive(false);
        }, 450);

        respawnTimer.current = setTimeout(() => {
          healthRef.current = 100;
          setHealth(100);
          setDestroying(false);
          setActive(true);

          console.log("Target respawned!");
        }, 3000);
      }
    };

    groupRef.current.traverse((object) => {
      if (object.isMesh && object.userData.isTarget) {
        object.addEventListener("target-hit", handleHit);
        targetMeshes.push(object);
      }
    });

    return () => {
      targetMeshes.forEach((mesh) => {
        mesh.removeEventListener("target-hit", handleHit);
      });
    };
  }, [active, destroying]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (respawnTimer.current) clearTimeout(respawnTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Hanging cord */}
      <mesh position={[0, 1.2, -0.08]}>
        <cylinderGeometry args={[0.025, 0.025, 1.65, 6]} />
        <meshStandardMaterial color="#4b4032" />
      </mesh>

      {/* Outer red target */}
      <mesh userData={{ isTarget: true }}>
        <circleGeometry args={[0.75, 32]} />
        <meshStandardMaterial
          ref={bodyMaterialRef}
          color="#b52b25"
          roughness={0.8}
        />
      </mesh>

      {/* White ring */}
      <mesh position={[0, 0, 0.025]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.57, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Red ring */}
      <mesh position={[0, 0, 0.045]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.39, 32]} />
        <meshBasicMaterial color="#c52c25" />
      </mesh>

      {/* Inner white circle */}
      <mesh position={[0, 0, 0.065]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.21, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Bullseye */}
      <mesh position={[0, 0, 0.085]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.09, 24]} />
        <meshBasicMaterial color="#c52c25" />
      </mesh>

      {/* Hit particles */}
      {Array.from({ length: 6 }).map((_, index) => (
        <mesh
          key={index}
          ref={(element) => {
            particleRefs.current[index] = element;
          }}
          position={[0, 0, 0.16]}
          visible={false}
        >
          <sphereGeometry args={[0.035, 5, 4]} />
          <meshBasicMaterial
            color="#ff3333"
            transparent
            opacity={1}
            depthTest={false}
          />
        </mesh>
      ))}

      {/* Health background */}
      <mesh position={[0, 0.95, 0.12]}>
        <boxGeometry args={[1.2, 0.12, 0.05]} />
        <meshBasicMaterial color="black" />
      </mesh>

      {/* Health bar */}
      {health > 0 && (
        <mesh
          position={[
            -0.6 + (health / 100) * 0.6,
            0.95,
            0.16,
          ]}
        >
          <boxGeometry args={[(health / 100) * 1.2, 0.08, 0.05]} />
          <meshBasicMaterial color="#20d45a" />
        </mesh>
      )}
    </group>
  );
}
