"use client";

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type EvidenceToolId = "magnifier" | "camera" | "tweezers" | "sample" | "microscope";

const EVIDENCE_TOOLS: { id: EvidenceToolId; label: string }[] = [
  { id: "magnifier", label: "Lupa forense" },
  { id: "camera", label: "Cámara de evidencias" },
  { id: "tweezers", label: "Pinzas de precisión" },
  { id: "sample", label: "Frascos de muestras" },
  { id: "microscope", label: "Microscopio" },
];

function ToolIllustration({ tool, className = "h-16 w-16" }: { tool: EvidenceToolId; className?: string }) {
  if (tool === "magnifier") return (
    <span className={`block overflow-visible ${className}`} aria-hidden="true">
      <Canvas
        orthographic
        frameloop="demand"
        camera={{ position: [0, 0, 5], left: -1.125, right: 1.125, top: 1.125, bottom: -1.125, near: 0.1, far: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
        style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[2.5, 3.5, 5]} intensity={2.2} />
        <directionalLight position={[-3, 1, 2]} intensity={0.8} />
        <Suspense fallback={null}>
          <MagnifierCursorModel />
        </Suspense>
      </Canvas>
    </span>
  );
  if (tool === "camera") return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="cam-body" x1="20" y1="24" x2="76" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#515b60"/><stop offset=".44" stopColor="#20272a"/><stop offset=".78" stopColor="#0c1012"/><stop offset="1" stopColor="#687276"/>
        </linearGradient>
        <radialGradient id="cam-lens"><stop stopColor="#b8e4e9"/><stop offset=".26" stopColor="#456c79"/><stop offset=".62" stopColor="#14242d"/><stop offset="1" stopColor="#080d11"/></radialGradient>
      </defs>
      <ellipse cx="48" cy="77" rx="30" ry="6" fill="#152025" opacity=".13"/>
      <path d="M24 31h12l5-7h18l5 7h9a6 6 0 0 1 6 6v29a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V37a6 6 0 0 1 6-6Z" fill="url(#cam-body)" stroke="#101619" strokeWidth="2"/>
      <path d="M24 33h12l5-7h18l5 7" stroke="#d1d6d2" strokeWidth="2" opacity=".8"/>
      <circle cx="49" cy="49" r="17" fill="#080c0f" stroke="#b9c3c2" strokeWidth="3"/>
      <circle cx="49" cy="49" r="12.5" fill="url(#cam-lens)" stroke="#56646a" strokeWidth="2"/>
      <circle cx="45" cy="44" r="3" fill="#e3fbff" opacity=".8"/>
      <rect x="60" y="37" width="7" height="4" rx="1.5" fill="#e2c88d"/>
    </svg>
  );
  if (tool === "tweezers") return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <defs><linearGradient id="tweezer-steel" x1="22" y1="10" x2="69" y2="84" gradientUnits="userSpaceOnUse"><stop stopColor="#f7faf6"/><stop offset=".22" stopColor="#8f9a9d"/><stop offset=".43" stopColor="#e0e5e1"/><stop offset=".68" stopColor="#535e63"/><stop offset=".86" stopColor="#cbd1cf"/><stop offset="1" stopColor="#657277"/></linearGradient></defs>
      <ellipse cx="47" cy="77" rx="21" ry="6" fill="#152025" opacity=".12"/>
      <path d="M27 13c1 15 12 28 18 40 6 12 9 22 12 28" stroke="#252d30" strokeWidth="11" strokeLinecap="round"/>
      <path d="M27 13c1 15 12 28 18 40 6 12 9 22 12 28" stroke="url(#tweezer-steel)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M68 13c-1 15-12 28-18 40-6 12-9 22-12 28" stroke="#252d30" strokeWidth="11" strokeLinecap="round"/>
      <path d="M68 13c-1 15-12 28-18 40-6 12-9 22-12 28" stroke="url(#tweezer-steel)" strokeWidth="7" strokeLinecap="round"/>
      <path d="M27 13 25 7M68 13l2-6" stroke="#f7f9f5" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
  if (tool === "sample") return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <defs><linearGradient id="vial-glass" x1="18" y1="12" x2="60" y2="82" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity=".95"/><stop offset=".48" stopColor="#b9dadd" stopOpacity=".35"/><stop offset=".82" stopColor="#72a8b5" stopOpacity=".6"/><stop offset="1" stopColor="#edf6f4" stopOpacity=".9"/></linearGradient></defs>
      <ellipse cx="47" cy="80" rx="27" ry="5" fill="#152025" opacity=".12"/>
      <g transform="translate(14 9) rotate(-7 21 39)"><rect x="12" y="7" width="18" height="8" rx="2" fill="#777f80" stroke="#4c5557"/><path d="M14 15v8l-4 7v34a7 7 0 0 0 7 7h6a7 7 0 0 0 7-7V30l-4-7v-8" fill="url(#vial-glass)" stroke="#74898d" strokeWidth="1.6"/><path d="M12 49h16v15a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z" fill="#78b7c2" opacity=".65"/><path d="M17 25v39" stroke="white" strokeWidth="1.8" opacity=".85"/></g>
      <g transform="translate(51 20) rotate(8 12 28)"><rect x="3" y="0" width="18" height="8" rx="2" fill="#e4e1d7" stroke="#9aa3a0"/><path d="M5 8v8l-3 6v36a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6V22l-3-6V8" fill="url(#vial-glass)" stroke="#71868a" strokeWidth="1.5"/><path d="M3 39h14v19a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Z" fill="#e3c88f" opacity=".72"/><path d="M8 22v36" stroke="white" strokeWidth="1.7" opacity=".85"/></g>
    </svg>
  );
  return (
    <svg viewBox="0 0 96 96" className={className} fill="none" aria-hidden="true">
      <defs><linearGradient id="micro-metal" x1="23" y1="12" x2="69" y2="74" gradientUnits="userSpaceOnUse"><stop stopColor="#f7f8f3"/><stop offset=".28" stopColor="#8e999b"/><stop offset=".56" stopColor="#3c474b"/><stop offset=".81" stopColor="#d4dbd7"/><stop offset="1" stopColor="#657175"/></linearGradient></defs>
      <ellipse cx="49" cy="80" rx="27" ry="5" fill="#152025" opacity=".12"/>
      <path d="M32 15h20v8H32z" fill="#333d41"/>
      <path d="M35 20c-1 11 3 20 12 25l-6 8c-14-8-19-20-18-33" fill="url(#micro-metal)" stroke="#313a3e" strokeWidth="2"/>
      <path d="M49 40c11 5 15 14 11 25l-10 2c2-9-1-14-8-17Z" fill="#252e32" stroke="#8b9698" strokeWidth="2"/>
      <path d="M43 52 34 65H58" stroke="#899699" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 73h48" stroke="#333d41" strokeWidth="8" strokeLinecap="round"/>
      <path d="M27 73h42" stroke="#a8b0ae" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="51" cy="42" r="5" fill="#d5d9d2" stroke="#344045" strokeWidth="2"/>
      <rect x="47" y="22" width="13" height="8" rx="2" transform="rotate(30 47 22)" fill="#1d2528" stroke="#7d888a"/>
    </svg>
  );
}

/**
 * Real Poly Haven magnifier (CC0), loaded through the same-origin API route.
 * The upright asset's lens is above the handle's center of mass, so the model
 * is shifted to keep its lens aligned with the pointer while the handle trails
 * diagonally down-right. Keep the zoomed image in a separate layer underneath
 * the translucent glass for a genuinely usable magnifier.
 */
function MagnifierCursorModel() {
  const gltf = useLoader(GLTFLoader, "/api/caso-cero-magnifier-model");
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.updateMatrixWorld(true);

    const bounds = new THREE.Box3().setFromObject(scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const longestSide = Math.max(size.x, size.y, size.z, 0.001);
    const scale = 2.15 / longestSide;
    const angle = Math.PI / 4;
    const zAxis = new THREE.Vector3(0, 0, 1);

    scene.scale.setScalar(scale);
    scene.rotation.set(0, 0, angle);

    // The source preview places the circular lens at roughly the upper quarter
    // of the complete upright silhouette. Move that lens center to (0, 0).
    const lensOffset = new THREE.Vector3(0, size.y * 0.24, 0)
      .multiplyScalar(scale)
      .applyAxisAngle(zAxis, angle);
    const scaledCenter = center
      .clone()
      .multiplyScalar(scale)
      .applyAxisAngle(zAxis, angle);
    scene.position.copy(scaledCenter.negate().sub(lensOffset));

    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;

      const tuneMaterial = (material: THREE.Material) => {
        const cloned = material.clone();
        const materialName = `${cloned.name} ${node.name}`.toLowerCase();
        if (
          /(glass|lens|lense|magnifying)/.test(materialName) &&
          cloned instanceof THREE.MeshStandardMaterial
        ) {
          // Preserve the model's physical reflections but let the live zoom
          // crop show through the optical glass.
          cloned.transparent = true;
          cloned.opacity = Math.min(cloned.opacity, 0.3);
          cloned.depthWrite = false;
          cloned.roughness = 0.12;
          cloned.needsUpdate = true;
        }
        return cloned;
      };

      node.material = Array.isArray(node.material)
        ? node.material.map(tuneMaterial)
        : tuneMaterial(node.material);
    });

    return scene;
  }, [gltf.scene]);

  return <primitive object={model} dispose={null} />;
}

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
  const [maps, setMaps] = useState<PbrTextureSet | null>(null);
  const onExternalMapsLoaded = useCallback((nextMaps: PbrTextureSet) => {
    setMaps(nextMaps);
  }, []);

  useEffect(() => {
    setMaps(getPbrTextureSet("jute"));
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
  const [woodMaps, setWoodMaps] = useState<PbrTextureSet | null>(null);
  const jaws = useMemo(
    () => [createWoodHalf(-1), createWoodHalf(1)],
    [],
  );

  useEffect(() => {
    setWoodMaps(getPbrTextureSet("wood"));
    return () => jaws.forEach((geometry) => geometry.dispose());
  }, [jaws]);

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
  const texture = useLoader(RGBELoader, "/api/caso-cero-hdri");

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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const active = activeEvidence === null ? null : CASE_EVIDENCE[activeEvidence];

  const handlePhotoClick = useCallback((index: number) => {
    if (magnifierActive) return;
    setActiveEvidence(index);
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
          <p className="mt-2 text-[11px] leading-5 text-[#cad3d4] sm:text-xs">{active.competence}</p>
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
            className="caso-cero-tools-panel pointer-events-auto mr-2 w-[min(246px,calc(100vw_-_52px))] rounded-[4px] border border-[#d7d7d0] bg-[#f5f5f0] p-3 shadow-[-9px_12px_28px_rgba(0,0,0,.28)]"
          >
            <div className="grid grid-cols-3 gap-2">
              {EVIDENCE_TOOLS.map((item) => (
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
                  className={[
                    "group grid aspect-square place-items-center rounded-[3px] border bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,.07)] transition",
                    activeTool === item.id
                      ? "border-[#757b7d] ring-1 ring-[#757b7d]/20"
                      : "border-[#e0e0d9] hover:border-[#a4a9a7] hover:bg-[#fdfdf9]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#343a3d]",
                  ].join(" ")}
                >
                  <ToolIllustration tool={item.id} className="h-full w-full max-h-[62px] max-w-[62px] transition-transform duration-150 group-hover:scale-[1.04]" />
                </button>
              ))}
            </div>
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
          <div className="absolute -left-[135px] -top-[135px] h-[270px] w-[270px]">
            {/* The selected magnification (3.15×) is unchanged; the physical GLB lens sits above this live crop. */}
            <div
              className="absolute left-1/2 top-1/2 z-0 h-[138px] w-[138px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border border-[#b9c9ce]/80"
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
            <Canvas
              orthographic
              frameloop="demand"
              camera={{ position: [0, 0, 5], left: -1.125, right: 1.125, top: 1.125, bottom: -1.125, near: 0.1, far: 50 }}
              gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
              onCreated={({ gl }) => {
                gl.setClearColor("#000000", 0);
                gl.outputColorSpace = THREE.SRGBColorSpace;
                gl.toneMapping = THREE.ACESFilmicToneMapping;
                gl.toneMappingExposure = 1.05;
              }}
              style={{ position: "absolute", inset: 0, zIndex: 2, display: "block", width: "100%", height: "100%", pointerEvents: "none" }}
            >
              <ambientLight intensity={1.65} />
              <directionalLight position={[2.5, 3.5, 5]} intensity={2.25} />
              <directionalLight position={[-3, 1, 2]} intensity={0.85} />
              <Suspense fallback={null}>
                <MagnifierCursorModel />
              </Suspense>
            </Canvas>
          </div>
        </div>
      )}
{`
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
