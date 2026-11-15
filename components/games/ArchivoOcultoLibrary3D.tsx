"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

type LibraryProps = { onOpen: () => void; disabled?: boolean };

const BOOK_COLORS = [
  "#382019", "#654027", "#25372f", "#7b2b24", "#40304a",
  "#8a6235", "#263e48", "#542b20", "#77704c", "#34251d",
  "#6b2527", "#334a3b", "#795333", "#292d3e", "#5a3827",
  "#7b3028", "#344b50", "#5b472e", "#412b23", "#6d4b32",
  "#293b31", "#74402c", "#39304a", "#855c37", "#38221d",
];

function ShelfBoard({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.16, 0.92]} />
        <meshStandardMaterial color="#3a2115" roughness={0.72} />
      </mesh>
      <mesh position={[0, -0.095, 0.455]}>
        <boxGeometry args={[width, 0.055, 0.055]} />
        <meshStandardMaterial color="#704327" roughness={0.56} />
      </mesh>
    </group>
  );
}

function LibraryBook({
  index, position, color, active, hovered, onHover, onOpen, disabled,
}: {
  index: number;
  position: [number, number, number];
  color: string;
  active: boolean;
  hovered: boolean;
  onHover: (index: number | null) => void;
  onOpen: () => void;
  disabled: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const selected = useRef(false);
  const materialColor = useMemo(() => new THREE.Color(color), [color]);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (!group.current) return;
    const isFocused = hovered || active;
    const desiredZ = selected.current ? 1.65 : isFocused ? 0.24 : 0;
    const desiredY = selected.current ? position[1] + 0.06 : position[1];
    const desiredRotation = selected.current ? -0.22 : isFocused ? -0.045 : 0;
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, position[2] + desiredZ, 8, Math.min(delta, 1 / 30));
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, desiredY, 8, Math.min(delta, 1 / 30));
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, desiredRotation, 8, Math.min(delta, 1 / 30));
    group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, isFocused ? 1.035 : 1, 8, Math.min(delta, 1 / 30));
    const moving = Math.abs(group.current.position.z - (position[2] + desiredZ)) > 0.002
      || Math.abs(group.current.position.y - desiredY) > 0.002
      || Math.abs(group.current.rotation.y - desiredRotation) > 0.002
      || Math.abs(group.current.scale.y - (isFocused ? 1.035 : 1)) > 0.002;
    if (moving) invalidate();
  });

  const activate = useCallback((event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (disabled || selected.current) return;
    selected.current = true;
    window.setTimeout(onOpen, 760);
  }, [disabled, onOpen]);

  const width = 0.22 + (index % 4) * 0.035;
  const height = 0.96 + (index % 5) * 0.075;

  return (
    <group ref={group} position={position}
      onPointerOver={(event) => { event.stopPropagation(); onHover(index); }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
      onClick={activate}>
      <RoundedBox args={[width, height, 0.72]} radius={0.025} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color={materialColor} roughness={0.68} metalness={0.025}
          emissive={hovered || active ? "#fff2d7" : "#000000"}
          emissiveIntensity={hovered || active ? 0.22 : 0} />
      </RoundedBox>
      <mesh position={[0, 0, 0.366]}>
        <planeGeometry args={[width * 0.82, height * 0.86]} />
        <meshStandardMaterial color={materialColor} roughness={0.78} />
      </mesh>
      <mesh position={[0, height * 0.31, 0.374]}>
        <boxGeometry args={[width * 0.72, 0.018, 0.008]} />
        <meshStandardMaterial color="#c49b60" metalness={0.48} roughness={0.42} />
      </mesh>
      <mesh position={[0, -height * 0.31, 0.374]}>
        <boxGeometry args={[width * 0.72, 0.018, 0.008]} />
        <meshStandardMaterial color="#c49b60" metalness={0.48} roughness={0.42} />
      </mesh>
      {(hovered || active) && (
        <lineSegments position={[0, 0, 0.39]}>
          <edgesGeometry args={[new THREE.BoxGeometry(width * 1.08, height * 1.04, 0.76)]} />
          <lineBasicMaterial color="#fff9e9" transparent opacity={0.96} />
        </lineSegments>
      )}
    </group>
  );
}

function LibraryRoom({ onOpen, disabled }: LibraryProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const rows = [-1.15, 0.12, 1.39];
  const books = useMemo(() => {
    const result: { index: number; position: [number, number, number]; color: string; active: boolean }[] = [];
    rows.forEach((y, row) => {
      for (let column = 0; column < 9; column += 1) {
        const index = row * 9 + column;
        const height = 0.96 + (index % 5) * 0.075;
        result.push({
          index,
          position: [-3.25 + column * 0.81, y + height / 2 + 0.09, 0.05],
          color: BOOK_COLORS[index % BOOK_COLORS.length],
          active: true,
        });
      }
    });
    return result;
  }, []);

  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#f6dfbd", "#1c1009", 0.7]} />
      <directionalLight position={[-4, 7, 5]} intensity={1.45} />
      <pointLight position={[-4, 2.5, 3]} intensity={1.3} color="#e9a85f" />
      <pointLight position={[4, 2.8, 2]} intensity={1.05} color="#d78c45" />
      <group>
        <mesh position={[0, 0.55, -0.55]}>
          <boxGeometry args={[8.5, 5.2, 0.24]} />
          <meshStandardMaterial color="#24160f" roughness={0.88} />
        </mesh>
        {rows.map((y, row) => (
          <group key={row}>
            <ShelfBoard position={[0, y, 0]} width={8.2} />
            {row < 2 && <ShelfBoard position={[0, y + 1.27, -0.08]} width={8.2} />}
          </group>
        ))}
        <mesh position={[-4.05, 0.55, -0.12]}>
          <boxGeometry args={[0.18, 4.15, 0.9]} />
          <meshStandardMaterial color="#4b2c19" roughness={0.7} />
        </mesh>
        <mesh position={[4.05, 0.55, -0.12]}>
          <boxGeometry args={[0.18, 4.15, 0.9]} />
          <meshStandardMaterial color="#4b2c19" roughness={0.7} />
        </mesh>
        {books.map((book) => (
          <LibraryBook key={book.index} {...book} hovered={hovered === book.index}
            onHover={setHovered} onOpen={onOpen} disabled={Boolean(disabled)} />
        ))}
      </group>
      <mesh position={[0, -1.72, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1c100a" roughness={0.9} />
      </mesh>
    </>
  );
}

export function ArchivoOcultoLibrary3D({ onOpen, disabled = false }: LibraryProps) {
  return (
    <div className="archivo-library-scene absolute inset-0" aria-label="Biblioteca interactiva. Selecciona el libro iluminado para abrirlo.">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.25]}
        camera={{ position: [0, 0.45, 8.8], fov: 39 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl, invalidate }) => { gl.setClearColor("#100a06", 0); invalidate(); }}
      >
        <LibraryRoom onOpen={onOpen} disabled={disabled} />
      </Canvas>
    </div>
  );
}
