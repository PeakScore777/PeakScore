"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

export type ArchivoLibraryStory = { id: string; title: string; completed?: boolean; questions: { id: string }[] };

type Props = {
  stories: ArchivoLibraryStory[];
  onSelect: (story: ArchivoLibraryStory) => void;
  disabled?: boolean;
};

const WOOD = "#382316";
const TRIM = "#70482b";

function makeWoodTexture(base: string, grain: string, repeat: [number, number]) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 48; i += 1) {
    const y = (i * 37) % canvas.height;
    ctx.strokeStyle = i % 4 === 0 ? grain : "rgba(20,10,5,.12)";
    ctx.globalAlpha = i % 4 === 0 ? 0.34 : 0.22;
    ctx.lineWidth = i % 7 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(70, y - 3, 170, y + 4, canvas.width, y + ((i % 3) - 1) * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 2;
  return texture;
}

function Room() {
  const wallTexture = useMemo(() => makeWoodTexture("#392319", "rgba(190,125,75,.6)", [3, 2]), []);
  const floorTexture = useMemo(() => makeWoodTexture("#69452e", "rgba(226,174,113,.65)", [5, 4]), []);
  useEffect(() => () => { wallTexture?.dispose(); floorTexture?.dispose(); }, [wallTexture, floorTexture]);
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
          <meshStandardMaterial map={wallTexture ?? undefined} color="#805a40" roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0, 1.95, -5.9]} receiveShadow>
        <boxGeometry args={[15, 4, 0.2]} />
        <meshStandardMaterial map={wallTexture ?? undefined} color="#b28a68" roughness={0.88} />
      </mesh>
      {[-6.7, 6.7].map((x) => (
        <mesh key={x} position={[x, 1.95, -5.76]}>
          <boxGeometry args={[0.16, 3.8, 0.18]} />
          <meshStandardMaterial color={TRIM} roughness={0.62} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14.6, 11.6]} />
        <meshStandardMaterial map={floorTexture ?? undefined} color="#c49a70" roughness={0.62} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[-6.8 + i * 0.97, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, 11.4]} />
          <meshStandardMaterial color="#21140d" roughness={0.9} />
        </mesh>
      ))}
      <group position={[0, 0, -5.65]}>
        {[-0.85, 0.25, 1.35].map((y) => (
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
  const shelfTexture = useMemo(() => makeWoodTexture("#52331f", "rgba(211,158,99,.7)", [4, 1]), []);
  useEffect(() => () => shelfTexture?.dispose(), [shelfTexture]);
  return (
    <group position={[0, y, -5.15]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.16, 0.88]} />
        <meshStandardMaterial map={shelfTexture ?? undefined} color="#c19a72" roughness={0.58} />
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
  canvas.width = 128;
  canvas.height = 512;
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
  ctx.lineWidth = 3;
  ctx.strokeRect(29, 24, 198, 976);
  ctx.strokeStyle = "rgba(214,177,117,.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(39, 35, 178, 954);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#e8d0a0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 23;
  ctx.font = `bold ${size}px Georgia`;
  while (ctx.measureText(title).width > 390 && size > 11) {
    size -= 2;
    ctx.font = `bold ${size}px Georgia`;
  }
  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 4;
  ctx.fillText(title, 0, 0, 390);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function StoryBook({
  story, index, position, carried, placed, droppedPosition,
}: {
  story: ArchivoLibraryStory;
  index: number;
  position: [number, number, number];
  carried: boolean;
  placed: boolean;
  droppedPosition: [number, number, number] | null;
}) {
  const root = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => spineTexture(story.title), [story.title]);
  const { camera, invalidate } = useThree();
  const forward = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const desiredQuaternion = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame((_, delta) => {
    if (!root.current) return;
    const alpha = 1 - Math.exp(-delta * 14);
    if (carried) {
      camera.getWorldDirection(forward);
      target.copy(camera.position).addScaledVector(forward, 1.05);
      target.y -= 0.24;
      root.current.position.lerp(target, alpha);
      desiredQuaternion.copy(camera.quaternion);
      root.current.quaternion.slerp(desiredQuaternion, alpha);
      root.current.scale.setScalar(0.92);
    } else if (placed) {
      target.set(0, 1.17, 2.25);
      root.current.position.lerp(target, alpha);
      desiredQuaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      root.current.quaternion.slerp(desiredQuaternion, alpha);
      root.current.scale.setScalar(1);
    } else if (droppedPosition) {
      target.set(droppedPosition[0], droppedPosition[1], droppedPosition[2]);
      root.current.position.lerp(target, alpha);
      desiredQuaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      root.current.quaternion.slerp(desiredQuaternion, alpha);
      root.current.scale.setScalar(0.92);
    } else {
      root.current.position.set(position[0], position[1], position[2] + (hovered ? 0.045 : 0));
      root.current.rotation.set(0, hovered ? -0.025 : 0, 0);
      root.current.scale.setScalar(1);
    }
    if (hovered || carried || placed) invalidate();
  });

  const width = 0.09 + (index % 4) * 0.014;
  const height = 0.72 + (index % 4) * 0.045;
  const depth = 0.34;

  return (
    <group ref={root} position={position} userData={{ archivoStoryId: story.id }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}>
      <RoundedBox args={[width, height, depth]} radius={0.025} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#4b2119" roughness={0.68} metalness={0.025}
          emissive={hovered ? "#fff0c8" : "#000000"}
          emissiveIntensity={hovered ? 0.24 : 0} />
      </RoundedBox>
      <mesh position={[0, 0, depth / 2 + 0.022]}>
        <planeGeometry args={[width * 0.9, height * 0.94]} />
        <meshStandardMaterial map={texture ?? undefined} color={texture ? "#ffffff" : "#5b2b20"} roughness={0.72} />
      </mesh>
      {story.completed && (
        <mesh position={[0, height * 0.28, depth / 2 + 0.035]}>
          <circleGeometry args={[0.075, 24]} />
          <meshBasicMaterial color="#b99a62" />
        </mesh>
      )}
      {[-0.37, 0.37].map((band) => (
        <mesh key={band} position={[0, height * band, depth / 2 + 0.028]}>
          <boxGeometry args={[width * 0.82, 0.018, 0.012]} />
          <meshStandardMaterial color="#cba36a" metalness={0.42} roughness={0.38} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[width * 0.84, height * 0.92, depth * 0.9]} />
        <meshStandardMaterial color="#e7dcc6" roughness={0.94} />
      </mesh>
      <group position={[width / 2, 0, 0]}>
        <mesh position={[0.025, 0, -depth / 2]} castShadow>
          <boxGeometry args={[0.05, height, depth]} />
          <meshStandardMaterial color="#54271d" roughness={0.58} />
        </mesh>
      </group>
    </group>
  );
}

function FirstPersonMovement() {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const direction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const elapsed = useRef(0);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      keys.current[event.code] = true;
    };
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

  useFrame((state, delta) => {
    elapsed.current += Math.min(delta, 0.05);
    const speed = 7.4 * Math.min(delta, 0.05);
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
      const nextX = THREE.MathUtils.clamp(camera.position.x + direction.x, -6.2, 6.2);
      const nextZ = THREE.MathUtils.clamp(camera.position.z + direction.z, -4.7, 5.1);
      const deskCollision = Math.abs(nextX) < 1.85 && nextZ > 1.15 && nextZ < 3.2;
      if (!deskCollision) {
        camera.position.x = nextX;
        camera.position.z = nextZ;
      } else {
        camera.position.x = nextX;
      }
      camera.position.y = 1.68 + Math.sin(elapsed.current * 8) * 0.018;
    } else {
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 1.68, 8, delta);
    }
  });
  return null;
}

function MouseLookControls() {
  const { camera } = useThree();
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!document.pointerLockElement) return;
      euler.setFromQuaternion(camera.quaternion);
      euler.y -= event.movementX * 0.0052;
      euler.x -= event.movementY * 0.0052;
      euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2.15, Math.PI / 2.15);
      camera.quaternion.setFromEuler(euler);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [camera, euler]);
  return null;
}

function LibraryInteractionController({
  stories, disabled, carriedId, placedId, onCarry, onPlace, onDrop, onOpen, onTargetChange,
}: {
  stories: ArchivoLibraryStory[];
  disabled: boolean;
  carriedId: string | null;
  placedId: string | null;
  onCarry: (id: string | null) => void;
  onPlace: (id: string | null) => void;
  onDrop: (drop: { id: string; position: [number, number, number] } | null) => void;
  onOpen: (story: ArchivoLibraryStory) => void;
  onTargetChange: (id: string | null) => void;
}) {
  const { camera, scene } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const center = useMemo(() => new THREE.Vector2(0, 0), []);
  const targetId = useRef<string | null>(null);
  const carriedRef = useRef(carriedId);
  const placedRef = useRef(placedId);
  useEffect(() => { carriedRef.current = carriedId; }, [carriedId]);
  useEffect(() => { placedRef.current = placedId; }, [placedId]);

  useFrame(() => {
    if (disabled || carriedRef.current || placedRef.current) return;
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    let nextId: string | null = null;
    for (const hit of hits) {
      let node: THREE.Object3D | null = hit.object;
      while (node) {
        const id = node.userData.archivoStoryId;
        if (typeof id === "string") { nextId = id; break; }
        node = node.parent;
      }
      if (nextId) break;
    }
    if (nextId !== targetId.current) {
      targetId.current = nextId;
      onTargetChange(nextId);
    }
  });

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || disabled) return;
      if (event.code === "KeyR" && !carriedRef.current && !placedRef.current && targetId.current) {
        event.preventDefault();
        carriedRef.current = targetId.current;
        onCarry(targetId.current);
        onDrop(null);
      } else if (event.code === "KeyC" && carriedRef.current) {
        event.preventDefault();
        const id = carriedRef.current;
        const nearDesk = Math.hypot(camera.position.x, camera.position.z - 2.25) < 1.7;
        if (nearDesk) {
          placedRef.current = id;
          onPlace(id);
          onDrop(null);
        } else {
          placedRef.current = null;
          onPlace(null);
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          onDrop({ id, position: [camera.position.x + forward.x * 0.9, 0.19, camera.position.z + forward.z * 0.9] });
        }
        carriedRef.current = null;
        onCarry(null);
      } else if (event.code === "KeyE" && placedRef.current) {
        event.preventDefault();
        const story = stories.find((item) => item.id === placedRef.current);
        if (story) onOpen(story);
      }
    };
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, [camera, disabled, onCarry, onDrop, onOpen, onPlace, stories]);
  return null;
}

function Desk() {
  return (
    <group position={[0, 0, 2.25]}>
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.25, 0.16, 1.55]} />
        <meshStandardMaterial color="#4a2b19" roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.99, 0]} castShadow>
        <boxGeometry args={[3.1, 0.025, 1.4]} />
        <meshStandardMaterial color="#8d613a" roughness={0.38} metalness={0.04} />
      </mesh>
      {[-1.42, 1.42].flatMap((x) => [-0.62, 0.62].map((z) => (
        <mesh key={x + ":" + z} position={[x, 0.43, z]} castShadow>
          <boxGeometry args={[0.14, 0.88, 0.14]} />
          <meshStandardMaterial color="#2d1a10" roughness={0.62} />
        </mesh>
      )))}
      <group position={[-0.95, 1.02, -0.12]}>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.24, 0.28, 0.09, 24]} />
          <meshStandardMaterial color="#8b612f" metalness={0.72} roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.72, 12]} />
          <meshStandardMaterial color="#75502a" metalness={0.65} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0.8, 0]} rotation={[0.12, 0, -0.12]}>
          <cylinderGeometry args={[0.22, 0.5, 0.34, 32, 1, true]} />
          <meshStandardMaterial color="#30402a" metalness={0.42} roughness={0.36} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 0.66, 0]} intensity={24} distance={4} color="#ffca75" />
      </group>
      <group position={[1.05, 1.02, -0.22]}>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.25, 24, 16]} />
          <meshStandardMaterial color="#a47a43" metalness={0.58} roughness={0.38} />
        </mesh>
        <mesh position={[0, 0.25, 0]} scale={[1.01, 1.01, 1.01]}>
          <sphereGeometry args={[0.25, 24, 16]} />
          <meshBasicMaterial color="#d6b477" wireframe transparent opacity={0.2} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.13, 0.2, 0.13, 20]} />
          <meshStandardMaterial color="#77502b" metalness={0.62} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function LibraryWorld({ stories, onSelect, disabled }: Props) {
  const [carriedId, setCarriedId] = useState<string | null>(null);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [droppedBook, setDroppedBook] = useState<{ id: string; position: [number, number, number] } | null>(null);
  const perRow = 36;
  const rows = Math.max(1, Math.ceil(stories.length / perRow));
  const shelfY = useMemo(() => Array.from({ length: Math.min(rows, 3) }, (_, i) => 0.25 + i * 1.1), [rows]);

  return (
    <>
      <color attach="background" args={["#130c08"]} />
      <fog attach="fog" args={["#130c08", 12, 24]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#f1d9b5", "#1b1009", 0.68]} />
      <directionalLight position={[-4, 7, 3]} intensity={1.15} castShadow
        shadow-mapSize-width={768} shadow-mapSize-height={768}
        shadow-camera-near={0.1} shadow-camera-far={20}
        shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={7} shadow-camera-bottom={-2} shadow-bias={-0.00015} />
      <pointLight position={[-4, 3.2, -3.6]} intensity={72} distance={8} decay={2} color="#e9ad69" />
      <pointLight position={[4, 3.3, -3.7]} intensity={62} distance={8} decay={2} color="#d78e4e" />
      <Room />
      <Desk />
      {shelfY.map((y) => <Shelf key={y} y={y} />)}
      {stories.map((story, index) => {
        const row = Math.floor(index / perRow);
        const column = index % perRow;
        const booksInRow = Math.min(perRow, stories.length - row * perRow);
        const height = 0.72 + (index % 4) * 0.045;
        const y = shelfY[Math.min(row, shelfY.length - 1)] + 0.16 + height / 2;
        const x = (column - (booksInRow - 1) / 2) * 0.32;
        return (
          <StoryBook key={story.id} story={story} index={index}
            position={[x, y, -4.88]}
            carried={carriedId === story.id}
            placed={placedId === story.id}
            droppedPosition={droppedBook?.id === story.id ? droppedBook.position : null} />
        );
      })}
      <FirstPersonMovement />
      <MouseLookControls />
      <LibraryInteractionController
        stories={stories}
        disabled={disabled}
        carriedId={carriedId}
        placedId={placedId}
        onCarry={setCarriedId}
        onPlace={setPlacedId}
        onDrop={setDroppedBook}
        onOpen={onSelect}
        onTargetChange={setTargetId}
      />
    </>
  );
}

export default function ArchivoOcultoLibrary3D({ stories, onSelect, disabled = false }: Props) {
  const [locked, setLocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => { setLocked(document.pointerLockElement !== null); setLockError(null); };
    const failed = () => setLockError("No se pudo activar el control del ratón. Haz clic de nuevo para intentarlo.");
    document.addEventListener("pointerlockchange", sync);
    document.addEventListener("pointerlockerror", failed);
    return () => {
      document.removeEventListener("pointerlockchange", sync);
      document.removeEventListener("pointerlockerror", failed);
    };
  }, []);
  return (
    <div className="archivo-library-world relative h-full min-h-[min(78svh,820px)] w-full overflow-hidden">
      <Canvas
        dpr={[1, 1.15]}
        camera={{ position: [0, 1.68, 4.8], fov: 68 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        shadows
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <LibraryWorld stories={stories} onSelect={onSelect} disabled={disabled} />
      </Canvas>
      {!locked && (
        <button type="button" onClick={() => {
          const canvas = document.querySelector(".archivo-library-world canvas") as HTMLCanvasElement | null;
          if (!canvas || document.pointerLockElement) return;
          try {
            const result = canvas.requestPointerLock();
            if (result && typeof result.catch === "function") {
              void result.catch(() => setLockError("El navegador no permitió capturar el ratón. Haz clic otra vez dentro de la habitación."));
            }
          } catch {
            setLockError("El navegador no permitió capturar el ratón. Haz clic otra vez dentro de la habitación.");
          }
        }} className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 rounded-sm border border-[#d9bd8d]/60 bg-[#170e09]/90 px-6 py-3 text-center text-xs font-semibold tracking-wide text-[#f1dfbd] shadow-2xl backdrop-blur transition hover:border-[#f5d9a5] hover:bg-[#2b190f]">
          HAZ CLIC PARA EMPEZAR
          <span className="mt-1 block text-[10px] font-normal tracking-normal text-[#d7c29d]">WASD · Caminar &nbsp; Ratón · Mirar &nbsp; R · Recoger &nbsp; C · Soltar &nbsp; E · Abrir &nbsp; ESC · Salir</span>
        </button>
      )}
      {lockError && !locked && <div role="status" className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded border border-[#d9bd8d]/40 bg-[#170e09]/95 px-4 py-2 text-center text-xs text-[#f1dfbd]">{lockError}</div>}
      {locked && (
        <div aria-hidden="true" className="archivo-game-crosshair pointer-events-none absolute left-1/2 top-1/2 z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-[#f8e7c4] shadow-[0_0_4px_#000]" />
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff3d9]" />
        </div>
      )}
      <div className="pointer-events-none absolute left-5 top-5 text-[10px] uppercase tracking-[.22em] text-[#d9bd8d]/75">
        BIBLIOTECA · {stories.length} {stories.length === 1 ? "LIBRO" : "LIBROS"}
      </div>
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded border border-[#d9bd8d]/30 bg-[#170e09]/75 px-4 py-2 text-center font-mono text-[10px] tracking-wide text-[#f1dfbd] backdrop-blur">
        R · RECOGER &nbsp; C · MESA / SOLTAR &nbsp; E · ABRIR
      </div>
    </div>
  );
}
