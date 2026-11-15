"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function createCoverTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1650;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.fillStyle = "#b5121b";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  texture.generateMipmaps = true;
  return texture;
}

function createContactShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(128, 128, 14, 128, 128, 126);
  gradient.addColorStop(0, "rgba(12, 7, 4, 0.52)");
  gradient.addColorStop(0.42, "rgba(12, 7, 4, 0.28)");
  gradient.addColorStop(0.76, "rgba(12, 7, 4, 0.09)");
  gradient.addColorStop(1, "rgba(12, 7, 4, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function PageStack({ x, fading = false }: { x: number; fading?: boolean }) {
  const opacity = fading ? 0 : 1;

  return (
    <group position={[x, 0, 0]}>
      <RoundedBox args={[1.38, 0.18, 3.02]} radius={0.035} smoothness={3}>
        <meshStandardMaterial
          color="#eadfc8"
          roughness={0.96}
          transparent={fading}
          opacity={opacity}
          depthWrite={!fading}
        />
      </RoundedBox>

      <mesh position={[0, 0.092, 0]}>
        <boxGeometry args={[1.32, 0.003, 2.96]} />
        <meshStandardMaterial
          color="#f6eddd"
          roughness={0.96}
          transparent={fading}
          opacity={opacity}
          depthWrite={!fading}
        />
      </mesh>

      {Array.from({ length: 3 }, (_, index) => (
        <mesh key={index} position={[0, -0.065 + index * 0.052, 1.512]}>
          <boxGeometry args={[1.33, 0.0015, 0.004]} />
          <meshStandardMaterial
            color={index === 1 ? "#cdbb9c" : "#f4ead7"}
            roughness={0.98}
            transparent={fading}
            opacity={opacity}
            depthWrite={!fading}
          />
        </mesh>
      ))}
    </group>
  );
}

function Book({ opening }: { opening: boolean }) {
  const cover = useRef<THREE.Group>(null);
  const leftPages = useRef<THREE.Group>(null);
  const openProgress = useRef(0);
  const currentOpacity = useRef(-1);
  const coverTexture = useMemo(() => createCoverTexture(), []);
  const shadowTexture = useMemo(() => createContactShadowTexture(), []);

  useEffect(() => () => {
    coverTexture?.dispose();
    shadowTexture?.dispose();
  }, [coverTexture, shadowTexture]);

  useFrame((_, delta) => {
    openProgress.current = THREE.MathUtils.damp(
      openProgress.current,
      opening ? 1 : 0,
      6.2,
      Math.min(delta, 1 / 30),
    );

    const progress = THREE.MathUtils.clamp(openProgress.current, 0, 1);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
    const hingeLift = Math.sin(eased * Math.PI) * 0.035;

    if (cover.current) {
      // One continuous hinge movement: lift, cross the spine, then settle flat.
      cover.current.rotation.z = eased * Math.PI + (opening ? hingeLift : -hingeLift);
      const seating = THREE.MathUtils.smoothstep(progress, 0.66, 1);
      cover.current.position.y = THREE.MathUtils.lerp(0.11, -0.125, seating);
    }

    if (leftPages.current) {
      const opacity = THREE.MathUtils.smoothstep(progress, 0.68, 0.96);
      leftPages.current.visible = opacity > 0.004;

      if (Math.abs(opacity - currentOpacity.current) > 0.012) {
        currentOpacity.current = opacity;
        leftPages.current.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            if ("opacity" in material) material.opacity = opacity;
          });
        });
      }
    }
  });

  return (
    <group position={[0, -0.9, 0]} rotation={[-0.06, -0.045, 0]}>
      {/* Soft, static contact shadow: far cheaper than a real-time shadow map. */}
      {shadowTexture && (
        <mesh position={[0.08, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
          <planeGeometry args={[4.05, 3.75]} />
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={0.9}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      <RoundedBox
        args={[1.6, 0.14, 3.24]}
        radius={0.045}
        smoothness={3}
        position={[0.8, -0.145, 0]}
      >
        <meshStandardMaterial color="#3b0d15" roughness={0.74} />
      </RoundedBox>

      <PageStack x={0.8} />

      <group ref={leftPages} position={[-0.74, 0, 0]} visible={false}>
        <PageStack x={0} fading />
      </group>

      <RoundedBox
        args={[0.22, 0.27, 3.18]}
        radius={0.055}
        smoothness={3}
        position={[0, -0.015, 0]}
      >
        <meshStandardMaterial color="#320b12" roughness={0.7} />
      </RoundedBox>

      <group ref={cover} position={[0.055, 0.11, 0]}>
        <RoundedBox
          args={[1.6, 0.14, 3.24]}
          position={[0.8, 0, 0]}
          radius={0.045}
          smoothness={3}
        >
          <meshStandardMaterial color="#4b1018" roughness={0.5} metalness={0.02} />
        </RoundedBox>

        <mesh position={[0.8, 0.074, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.515, 3.15]} />
          <meshStandardMaterial
            map={coverTexture ?? undefined}
            color={coverTexture ? "#ffffff" : "#651d27"}
            roughness={0.84}
            metalness={0.01}
            side={THREE.FrontSide}
          />
        </mesh>

        <mesh position={[0.8, -0.074, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.57, 3.2]} />
          <meshStandardMaterial color="#541923" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function CoverScene({ opening }: { opening: boolean }) {
  return (
    <>
      <ambientLight intensity={1.45} />
      <hemisphereLight args={["#f6dfb8", "#32170f", 0.7]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.85} />
      <pointLight position={[3, 2, -2]} intensity={0.65} color="#d99b61" />
      <Book opening={opening} />
    </>
  );
}

export function ArchivoOcultoBookScene({ opening = false }: { opening?: boolean }) {
  return (
    <div className="archivo-3d-book-scene" aria-hidden="true">
      <Canvas
        frameloop={opening ? "always" : "demand"}
        shadows={false}
        dpr={1}
        camera={{ position: [0, 3.5, 5.5], fov: 33 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
      >
        <CoverScene opening={opening} />
      </Canvas>
    </div>
  );
}
