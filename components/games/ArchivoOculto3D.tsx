"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

const HAND_MODEL_URL = "https://files.innerscene.com/library/posable-anatomical-right-hand-f6098b4f/c28ad5ff8fafd424275f/hand-posable.glb";
type HandAction = "open" | "turn" | "point";

function AnatomicalHand({ side = 1, action = "open" }: { side?: 1 | -1; action?: HandAction }) {
  const root = useRef<THREE.Group>(null);
  const { scene } = useGLTF(HAND_MODEL_URL);
  const rig = useMemo(() => {
    const cloned = cloneSkinned(scene) as THREE.Group;
    cloned.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    cloned.position.sub(center);
    const longest = Math.max(size.x, size.y, size.z);
    cloned.scale.multiplyScalar(1.32 / Math.max(longest, 0.001));
    const bones: Record<string, THREE.Bone> = {};
    cloned.traverse((node) => {
      if ((node as THREE.Bone).isBone) bones[node.name] = node as THREE.Bone;
    });
    return { object: cloned, bones };
  }, [scene]);

  useFrame((state, delta) => {
    if (!root.current) return;
    root.current.position.y += Math.sin(state.clock.elapsedTime * 2.1) * 0.0008;
    const fingers = ["index", "middle", "ring", "pinky"];
    for (const finger of fingers) {
      for (let joint = 1; joint <= 3; joint += 1) {
        const bone = rig.bones[`${finger}_0${joint}_r`];
        if (!bone) continue;
        const base = (bone.userData.baseFlex as number | undefined) ?? bone.rotation.z;
        bone.userData.baseFlex = base;
        const target = action === "point"
          ? (finger === "index" ? 0.02 : 0.92)
          : action === "turn"
            ? (joint === 1 ? 0.3 : 0.52)
            : 0.12;
        bone.rotation.z = THREE.MathUtils.damp(bone.rotation.z, base + target, 8, delta);
      }
    }
    for (let joint = 1; joint <= 3; joint += 1) {
      const bone = rig.bones[`thumb_0${joint}_r`];
      if (!bone) continue;
      const base = (bone.userData.baseFlex as number | undefined) ?? bone.rotation.z;
      bone.userData.baseFlex = base;
      const target = action === "point" ? 0.62 : action === "turn" ? 0.48 : 0.18;
      bone.rotation.z = THREE.MathUtils.damp(bone.rotation.z, base + target, 8, delta);
    }
  });

  return (
    <group ref={root} scale={[side, 1, 1]}>
      <primitive object={rig.object} />
    </group>
  );
}

function Book({ opening }: { opening: boolean }) {
  const cover = useRef<THREE.Group>(null);
  const target = opening ? -Math.PI * 0.88 : 0;
  useFrame((_, delta) => {
    if (cover.current) cover.current.rotation.y = THREE.MathUtils.damp(cover.current.rotation.y, target, 2.15, delta);
  });

  return (
    <group position={[0, -0.36, 0]} rotation={[-0.1, -0.08, 0]}>
      {/* Thick, slightly rounded page block */}
      <RoundedBox args={[2.16, 0.19, 2.92]} radius={0.055} smoothness={5} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e8d9bb" roughness={0.94} />
      </RoundedBox>
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[0, 0.098 + i * 0.0013, 0]} receiveShadow>
          <boxGeometry args={[2.12, 0.0018, 2.86]} />
          <meshStandardMaterial color={i % 2 ? "#e1d0ad" : "#f4e9d2"} roughness={0.98} />
        </mesh>
      ))}
      {/* Leather spine and rounded board */}
      <RoundedBox args={[0.19, 0.26, 2.98]} radius={0.065} smoothness={6} position={[-1.08, -0.005, 0]} castShadow>
        <meshStandardMaterial color="#3d0c14" roughness={0.68} />
      </RoundedBox>
      <group ref={cover} position={[-1.04, 0.115, 0]}>
        <RoundedBox args={[2.2, 0.105, 3.02]} radius={0.055} smoothness={6} position={[1.1, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4b1018" roughness={0.46} metalness={0.06} />
        </RoundedBox>
        <RoundedBox args={[2.04, 0.014, 2.84]} radius={0.045} smoothness={5} position={[1.1, 0.059, 0]} castShadow>
          <meshStandardMaterial color="#7b3028" roughness={0.52} metalness={0.08} />
        </RoundedBox>
        <mesh position={[1.1, 0.068, 0]}>
          <boxGeometry args={[1.92, 0.008, 2.72]} />
          <meshStandardMaterial color="#d2a65c" roughness={0.38} metalness={0.58} />
        </mesh>
        <mesh position={[1.1, 0.074, 0]}>
          <boxGeometry args={[1.88, 0.008, 2.68]} />
          <meshStandardMaterial color="#50121a" roughness={0.48} />
        </mesh>
        <mesh position={[1.1, 0.081, 0.16]}>
          <boxGeometry args={[1.18, 0.012, 0.48]} />
          <meshStandardMaterial color="#d5b16c" roughness={0.4} metalness={0.48} />
        </mesh>
        {/* Brass corner hardware */}
        {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
          <mesh key={`${x}-${z}`} position={[1.1 + x * 0.91, 0.084, z * 1.29]}>
            <boxGeometry args={[0.13, 0.012, 0.13]} />
            <meshStandardMaterial color="#c99c51" metalness={0.72} roughness={0.3} />
          </mesh>
        )))}
      </group>
    </group>
  );
}

function CoverScene({ opening }: { opening: boolean }) {
  const hands = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!hands.current) return;
    const target = opening ? 1 : 0;
    hands.current.scale.setScalar(THREE.MathUtils.damp(hands.current.scale.x, target, 4.2, delta));
    hands.current.position.y = THREE.MathUtils.damp(hands.current.position.y, opening ? -0.24 : -1.75, 4.2, delta);
    hands.current.position.z = THREE.MathUtils.damp(hands.current.position.z, opening ? 0.92 : 1.6, 4.2, delta);
    hands.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.8) * 0.012;
  });
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[-3, 5, 4]} intensity={2.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[3, 2, -2]} intensity={1.25} color="#d99b61" />
      <Book opening={opening} />
      <group ref={hands} position={[0, -1.75, 1.6]}>
        <group position={[-0.98, 0, 0]} rotation={[0, Math.PI, -0.18]} scale={0.9}>
          <AnatomicalHand side={1} action="turn" />
        </group>
        <group position={[0.98, 0, 0]} rotation={[0, Math.PI, 0.18]} scale={0.9}>
          <AnatomicalHand side={-1} action="turn" />
        </group>
      </group>
      <ContactShadows position={[0, -0.48, 0]} opacity={0.48} scale={5.5} blur={2.2} far={2.4} />
    </>
  );
}

export function ArchivoOcultoBookScene({ opening = false }: { opening?: boolean }) {
  return (
    <div className="archivo-3d-book-scene" aria-hidden="true">
      <Canvas frameloop={opening ? "always" : "demand"} shadows dpr={[1, 1.5]} camera={{ position: [0, 3.5, 5.3], fov: 34 }} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}><CoverScene opening={opening} /></Suspense>
      </Canvas>
    </div>
  );
}

function CueScene({ action, optionIndex = 0 }: { action: "turn" | "point"; optionIndex?: number }) {
  const hand = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!hand.current) return;
    hand.current.position.x = THREE.MathUtils.damp(hand.current.position.x, action === "point" ? 0.88 : 1.08, 5, delta);
    hand.current.position.y = THREE.MathUtils.damp(hand.current.position.y, action === "point" ? -0.06 - optionIndex * 0.025 : -0.12, 5, delta);
    hand.current.position.z = Math.sin(state.clock.elapsedTime * 4) * 0.012;
  });
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[-2, 3, 4]} intensity={2.1} />
      <group ref={hand} position={[1.6, -0.1, 0]} rotation={[0, -Math.PI / 2, action === "point" ? -0.12 : 0.28]} scale={0.92}>
        <AnatomicalHand side={1} action={action} />
      </group>
    </>
  );
}

export function ArchivoOcultoHandCue({ action, optionIndex = 0 }: { action: "turn" | "point"; optionIndex?: number }) {
  return (
    <div className="archivo-3d-hand-cue" aria-hidden="true">
      <Canvas dpr={[1, 1.25]} camera={{ position: [0, 0, 3.2], fov: 42 }} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}><CueScene action={action} optionIndex={optionIndex} /></Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(HAND_MODEL_URL);
