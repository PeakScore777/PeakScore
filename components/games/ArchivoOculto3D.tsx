"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function createCoverTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const background = context.createLinearGradient(0, 0, 1024, 1536);
  background.addColorStop(0, "#641c25");
  background.addColorStop(0.48, "#481019");
  background.addColorStop(1, "#2c090f");
  context.fillStyle = background;
  context.fillRect(0, 0, 1024, 1536);

  const vignette = context.createRadialGradient(510, 560, 120, 510, 760, 930);
  vignette.addColorStop(0, "rgba(255,190,132,.13)");
  vignette.addColorStop(1, "rgba(0,0,0,.32)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, 1024, 1536);

  context.strokeStyle = "#c79b55";
  context.lineWidth = 13;
  context.strokeRect(62, 62, 900, 1412);
  context.strokeStyle = "rgba(225,184,111,.72)";
  context.lineWidth = 3;
  context.strokeRect(86, 86, 852, 1364);

  for (const x of [112, 912]) {
    for (const y of [112, 1424]) {
      context.save();
      context.translate(x, y);
      context.strokeStyle = "#d5b16d";
      context.lineWidth = 7;
      context.beginPath();
      context.arc(0, 0, 32, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#f1d49a";
  context.shadowColor = "rgba(0,0,0,.65)";
  context.shadowBlur = 16;
  context.font = "bold 76px Georgia, 'Times New Roman', serif";
  context.fillText("EL", 512, 545);
  context.font = "bold 112px Georgia, 'Times New Roman', serif";
  context.fillText("ARCHIVO", 512, 675);
  context.fillText("OCULTO", 512, 805);
  context.shadowBlur = 0;
  context.strokeStyle = "#d0a65e";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(285, 900);
  context.lineTo(739, 900);
  context.stroke();

  context.fillStyle = "#e4c17d";
  context.font = "bold 34px Georgia, 'Times New Roman', serif";
  context.fillText("EXPEDIENTE 001", 512, 1000);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function PageStack({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[1.34, 0.18, 3.02]} radius={0.035} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#eadfc8" roughness={0.94} />
      </RoundedBox>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[0, -0.088 + index * 0.018, 0]} receiveShadow>
          <boxGeometry args={[1.31, 0.0018, 2.98]} />
          <meshStandardMaterial color={index % 2 ? "#e2d4b8" : "#f4ead7"} roughness={0.98} />
        </mesh>
      ))}
      <mesh position={[0, 0.094, 0]}>
        <boxGeometry args={[1.25, 0.004, 2.91]} />
        <meshStandardMaterial color="#f5ebd8" roughness={0.96} />
      </mesh>
    </group>
  );
}

function Book({ opening }: { opening: boolean }) {
  const cover = useRef<THREE.Group>(null);
  const leftPages = useRef<THREE.Group>(null);
  const coverTexture = useMemo(() => createCoverTexture(), []);

  useEffect(() => () => coverTexture?.dispose(), [coverTexture]);

  useFrame((_, delta) => {
    if (cover.current) {
      const target = opening ? Math.PI : 0;
      cover.current.rotation.z = THREE.MathUtils.damp(cover.current.rotation.z, target, 2.7, delta);
    }
    if (leftPages.current) {
      const target = opening ? 1 : 0.001;
      leftPages.current.scale.x = THREE.MathUtils.damp(leftPages.current.scale.x, target, 3.5, delta);
    }
  });

  return (
    <group position={[0, -0.28, 0]} rotation={[-0.1, -0.08, 0]}>
      <PageStack x={0.72} />
      <group ref={leftPages} position={[-0.72, 0, 0]} scale={[0.001, 1, 1]}>
        <PageStack x={0} />
      </group>

      <RoundedBox args={[0.2, 0.25, 3.1]} radius={0.065} smoothness={6} position={[0, -0.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#320b12" roughness={0.7} />
      </RoundedBox>

      <group ref={cover} position={[0.04, 0.115, 0]}>
        <RoundedBox args={[1.48, 0.105, 3.12]} radius={0.045} smoothness={6} position={[0.72, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#4b1018" roughness={0.48} metalness={0.035} />
        </RoundedBox>

        <mesh position={[0.72, 0.054, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.39, 3.02]} />
          <meshStandardMaterial map={coverTexture ?? undefined} color={coverTexture ? "#ffffff" : "#651d27"} roughness={0.82} metalness={0.015} />
        </mesh>

        <mesh position={[0.72, 0.056, 0]}>
          <boxGeometry args={[0.82, 0.009, 0.08]} />
          <meshStandardMaterial color="#c9a15d" metalness={0.52} roughness={0.4} />
        </mesh>
        <mesh position={[0.72, 0.056, 1.38]}>
          <boxGeometry args={[0.82, 0.009, 0.08]} />
          <meshStandardMaterial color="#c9a15d" metalness={0.52} roughness={0.4} />
        </mesh>
        {[-1, 1].map((z) => (
          <mesh key={z} position={[1.36, 0.06, z * 1.42]}>
            <boxGeometry args={[0.12, 0.014, 0.12]} />
            <meshStandardMaterial color="#d4ad67" metalness={0.72} roughness={0.28} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CoverScene({ opening }: { opening: boolean }) {
  return (
    <>
      <ambientLight intensity={1.05} />
      <directionalLight position={[-3, 5, 4]} intensity={2.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[3, 2, -2]} intensity={1.1} color="#d99b61" />
      <Book opening={opening} />
      <ContactShadows position={[0, -0.42, 0]} opacity={0.44} scale={5.5} blur={2.4} far={2.4} />
    </>
  );
}

export function ArchivoOcultoBookScene({ opening = false }: { opening?: boolean }) {
  return (
    <div className="archivo-3d-book-scene" aria-hidden="true">
      <Canvas frameloop={opening ? "always" : "demand"} shadows dpr={[1, 1.5]} camera={{ position: [0, 3.5, 4.5], fov: 34 }} gl={{ alpha: true, antialias: true }}>
        <CoverScene opening={opening} />
      </Canvas>
    </div>
  );
}

