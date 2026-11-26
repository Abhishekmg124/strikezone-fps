
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

export default function MovingTarget({
  position = [0, 3, -16],
  movementRange = 2.5,
}) {
  const [health, setHealth] = useState(100);
  const [active, setActive] = useState(true);

  const groupRef = useRef();
  const materialRef = useRef();
  const healthRef = useRef(100);

  const hitTimer = useRef(0);
  const respawnTimer = useRef(null);

  const movement = useRef({
    offset: 0,
    direction: Math.random() < 0.5 ? 1 : -1,
    speed: 1 + Math.random() * 1.5,
    changeTime: 1 + Math.random() * 2,
  });

  // Independent left-right movement
  useFrame((_, delta) => {
    if (!active || !groupRef.current) return;

    const motion = movement.current;

    motion.changeTime -= delta;

    if (motion.changeTime <= 0) {
      motion.direction = Math.random() < 0.5 ? 1 : -1;
      motion.speed = 1 + Math.random() * 1.5;
      motion.changeTime = 1 + Math.random() * 2;
    }

    motion.offset += motion.direction * motion.speed * delta;

    if (motion.offset >= movementRange) {
      motion.offset = movementRange;
      motion.direction = -1;
    }

    if (motion.offset <= -movementRange) {
      motion.offset = -movementRange;
      motion.direction = 1;
    }

    groupRef.current.position.x = position[0] + motion.offset;

    if (hitTimer.current > 0) {
      hitTimer.current -= delta;

      if (materialRef.current) {
        materialRef.current.color.set("#ff3333");
      }
    } else if (materialRef.current) {
      materialRef.current.color.set("#b52b25");
    }
  });

  // Listen for hits on every target ring
  useEffect(() => {
    if (!active || !groupRef.current) return;

    const meshes = [];

    const handleHit = () => {
      if (healthRef.current <= 0) return;

      const nextHealth = Math.max(0, healthRef.current - 25);

      healthRef.current = nextHealth;
      setHealth(nextHealth);
      hitTimer.current = 0.2;

      if (nextHealth === 0) {
        setActive(false);

        respawnTimer.current = setTimeout(() => {
          healthRef.current = 100;
          setHealth(100);

          movement.current = {
            offset: 0,
            direction: Math.random() < 0.5 ? 1 : -1,
            speed: 1 + Math.random() * 1.5,
            changeTime: 1 + Math.random() * 2,
          };

          setActive(true);
        }, 3000);
      }
    };

    groupRef.current.traverse((object) => {
      if (object.isMesh && object.userData.isTarget) {
        object.addEventListener("target-hit", handleHit);
        meshes.push(object);
      }
    });

    return () => {
      meshes.forEach((mesh) => {
        mesh.removeEventListener("target-hit", handleHit);
      });
    };
  }, [active]);

  useEffect(() => {
    return () => {
      if (respawnTimer.current) clearTimeout(respawnTimer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Hanging connector */}
      <mesh position={[0, 0.9, -0.08]}>
        <cylinderGeometry args={[0.025, 0.025, 1.2, 6]} />
        <meshStandardMaterial color="#514532" />
      </mesh>

      {/* Outer red ring */}
      <mesh userData={{ isTarget: true }}>
        <circleGeometry args={[0.75, 32]} />
        <meshStandardMaterial ref={materialRef} color="#b52b25" />
      </mesh>

      {/* White ring */}
      <mesh position={[0, 0, 0.02]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Red ring */}
      <mesh position={[0, 0, 0.04]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.37, 32]} />
        <meshBasicMaterial color="#c52c25" />
      </mesh>

      {/* White center */}
      <mesh position={[0, 0, 0.06]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.19, 32]} />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Bullseye */}
      <mesh position={[0, 0, 0.08]} userData={{ isTarget: true }}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial color="#c52c25" />
      </mesh>

      {/* Health bar background */}
      <mesh position={[0, -0.95, 0.08]}>
        <boxGeometry args={[1.1, 0.1, 0.04]} />
        <meshBasicMaterial color="black" />
      </mesh>

      {/* Health bar */}
      {health > 0 && (
        <mesh
          position={[-0.55 + (health / 100) * 0.55, -0.95, 0.11]}
        >
          <boxGeometry args={[(health / 100) * 1.1, 0.065, 0.04]} />
          <meshBasicMaterial color="#20d45a" />
        </mesh>
      )}
    </group>
  );
}
