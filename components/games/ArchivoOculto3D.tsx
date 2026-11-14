"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { useCallback, useRef } from "react";
import * as THREE from "three";

type GroupRef = THREE.Group;

function Hand({ side = 1, action = "open" }: { side?: 1 | -1; action?: "open" | "turn" | "point" }) {
  const root = useRef<GroupRef>(null);
  const fingerRefs = useRef<Array<THREE.Group | null>>([]);
  const skin = "#c98f69";
  const skinLight = "#e0ad88";
  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    root.current.position.y = Math.sin(t * 2.1) * 0.012;
    root.current.rotation.z = side * (action === "point" ? -0.1 : 0.05 + Math.sin(t * 1.4) * 0.025);
    fingerRefs.current.forEach((finger, index) => {
      if (!finger) return;
      const curl = action === "point" && index !== 1 ? 0.9 : action === "open" ? 0.12 : 0.18;
      finger.rotation.x = THREE.MathUtils.damp(finger.rotation.x, curl, 7, state.clock.getDelta());
    });
  });

  return (
    <group ref={root} scale={side} rotation={[0, 0, side === 1 ? -0.18 : 0.18]}>
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial color={skin} roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.105, 0.008]} scale={[0.105, 0.145, 0.035]} castShadow>
        <sphereGeometry args={[1, 28, 20]} />
        <meshStandardMaterial color={skin} roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const x = (i - 1.5) * 0.047;
        const lengths = [0.14, 0.17, 0.16, 0.125];
        return (
          <group key={i} ref={(node) => { fingerRefs.current[i] = node; }} position={[x, 0.105, 0]}>
            <mesh position={[0, lengths[i] * 0.48, 0]} castShadow>
              <capsuleGeometry args={[0.021 - i * 0.0015, lengths[i], 5, 10]} />
              <meshStandardMaterial color={skinLight} roughness={0.68} />
            </mesh>
            <mesh position={[0, lengths[i] * 0.88, 0.012]} scale={[0.014, 0.024, 0.006]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color="#edc5a8" roughness={0.48} />
            </mesh>
          </group>
        );
      })}
      <group position={[side === 1 ? -0.105 : 0.105, -0.025, 0]} rotation={[0, 0, side === 1 ? -0.8 : 0.8]}>
        <mesh position={[0, 0.06, 0]} rotation={[0, 0, -0.5]} castShadow>
          <capsuleGeometry args={[0.027, 0.115, 5, 10]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.12, 0.012]} scale={[0.017, 0.022, 0.006]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color="#edc5a8" roughness={0.48} />
        </mesh>
      </group>
      <mesh position={[0, -0.04, 0.03]} scale={[0.068, 0.055, 0.014]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#b97d5c" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Book({ opening }: { opening: boolean }) {
  const cover = useRef<GroupRef>(null);
  const target = opening ? -Math.PI * 0.82 : 0;
  useFrame((_, delta) => {
    if (cover.current) cover.current.rotation.y = THREE.MathUtils.damp(cover.current.rotation.y, target, 2.8, delta);
  });
  return (
    <group position={[0, -0.34, 0]} rotation={[-0.12, -0.12, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.13, 2.15]} />
        <meshStandardMaterial color="#e7d3ae" roughness={0.94} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 0.072 + i * 0.002, 0]} receiveShadow>
          <boxGeometry args={[1.68, 0.003, 2.12]} />
          <meshStandardMaterial color={i % 2 ? "#d9c39b" : "#f1e2c4"} roughness={0.98} />
        </mesh>
      ))}
      <mesh position={[-0.84, 0, 0]} castShadow>
        <boxGeometry args={[0.13, 0.19, 2.18]} />
        <meshStandardMaterial color="#481018" roughness={0.62} />
      </mesh>
      <group ref={cover} position={[-0.82, 0.105, 0]}>
        <mesh position={[0.82, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.075, 2.2]} />
          <meshStandardMaterial color="#4b1018" roughness={0.58} metalness={0.08} />
        </mesh>
        <mesh position={[0.82, 0.041, 0]} castShadow>
          <boxGeometry args={[1.57, 0.008, 2.06]} />
          <meshStandardMaterial color="#7a3028" roughness={0.5} metalness={0.14} />
        </mesh>
        <mesh position={[0.82, 0.047, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.42, 0.006, 1.9]} />
          <meshStandardMaterial color="#54202a" roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh position={[0.82, 0.052, 0]}>
          <boxGeometry args={[1.22, 0.008, 1.65]} />
          <meshStandardMaterial color="#d2a65c" roughness={0.42} metalness={0.45} />
        </mesh>
        <mesh position={[0.82, 0.058, 0]} scale={[0.96, 1, 0.96]}>
          <boxGeometry args={[1.16, 0.01, 1.58]} />
          <meshStandardMaterial color="#50121a" roughness={0.56} />
        </mesh>
        <mesh position={[0.82, 0.066, 0.12]}>
          <boxGeometry args={[0.88, 0.012, 0.45]} />
          <meshStandardMaterial color="#d5b16c" roughness={0.45} metalness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

function CoverScene({ opening }: { opening: boolean }) {
  const hands = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!hands.current) return;
    const target = opening ? 1 : 0;
    hands.current.scale.setScalar(THREE.MathUtils.damp(hands.current.scale.x, target, 5, delta));
    hands.current.position.y = THREE.MathUtils.damp(hands.current.position.y, opening ? -0.18 : -1.45, 5, delta);
    hands.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.025;
  });
  return (
    <>
      <ambientLight intensity={1.25} />
      <directionalLight position={[-3, 5, 5]} intensity={2.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[3, 2, -2]} intensity={1.1} color="#d99b61" />
      <Book opening={opening} />
      <group ref={hands} position={[0, -1.45, 1.05]}>
        <group position={[-0.78, 0, 0]} rotation={[0.18, 0.2, 0.5]} scale={0.82}><Hand side={1} /></group>
        <group position={[0.78, 0, 0]} rotation={[0.18, -0.2, -0.5]} scale={0.82}><Hand side={-1} /></group>
      </group>
      <ContactShadows position={[0, -0.46, 0]} opacity={0.42} scale={5} blur={2.4} far={2} />
      <Environment preset="apartment" />
    </>
  );
}

export function ArchivoOcultoBookScene({ opening = false }: { opening?: boolean }) {
  return (
    <div className="archivo-3d-book-scene" aria-hidden="true">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2.7, 4.9], fov: 34 }} gl={{ alpha: true, antialias: true }}>
        <CoverScene opening={opening} />
      </Canvas>
    </div>
  );
}

function CueScene({ action, optionIndex = 0 }: { action: "turn" | "point"; optionIndex?: number }) {
  const hand = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!hand.current) return;
    const t = state.clock.elapsedTime;
    hand.current.position.x = THREE.MathUtils.damp(hand.current.position.x, action === "point" ? (optionIndex % 2 ? 0.95 : -0.95) : 1.2, 5, delta);
    hand.current.position.y = THREE.MathUtils.damp(hand.current.position.y, action === "point" ? -0.08 - optionIndex * 0.035 : -0.2, 5, delta);
    hand.current.rotation.z = THREE.MathUtils.damp(hand.current.rotation.z, action === "point" ? (optionIndex % 2 ? 0.55 : -0.55) : -0.9, 5, delta);
    hand.current.position.z = Math.sin(t * 5) * 0.018;
  });
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[-2, 3, 4]} intensity={1.8} />
      <group ref={hand} position={[1.8, -0.3, 0]} scale={0.8}>
        <Hand side={action === "point" && optionIndex % 2 ? -1 : 1} action={action === "point" ? "point" : "turn"} />
      </group>
    </>
  );
}

export function ArchivoOcultoHandCue({ action, optionIndex = 0 }: { action: "turn" | "point"; optionIndex?: number }) {
  return (
    <div className="archivo-3d-hand-cue" aria-hidden="true">
      <Canvas dpr={[1, 1.25]} camera={{ position: [0, 0, 3.2], fov: 42 }} gl={{ alpha: true, antialias: true }}>
        <CueScene action={action} optionIndex={optionIndex} />
      </Canvas>
    </div>
  );
}
