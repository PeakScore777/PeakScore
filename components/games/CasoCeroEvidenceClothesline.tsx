"use client";

import { Component, Suspense, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Image as DreiImage } from "@react-three/drei";
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
  const segments = 150;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = start.clone().lerp(end, t);
    center.y -= Math.sin(Math.PI * t) * sag;

    // Three helical strands wrap around the main rope axis.
    const angle = t * length * 18 + phase;
    center
      .addScaledVector(normal, Math.cos(angle) * 0.021)
      .addScaledVector(binormal, Math.sin(angle) * 0.021);
    points.push(center);
  }

  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    segments,
    0.0105,
    5,
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
  const geometries = useMemo(() => {
    const start = new THREE.Vector3(left, 1.2, 0);
    const end = new THREE.Vector3(right, 1.2, 0);
    return [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((phase) =>
      makeBraidedStrand(start, end, sag, phase),
    );
  }, [left, right, sag]);

  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={["#806043", "#b18a5d", "#593a27"][index]}
            roughness={0.96}
          />
        </mesh>
      ))}
    </group>
  );
}

function WoodenPin({ position }: { position: [number, number, number] }) {
  const [woodTexture, setWoodTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#a77b4d";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Fine, deterministic wood grain; generated after mount so SSR never touches document.
    for (let i = 0; i < 180; i++) {
      const y = (i * 37) % 256;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(70, y - 3 + (i % 5), 170, y + 2, 256, y - 1);
      context.strokeStyle = i % 4 === 0
        ? "rgba(61,37,19,0.23)"
        : "rgba(239,194,130,0.14)";
      context.lineWidth = i % 6 === 0 ? 1.8 : 0.7;
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    setWoodTexture(texture);

    return () => texture.dispose();
  }, []);

  return (
    <group position={position} rotation={[0, 0, -0.07]}>
      {[-0.022, 0.022].map((z, index) => (
        <mesh key={z} position={[index === 0 ? -0.028 : 0.028, 0, z]} castShadow receiveShadow>
          <boxGeometry args={[0.072, 0.34, 0.038]} />
          <meshStandardMaterial
            color={index === 0 ? "#b28554" : "#8f653e"}
            map={woodTexture ?? undefined}
            roughness={0.87}
          />
        </mesh>
      ))}

      {/* Steel coil and crossbar make the clip read as a physical spring peg. */}
      <mesh position={[0, 0.015, 0.061]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.031, 0.007, 8, 20]} />
        <meshStandardMaterial color="#817e77" metalness={0.86} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.015, 0.061]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.12, 8]} />
        <meshStandardMaterial color="#b3aca0" metalness={0.82} roughness={0.34} />
      </mesh>
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
  const rotationZ = [-0.045, 0.025, -0.035][index];

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
      rotation={[0.012 * (index - 1), 0, rotationZ]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
    >
      {/* Paper print with visible edge thickness, not a flat CSS thumbnail. */}
      <mesh position={[0, 0, -0.035]} castShadow receiveShadow>
        <boxGeometry args={[1.48, 1.76, 0.055]} />
        <meshStandardMaterial color="#e8dfcd" roughness={0.92} />
      </mesh>

      <EvidenceImageBoundary
        key={photo.src}
        fallback={
          <mesh position={[0, 0.025, 0.003]}>
            <planeGeometry args={[1.32, 1.35]} />
            <meshStandardMaterial color="#263137" roughness={1} />
          </mesh>
        }
      >
        <Suspense
          fallback={
            <mesh position={[0, 0.025, 0.003]}>
              <planeGeometry args={[1.32, 1.35]} />
              <meshStandardMaterial color="#263137" roughness={1} />
            </mesh>
          }
        >
          <DreiImage
            url={photo.src}
            position={[0, 0.025, 0.003]}
            scale={[1.32, 1.35]}
            toneMapped={false}
            transparent={false}
          />
        </Suspense>
      </EvidenceImageBoundary>

      <mesh position={[0, -0.755, 0.006]}>
        <planeGeometry args={[1.32, 0.12]} />
        <meshStandardMaterial color="#e8dfcd" roughness={0.96} />
      </mesh>
      {labelTexture && (
        <mesh position={[0, -0.755, 0.012]}>
          <planeGeometry args={[1.32, 0.12]} />
          <meshBasicMaterial map={labelTexture} transparent toneMapped={false} />
        </mesh>
      )}

      {/* Pin overlaps the paper edge and reaches the rope above it. */}
      <mesh position={[0, 0.855, 0.018]} castShadow>
        <boxGeometry args={[0.13, 0.035, 0.022]} />
        <meshStandardMaterial color="#78634b" roughness={1} />
      </mesh>
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

function EvidenceScene({
  mobile,
  onSelect,
}: {
  mobile: boolean;
  onSelect: (index: number) => void;
}) {
  const { size } = useThree();
  const cardScale = mobile ? 0.86 : 1;
  const visibleHeight = mobile ? 2.7 : 2.75;
  const halfWorldWidth = (size.width / Math.max(size.height, 1)) * visibleHeight / 2;
  const outerX = mobile ? 1.35 : halfWorldWidth * 0.68;
  const ropeX = mobile ? 2.15 : halfWorldWidth * 0.93;
  const positions: [number, number, number][] = [
    [-outerX, -0.02, 0],
    [0, -0.02, 0],
    [outerX, -0.02, 0],
  ];

  return (
    <>
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#d7e2e5", "#24180f", 1.15]} />
      <directionalLight position={[-3.5, 5, 5]} intensity={2.2} castShadow />
      <pointLight position={[3, 1, 3]} intensity={22} color="#e4b87d" />
      <pointLight position={[-3, 0, 2]} intensity={8} color="#8cbac4" />

      <BraidedRope
        left={-ropeX}
        right={ropeX}
        sag={mobile ? 0.09 : 0.15}
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
