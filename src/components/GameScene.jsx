
import { Canvas } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";

import Player from "./Player.jsx";
import Weapon from "./Weapon.jsx";
import Target from "./Target.jsx";
import GameControls from "./GameControls.jsx";
import MovingTarget from "./MovingTarget.jsx";

// Sandy terrain
function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 0]}
    >
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#c5a36b" roughness={1} />
    </mesh>
  );
}

// Low-poly tree
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 3, 6]} />
        <meshStandardMaterial color="#65452c" />
      </mesh>

      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[1.5, 3, 7]} />
        <meshStandardMaterial color="#315b32" flatShading />
      </mesh>

      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[1.15, 2.5, 7]} />
        <meshStandardMaterial color="#47783b" flatShading />
      </mesh>

      <mesh position={[0, 5.3, 0]}>
        <coneGeometry args={[0.75, 1.8, 7]} />
        <meshStandardMaterial color="#5b8845" flatShading />
      </mesh>
    </group>
  );
}

// Decorative rocks
function Rock({ position, scale = 1 }) {
  return (
    <mesh
      position={position}
      scale={scale}
      rotation={[0.2, 0.5, 0.3]}
    >
      <dodecahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial
        color="#817969"
        flatShading
        roughness={1}
      />
    </mesh>
  );
}

// Low-poly bushes
function Bush({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.45, 0]}>
        <dodecahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color="#315d32" flatShading />
      </mesh>

      <mesh position={[-0.4, 0.3, 0.1]}>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#426f36" flatShading />
      </mesh>

      <mesh position={[0.4, 0.3, -0.1]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#527d3d" flatShading />
      </mesh>
    </group>
  );
}

// Environment decoration
function Environment() {
  const trees = [
    [-17, 0, -3],
    [-17, 0, 7],
    [-17, 0, 15],
    [17, 0, 3],
    [17, 0, 12],
    [17, 0, -9],
    [-9, 0, 17],
    [0, 0, 17],
    [9, 0, 17],
    [-15, 0, -17],
    [-5, 0, -17],
    [6, 0, -17],
    [15, 0, -17],
    [-12, 0, 11],
    [12, 0, 8],
    [-15, 0, -10],
    [14, 0, -13],
    [-7, 0, 12],
  ];

  const rocks = [
    [-10, 0.25, -4],
    [11, 0.3, -10],
    [-8, 0.25, 5],
    [6, 0.25, 12],
    [15, 0.25, -2],
    [-15, 0.25, 11],
  ];

  const bushes = [
    [-15, 0, 1],
    [-15, 0, 5],
    [-14, 0, 13],
    [-12, 0, -15],
    [-7, 0, 15],
    [-2, 0, 15],
    [4, 0, 15],
    [12, 0, 15],
    [15, 0, 8],
    [15, 0, 0],
    [15, 0, -6],
    [12, 0, -15],
    [5, 0, -15],
    [-10, 0, -15],
    [-17, 0, -7],
    [17, 0, 15],
    [-17, 0, 17],
    [17, 0, -17],
  ];

  return (
    <group>
      {trees.map((position, index) => (
        <Tree
          key={`tree-${index}`}
          position={position}
          scale={0.8 + (index % 3) * 0.2}
        />
      ))}

      {bushes.map((position, index) => (
        <Bush
          key={`bush-${index}`}
          position={position}
          scale={0.7 + (index % 3) * 0.2}
        />
      ))}

      {rocks.map((position, index) => (
        <Rock
          key={`rock-${index}`}
          position={position}
          scale={0.7 + (index % 3) * 0.25}
        />
      ))}
    </group>
  );
}

// Arena walls
function Walls() {
  return (
    <group>
      <mesh position={[0, 3, -20]}>
        <boxGeometry args={[40, 6, 1]} />
        <meshStandardMaterial color="#75654d" />
      </mesh>

      <mesh position={[-20, 3, 0]}>
        <boxGeometry args={[1, 6, 40]} />
        <meshStandardMaterial color="#75654d" />
      </mesh>

      <mesh position={[20, 3, 0]}>
        <boxGeometry args={[1, 6, 40]} />
        <meshStandardMaterial color="#75654d" />
      </mesh>
    </group>
  );
}

// Training obstacles
function Obstacles() {
  return (
    <group>
      <mesh position={[4, 1, -5]}>
        <boxGeometry args={[3, 2, 2]} />
        <meshStandardMaterial color="#756b4e" />
      </mesh>

      <mesh position={[-5, 1.5, -10]}>
        <boxGeometry args={[4, 3, 2]} />
        <meshStandardMaterial color="#4b5146" />
      </mesh>

      <mesh position={[8, 0.8, -12]}>
        <boxGeometry args={[3, 1.6, 3]} />
        <meshStandardMaterial color="#756b4e" />
      </mesh>
    </group>
  );
}

// Main sky dome
function SkyDome() {
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[90, 32, 20]} />
      <meshBasicMaterial
        color="#2875b9"
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function Sun() {
  return (
    <group position={[30, 35, -65]}>
      <mesh>
        <sphereGeometry args={[4, 24, 24]} />
        <meshBasicMaterial
          color="#fff3c4"
          toneMapped={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[5.5, 20, 20]} />
        <meshBasicMaterial
          color="#ffd98a"
          transparent
          opacity={0.16}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Cloud({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[-2, 0, 0]}>
        <sphereGeometry args={[2, 8, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[2.5, 8, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <mesh position={[2.2, 0.2, 0]}>
        <sphereGeometry args={[1.8, 8, 6]} />
        <meshBasicMaterial color="#f7fbff" />
      </mesh>

      <mesh position={[0.5, -0.5, 0.3]}>
        <sphereGeometry args={[2, 8, 6]} />
        <meshBasicMaterial color="#e7edf2" />
      </mesh>
    </group>
  );
}

// Cloud arrangement
function Clouds() {
  return (
    <group>
      <Cloud position={[-35, 28, -65]} scale={1.5} />
      <Cloud position={[-5, 37, -75]} scale={1.2} />
      <Cloud position={[45, 29, -60]} scale={1.4} />
      <Cloud position={[55, 22, -20]} scale={1.1} />
      <Cloud position={[-55, 23, -25]} scale={1.3} />
    </group>
  );
}

function WoodenDivider() {
  return (
    <group position={[0, 0, -4]}>
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[22, 1.1, 0.35]} />
        <meshStandardMaterial color="#79502f" roughness={1} />
      </mesh>

      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[22.3, 0.12, 0.45]} />
        <meshStandardMaterial color="#4f321f" />
      </mesh>

      {[-10, -5, 0, 5, 10].map((x) => (
        <mesh key={x} position={[x, 0.65, 0]}>
          <boxGeometry args={[0.2, 1.5, 0.5]} />
          <meshStandardMaterial color="#593a24" />
        </mesh>
      ))}
    </group>
  );
}

function TargetRope() {
  return (
    <group>
      <mesh
        position={[0, 4.5, -13]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.045, 0.045, 20, 8]} />
        <meshStandardMaterial color="#403326" />
      </mesh>

      {[-10, 10].map((x) => (
        <group key={x} position={[x, 0, -13]}>
          <mesh position={[0, 2.3, 0]}>
            <cylinderGeometry args={[0.1, 0.15, 4.6, 8]} />
            <meshStandardMaterial color="#68452b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Mountains() {
  const mountainPositions = [
    [-24, 0, -5, 10, 13, 9],
    [-27, 0, -16, 13, 17, 10],
    [-23, 0, -29, 11, 15, 9],

    [24, 0, -5, 11, 14, 9],
    [28, 0, -17, 14, 18, 11],
    [23, 0, -30, 12, 16, 10],

    [-12, 0, -34, 13, 17, 10],
    [4, 0, -38, 15, 20, 12],
    [20, 0, -36, 13, 16, 10],
  ];

  return (
    <group>
      {mountainPositions.map((m, index) => (
        <group key={index} position={[m[0], m[1], m[2]]}>
          <mesh position={[0, m[4] / 2, 0]}>
            <coneGeometry args={[m[3], m[4], 7]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? "#596d59" : "#71806a"}
              roughness={1}
            />
          </mesh>

          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[m[3] * 0.9, m[3] * 1.15, 2.4, 7]} />
            <meshStandardMaterial
              color="#75634b"
              roughness={1}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function GameScene() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [graphics, setGraphics] = useState("Low");
  const [sensitivity, setSensitivity] = useState(0.5);

  // Detect touch devices
  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");

    setIsTouchDevice(mediaQuery.matches);

    const handleChange = (event) => {
      setIsTouchDevice(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Receive settings from the pause menu
  useEffect(() => {
    const handleSettings = (event) => {
      setGraphics(event.detail.graphics ?? "Low");
      setSensitivity(event.detail.sensitivity ?? 0.5);
    };

    window.addEventListener("game-settings-update", handleSettings);

    return () => {
      window.removeEventListener("game-settings-update", handleSettings);
    };
  }, []);

  // Keep rendering resolution conservative
  const getDpr = () => {
    if (graphics === "High") {
      return isTouchDevice ? 1.15 : 1.3;
    }

    if (graphics === "Medium") {
      return isTouchDevice ? 1.05 : 1.15;
    }

    return 1;
  };

  return (
    <Canvas
      camera={{
        position: [0, 1.7, 5],
        fov: 75,
        near: 0.1,
        far: 100,
      }}
      dpr={getDpr()}
      frameloop="always"
      shadows={false}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false,
      }}
    >
      {/* Sky */}
      <SkyDome />
      <Sun />
      <Clouds />

      {/* Lighting */}
      <ambientLight intensity={1.3} />

      <directionalLight
        position={[10, 15, 5]}
        intensity={1.5}
      />

      {/* World */}
      <Ground />
      <Environment />
      {/* <Walls /> */}
      <Mountains />

      {/* Player and weapon */}
      <Player />
      <Weapon />

      {/* Wooden shooting divider */}
      <WoodenDivider />

      {/* Target rope */}
      <TargetRope />

      {/* Existing three targets */}
      <MovingTarget position={[-6, 3.2, -13]} movementRange={2.5} />
      <MovingTarget position={[0, 3.2, -13]} movementRange={2.5} />
      <MovingTarget position={[6, 3.2, -13]} movementRange={1} />

      {/* Three additional targets */}
      <MovingTarget position={[-6, 3.2, -13]} />
      <MovingTarget position={[0, 3.2, -13]} />
      <MovingTarget position={[6, 3.2, -13]} />

      {/* Shooting */}
      <GameControls />

      {/* Desktop mouse controls */}
      {!isTouchDevice && (
        <PointerLockControls
          pointerSpeed={sensitivity / 0.5}
        />
      )}
    </Canvas>
  );
}
