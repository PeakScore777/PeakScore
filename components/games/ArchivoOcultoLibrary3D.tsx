"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type ArchivoLibraryStory = { id: string; title: string };

type Props = {
  stories: ArchivoLibraryStory[];
  onSelect: (story: ArchivoLibraryStory) => void;
  disabled?: boolean;
};

const WOOD = "#382316";
const TRIM = "#70482b";

function Room() {
  return (
    <group>
      <mesh position={[0, 4, 0]} receiveShadow>
        <boxGeometry args={[15, 0.25, 12]} />
        <meshStandardMaterial color="#24170f" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.13, 0]} receiveShadow>
        <boxGeometry args={[15, 0.25, 12]} />
        <meshStandardMaterial color="#3a2417" roughness={0.66} />
      </mesh>
      {[-7.4, 7.4].map((x) => (
        <mesh key={x} position={[x, 1.95, 0]} receiveShadow>
          <boxGeometry args={[0.2, 4, 12]} />
          <meshStandardMaterial color="#2b1a11" roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0, 1.95, -5.9]} receiveShadow>
        <boxGeometry args={[15, 4, 0.2]} />
        <meshStandardMaterial color="#24160f" roughness={0.88} />
      </mesh>
      {[-6.7, 6.7].map((x) => (
        <mesh key={x} position={[x, 1.95, -5.76]}>
          <boxGeometry args={[0.16, 3.8, 0.18]} />
          <meshStandardMaterial color={TRIM} roughness={0.62} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14.6, 11.6]} />
        <meshStandardMaterial color="#4a2d1b" roughness={0.56} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[-6.8 + i * 0.97, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 11.4]} />
          <meshStandardMaterial color="#21140d" roughness={0.9} />
        </mesh>
      ))}
      <group position={[0, 0, -5.65]}>
        {[-1.8, 0, 1.8].map((y) => (
          <mesh key={y} position={[0, y + 1.15, 0]}>
            <boxGeometry args={[12.5, 0.08, 0.55]} />
            <meshStandardMaterial color="#1b100a" roughness={0.85} />
          </mesh>
        ))}
        {[-6.1, 6.1].map((x) => (
          <mesh key={x} position={[x, 1.85, 0]}>
            <boxGeometry args={[0.18, 3.7, 0.62]} />
            <meshStandardMaterial color={TRIM} roughness={0.62} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Shelf({ y, width = 12.2 }: { y: number; width?: number }) {
  return (
    <group position={[0, y, -5.15]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.16, 0.88]} />
        <meshStandardMaterial color={WOOD} roughness={0.64} />
      </mesh>
      <mesh position={[0, -0.09, 0.43]}>
        <boxGeometry args={[width, 0.06, 0.07]} />
        <meshStandardMaterial color={TRIM} roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.105, -0.27]}>
        <boxGeometry args={[width, 0.035, 0.08]} />
        <meshStandardMaterial color="#805432" roughness={0.62} />
      </mesh>
    </group>
  );
}

function spineTexture(title: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#54231d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0, "#24100d");
  grad.addColorStop(0.25, "#783b29");
  grad.addColorStop(0.55, "#4c211b");
  grad.addColorStop(1, "#1c0d0a");
  ctx.fillStyle = grad;
  ctx.fillRect(15, 12, 226, 1000);
  ctx.strokeStyle = "#c6a06a";
  ctx.lineWidth = 5;
  ctx.strokeRect(29, 24, 198, 976);
  ctx.strokeStyle = "rgba(214,177,117,.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(39, 35, 178, 954);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#e8d0a0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 43;
  ctx.font = `bold ${size}px Georgia`;
  while (ctx.measureText(title).width > 790 && size > 19) {
    size -= 2;
    ctx.font = `bold ${size}px Georgia`;
  }
  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 4;
  ctx.fillText(title, 0, 0, 790);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function StoryBook({
  story, index, position, onSelect, disabled,
}: {
  story: ArchivoLibraryStory;
  index: number;
  position: [number, number, number];
  onSelect: (story: ArchivoLibraryStory) => void;
  disabled: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);
  const texture = useMemo(() => spineTexture(story.title), [story.title]);
  const { invalidate } = useThree();

  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame((_, delta) => {
    if (!root.current) return;
    const focused = hovered || selected;
    const targetZ = selected ? 2.6 : hovered ? 0.42 : 0;
    const targetY = selected ? position[1] + 0.1 : position[1];
    const targetRotation = selected ? -0.35 : hovered ? -0.08 : 0;
    root.current.position.z = THREE.MathUtils.damp(root.current.position.z, position[2] + targetZ, 5.5, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, targetY, 6, delta);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, targetRotation, 6, delta);
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, focused ? 1.07 : 1, 6, delta));
    if (focused) invalidate();
  });

  const width = 0.48 + (index % 3) * 0.08;
  const height = 1.16 + (index % 4) * 0.09;

  return (
    <group ref={root} position={position}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled || selected) return;
        setSelected(true);
        window.setTimeout(() => onSelect(story), 1050);
      }}>
      <RoundedBox args={[width, height, 0.72]} radius={0.035} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#5b2b20" roughness={0.58} metalness={0.04}
          emissive={hovered || selected ? "#fff0c8" : "#000000"}
          emissiveIntensity={hovered || selected ? 0.32 : 0} />
      </RoundedBox>
      <mesh position={[0, 0, 0.365]}>
        <planeGeometry args={[width * 0.88, height * 0.96]} />
        <meshStandardMaterial map={texture ?? undefined} color={texture ? "#ffffff" : "#5b2b20"} roughness={0.75} />
      </mesh>
      <mesh position={[0, height * 0.39, 0.38]}>
        <boxGeometry args={[width * 0.8, 0.022, 0.018]} />
        <meshStandardMaterial color="#d0ad71" metalness={0.45} roughness={0.35} />
      </mesh>
      {(hovered || selected) && (
        <lineSegments position={[0, 0, 0.4]}>
          <edgesGeometry args={[new THREE.BoxGeometry(width * 1.1, height * 1.04, 0.78)]} />
          <lineBasicMaterial color="#fff9e9" />
        </lineSegments>
      )}
    </group>
  );
}

function FirstPersonMovement() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => { keys.current[event.code] = true; };
    const up = (event: KeyboardEvent) => { keys.current[event.code] = false; };
    const clear = () => { keys.current = {}; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  useFrame((_, delta) => {
    const speed = 2.25 * Math.min(delta, 0.04);
    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();
    direction.set(0, 0, 0);
    if (keys.current.KeyW || keys.current.ArrowUp) direction.add(forward);
    if (keys.current.KeyS || keys.current.ArrowDown) direction.sub(forward);
    if (keys.current.KeyD || keys.current.ArrowRight) direction.add(right);
    if (keys.current.KeyA || keys.current.ArrowLeft) direction.sub(right);
    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed);
      camera.position.add(direction);
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -6.2, 6.2);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -4.7, 5.1);
      camera.position.y = 1.68;
    }
  });
  return null;
}

function LibraryWorld({ stories, onSelect, disabled }: Props) {
  const rows = Math.max(1, Math.ceil(stories.length / 7));
  const shelfY = useMemo(() => Array.from({ length: Math.min(rows, 3) }, (_, i) => 0.35 + i * 1.22), [rows]);
  return (
    <>
      <color attach="background" args={["#130c08"]} />
      <fog attach="fog" args={["#130c08", 12, 24]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#f1d9b5", "#1b1009", 0.68]} />
      <directionalLight position={[-4, 7, 3]} intensity={1.15} />
      <pointLight position={[-4, 3.2, -3.6]} intensity={95} distance={8} decay={2} color="#e9ad69" />
      <pointLight position={[4, 3.3, -3.7]} intensity={82} distance={8} decay={2} color="#d78e4e" />
      <Room />
      {shelfY.map((y) => <Shelf key={y} y={y} />)}
      {stories.map((story, index) => {
        const row = Math.floor(index / 7);
        const column = index % 7;
        const y = shelfY[Math.min(row, shelfY.length - 1)] + 0.7;
        const x = -5.2 + column * 1.72;
        return (
          <StoryBook key={story.id} story={story} index={index}
            position={[x, y, -4.66]} onSelect={onSelect} disabled={disabled} />
        );
      })}
      <mesh position={[0, 0.03, 2.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 1.3]} />
        <meshStandardMaterial color="#25160f" roughness={0.45} />
      </mesh>
      <FirstPersonMovement />
      <PointerLockControls />
    </>
  );
}

export default function ArchivoOcultoLibrary3D({ stories, onSelect, disabled = false }: Props) {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const sync = () => setLocked(document.pointerLockElement !== null);
    document.addEventListener("pointerlockchange", sync);
    return () => document.removeEventListener("pointerlockchange", sync);
  }, []);
  return (
    <div className="archivo-library-world relative h-full min-h-[min(78svh,820px)] w-full overflow-hidden">
      <Canvas
        dpr={[1, 1.35]}
        camera={{ position: [0, 1.68, 4.8], fov: 68 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
        onCreated={({ gl }) => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
      >
        <LibraryWorld stories={stories} onSelect={onSelect} disabled={disabled} />
      </Canvas>
      {!locked && (
        <button type="button" onClick={() => {
          void document.body.requestPointerLock?.();
        }} className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-[#d9bd8d]/50 bg-[#170e09]/80 px-4 py-2 text-xs text-[#f1dfbd] shadow-xl backdrop-blur">
          Haz clic para mirar alrededor · WASD para caminar
        </button>
      )}
      <div className="pointer-events-none absolute left-5 top-5 text-[10px] uppercase tracking-[.22em] text-[#d9bd8d]/75">
        Biblioteca · {stories.length} {stories.length === 1 ? "historia" : "historias"}
      </div>
    </div>
  );
}
