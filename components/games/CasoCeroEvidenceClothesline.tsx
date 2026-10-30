"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ErrorInfo, type ReactNode } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type EvidenceToolId = "magnifier" | "camera" | "tweezers" | "sample" | "microscope";

const EVIDENCE_TOOLS: { id: EvidenceToolId; label: string }[] = [
  { id: "magnifier", label: "Lupa forense" },
  { id: "camera", label: "Cámara de evidencias" },
  { id: "tweezers", label: "Pinzas de precisión" },
  { id: "sample", label: "Frascos de muestras" },
  { id: "microscope", label: "Microscopio" },
];

function ThreeDimensionalTool({ tool }: { tool: Exclude<EvidenceToolId, "magnifier"> }) {
  if (tool === "camera") {
    return (
      <group rotation={[0.2, -0.24, -0.12]}>
        <mesh position={[0, -0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 0.72, 0.42]} />
          <meshPhysicalMaterial color="#252c2e" metalness={0.72} roughness={0.28} clearcoat={0.7} />
        </mesh>
        <mesh position={[-0.16, 0.38, -0.01]} castShadow>
          <boxGeometry args={[0.42, 0.12, 0.34]} />
          <meshStandardMaterial color="#3d4647" metalness={0.68} roughness={0.31} />
        </mesh>
        <mesh position={[0.03, 0.02, 0.235]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.29, 0.31, 0.15, 40]} />
          <meshPhysicalMaterial color="#9ea7a5" metalness={0.91} roughness={0.2} />
        </mesh>
        <mesh position={[0.03, 0.02, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.235, 0.235, 0.12, 40]} />
          <meshPhysicalMaterial color="#16262d" metalness={0.55} roughness={0.14} clearcoat={1} />
        </mesh>
        <mesh position={[0.03, 0.02, 0.405]}>
          <circleGeometry args={[0.17, 40]} />
          <meshPhysicalMaterial color="#53889a" metalness={0.34} roughness={0.13} clearcoat={1} />
        </mesh>
        <mesh position={[-0.25, 0.12, 0.414]}>
          <circleGeometry args={[0.045, 24]} />
          <meshBasicMaterial color="#f3fbf8" />
        </mesh>
        <mesh position={[0.42, 0.2, 0.02]}>
          <boxGeometry args={[0.13, 0.06, 0.12]} />
          <meshStandardMaterial color="#c9a469" metalness={0.74} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (tool === "tweezers") {
    return (
      <group rotation={[0.12, -0.28, -0.18]}>
        <mesh position={[-0.14, 0.02, 0]} rotation={[0, 0, -0.105]} castShadow>
          <cylinderGeometry args={[0.018, 0.075, 1.48, 14]} />
          <meshPhysicalMaterial color="#b8c1c0" metalness={0.94} roughness={0.2} clearcoat={0.7} />
        </mesh>
        <mesh position={[0.14, 0.02, 0]} rotation={[0, 0, 0.105]} castShadow>
          <cylinderGeometry args={[0.018, 0.075, 1.48, 14]} />
          <meshPhysicalMaterial color="#7f8a8d" metalness={0.96} roughness={0.22} clearcoat={0.7} />
        </mesh>
        <mesh position={[0, -0.55, 0]}>
          <sphereGeometry args={[0.075, 18, 14]} />
          <meshStandardMaterial color="#d8dfdc" metalness={0.96} roughness={0.2} />
        </mesh>
        <mesh position={[-0.15, 0.46, 0]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshStandardMaterial color="#f3f5ef" metalness={0.9} roughness={0.18} />
        </mesh>
        <mesh position={[0.15, 0.46, 0]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshStandardMaterial color="#f3f5ef" metalness={0.9} roughness={0.18} />
        </mesh>
      </group>
    );
  }

  if (tool === "sample") {
    const tubes = [
      { x: -0.34, liquid: "#548f91", cap: "#7b8583" },
      { x: 0, liquid: "#a88b59", cap: "#c9c6b8" },
      { x: 0.34, liquid: "#7a9b83", cap: "#8e9893" },
    ];
    return (
      <group rotation={[0.08, -0.2, 0.08]}>
        {tubes.map((tube) => (
          <group key={tube.x} position={[tube.x, 0, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.125, 0.12, 0.93, 28, 1, true]} />
              <meshPhysicalMaterial color="#c4e1e4" metalness={0.05} roughness={0.13} transmission={0.55} transparent opacity={0.42} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.24, 0]}>
              <cylinderGeometry args={[0.094, 0.094, 0.39, 24]} />
              <meshPhysicalMaterial color={tube.liquid} metalness={0.08} roughness={0.18} transparent opacity={0.8} />
            </mesh>
            <mesh position={[0, 0.49, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.14, 0.13, 24]} />
              <meshStandardMaterial color={tube.cap} metalness={0.48} roughness={0.32} />
            </mesh>
            <mesh position={[-0.052, 0.01, 0.11]}>
              <boxGeometry args={[0.016, 0.48, 0.012]} />
              <meshBasicMaterial color="#f5ffff" transparent opacity={0.68} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  return (
    <group rotation={[0.1, -0.23, -0.18]}>
      <mesh position={[0.04, -0.49, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.14, 0.48]} />
        <meshPhysicalMaterial color="#30383a" metalness={0.82} roughness={0.27} clearcoat={0.6} />
      </mesh>
      <mesh position={[0.16, -0.09, -0.02]} rotation={[0, 0, -0.09]} castShadow>
        <cylinderGeometry args={[0.064, 0.085, 0.7, 20]} />
        <meshStandardMaterial color="#8c9695" metalness={0.88} roughness={0.25} />
      </mesh>
      <mesh position={[-0.1, 0.23, 0]} rotation={[0, 0, -0.48]} castShadow>
        <cylinderGeometry args={[0.075, 0.095, 0.72, 20]} />
        <meshPhysicalMaterial color="#465054" metalness={0.84} roughness={0.27} clearcoat={0.55} />
      </mesh>
      <mesh position={[-0.36, 0.48, 0.02]} rotation={[0, 0, -0.48]} castShadow>
        <cylinderGeometry args={[0.105, 0.12, 0.25, 20]} />
        <meshStandardMaterial color="#a4acab" metalness={0.92} roughness={0.22} />
      </mesh>
      <mesh position={[0.23, -0.23, 0.09]} castShadow>
        <boxGeometry args={[0.58, 0.08, 0.35]} />
        <meshStandardMaterial color="#b3b9b3" metalness={0.77} roughness={0.28} />
      </mesh>
      <mesh position={[0.29, -0.06, 0.11]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.045, 0.065, 0.23, 18]} />
        <meshPhysicalMaterial color="#6c7a7c" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0.32, -0.4, 0.04]} castShadow>
        <sphereGeometry args={[0.095, 18, 14]} />
        <meshStandardMaterial color="#c5a66e" metalness={0.88} roughness={0.24} />
      </mesh>
    </group>
  );
}

function ToolIllustration({ tool, className = "h-16 w-16" }: { tool: EvidenceToolId; className?: string }) {
  if (tool === "magnifier") return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mag-metal" x1="18" y1="16" x2="59" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f9faf7"/><stop offset=".22" stopColor="#9ca8ab"/><stop offset=".48" stopColor="#313a3e"/><stop offset=".72" stopColor="#e1e4e0"/><stop offset="1" stopColor="#626d72"/>
        </linearGradient>
        <radialGradient id="mag-glass" cx=".25" cy=".2" r=".9">
          <stop stopColor="#f5ffff" stopOpacity=".95"/><stop offset=".42" stopColor="#a5ccd5" stopOpacity=".48"/><stop offset="1" stopColor="#3f6471" stopOpacity=".78"/>
        </radialGradient>
        <linearGradient id="mag-handle" x1="54" y1="55" x2="78" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8d999b"/><stop offset=".22" stopColor="#20272b"/><stop offset=".58" stopColor="#101518"/><stop offset=".82" stopColor="#7e8a8e"/><stop offset="1" stopColor="#283034"/>
        </linearGradient>
      </defs>
      <ellipse cx="53" cy="79" rx="28" ry="6" fill="#152025" opacity=".13"/>
      <path d="M53 55 78 82" stroke="#111619" strokeWidth="14" strokeLinecap="round"/>
      <path d="M53 55 78 82" stroke="url(#mag-handle)" strokeWidth="10" strokeLinecap="round"/>
      <path d="M51 53 60 62" stroke="#394348" strokeWidth="13" strokeLinecap="round"/>
      <path d="M51 53 60 62" stroke="url(#mag-metal)" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="36" cy="35" r="25" fill="#151b1e"/>
      <circle cx="36" cy="35" r="23" fill="url(#mag-metal)"/>
      <circle cx="36" cy="35" r="18.5" fill="#e2e9e6"/>
      <circle cx="36" cy="35" r="16.5" fill="url(#mag-glass)" stroke="#f8ffff" strokeOpacity=".8"/>
      <path d="M24 23c5-6 12-7 18-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity=".9"/>
      <path d="M25 45c6 6 14 7 21 2" stroke="#e7fbff" strokeWidth="1.8" strokeLinecap="round" opacity=".55"/>
    </svg>
  );
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.5], left: -1.12, right: 1.12, top: 1.12, bottom: -1.12, near: 0.1, far: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <ambientLight intensity={1.45} />
        <hemisphereLight args={["#f5fbff", "#34352d", 0.9]} />
        <directionalLight position={[2.8, 3.5, 5]} intensity={2.1} />
        <directionalLight position={[-3, -1, 2]} intensity={0.8} />
        <Suspense fallback={null}>
          <ThreeDimensionalTool tool={tool} />
        </Suspense>
      </Canvas>
    </div>
  );
}

type ToolActionFeedback = {
  tool: Exclude<EvidenceToolId, "magnifier">;
  evidenceIndex: number;
  message: string;
};

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
  color: THREE.Texture;
  normal: THREE.Texture;
  roughness: THREE.Texture;
};

type PhotoPointerDetails = { clientX: number; clientY: number; u: number; v: number };
type MagnifierTarget = { src: string; u: number; v: number; imageWidth: number; imageHeight: number };

const MAGNIFIER_ZOOM = 3.15;
const MAGNIFIER_INNER_DIAMETER = 138;

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
  const [colorContext, normalContext, roughnessContext] = canvases.map((canvas) =>
    canvas.getContext("2d", { willReadFrequently: true }),
  );
  if (!colorContext || !normalContext || !roughnessContext) {
    throw new Error("Could not build Caso Cero PBR texture maps");
  }

  const colorImage = colorContext.createImageData(size, size);
  const normalImage = normalContext.createImageData(size, size);
  const roughImage = roughnessContext.createImageData(size, size);
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
      let r = kind === "paper" ? 228 : kind === "jute" ? 145 : 205;
      let g = kind === "paper" ? 218 : kind === "jute" ? 103 : 164;
      let b = kind === "paper" ? 200 : kind === "jute" ? 66 : 105;
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

  colorContext.putImageData(colorImage, 0, 0);
  normalContext.putImageData(normalImage, 0, 0);
  roughnessContext.putImageData(roughImage, 0, 0);

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
  // Long, almost straight wooden jaw with softened ends.
  // The two jaws are stacked front-to-back, as in the reference photo,
  // rather than separated widely across the visible face.
  const xShift = side * 0.0025;
  const points: [number, number][] = [
    [-0.025, -0.348],
    [-0.028, -0.332],
    [-0.024, -0.295],
    [-0.025, -0.075],
    [-0.027, 0.245],
    [-0.022, 0.276],
    [0.020, 0.283],
    [0.027, 0.264],
    [0.025, -0.075],
    [0.024, -0.295],
    [0.028, -0.332],
    [0.025, -0.348],
  ].map(([x, y]) => [x + xShift, y]);

  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.0035,
    bevelSize: 0.003,
    bevelSegments: 3,
    curveSegments: 8,
  });
}

function PhotoTexture({
  src,
  photoIndex,
  scale,
  onPhotoClick,
  onPhotoPointerMove,
  onPhotoPointerOut,
}: {
  src: string;
  photoIndex: number;
  scale: number;
  onPhotoClick: () => void;
  onPhotoPointerMove: (index: number, src: string, scale: number, point: PhotoPointerDetails) => void;
  onPhotoPointerOut: () => void;
}) {
  const loadedTexture = useLoader(THREE.TextureLoader, src);
  const texture = useMemo(() => {
    const clone = loadedTexture.clone();
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.anisotropy = 8;
    clone.needsUpdate = true;
    return clone;
  }, [loadedTexture]);
  const paperMaps = useMemo(() => getPbrTextureSet("paper"), []);
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

  useEffect(() => () => {
    texture.dispose();
    geometry.dispose();
  }, [texture, geometry]);

  return (
    <mesh
      geometry={geometry}
      position={[0, 0.025, 0.006]}
      onClick={(event) => {
        event.stopPropagation();
        onPhotoClick();
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        onPhotoPointerMove(photoIndex, src, scale, {
          clientX: event.clientX,
          clientY: event.clientY,
          u: event.uv?.x ?? 0.5,
          v: event.uv?.y ?? 0.5,
        });
      }}
      onPointerOut={() => onPhotoPointerOut()}
    >
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
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 320;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createRadialGradient(128, 160, 24, 128, 160, 145);
    gradient.addColorStop(0, "rgba(0,0,0,0.60)");
    gradient.addColorStop(0.55, "rgba(0,0,0,0.32)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    return nextTexture;
  }, []);
  useEffect(() => () => texture?.dispose(), [texture]);

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

function catenaryDrop(t: number, sag: number) {
  // A catenary has a flatter tangent at each wall tie than a sine wave.
  const curve = 2.6;
  const edge = Math.cosh(curve / 2);
  return sag * (edge - Math.cosh((t - 0.5) * curve)) / (edge - 1);
}

function ropeYAt(t: number, anchorY: number, sag: number) {
  return anchorY - catenaryDrop(THREE.MathUtils.clamp(t, 0, 1), sag);
}

function ropeTangentAngle(t: number, ropeX: number, anchorY: number, sag: number) {
  const step = 0.001;
  const leftT = Math.max(0, t - step);
  const rightT = Math.min(1, t + step);
  const dy = ropeYAt(rightT, anchorY, sag) - ropeYAt(leftT, anchorY, sag);
  const dx = (rightT - leftT) * ropeX * 2;
  return Math.atan2(dy, Math.max(dx, 0.0001));
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
    center.y -= catenaryDrop(t, sag);

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
  anchorY,
  sag,
}: {
  left: number;
  right: number;
  anchorY: number;
  sag: number;
}) {
  const [externalMaps, setExternalMaps] = useState<PbrTextureSet | null>(null);
  const fallbackMaps = useMemo(() => getPbrTextureSet("jute"), []);
  const maps = externalMaps ?? fallbackMaps;
  const onExternalMapsLoaded = useCallback((nextMaps: PbrTextureSet) => {
    setExternalMaps(nextMaps);
  }, []);

  const geometries = useMemo(() => {
    const start = new THREE.Vector3(left, anchorY, 0);
    const end = new THREE.Vector3(right, anchorY, 0);
    const mainStrands = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((phase) =>
      makeBraidedStrand(start, end, sag, phase),
    );
    const fineStrands = Array.from({ length: 6 }, (_, index) =>
      makeBraidedStrand(start, end, sag, (index * Math.PI) / 3 + 0.28),
    );
    return [...mainStrands, ...fineStrands];
  }, [left, right, anchorY, sag]);

  useEffect(
    () => () => geometries.forEach((geometry) => geometry.dispose()),
    [geometries],
  );

  return (
    <group>
      <PbrTextureBoundary>
        <Suspense fallback={null}>
          <ExternalRopeTextureMaps onLoaded={onExternalMapsLoaded} />
        </Suspense>
      </PbrTextureBoundary>
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

function WoodenPin({
  position,
  ropeAngle,
}: {
  position: [number, number, number];
  ropeAngle: number;
}) {
  const woodMaps = useMemo(() => getPbrTextureSet("wood"), []);
  const jaws = useMemo(
    () => [createWoodHalf(-1), createWoodHalf(1)],
    [],
  );

  useEffect(() => () => jaws.forEach((geometry) => geometry.dispose()), [jaws]);

  return (
    <group
      position={position}
      // Counter-rotate against the photograph so the peg remains nearly vertical
      // even where the rope's tangent slopes down toward its wall anchors.
      rotation={[0, 0, -ropeAngle * 0.68]}
    >
      {jaws.map((geometry, index) => (
        <mesh
          key={index}
          geometry={geometry}
          // Rear jaw is behind the rope; front jaw is in front of the paper.
          // Slightly offset in X so the two pieces remain readable from the camera.
          position={[index === 0 ? -0.004 : 0.004, 0, index === 0 ? -0.071 : 0.03]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={index === 0 ? "#c4a16b" : "#eed29b"}
            map={woodMaps?.color}
            normalMap={woodMaps?.normal}
            normalScale={new THREE.Vector2(0.12, 0.26)}
            roughnessMap={woodMaps?.roughness}
            roughness={0.91}
            metalness={0}
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
  ropeAngle,
  scale,
  onSelect,
  onPhotoClick,
  onPhotoPointerMove,
  onPhotoPointerOut,
}: {
  photo: EvidencePhoto;
  index: number;
  position: [number, number, number];
  ropeAngle: number;
  scale: number;
  onSelect: (index: number) => void;
  onPhotoClick: (index: number) => void;
  onPhotoPointerMove: (index: number, src: string, scale: number, point: PhotoPointerDetails) => void;
  onPhotoPointerOut: () => void;
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

  const rotationZ = [-0.035, 0.015, -0.025][index] + ropeAngle * 0.68;
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
      {/* All paper geometry is offset below the attachment pivot at the rope. */}
      <group position={[0, -1.195, 0]}>
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
          <PhotoTexture
            src={photo.src}
            photoIndex={index}
            scale={scale}
            onPhotoClick={() => onPhotoClick(index)}
            onPhotoPointerMove={onPhotoPointerMove}
            onPhotoPointerOut={onPhotoPointerOut}
          />
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

      </group>

      {/* The peg's upper jaw sits directly at the rope; the print hangs below it. */}
      <WoodenPin position={[0, 0, 0]} ropeAngle={ropeAngle} />
    </group>
  );
}

function CameraFraming({ mobile }: { mobile: boolean }) {
  const { camera, size, invalidate } = useThree();

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
    invalidate();
  }, [camera, size.width, size.height, mobile, invalidate]);

  return null;
}

type EnvironmentBoundaryProps = { children: ReactNode };

class EnvironmentBoundary extends Component<EnvironmentBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Caso Cero: HDRI real no disponible; se conserva la iluminación de respaldo.", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
class PbrTextureBoundary extends Component<EnvironmentBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn("Caso Cero: textura fotográfica de cuerda no disponible; se conserva el material de respaldo.", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ExternalRopeTextureMaps({ onLoaded }: { onLoaded: (maps: PbrTextureSet) => void }) {
  const loaded = useLoader(THREE.TextureLoader, [
    "/api/caso-cero-pbr/rope-color",
    "/api/caso-cero-pbr/rope-normal",
    "/api/caso-cero-pbr/rope-roughness",
  ]) as THREE.Texture[];
  const [color, normal, roughness] = loaded;

  useEffect(() => {
    if (!color || !normal || !roughness) return;

    color.colorSpace = THREE.SRGBColorSpace;
    normal.colorSpace = THREE.NoColorSpace;
    roughness.colorSpace = THREE.NoColorSpace;

    for (const texture of [color, normal, roughness]) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 9);
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }

    onLoaded({ color, normal, roughness });
  }, [color, normal, roughness, onLoaded]);

  return null;
}


function PhotographicRoomEnvironment() {
  const { scene, invalidate } = useThree();
  const texture = useLoader(HDRLoader, "/api/caso-cero-hdri");

  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.LinearSRGBColorSpace;
    texture.needsUpdate = true;

    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environment = texture;
    scene.environmentIntensity = 0.56;
    invalidate();

    return () => {
      if (scene.environment === texture) scene.environment = previousEnvironment;
      scene.environmentIntensity = previousIntensity;
      invalidate();
    };
  }, [scene, texture, invalidate]);

  return null;
}

function RoomReflectionEnvironment() {
  const { scene, invalidate } = useThree();

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
    const previousIntensity = scene.environmentIntensity;
    scene.environment = environment;
    scene.environmentIntensity = 0.72;
    invalidate();

    return () => {
      if (scene.environment === environment) scene.environment = previousEnvironment;
      scene.environmentIntensity = previousIntensity;
      environment.dispose();
      invalidate();
    };
  }, [scene, invalidate]);

  return null;
}

function WallEyelet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.045, -0.018]} castShadow>
        <cylinderGeometry args={[0.022, 0.025, 0.018, 16]} />
        <meshPhysicalMaterial color="#5b4a36" metalness={0.72} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.028]} castShadow receiveShadow>
        <torusGeometry args={[0.048, 0.009, 10, 28]} />
        <meshPhysicalMaterial
          color="#86765e"
          metalness={0.9}
          roughness={0.26}
          clearcoat={0.24}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.045, 0.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.005, 12]} />
        <meshStandardMaterial color="#332a21" metalness={0.75} roughness={0.4} />
      </mesh>
    </group>
  );
}

function EvidenceScene({
  mobile,
  onSelect,
  onPhotoClick,
  onPhotoPointerMove,
  onPhotoPointerOut,
}: {
  mobile: boolean;
  onSelect: (index: number) => void;
  onPhotoClick: (index: number) => void;
  onPhotoPointerMove: (index: number, src: string, scale: number, point: PhotoPointerDetails) => void;
  onPhotoPointerOut: () => void;
}) {
  const { size } = useThree();
  const cardScale = mobile ? 0.84 : 1;
  const visibleHeight = mobile ? 2.7 : 2.75;
  const halfWorldWidth = (size.width / Math.max(size.height, 1)) * visibleHeight / 2;
  const outerX = mobile ? 1.32 : halfWorldWidth * 0.68;
  // Tie each end almost against the two marked side-wall points.
  const ropeX = Math.max(1.72, halfWorldWidth - (mobile ? 0.08 : 0.045));
  const anchorY = 1.43;
  const sag = mobile ? 0.27 : 0.34;
  const cardXs = [-outerX, 0, outerX];
  const hangingCards = cardXs.map((x, index) => {
    const t = THREE.MathUtils.clamp((x + ropeX) / (2 * ropeX), 0, 1);
    const ropeY = ropeYAt(t, anchorY, sag);
    return {
      index,
      position: [x, ropeY, index === 1 ? -0.025 : 0.035] as [number, number, number],
      ropeAngle: ropeTangentAngle(t, ropeX, anchorY, sag),
    };
  });

  return (
    <>
      <RoomReflectionEnvironment />
      <EnvironmentBoundary>
        <Suspense fallback={null}>
          <PhotographicRoomEnvironment />
        </Suspense>
      </EnvironmentBoundary>
      <ambientLight intensity={0.82} />
      <hemisphereLight args={["#d7e2e5", "#24180f", 1.15]} />
      <directionalLight position={[-3.5, 5, 5]} intensity={2.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-bias={-0.00015} />
      <pointLight position={[3, 1, 3]} intensity={15} distance={8} decay={2} color="#e4b87d" />
      <pointLight position={[-3, 0, 2]} intensity={6} distance={7} decay={2} color="#8cbac4" />

      <BraidedRope
        left={-ropeX}
        right={ropeX}
        anchorY={anchorY}
        sag={sag}
      />

      <WallEyelet position={[-ropeX, anchorY, 0.015]} />
      <WallEyelet position={[ropeX, anchorY, 0.015]} />

      {hangingCards.map(({ index, position, ropeAngle }) => (
        <EvidenceCard
          key={CASE_EVIDENCE[index].title}
          photo={CASE_EVIDENCE[index]}
          index={index}
          position={position}
          ropeAngle={ropeAngle}
          scale={cardScale}
          onSelect={onSelect}
          onPhotoClick={onPhotoClick}
          onPhotoPointerMove={onPhotoPointerMove}
          onPhotoPointerOut={onPhotoPointerOut}
        />
      ))}
    </>
  );
}

export default function CasoCeroEvidenceClothesline() {
  const [activeEvidence, setActiveEvidence] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<EvidenceToolId | null>(null);
  const [magnifierActive, setMagnifierActive] = useState(false);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  const [magnifierTarget, setMagnifierTarget] = useState<MagnifierTarget | null>(null);
  const [toolAction, setToolAction] = useState<ToolActionFeedback | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const active = activeEvidence === null ? null : CASE_EVIDENCE[activeEvidence];

  const handlePhotoClick = useCallback((index: number) => {
    if (magnifierActive) return;
    setActiveEvidence(index);

    if (activeTool && activeTool !== "magnifier") {
      const title = CASE_EVIDENCE[index].title.replace(/^\\d+ · /, "");
      const messages: Record<Exclude<EvidenceToolId, "magnifier">, string> = {
        camera: `Registro fotográfico guardado: ${title}. Usa las demás pistas para contrastar lo observado.`,
        tweezers: `Evidencia aislada: ${title}. Esta pista queda marcada para compararla con las muestras.`,
        sample: `Registro de muestreo creado para ${title}. Comprueba ubicación y procedimiento antes de concluir.`,
        microscope: `Inspección ampliada abierta: revisa los detalles de ${title} sin confundir observación con causa demostrada.`,
      };
      setToolAction({ tool: activeTool, evidenceIndex: index, message: messages[activeTool] });
    }

    if (activeTool) {
      setActiveTool(null);
      setMagnifierActive(false);
      setToolsOpen(true);
    }
  }, [activeTool, magnifierActive]);

  const handlePhotoPointerMove = useCallback((
    _index: number,
    src: string,
    imageScale: number,
    point: PhotoPointerDetails,
  ) => {
    if (!magnifierActive) return;
    const rootRect = rootRef.current?.getBoundingClientRect();
    const frameRect = canvasFrameRef.current?.getBoundingClientRect();
    if (!rootRect || !frameRect) return;

    const visibleHeight = mobile ? 2.7 : 2.75;
    const pixelsPerWorldUnit = frameRect.height / visibleHeight;
    setPointerPosition({ x: point.clientX - rootRect.left, y: point.clientY - rootRect.top });
    setMagnifierTarget({
      src,
      u: THREE.MathUtils.clamp(point.u, 0, 1),
      v: THREE.MathUtils.clamp(point.v, 0, 1),
      imageWidth: 1.32 * imageScale * pixelsPerWorldUnit,
      imageHeight: 1.35 * imageScale * pixelsPerWorldUnit,
    });
  }, [magnifierActive, mobile]);

  const handlePhotoPointerOut = useCallback(() => setMagnifierTarget(null), []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!activeTool) {
      setMagnifierTarget(null);
      setPointerPosition(null);
      rootRef.current?.closest(".caso-cero-cinematic")?.classList.remove("caso-cero-loupe-active", "caso-cero-tool-active");
      return;
    }

    const sceneRoot = rootRef.current?.closest(".caso-cero-cinematic");
    const movePointer = (event: PointerEvent) => {
      const root = rootRef.current;
      const rect = root?.getBoundingClientRect();
      if (!root || !rect) return;

      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      sceneRoot?.classList.toggle("caso-cero-loupe-active", inside && magnifierActive);
      sceneRoot?.classList.toggle("caso-cero-tool-active", inside && activeTool !== null);
      if (!inside) {
        setPointerPosition(null);
        setMagnifierTarget(null);
        return;
      }
      setPointerPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveTool(null);
        setMagnifierActive(false);
        setToolsOpen(true);
      }
    };
    window.addEventListener("pointermove", movePointer, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", movePointer);
      window.removeEventListener("keydown", handleKeyDown);
      sceneRoot?.classList.remove("caso-cero-loupe-active", "caso-cero-tool-active");
    };
  }, [activeTool, magnifierActive]);

  return (
    <div
      ref={rootRef}
      className="caso-cero-evidence-clothesline pointer-events-none absolute inset-0 z-20"
      aria-label="Fotografías de evidencia de Caso Cero"
    >
      <div
        ref={canvasFrameRef}
        className="pointer-events-auto absolute left-1/2 top-[1%] h-[210px] w-screen -translate-x-1/2 sm:h-[405px] lg:h-[530px]"
      >
        <Canvas
          orthographic
          frameloop="demand"
          shadows
          dpr={[1, 1.1]}
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
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <CameraFraming mobile={mobile} />
          <EvidenceScene
            mobile={mobile}
            onSelect={setActiveEvidence}
            onPhotoClick={handlePhotoClick}
            onPhotoPointerMove={handlePhotoPointerMove}
            onPhotoPointerOut={handlePhotoPointerOut}
          />
        </Canvas>
      </div>

      {active && (
        <aside
          role="dialog"
          aria-modal="false"
          aria-labelledby="caso-cero-evidence-title"
          className="pointer-events-auto absolute left-1/2 top-[58%] z-30 w-[min(360px,92vw)] -translate-x-1/2 border border-[#9c7949]/70 bg-[#061016]/95 p-3 text-[#eee3ce] shadow-[0_14px_38px_rgba(0,0,0,.65)] backdrop-blur-md sm:top-[58%] sm:p-4"
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
          {toolAction?.evidenceIndex === activeEvidence && toolAction.tool === "microscope" && (
            <div
              role="img"
              aria-label={`Detalle ampliado de ${active.title}`}
              className="mt-3 h-28 overflow-hidden border border-[#8f7c5c] bg-[#111a19]"
              style={{
                backgroundImage: `linear-gradient(180deg,rgba(4,10,12,.02),rgba(4,10,12,.18)),url("${active.src}")`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "190%",
              }}
            />
          )}
          <p className="mt-2 text-[11px] leading-5 text-[#cad3d4] sm:text-xs">{active.competence}</p>
          {toolAction?.evidenceIndex === activeEvidence && (
            <p role="status" className="mt-2 border border-[#718b78] bg-[#1a3329] px-2.5 py-2 text-[10px] leading-4 text-[#d8ebd8]">
              {toolAction.message}
            </p>
          )}
          <p className="mt-2 border-t border-[#5a4932]/70 pt-2 text-[9px] leading-4 text-[#d9b878]">
            Observa la pista y contrástala con las demás antes de formular una conclusión.
          </p>
        </aside>
      )}

      <div className="pointer-events-none absolute right-0 top-1/2 z-[110] flex -translate-y-1/2 items-stretch">
        {toolsOpen && (
          <aside
            id="caso-cero-tools-drawer"
            aria-label="Herramientas de investigación"
            className="caso-cero-tools-panel pointer-events-auto mr-2 w-[min(292px,calc(100vw_-_52px))] rounded-[7px] border border-[#ad8b55] bg-[#e4d8bd] p-3 shadow-[-12px_14px_34px_rgba(0,0,0,.42)]"
          >
            <div className="mb-3 flex items-center gap-2 border border-[#3f504a] bg-[#14211f] px-2.5 py-2.5 text-[#f0e4c9] shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-[#b99a63] bg-[#263b34] text-sm text-[#e8c98e]">✦</div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[.2em]">Estación de campo</p>
                <p className="mt-0.5 text-[8px] tracking-[.11em] text-[#b8c8bd]">KIT DE INVESTIGACIÓN · 05 EQUIPOS</p>
              </div>
              <span className="rounded-sm border border-[#66756b] px-1.5 py-1 text-[8px] font-black text-[#d9c08f]">3D</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {EVIDENCE_TOOLS.map((item) => {
                const selected = activeTool === item.id;
                const shortLabel = item.id === "magnifier"
                  ? "Lupa"
                  : item.id === "camera"
                    ? "Cámara"
                    : item.id === "tweezers"
                      ? "Pinzas"
                      : item.id === "sample"
                        ? "Muestras"
                        : "Microscopio";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveEvidence(null);
                      setMagnifierTarget(null);
                      setPointerPosition(null);
                      setActiveTool(item.id);
                      setMagnifierActive(item.id === "magnifier");
                      setToolsOpen(false);
                    }}
                    aria-label={item.label}
                    aria-pressed={selected}
                    className={[
                      "group relative grid min-h-[91px] min-w-0 grid-rows-[1fr_auto] place-items-center overflow-hidden rounded-[4px] border p-1.5 text-center transition duration-150",
                      selected
                        ? "border-[#d8b36e] bg-[#1b2d29] text-[#f2dfb9] shadow-[inset_0_0_0_1px_rgba(216,179,110,.28),0_3px_5px_rgba(0,0,0,.18)]"
                        : "border-[#c2b28f] bg-gradient-to-b from-[#fcf8ed] to-[#ddd0b5] text-[#26312c] shadow-[0_2px_2px_rgba(63,48,28,.14)] hover:-translate-y-0.5 hover:border-[#9a7543] hover:from-white hover:to-[#e9dcc1]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#343a3d]",
                    ].join(" ")}
                  >
                    <span className={[
                      "absolute right-1 top-1 rounded-[2px] px-1 py-0.5 text-[6px] font-black uppercase tracking-[.1em]",
                      selected ? "bg-[#c39a57] text-[#18201c]" : "bg-[#e4dbc6] text-[#67604f]",
                    ].join(" ")}>{selected ? "En uso" : item.id === "magnifier" ? "Zoom" : "3D"}</span>
                    <div className="mt-2 flex h-[52px] w-full items-center justify-center">
                      <ToolIllustration
                        tool={item.id}
                        className="h-full w-full max-h-[54px] max-w-[58px] transition-transform duration-150 group-hover:scale-[1.05]"
                      />
                    </div>
                    <span className="mt-1 w-full truncate text-[9px] font-black leading-tight sm:text-[10px]">{shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border border-[#bbaa84] bg-[#f6efdf] px-2.5 py-2 text-[#33403a]">
              <p className="text-[8px] font-black uppercase tracking-[.17em] text-[#89663a]">Cómo usar el equipo</p>
              <p className="mt-1 text-[9px] leading-4">
                {!activeTool
                  ? "Selecciona una herramienta y toca una fotografía del tendedero."
                  : activeTool === "magnifier"
                    ? "Desliza la lupa sobre una foto para examinar sus detalles con el aumento seleccionado."
                    : activeTool === "camera"
                      ? "Toca una foto para registrar esa evidencia."
                      : activeTool === "tweezers"
                        ? "Toca una foto para marcar la pista que vas a aislar y comparar."
                        : activeTool === "sample"
                          ? "Toca una pista para registrar su muestra y revisar el método de recolección."
                          : "Toca una foto para inspeccionarla con detalle y abrir su ficha."
                }
              </p>
            </div>

            {toolAction && (
              <div role="status" className="mt-2 border border-[#718b78] bg-[#e5eddc] px-2.5 py-2 text-[#1d3a2a]">
                <p className="text-[8px] font-black uppercase tracking-[.16em]">Última acción · {EVIDENCE_TOOLS.find((item) => item.id === toolAction.tool)?.label}</p>
                <p className="mt-1 text-[9px] leading-4">{toolAction.message}</p>
              </div>
            )}
          </aside>
        )}

        <button
          type="button"
          onClick={() => {
            if (!toolsOpen && activeTool) {
              setActiveTool(null);
              setMagnifierActive(false);
            }
            setToolsOpen((open) => !open);
          }}
          aria-label={toolsOpen ? "Cerrar herramientas" : "Abrir herramientas"}
          aria-expanded={toolsOpen}
          aria-controls="caso-cero-tools-drawer"
          className="pointer-events-auto grid h-[62px] w-8 place-items-center rounded-l-[3px] border border-r-0 border-[#dadad4] bg-[#f7f7f2] text-[#171a1c] shadow-[-5px_5px_15px_rgba(0,0,0,.2)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#42494c]"
        >
          {toolsOpen ? <ChevronRight className="h-5 w-5" strokeWidth={2.5} /> : <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />}
        </button>
      </div>

            {activeTool && activeTool !== "magnifier" && pointerPosition && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[100] h-[62px] w-[62px]"
          style={{ left: pointerPosition.x - 31, top: pointerPosition.y - 31 }}
        >
          <ToolIllustration tool={activeTool} className="h-full w-full drop-shadow-[0_4px_4px_rgba(0,0,0,.48)]" />
        </div>
      )}

      {magnifierActive && pointerPosition && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[100] h-0 w-0"
          style={{ left: pointerPosition.x, top: pointerPosition.y }}
        >
          {/* The handle, metal rim and zoom crop share this exact pointer origin. */}
          <div
            className="absolute left-[34px] top-[43px] z-0 h-[25px] w-[148px] origin-[12px_12px] rotate-[43deg] rounded-[6px] border border-[#111619] shadow-[2px_5px_8px_rgba(0,0,0,.72)]"
            style={{ background: "linear-gradient(180deg,#e1e4df 0%,#858d8f 10%,#2e3539 26%,#111518 55%,#333a3e 78%,#b5babb 96%,#454c50 100%)" }}
          />
          <div
            className="absolute left-[34px] top-[43px] z-[1] h-[29px] w-[32px] origin-[12px_14px] rotate-[43deg] rounded-[5px] border border-[#20272a]"
            style={{ background: "linear-gradient(135deg,#f3f1e8,#7b8588 28%,#242a2d 58%,#c3c9c6 84%,#565e61)" }}
          />
          <div
            className="absolute -left-[77px] -top-[77px] z-[2] h-[154px] w-[154px] rounded-full border-[5px] border-[#171d20] shadow-[0_4px_12px_rgba(0,0,0,.6),inset_0_1px_2px_rgba(255,255,255,.75)]"
            style={{ background: "linear-gradient(135deg,#e2e5df 0%,#737d81 14%,#22282c 35%,#151a1d 58%,#c2c9c9 82%,#4d5559 100%)" }}
          />
          <div
            className="absolute -left-[69px] -top-[69px] z-[3] h-[138px] w-[138px] overflow-hidden rounded-full border border-[#c5d1d4]/80"
            style={{
              background: "rgba(184,214,225,.18)",
              boxShadow: "inset 0 1px 8px rgba(255,255,255,.23), inset 0 -2px 8px rgba(2,12,19,.20)",
            }}
          >
            {magnifierTarget && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("${magnifierTarget.src}")`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: `${magnifierTarget.imageWidth * MAGNIFIER_ZOOM}px ${magnifierTarget.imageHeight * MAGNIFIER_ZOOM}px`,
                  backgroundPosition: `${MAGNIFIER_INNER_DIAMETER / 2 - magnifierTarget.u * magnifierTarget.imageWidth * MAGNIFIER_ZOOM}px ${MAGNIFIER_INNER_DIAMETER / 2 - (1 - magnifierTarget.v) * magnifierTarget.imageHeight * MAGNIFIER_ZOOM}px`,
                  filter: "contrast(1.04) saturate(1.06)",
                }}
              />
            )}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(ellipse at 24% 15%,rgba(255,255,255,.54),transparent 22%),radial-gradient(ellipse at 73% 82%,rgba(132,184,199,.18),transparent 38%),linear-gradient(132deg,rgba(239,251,255,.08),transparent 44%,rgba(3,14,22,.13))",
                boxShadow: "inset 0 1px 8px rgba(255,255,255,.24),inset 0 -3px 8px rgba(4,12,18,.18)",
              }}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes caso-cero-tools-board-in {
          from { opacity: 0; transform: translate3d(10px, 0, 0) scale(.985); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        .caso-cero-tools-panel { animation: caso-cero-tools-board-in 160ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .caso-cero-tools-panel { animation: none; }
        }
        .caso-cero-cinematic.caso-cero-loupe-active,
        .caso-cero-cinematic.caso-cero-loupe-active *,
        .caso-cero-cinematic.caso-cero-tool-active,
        .caso-cero-cinematic.caso-cero-tool-active * {
          cursor: none !important;
        }
      `}</style>
    </div>
  );
}
