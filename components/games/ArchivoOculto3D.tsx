"use client";

import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

const HAND_MODEL_URL = "/api/games/archivo-oculto/hand-model";

class HandAssetBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("[Archivo Oculto] No se pudo cargar la mano 3D.", error); }
  render() { return this.state.failed ? null : this.props.children; }
}

function createCoverTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 2200;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const background = context.createLinearGradient(0, 0, 1024, 2200);
  background.addColorStop(0, "#681f29");
  background.addColorStop(0.5, "#4a1019");
  background.addColorStop(1, "#2c090f");
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 2200);
  const vignette = context.createRadialGradient(512, 1000, 170, 512, 1100, 1300);
  vignette.addColorStop(0, "rgba(255,198,142,.14)");
  vignette.addColorStop(1, "rgba(0,0,0,.38)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, 1024, 2200);
  context.strokeStyle = "#c79b55";
  context.lineWidth = 13;
  context.strokeRect(58, 58, 908, 2084);
  context.strokeStyle = "rgba(225,184,111,.76)";
  context.lineWidth = 3;
  context.strokeRect(83, 83, 858, 2034);
  for (const x of [112, 912]) for (const y of [112, 2088]) {
    context.beginPath();
    context.arc(x, y, 31, 0, Math.PI * 2);
    context.strokeStyle = "#d5b16d";
    context.lineWidth = 7;
    context.stroke();
  }
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#f1d49a";
  context.shadowColor = "rgba(0,0,0,.7)";
  context.shadowBlur = 18;
  context.font = "bold 82px Georgia, 'Times New Roman', serif";
  context.fillText("EL", 512, 790);
  context.font = "bold 142px Georgia, 'Times New Roman', serif";
  context.fillText("ARCHIVO", 512, 1010);
  context.fillText("OCULTO", 512, 1190);
  context.shadowBlur = 0;
  context.strokeStyle = "#d0a65e";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(255, 1325);
  context.lineTo(769, 1325);
  context.stroke();
  context.fillStyle = "#e4c17d";
  context.font = "bold 42px Georgia, 'Times New Roman', serif";
  context.fillText("EXPEDIENTE 001", 512, 1445);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function PageStack({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[1.39, 0.19, 3.08]} radius={0.035} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color="#eadfc8" roughness={0.94} />
      </RoundedBox>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[0, -0.091 + index * 0.019, 0]} receiveShadow>
          <boxGeometry args={[1.36, 0.0022, 3.04]} />
          <meshStandardMaterial color={index % 2 ? "#e2d4b8" : "#f4ead7"} roughness={0.98} />
        </mesh>
      ))}
      <mesh position={[0, 0.096, 0]}>
        <boxGeometry args={[1.32, 0.004, 3.0]} />
        <meshStandardMaterial color="#f5ebd8" roughness={0.96} />
      </mesh>
    </group>
  );
}

function Book({ opening }: { opening: boolean }) {
  const cover = useRef<THREE.Group>(null);
  const leftPages = useRef<THREE.Group>(null);
  const leftBackCover = useRef<THREE.Group>(null);
  const coverTexture = useMemo(() => createCoverTexture(), []);
  useEffect(() => () => coverTexture?.dispose(), [coverTexture]);

  useFrame((_, delta) => {
    if (cover.current) cover.current.rotation.z = THREE.MathUtils.damp(cover.current.rotation.z, opening ? Math.PI : 0, 3.2, delta);
    if (leftPages.current) {
      leftPages.current.scale.x = THREE.MathUtils.damp(leftPages.current.scale.x, opening ? 1 : 0, 3.8, delta);
      leftPages.current.visible = opening || leftPages.current.scale.x > 0.015;
    }
    if (leftBackCover.current) {
      leftBackCover.current.scale.x = THREE.MathUtils.damp(leftBackCover.current.scale.x, opening ? 1 : 0, 3.8, delta);
      leftBackCover.current.visible = opening || leftBackCover.current.scale.x > 0.015;
    }
  });

  return (
    <group position={[0, -0.28, 0]} rotation={[-0.075, -0.055, 0]}>
      <RoundedBox args={[1.53, 0.11, 3.18]} radius={0.055} smoothness={6} position={[0.735, -0.145, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3b0d15" roughness={0.65} />
      </RoundedBox>
      <group ref={leftBackCover} position={[-0.735, -0.145, 0]} scale={[0, 1, 1]} visible={false}>
        <RoundedBox args={[1.53, 0.11, 3.18]} radius={0.055} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial color="#3b0d15" roughness={0.65} />
        </RoundedBox>
      </group>
      <PageStack x={0.735} />
      <group ref={leftPages} position={[-0.735, 0, 0]} scale={[0, 1, 1]} visible={false}>
        <PageStack x={0} />
      </group>
      <RoundedBox args={[0.22, 0.27, 3.18]} radius={0.075} smoothness={7} position={[0, -0.015, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#320b12" roughness={0.68} />
      </RoundedBox>
      <group ref={cover} position={[0.055, 0.105, 0]}>
        <RoundedBox args={[1.49, 0.115, 3.2]} radius={0.055} smoothness={7} position={[0.745, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4b1018" roughness={0.46} metalness={0.035} />
        </RoundedBox>
        <mesh position={[0.745, 0.059, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.405, 3.105]} />
          <meshStandardMaterial map={coverTexture ?? undefined} color={coverTexture ? "#ffffff" : "#651d27"} roughness={0.82} metalness={0.015} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.745, -0.058, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.40, 3.09]} />
          <meshStandardMaterial color="#754239" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {[-1, 1].map((z) => (
          <mesh key={z} position={[1.40, 0.062, z * 1.43]}>
            <boxGeometry args={[0.12, 0.014, 0.12]} />
            <meshStandardMaterial color="#d4ad67" metalness={0.72} roughness={0.28} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function AnatomicalHand({ mirror, lean }: { mirror: 1 | -1; lean: number }) {
  const { scene } = useGLTF(HAND_MODEL_URL);
  const rig = useMemo(() => {
    const cloned = cloneSkinned(scene) as THREE.Group;
    cloned.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(cloned);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const factor = 1.3 / Math.max(size.x, size.y, size.z, 0.001);
    cloned.scale.setScalar(factor);
    cloned.position.copy(center).multiplyScalar(-factor);
    const bones: Record<string, THREE.Bone> = {};
    const baseFlex: Record<string, number> = {};
    cloned.traverse((node) => {
      const bone = node as THREE.Bone;
      if (!bone.isBone) return;
      bones[bone.name] = bone;
      if (/^(index|middle|ring|pinky)_0[123]_r$/.test(bone.name) || /^thumb_0[123]_r$/.test(bone.name)) baseFlex[bone.name] = bone.rotation.z;
    });
    return { object: cloned, bones, baseFlex };
  }, [scene]);

  useFrame((_, delta) => {
    for (const finger of ["index", "middle", "ring", "pinky"]) {
      for (let joint = 1; joint <= 3; joint += 1) {
        const name = finger + "_0" + joint + "_r";
        const bone = rig.bones[name];
        if (!bone) continue;
        const curl = finger === "index" ? 0.12 : 0.34;
        bone.rotation.z = THREE.MathUtils.damp(bone.rotation.z, (rig.baseFlex[name] ?? 0) + curl, 5.5, delta);
      }
    }
    for (let joint = 1; joint <= 3; joint += 1) {
      const name = "thumb_0" + joint + "_r";
      const bone = rig.bones[name];
      if (!bone) continue;
      bone.rotation.z = THREE.MathUtils.damp(bone.rotation.z, (rig.baseFlex[name] ?? 0) + 0.22, 5.5, delta);
    }
  });

  return (
    <group scale={[mirror, 1, 1]} rotation={[0, lean, 0]}>
      <mesh position={[0, 0, 0.72]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.135, 0.78, 8, 16]} />
        <meshStandardMaterial color="#b98165" roughness={0.78} />
      </mesh>
      <primitive object={rig.object} />
    </group>
  );
}

function OpeningHands({ opening }: { opening: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, opening ? -0.04 : -1.35, 4.8, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, opening ? 1.9 : 2.75, 4.8, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, opening ? -0.08 : 0.24, 4.2, delta);
  });
  return (
    <group ref={group} position={[0, opening ? -0.58 : -1.35, 2.75]} scale={opening ? 1 : 0.001}>
      <group position={[-0.88, 0, 0]}><AnatomicalHand mirror={1} lean={-0.28} /></group>
      <group position={[0.88, 0, 0]}><AnatomicalHand mirror={-1} lean={0.28} /></group>
    </group>
  );
}

function CoverScene({ opening }: { opening: boolean }) {
  return (
    <>
      <ambientLight intensity={1.12} />
      <directionalLight position={[-3, 5, 4]} intensity={2.45} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[3, 2, -2]} intensity={1.08} color="#d99b61" />
      <Book opening={opening} />
      {opening && <HandAssetBoundary><Suspense fallback={null}><OpeningHands opening={opening} /></Suspense></HandAssetBoundary>}
      <ContactShadows position={[0, -0.43, 0]} opacity={0.46} scale={5.8} blur={2.4} far={2.5} />
    </>
  );
}

export function ArchivoOcultoBookScene({ opening = false }: { opening?: boolean }) {
  return (
    <div className="archivo-3d-book-scene" aria-hidden="true">
      <Canvas frameloop={opening ? "always" : "demand"} shadows dpr={[1, 1.5]} camera={{ position: [0, 4.05, 5.2], fov: 32 }} gl={{ alpha: true, antialias: true }}>
        <CoverScene opening={opening} />
      </Canvas>
    </div>
  );
}

useGLTF.preload(HAND_MODEL_URL);
