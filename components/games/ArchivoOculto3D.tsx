"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function createCoverTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 2200;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const leather = context.createLinearGradient(0, 0, 1024, 2200);
  leather.addColorStop(0, "#6a202a");
  leather.addColorStop(0.48, "#4b111b");
  leather.addColorStop(1, "#2d090f");
  context.fillStyle = leather;
  context.fillRect(0, 0, 1024, 2200);

  const light = context.createRadialGradient(520, 760, 130, 512, 1050, 1450);
  light.addColorStop(0, "rgba(255,205,151,.16)");
  light.addColorStop(1, "rgba(0,0,0,.34)");
  context.fillStyle = light;
  context.fillRect(0, 0, 1024, 2200);

  context.strokeStyle = "#c99e5b";
  context.lineWidth = 12;
  context.strokeRect(58, 58, 908, 2084);
  context.strokeStyle = "rgba(234,196,125,.78)";
  context.lineWidth = 3;
  context.strokeRect(84, 84, 856, 2032);

  for (const x of [112, 912]) {
    for (const y of [112, 2088]) {
      context.beginPath();
      context.arc(x, y, 30, 0, Math.PI * 2);
      context.strokeStyle = "#d7b16d";
      context.lineWidth = 7;
      context.stroke();
    }
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#f2d79f";
  context.shadowColor = "rgba(0,0,0,.72)";
  context.shadowBlur = 16;
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

function PageStack() {
  return (
    <group position={[0.74, 0, 0]}>
      <RoundedBox args={[1.43, 0.19, 3.08]} radius={0.035} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color="#eadfc8" roughness={0.94} />
      </RoundedBox>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[0, -0.084 + index * 0.021, 0]} receiveShadow>
          <boxGeometry args={[1.39, 0.002, 3.04]} />
          <meshStandardMaterial color={index % 2 ? "#e2d4b8" : "#f4ead7"} roughness={0.98} />
        </mesh>
      ))}
      <mesh position={[0, 0.096, 0]}>
        <boxGeometry args={[1.36, 0.004, 3.0]} />
        <meshStandardMaterial color="#f5ebd8" roughness={0.96} />
      </mesh>
    </group>
  );
}

function Book({ opening }: { opening: boolean }) {
  const cover = useRef<THREE.Group>(null);
  const coverTexture = useMemo(() => createCoverTexture(), []);
  useEffect(() => () => coverTexture?.dispose(), [coverTexture]);

  useFrame((_, delta) => {
    if (!cover.current) return;
    // The hinge runs along the spine (Z axis); the cover swings left like a real book.
    const targetAngle = opening ? Math.PI : 0;
    cover.current.rotation.z = THREE.MathUtils.damp(
      cover.current.rotation.z,
      targetAngle,
      2.8,
      delta,
    );
  });

  return (
    <group position={[0, -0.44, 0]} rotation={[-0.075, -0.055, 0]}>
      {/* Closed back board, page block and rounded spine all share one hinge line. */}
      <RoundedBox
        args={[1.53, 0.115, 3.18]}
        radius={0.055}
        smoothness={6}
        position={[0.74, -0.145, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#3b0d15" roughness={0.68} />
      </RoundedBox>

      <PageStack />

      <RoundedBox
        args={[0.22, 0.27, 3.18]}
        radius={0.075}
        smoothness={7}
        position={[0, -0.015, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#320b12" roughness={0.66} />
      </RoundedBox>

      {/* Front cover: one rigid board with its hinge exactly on the spine. */}
      <group ref={cover} position={[0.055, 0.105, 0]}>
        <RoundedBox
          args={[1.49, 0.115, 3.2]}
          radius={0.055}
          smoothness={7}
          position={[0.745, 0, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#4b1018" roughness={0.46} metalness={0.035} />
        </RoundedBox>

        {/* Raised outer print: offset from the leather so it never z-fights. */}
        <mesh position={[0.745, 0.064, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.405, 3.105]} />
          <meshStandardMaterial
            map={coverTexture ?? undefined}
            color={coverTexture ? "#ffffff" : "#651d27"}
            roughness={0.82}
            metalness={0.015}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inside lining, visible as the board opens. */}
        <mesh position={[0.745, -0.064, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.405, 3.105]} />
          <meshStandardMaterial color="#754239" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>

        {/* Small brass corner caps. */}
        {[-1, 1].map((z) => (
          <mesh key={z} position={[1.40, 0.064, z * 1.43]}>
            <boxGeometry args={[0.12, 0.014, 0.12]} />
            <meshStandardMaterial color="#d4ad67" metalness={0.72} roughness={0.28} />
          </mesh>
        ))}
      </group>

      <ContactShadows position={[0, -0.43, 0]} opacity={0.43} scale={5.4} blur={2.3} far={2.3} />
    </group>
  );
}

function CoverScene({ opening }: { opening: boolean }) {
  return (
    <>
      <ambientLight intensity={1.08} />
      <directionalLight
        position={[-3, 5, 4]}
        intensity={2.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[3, 2, -2]} intensity={1.05} color="#d99b61" />
      <Book opening={opening} />
    </>
  );
}

export function ArchivoOcultoBookScene({ opening = false }: { opening?: boolean }) {
  return (
    <div className="archivo-3d-book-scene" aria-hidden="true">
      <Canvas
        frameloop={opening ? "always" : "demand"}
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.05, 5.2], fov: 32 }}
        gl={{ alpha: true, antialias: true }}
      >
        <CoverScene opening={opening} />
      </Canvas>
    </div>
  );
}
