"use client";

import { Component, Suspense, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { X } from "lucide-react";

type EvidencePhoto = {
  src: string;
  alt: string;
  title: string;
  description: string;
  tag: string;
  competence: string;
};

const CASE_EVIDENCE: EvidencePhoto[] = [
  {
    src: "/api/caso-cero-evidence-image/river",
    alt: "Corriente de un río durante una tormenta, con agua golpeando las rocas",
    title: "01 · EL RÍO",
    description: "Punto de muestreo",
    tag: "OBSERVACIÓN",
    competence: "Interpretar una situación y distinguir observaciones de conclusiones.",
  },
  {
    src: "/api/caso-cero-evidence-image/samples",
    alt: "Técnico de campo recolectando una muestra de agua para análisis",
    title: "02 · MUESTRAS",
    description: "Trabajo de campo",
    tag: "INDAGACIÓN",
    competence: "Comprobar si las muestras se obtuvieron bajo condiciones comparables.",
  },
  {
    src: "/api/caso-cero-evidence-image/laboratory",
    alt: "Material de laboratorio para analizar una muestra líquida",
    title: "03 · LABORATORIO",
    description: "Análisis de datos",
    tag: "EVIDENCIA",
    competence: "Relacionar mediciones y unidades para decidir qué conclusión respaldan los datos.",
  },
];

type ImageBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ImageBoundaryState = {
  failed: boolean;
};

/**
 * TextureLoader errors must not bubble out of the whole WebGL canvas.
 * Keep the physical print visible as a dark fallback if a remote image is unavailable.
 */
class EvidenceImageBoundary extends Component<ImageBoundaryProps, ImageBoundaryState> {
  state: ImageBoundaryState = { failed: false };

  static getDerivedStateFromError(): ImageBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn("Caso Cero: no se pudo cargar una fotografía de evidencia.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}


type PbrTextureSet = {
  color: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
};

const pbrCache = new Map<"wood" | "jute" | "paper", PbrTextureSet>();

/** Shared browser-generated microtexture maps; no external texture requests. */
function getPbrTextureSet(kind: "wood" | "jute" | "paper"): PbrTextureSet {
  const cached = pbrCache.get(kind);
  if (cached) return cached;

  const size = 512;
  const canvases = [0, 1, 2].map(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    return canvas;
  });
  const contexts = canvases.map((canvas) => canvas.getContext("2d", { willReadFrequently: true }));
  if (!contexts[0] || !contexts[1] || !contexts[2]) {
    throw new Error("Could not build Caso Cero PBR texture maps");
  }

  const colorImage = contexts[0].createImageData(size, size);
  const normalImage = contexts[1].createImageData(size, size);
  const roughImage = contexts[2].createImageData(size, size);
  const heights = new Float32Array(size * size);
  const noiseAt = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + 74.7) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const noise = noiseAt(x, y);
      let height = 0.5;
      let r = kind === "paper" ? 228 : kind === "jute" ? 145 : 158;
      let g = kind === "paper" ? 218 : kind === "jute" ? 103 : 110;
      let b = kind === "paper" ? 200 : kind === "jute" ? 66 : 66;
      if (kind === "wood") {
        const warped = u + Math.sin(v * 17) * 0.012 + Math.sin(v * 57) * 0.002;
        const grain = Math.sin(warped * 660) * 0.46
          + Math.sin(warped * 1730) * 0.20
          + Math.sin(warped * 3250) * 0.08;
        const knotA = Math.exp(-((u - 0.27) ** 2 / 0.0008 + (v - 0.58) ** 2 / 0.006));
        const knotB = Math.exp(-((u - 0.76) ** 2 / 0.0011 + (v - 0.21) ** 2 / 0.004));
        const value = grain + noise * 0.16 - (knotA + knotB) * 0.26;
        height = 0.5 + value * 0.14;
        r += value * 39; g += value * 30; b += value * 20;
      } else if (kind === "jute") {
        const twistA = Math.sin((x + y * 0.68) * 0.29);
        const twistB = Math.sin((x - y * 0.76) * 0.25);
        const crossedFibres = Math.pow(Math.max(0, twistA), 7) * 0.46
          + Math.pow(Math.max(0, twistB), 7) * 0.36;
        const fuzz = Math.sin(x * 1.31 + y * 0.93) * 0.08 + noise * 0.12;
        height = 0.5 + crossedFibres * 0.24 + fuzz * 0.14;
        const value = crossedFibres * 0.45 + fuzz;
        r += value * 54; g += value * 40; b += value * 27;
      } else {
        const grain = noise * 0.45 + Math.sin(x * 2.4 + y * 1.1) * 0.18;
        height = 0.5 + grain * 0.018;
        r += grain * 5; g += grain * 5; b += grain * 4;
      }

      const idx = (y * size + x) * 4;
      heights[y * size + x] = height;
      colorImage.data[idx] = THREE.MathUtils.clamp(r, 0, 255);
      colorImage.data[idx + 1] = THREE.MathUtils.clamp(g, 0, 255);
      colorImage.data[idx + 2] = THREE.MathUtils.clamp(b, 0, 255);
      colorImage.data[idx + 3] = 255;

      const rough = kind === "paper" ? 232 + noise * 7 : kind === "wood" ? 210 + noise * 24 : 218 + noise * 25;
      roughImage.data[idx] = THREE.MathUtils.clamp(rough, 0, 255);
      roughImage.data[idx + 1] = roughImage.data[idx];
      roughImage.data[idx + 2] = roughImage.data[idx];
      roughImage.data[idx + 3] = 255;
    }
  }

  const normalStrength = kind === "wood" ? 2.6 : kind === "jute" ? 5.2 : 0.65;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (heights[y * size + ((x - 1 + size) % size)] - heights[y * size + ((x + 1) % size)]) * normalStrength;
      const dy = (heights[((y - 1 + size) % size) * size + x] - heights[((y + 1) % size) * size + x]) * normalStrength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const idx = (y * size + x) * 4;
      normalImage.data[idx] = (dx / len * 0.5 + 0.5) * 255;
      normalImage.data[idx + 1] = (dy / len * 0.5 + 0.5) * 255;
      normalImage.data[idx + 2] = (1 / len * 0.5 + 0.5) * 255;
      normalImage.data[idx + 3] = 255;
    }
  }

  contexts[0].putImageData(colorImage, 0, 0);
  contexts[1].putImageData(normalImage, 0, 0);
  contexts[2].putImageData(roughImage, 0, 0);

  const color = new THREE.CanvasTexture(canvases[0]);
  const normal = new THREE.CanvasTexture(canvases[1]);
  const roughness = new THREE.CanvasTexture(canvases[2]);
  color.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [color, normal, roughness]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }
  if (kind === "jute") {
    for (const texture of [color, normal, roughness]) texture.repeat.set(2, 9);
  } else if (kind === "wood") {
    for (const texture of [color, normal, roughness]) texture.repeat.set(1.2, 1.7);
  }

  const result = { color, normal, roughness };
  pbrCache.set(kind, result);
  return result;
}


function roundedRectangle(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const right = width / 2;
  const bottom = -height / 2;
  const top = height / 2;

  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.absarc(right - radius, bottom + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(right, top - radius);
  shape.absarc(right - radius, top - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(left + radius, top);
  shape.absarc(left + radius, top - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(left, bottom + radius);
  shape.absarc(left + radius, bottom + radius, radius, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function createWoodHalf(side: -1 | 1) {
  const shape = new THREE.Shape();
  const points: [number, number][] = side < 0
    ? [
        [-0.057, -0.205], [-0.014, -0.205], [-0.019, -0.12],
        [-0.011, -0.035], [-0.025, 0.075], [-0.012, 0.18],
        [-0.039, 0.202], [-0.053, 0.105], [-0.041, 0.02],
        [-0.052, -0.075],
      ]
    : [
        [0.014, -0.205], [0.057, -0.205], [0.052, -0.075],
        [0.041, 0.02], [0.053, 0.105], [0.039, 0.202],
        [0.012, 0.18], [0.025, 0.075], [0.011, -0.035],
        [0.019, -0.12],
      ];

  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 3,
    curveSegments: 8,
  });
}

function tubeFromPoints(points: THREE.Vector3[], radius: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 36, radius, 8, false);
}

function PhotoTexture({ src }: { src: string }) {
  const texture = useLoader(THREE.TextureLoader, src);
  const [paperMaps, setPaperMaps] = useState<PbrTextureSet | null>(null);
  useEffect(() => setPaperMaps(getPbrTextureSet("paper")), []);
  const geometry = useMemo(() => {
    const mesh = new THREE.PlaneGeometry(1.32, 1.35, 20, 20);
    const positions = mesh.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) / 0.66;
      const y = positions.getY(i) / 0.675;
      const edge = Math.max(Math.abs(x), Math.abs(y));
      // A slight paper bow catches highlights instead of looking like a flat UI card.
      positions.setZ(i, 0.018 * Math.pow(edge, 3.2));
    }
    positions.needsUpdate = true;
    mesh.computeVertexNormals();
    return mesh;
  }, []);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return () => geometry.dispose();
  }, [texture, geometry]);

  return (
    <mesh geometry={geometry} position={[0, 0.025, 0.006]}>
      <meshStandardMaterial
        map={texture}
        normalMap={paperMaps?.normal}
        normalScale={new THREE.Vector2(0.035, 0.035)}
        roughnessMap={paperMaps?.roughness}
        roughness={0.78}
        metalness={0}
        side={THREE.DoubleSide}
        toneMapped
      />
    </mesh>
  );
}

function PhotoDropShadow() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 320;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createRadialGradient(128, 160, 24, 128, 160, 145);
    gradient.addColorStop(0, "rgba(0,0,0,0.60)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.32)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    setTexture(nextTexture);
    return () => nextTexture.dispose();
  }, []);

  if (!texture) return null;
  return (
    <mesh position={[0.065, -0.07, -0.071]} renderOrder={-1}>
      <planeGeometry args={[1.9, 2.13]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        opacity={0.9}
        toneMapped={false}
      />
    </mesh>
  );
}

function makeBraidedStrand(
  start: THREE.Vector3,
  end: THREE.Vector3,
  sag: number,
  phase: number,
) {
  const points: THREE.Vector3[] = [];
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const axis = direction.clone().normalize();
  const reference = new THREE.Vector3(0, 0, 1);
  const normal = new THREE.Vector3().crossVectors(axis, reference).normalize();
  const binormal = new THREE.Vector3().crossVectors(axis, normal).normalize();
  const segments = 180;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = start.clone().lerp(end, t);
    center.y -= Math.sin(Math.PI * t) * sag;

    // Rounded helix with dense ridges; PBR maps supply the fine jute fibres.
    const angle = t * length * 19 + phase;
    center
      .addScaledVector(normal, Math.cos(angle) * 0.021)
      .addScaledVector(binormal, Math.sin(angle) * 0.021);
    points.push(center);
  }

  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    segments,
    0.0125,
    6,
    false,
  );
}

function BraidedRope({
  left,
  right,
  sag,
}: {
  left: number;
  right: number;
  sag: number;
}) {
  const [maps, setMaps] = useState<PbrTextureSet | null>(null);

  useEffect(() => {
    setMaps(getPbrTextureSet("jute"));
  }, []);

  const geometries = useMemo(() => {
    const start = new THREE.Vector3(left, 1.2, 0);
    const end = new THREE.Vector3(right, 1.2, 0);
    const mainStrands = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((phase) =>
      makeBraidedStrand(start, end, sag, phase),
    );
    const fineStrands = Array.from({ length: 6 }, (_, index) =>
      makeBraidedStrand(start, end, sag, (index * Math.PI) / 3 + 0.28),
    );
    return [...mainStrands, ...fineStrands];
  }, [left, right, sag]);

  useEffect(
    () => () => geometries.forEach((geometry) => geometry.dispose()),
    [geometries],
  );

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={index < 3
              ? ["#806043", "#b18a5d", "#593a27"][index]
              : ["#c19a6c", "#593d28", "#9a754f"][index % 3]}
            map={maps?.color}
            normalMap={maps?.normal}
            normalScale={new THREE.Vector2(0.48, 0.7)}
            roughnessMap={maps?.roughness}
            roughness={0.96}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

function WoodenPin({ position }: { position: [number, number, number] }) {
  const [woodMaps, setWoodMaps] = useState<PbrTextureSet | null>(null);
  const halfGeometries = useMemo(
    () => [createWoodHalf(-1), createWoodHalf(1)],
    [],
  );
  const springGeometries = useMemo(() => {
    const coil: THREE.Vector3[] = [];
    const turns = 2.35;
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * Math.PI * 2 * turns;
      coil.push(new THREE.Vector3(
        Math.cos(angle) * 0.025,
        -0.01 + t * 0.045 + Math.sin(angle) * 0.003,
        0.085 + Math.sin(angle) * 0.014,
      ));
    }

    const leftArm = [
      new THREE.Vector3(-0.006, -0.006, 0.084),
      new THREE.Vector3(-0.024, -0.036, 0.088),
      new THREE.Vector3(-0.047, -0.068, 0.083),
      new THREE.Vector3(-0.047, -0.125, 0.075),
    ];
    const rightArm = [
      new THREE.Vector3(0.006, 0.028, 0.084),
      new THREE.Vector3(0.031, 0.056, 0.088),
      new THREE.Vector3(0.047, 0.105, 0.083),
      new THREE.Vector3(0.047, 0.15, 0.075),
    ];

    return [
      tubeFromPoints(coil, 0.0045),
      tubeFromPoints(leftArm, 0.0043),
      tubeFromPoints(rightArm, 0.0043),
    ];
  }, []);

  useEffect(() => {
    setWoodMaps(getPbrTextureSet("wood"));
    return () => {
      halfGeometries.forEach((geometry) => geometry.dispose());
      springGeometries.forEach((geometry) => geometry.dispose());
    };
  }, [halfGeometries, springGeometries]);

  return (
    <group position={position} rotation={[0.015, -0.035, -0.055]}>
      {halfGeometries.map((geometry, index) => (
        <mesh
          key={index}
          geometry={geometry}
          position={[0, 0, index * 0.008]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={index === 0 ? "#b58a58" : "#93683f"}
            map={woodMaps?.color}
            normalMap={woodMaps?.normal}
            normalScale={new THREE.Vector2(0.18, 0.45)}
            roughnessMap={woodMaps?.roughness}
            roughness={0.86}
            metalness={0}
          />
        </mesh>
      ))}

      {springGeometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow>
          <meshPhysicalMaterial
            color={index === 0 ? "#c6c4bf" : "#a8a7a2"}
            metalness={0.96}
            roughness={0.22}
            clearcoat={0.32}
            clearcoatRoughness={0.16}
            envMapIntensity={1.45}
          />
        </mesh>
      ))}
    </group>
  );
}

function EvidenceCard({
  photo,
  index,
  position,
  scale,
  onSelect,
}: {
  photo: EvidencePhoto;
  index: number;
  position: [number, number, number];
  scale: number;
  onSelect: (index: number) => void;
}) {
  const [labelTexture, setLabelTexture] = useState<THREE.CanvasTexture | null>(null);
  const paperGeometry = useMemo(
    () => new THREE.ExtrudeGeometry(roundedRectangle(1.48, 1.76, 0.035), {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.005,
      bevelSegments: 3,
      curveSegments: 8,
    }),
    [],
  );
  useEffect(() => () => paperGeometry.dispose(), [paperGeometry]);

  const rotationZ = [-0.045, 0.025, -0.035][index];
  const rotationY = [-0.11, 0.035, 0.09][index];
  const rotationX = [0.025, -0.035, 0.018][index];

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#433326";
    context.font = "bold 31px Georgia, serif";
    context.textBaseline = "middle";
    context.fillText(photo.title, 8, 33, 495);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    setLabelTexture(texture);
    return () => texture.dispose();
  }, [photo.title]);

  return (
    <group
      position={position}
      scale={scale}
      rotation={[rotationX, rotationY, rotationZ]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
    >
      {/* Soft cast shadow connects the physical print to the laboratory backdrop. */}
      <PhotoDropShadow />

      {/* Bevelled, rounded paper stock with a visible edge under the print. */}
      <mesh geometry={paperGeometry} position={[0, 0, -0.05]} castShadow receiveShadow>
        <meshStandardMaterial color="#d9cfbb" roughness={0.94} />
      </mesh>

      <EvidenceImageBoundary
        key={photo.src}
        fallback={
          <mesh position={[0, 0.025, 0.006]}>
            <planeGeometry args={[1.32, 1.35]} />
            <meshStandardMaterial color="#263137" roughness={1} />
          </mesh>
        }
      >
        <Suspense
          fallback={
            <mesh position={[0, 0.025, 0.006]}>
              <planeGeometry args={[1.32, 1.35]} />
              <meshStandardMaterial color="#263137" roughness={1} />
            </mesh>
          }
        >
          <PhotoTexture src={photo.src} />
        </Suspense>
      </EvidenceImageBoundary>

      <mesh position={[0, -0.755, 0.004]}>
        <planeGeometry args={[1.32, 0.12]} />
        <meshStandardMaterial color="#e8dfcd" roughness={0.96} />
      </mesh>
      {labelTexture && (
        <mesh position={[0, -0.755, 0.01]}>
          <planeGeometry args={[1.32, 0.12]} />
          <meshBasicMaterial map={labelTexture} transparent toneMapped={false} />
        </mesh>
      )}

      {/* The shaped wooden jaws and visible coiled spring grip the top paper edge. */}
      <WoodenPin position={[0, 0.99, 0.085]} />
    </group>
  );
}

function CameraFraming({ mobile }: { mobile: boolean }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;

    // Match the world-space frustum to the actual canvas aspect ratio.
    // The previous fixed [-1, 1] camera clipped the evidence cards on wide screens.
    const visibleHeight = mobile ? 2.7 : 2.75;
    const aspect = size.width / Math.max(size.height, 1);
    const visibleWidth = visibleHeight * aspect;

    camera.left = -visibleWidth / 2;
    camera.right = visibleWidth / 2;
    camera.top = visibleHeight / 2;
    camera.bottom = -visibleHeight / 2;
    camera.position.set(0, 0.12, 10);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, mobile]);

  return null;
}

function RoomReflectionEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    // Generate a local, equirectangular reflection card based on Caso Cero's
    // cool rain-window and warm laboratory lamps; no external HDRI dependency.
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const base = ctx.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0, "#18232c");
    base.addColorStop(0.28, "#0b1117");
    base.addColorStop(0.57, "#12171a");
    base.addColorStop(0.76, "#342216");
    base.addColorStop(1, "#090b0d");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1024, 512);

    // Broad cool window panels and mullions make the metal spring reflect
    // the same dark-blue window shape that sits behind the rope.
    for (const x of [92, 248, 414, 590, 760]) {
      const windowGlow = ctx.createLinearGradient(x, 75, x + 110, 290);
      windowGlow.addColorStop(0, "rgba(177,204,216,0.34)");
      windowGlow.addColorStop(0.45, "rgba(74,107,123,0.18)");
      windowGlow.addColorStop(1, "rgba(8,16,23,0.02)");
      ctx.fillStyle = windowGlow;
      ctx.fillRect(x, 70 + (x % 3) * 12, 110, 220);
      ctx.strokeStyle = "rgba(205,221,226,0.18)";
      ctx.lineWidth = 4;
      ctx.strokeRect(x, 70 + (x % 3) * 12, 110, 220);
    }

    // Long, soft photographic highlights from practical lamps and wet wood.
    const lights = [
      { x: 70, y: 365, r: 68, color: "rgba(255,184,93,0.86)" },
      { x: 850, y: 280, r: 86, color: "rgba(255,157,61,0.78)" },
      { x: 940, y: 350, r: 46, color: "rgba(246,203,126,0.58)" },
    ];
    for (const light of lights) {
      const glow = ctx.createRadialGradient(light.x, light.y, 2, light.x, light.y, light.r);
      glow.addColorStop(0, light.color);
      glow.addColorStop(0.18, light.color.replace(/0\.\d+\)/, "0.24)"));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(light.x - light.r, light.y - light.r, light.r * 2, light.r * 2);
    }

    // Tiny low-contrast horizontal bands suggest workshop shelves without
    // creating noisy false reflections on the small metal coil.
    for (let i = 0; i < 24; i++) {
      const y = 320 + i * 7;
      ctx.fillStyle = i % 3 === 0
        ? "rgba(218,158,91,0.07)"
        : "rgba(171,190,196,0.025)";
      ctx.fillRect(0, y, 1024, 1 + (i % 2));
    }

    const environment = new THREE.CanvasTexture(canvas);
    environment.mapping = THREE.EquirectangularReflectionMapping;
    environment.colorSpace = THREE.SRGBColorSpace;
    environment.needsUpdate = true;

    const previousEnvironment = scene.environment;
    scene.environment = environment;
    scene.environmentIntensity = 0.72;

    return () => {
      if (scene.environment === environment) scene.environment = previousEnvironment;
      environment.dispose();
    };
  }, [scene]);

  return null;
}

function EvidenceScene({
  mobile,
  onSelect,
}: {
  mobile: boolean;
  onSelect: (index: number) => void;
}) {
  const { size } = useThree();
  const cardScale = mobile ? 0.84 : 1;
  const visibleHeight = mobile ? 2.7 : 2.75;
  const halfWorldWidth = (size.width / Math.max(size.height, 1)) * visibleHeight / 2;
  const outerX = mobile ? 1.32 : halfWorldWidth * 0.68;
  const ropeX = mobile ? 2.15 : halfWorldWidth * 0.93;
  const sag = mobile ? 0.23 : 0.31;
  const cardXs = [-outerX, 0, outerX];
  const positions: [number, number, number][] = cardXs.map((x) => {
    const t = THREE.MathUtils.clamp((x + ropeX) / (2 * ropeX), 0, 1);
    const ropeY = 1.2 - Math.sin(Math.PI * t) * sag;
    // The top tip of each peg lands directly on the rope instead of floating below it.
    return [x, ropeY - 1.195, x === 0 ? -0.025 : 0.035] as [number, number, number];
  });

  return (
    <>
      <RoomReflectionEnvironment />
      <ambientLight intensity={0.82} />
      <hemisphereLight args={["#d7e2e5", "#24180f", 1.15]} />
      <directionalLight position={[-3.5, 5, 5]} intensity={2.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.00015} />
      <pointLight position={[3, 1, 3]} intensity={15} distance={8} decay={2} color="#e4b87d" />
      <pointLight position={[-3, 0, 2]} intensity={6} distance={7} decay={2} color="#8cbac4" />

      <BraidedRope
        left={-ropeX}
        right={ropeX}
        sag={sag}
      />

      {positions.map((position, index) => (
        <EvidenceCard
          key={CASE_EVIDENCE[index].title}
          photo={CASE_EVIDENCE[index]}
          index={index}
          position={position}
          scale={cardScale}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function CasoCeroEvidenceClothesline() {
  const [activeEvidence, setActiveEvidence] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const active = activeEvidence === null ? null : CASE_EVIDENCE[activeEvidence];

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div
      className="caso-cero-evidence-clothesline pointer-events-none absolute left-1/2 top-[1%] z-20 h-[210px] w-[98vw] -translate-x-1/2 sm:h-[405px] lg:h-[530px]"
      aria-label="Fotografías de evidencia de Caso Cero"
    >
      <div className="pointer-events-auto h-full w-full">
        <Canvas
          orthographic
          shadows
          dpr={[1, 1.35]}
          camera={{
            position: [0, 0.12, 10],
            left: -4,
            right: 4,
            top: 1.375,
            bottom: -1.375,
            near: 0.1,
            far: 100,
            zoom: 1,
          }}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          onCreated={({ gl }) => {
            gl.setClearColor("#000000", 0);
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.02;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <CameraFraming mobile={mobile} />
          <EvidenceScene mobile={mobile} onSelect={setActiveEvidence} />
        </Canvas>
      </div>

      {active && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="caso-cero-evidence-title"
          className="pointer-events-auto absolute left-1/2 top-[calc(100%-18px)] z-30 w-[min(360px,92vw)] -translate-x-1/2 border border-[#9c7949]/70 bg-[#061016]/95 p-3 text-[#eee3ce] shadow-[0_14px_38px_rgba(0,0,0,.65)] backdrop-blur-md sm:top-[calc(100%-22px)] sm:p-4"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black tracking-[.2em] text-[#a6d2c8]">
                PISTA {String(activeEvidence! + 1).padStart(2, "0")} · {active.tag}
              </p>
              <h2 id="caso-cero-evidence-title" className="mt-1 text-sm font-black sm:text-base">
                {active.title.replace(/^\d+ · /, "")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveEvidence(null)}
              aria-label="Cerrar pista"
              className="grid h-7 w-7 shrink-0 place-items-center border border-[#62513b] text-[#d8c8ad] transition hover:border-[#e4bc76] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#cad3d4] sm:text-xs">{active.competence}</p>
          <p className="mt-2 border-t border-[#5a4932]/70 pt-2 text-[9px] leading-4 text-[#d9b878]">
            Observa la pista y contrástala con las demás antes de formular una conclusión.
          </p>
        </aside>
      )}
    </div>
  );
}
