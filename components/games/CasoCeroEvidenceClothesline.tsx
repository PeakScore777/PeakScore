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
        roughness={0.82}
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
    canvas.height = 300;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.shadowColor = "rgba(0,0,0,0.78)";
    context.shadowBlur = 22;
    context.fillStyle = "rgba(0,0,0,0.7)";
    context.beginPath();
    context.roundRect(34, 28, 188, 244, 5);
    context.fill();

    const nextTexture = new THREE.CanvasTexture(canvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    setTexture(nextTexture);
    return () => nextTexture.dispose();
  }, []);

  if (!texture) return null;
  return (
    <mesh position={[0.045, -0.055, -0.061]} renderOrder={-1}>
      <planeGeometry args={[1.76, 2.02]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        opacity={0.84}
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
    const main = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((phase) =>
      makeBraidedStrand(start, end, sag, phase),
    );
    // Finer twisted fibers catch narrow highlights along the coarse jute strands.
    const fibers: THREE.TubeGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      fibers.push(makeBraidedStrand(start, end, sag, (i * Math.PI) / 3 + 0.28));
    }
    return [...main, ...fibers];
  }, [left, right, sag]);

  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={index < 3
              ? ["#806043", "#b18a5d", "#593a27"][index]
              : ["#c19a6c", "#593d28", "#9a754f"][index % 3]}
            roughness={0.93}
          />
        </mesh>
      ))}
    </group>
  );
}

function WoodenPin({ position }: { position: [number, number, number] }) {
  const [woodTexture, setWoodTexture] = useState<THREE.CanvasTexture | null>(null);
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
      const radius = 0.004 + 0.025 * t;
      coil.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0.012 + Math.sin(angle) * radius,
        0.082 + t * 0.003,
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
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#a77b4d";
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 260; i++) {
      const y = (i * 37) % 256;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(70, y - 3 + (i % 5), 170, y + 2, 256, y - 1);
      context.strokeStyle = i % 4 === 0
        ? "rgba(61,37,19,0.28)"
        : "rgba(239,194,130,0.17)";
      context.lineWidth = i % 6 === 0 ? 1.8 : 0.7;
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    setWoodTexture(texture);

    return () => {
      texture.dispose();
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
            map={woodTexture ?? undefined}
            roughness={0.78}
            metalness={0}
          />
        </mesh>
      ))}

      {springGeometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} castShadow>
          <meshStandardMaterial
            color={index === 0 ? "#c6c4bf" : "#a8a7a2"}
            metalness={0.94}
            roughness={0.24}
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
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#d7e2e5", "#24180f", 1.15]} />
      <directionalLight position={[-3.5, 5, 5]} intensity={2.2} castShadow />
      <pointLight position={[3, 1, 3]} intensity={22} color="#e4b87d" />
      <pointLight position={[-3, 0, 2]} intensity={8} color="#8cbac4" />

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
