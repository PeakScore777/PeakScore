"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  PerspectiveCamera,
  RoundedBox,
  Shadow,
} from "@react-three/drei";

/* ============================================================
   PEAKSCORE — PEAKY 3D
   Mascota 3D procedural para el Login

   Estados:
   - idle
   - email
   - password
   - password-visible

   Comportamiento:
   - Sigue el cursor con los ojos
   - Al escribir correo mira hacia abajo
   - Al entrar a contraseña cierra ambos ojos
   - Al mostrar contraseña abre un ojo
   - Flota suavemente
   - Cabeza y cuerpo animados
============================================================ */

export type PeakMascotState =
  | "idle"
  | "email"
  | "password"
  | "password-visible";

export interface PeakMascotProps {
  state?: PeakMascotState;
  className?: string;
}

/* ============================================================
   PALETA
============================================================ */

const COLORS = {
  white: "#F7FAFF",
  whiteWarm: "#EEF4FB",
  feather: "#E7EEF8",

  blue: "#1769FF",
  blueBright: "#3EA0FF",
  blueLight: "#73C4FF",
  blueDark: "#08265F",
  blueDeep: "#041536",

  hoodie: "#071E4D",
  hoodieLight: "#0C2D68",

  cyan: "#18D8FF",
  cyanBright: "#53E9FF",

  orange: "#F5A623",
  orangeDark: "#C96D08",

  black: "#020A18",

  shoeWhite: "#F5F8FC",
  sole: "#BFD2E9",
};

/* ============================================================
   UTILIDADES
============================================================ */

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/* ============================================================
   OJO
============================================================ */

interface EyeProps {
  side: "left" | "right";
  lookX: number;
  lookY: number;
  closed: boolean;
}

function PeakEye({
  side,
  lookX,
  lookY,
  closed,
}: EyeProps) {
  const group = useRef<THREE.Group>(null);
  const pupil = useRef<THREE.Group>(null);
  const eyelid = useRef<THREE.Mesh>(null);

  const x = side === "left" ? -0.29 : 0.29;

  useFrame((_, delta) => {
    if (!group.current || !pupil.current) return;

    const targetX = closed ? 0 : lookX * 0.075;
    const targetY = closed ? -0.045 : lookY * 0.055;

    pupil.current.position.x = THREE.MathUtils.damp(
      pupil.current.position.x,
      targetX,
      8,
      delta
    );

    pupil.current.position.y = THREE.MathUtils.damp(
      pupil.current.position.y,
      targetY,
      8,
      delta
    );

    const targetScaleY = closed ? 0.06 : 1;

    group.current.scale.y = THREE.MathUtils.damp(
      group.current.scale.y,
      targetScaleY,
      12,
      delta
    );

    if (eyelid.current) {
      eyelid.current.position.y = THREE.MathUtils.damp(
        eyelid.current.position.y,
        closed ? 0.02 : 0.15,
        10,
        delta
      );
    }
  });

  return (
    <group
      ref={group}
      position={[x, 0.12, -0.61]}
    >
      {/* OJO EXTERIOR */}

      <mesh scale={[1.08, 1.16, 0.78]}>
        <sphereGeometry args={[0.235, 32, 24]} />

        <meshStandardMaterial
          color={COLORS.white}
          roughness={0.25}
        />
      </mesh>

      {/* BORDE AZUL */}

      <mesh scale={[1.03, 1.11, 0.79]}>
        <torusGeometry
          args={[0.205, 0.022, 12, 40]}
        />

        <meshStandardMaterial
          color={COLORS.blueBright}
          emissive={COLORS.blue}
          emissiveIntensity={0.25}
          roughness={0.22}
          metalness={0.25}
        />
      </mesh>

      {/* IRIS */}

      <group ref={pupil}>
        <mesh position={[0, 0, -0.19]}>
          <sphereGeometry args={[0.115, 28, 20]} />

          <meshStandardMaterial
            color={COLORS.blue}
            emissive={COLORS.blueBright}
            emissiveIntensity={0.45}
            roughness={0.18}
          />
        </mesh>

        {/* PUPILA */}

        <mesh position={[0, 0, -0.285]}>
          <sphereGeometry args={[0.057, 20, 16]} />

          <meshStandardMaterial
            color={COLORS.black}
            roughness={0.1}
          />
        </mesh>

        {/* BRILLO */}

        <mesh
          position={[-0.038, 0.05, -0.335]}
        >
          <sphereGeometry args={[0.028, 16, 12]} />

          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        <mesh
          position={[0.035, -0.025, -0.33]}
        >
          <sphereGeometry args={[0.012, 12, 10]} />

          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* PÁRPADO */}

      <mesh
        ref={eyelid}
        position={[0, 0.15, -0.39]}
        scale={[1.1, 0.65, 0.2]}
      >
        <sphereGeometry args={[0.2, 24, 16]} />

        <meshStandardMaterial
          color={COLORS.white}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   GAFAS
============================================================ */

function PeakGlasses() {
  return (
    <group position={[0, 0.11, -0.68]}>
      {/* LENTE IZQUIERDO */}

      <mesh position={[-0.29, 0, 0]}>
        <torusGeometry
          args={[0.255, 0.035, 12, 48]}
        />

        <meshStandardMaterial
          color={COLORS.blueBright}
          emissive={COLORS.blue}
          emissiveIntensity={0.5}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* LENTE DERECHO */}

      <mesh position={[0.29, 0, 0]}>
        <torusGeometry
          args={[0.255, 0.035, 12, 48]}
        />

        <meshStandardMaterial
          color={COLORS.blueBright}
          emissive={COLORS.blue}
          emissiveIntensity={0.5}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>

      {/* PUENTE */}

      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.17, 0.055, 0.045]} />

        <meshStandardMaterial
          color={COLORS.blue}
          emissive={COLORS.blueBright}
          emissiveIntensity={0.3}
          metalness={0.35}
          roughness={0.2}
        />
      </mesh>

      {/* REFLEJOS */}

      <mesh
        position={[-0.42, 0.1, -0.035]}
        rotation={[0, 0, -0.35]}
      >
        <boxGeometry args={[0.025, 0.11, 0.01]} />

        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh
        position={[0.16, 0.19, -0.035]}
        rotation={[0, 0, -0.35]}
      >
        <boxGeometry args={[0.02, 0.075, 0.01]} />

        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   PICO
============================================================ */

function PeakBeak() {
  return (
    <group
      position={[0, -0.16, -0.71]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <mesh>
        <coneGeometry args={[0.115, 0.24, 4]} />

        <meshStandardMaterial
          color={COLORS.orange}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      <mesh
        position={[0, 0.055, 0.01]}
        scale={[0.65, 0.12, 0.5]}
      >
        <sphereGeometry args={[0.11, 16, 12]} />

        <meshStandardMaterial
          color={COLORS.orangeDark}
          roughness={0.45}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   CEJAS
============================================================ */

function PeakBrows() {
  return (
    <group position={[0, 0.37, -0.63]}>
      <mesh
        position={[-0.28, 0, 0]}
        rotation={[0, 0, -0.2]}
        scale={[1.2, 0.22, 0.18]}
      >
        <sphereGeometry args={[0.17, 20, 12]} />

        <meshStandardMaterial
          color={COLORS.blueDark}
          roughness={0.3}
        />
      </mesh>

      <mesh
        position={[0.28, 0, 0]}
        rotation={[0, 0, 0.2]}
        scale={[1.2, 0.22, 0.18]}
      >
        <sphereGeometry args={[0.17, 20, 12]} />

        <meshStandardMaterial
          color={COLORS.blueDark}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   PELO — MECHONES
============================================================ */

function PeakHair() {
  const locks = [
    {
      position: [-0.34, 0.47, -0.22] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, -0.55] as [
        number,
        number,
        number
      ],
      scale: [0.75, 1.3, 0.7] as [
        number,
        number,
        number
      ],
      color: COLORS.white,
    },

    {
      position: [-0.18, 0.59, -0.16] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, -0.25] as [
        number,
        number,
        number
      ],
      scale: [0.72, 1.5, 0.7] as [
        number,
        number,
        number
      ],
      color: COLORS.white,
    },

    {
      position: [0, 0.67, -0.14] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, 0] as [
        number,
        number,
        number
      ],
      scale: [0.72, 1.65, 0.72] as [
        number,
        number,
        number
      ],
      color: COLORS.blue,
    },

    {
      position: [0.18, 0.59, -0.16] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, 0.25] as [
        number,
        number,
        number
      ],
      scale: [0.72, 1.48, 0.7] as [
        number,
        number,
        number
      ],
      color: COLORS.white,
    },

    {
      position: [0.34, 0.48, -0.22] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, 0.55] as [
        number,
        number,
        number
      ],
      scale: [0.75, 1.3, 0.7] as [
        number,
        number,
        number
      ],
      color: COLORS.white,
    },

    {
      position: [-0.04, 0.84, -0.08] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, -0.12] as [
        number,
        number,
        number
      ],
      scale: [0.48, 1.35, 0.55] as [
        number,
        number,
        number
      ],
      color: COLORS.blue,
    },

    {
      position: [0.13, 0.83, -0.08] as [
        number,
        number,
        number
      ],
      rotation: [0, 0, 0.12] as [
        number,
        number,
        number
      ],
      scale: [0.48, 1.3, 0.55] as [
        number,
        number,
        number
      ],
      color: COLORS.white,
    },
  ];

  return (
    <group>
      {locks.map((lock, index) => (
        <mesh
          key={index}
          position={lock.position}
          rotation={lock.rotation}
          scale={lock.scale}
        >
          <sphereGeometry args={[0.22, 24, 18]} />

          <meshStandardMaterial
            color={lock.color}
            roughness={0.42}
          />
        </mesh>
      ))}

      {/* LÍNEAS AZULES DEL PELO */}

      <mesh
        position={[-0.03, 0.78, -0.29]}
        rotation={[0, 0, -0.05]}
        scale={[0.16, 0.7, 0.18]}
      >
        <sphereGeometry args={[0.2, 20, 16]} />

        <meshStandardMaterial
          color={COLORS.blueBright}
          roughness={0.3}
        />
      </mesh>

      <mesh
        position={[0.11, 0.68, -0.31]}
        rotation={[0, 0, 0.16]}
        scale={[0.13, 0.55, 0.16]}
      >
        <sphereGeometry args={[0.2, 20, 16]} />

        <meshStandardMaterial
          color={COLORS.blue}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   CABEZA
============================================================ */

function PeakHead({
  lookX,
  lookY,
  eyesClosed,
}: {
  lookX: number;
  lookY: number;
  eyesClosed: boolean;
}) {
  return (
    <group position={[0, 1.68, 0]}>
      {/* CABEZA */}

      <mesh scale={[1, 1.04, 0.94]}>
        <sphereGeometry args={[0.66, 40, 32]} />

        <meshStandardMaterial
          color={COLORS.white}
          roughness={0.5}
        />
      </mesh>

      {/* PLUMAS LATERALES */}

      <mesh
        position={[-0.57, -0.03, 0]}
        rotation={[0, 0, -0.15]}
        scale={[0.32, 0.8, 0.5]}
      >
        <sphereGeometry args={[0.3, 24, 18]} />

        <meshStandardMaterial
          color={COLORS.feather}
          roughness={0.5}
        />
      </mesh>

      <mesh
        position={[0.57, -0.03, 0]}
        rotation={[0, 0, 0.15]}
        scale={[0.32, 0.8, 0.5]}
      >
        <sphereGeometry args={[0.3, 24, 18]} />

        <meshStandardMaterial
          color={COLORS.feather}
          roughness={0.5}
        />
      </mesh>

      <PeakHair />

      <PeakEye
        side="left"
        lookX={lookX}
        lookY={lookY}
        closed={eyesClosed}
      />

      <PeakEye
        side="right"
        lookX={lookX}
        lookY={lookY}
        closed={eyesClosed}
      />

      <PeakBrows />

      <PeakGlasses />

      <PeakBeak />

      {/* AUDÍFONOS */}

      <group>
        <mesh position={[-0.67, 0.01, 0]}>
          <sphereGeometry args={[0.18, 24, 20]} />

          <meshStandardMaterial
            color={COLORS.blueDark}
            roughness={0.28}
            metalness={0.35}
          />
        </mesh>

        <mesh position={[0.67, 0.01, 0]}>
          <sphereGeometry args={[0.18, 24, 20]} />

          <meshStandardMaterial
            color={COLORS.blueDark}
            roughness={0.28}
            metalness={0.35}
          />
        </mesh>

        {/* AROS */}

        <mesh
          position={[-0.67, 0.01, -0.01]}
          scale={[0.78, 1.15, 0.38]}
        >
          <torusGeometry
            args={[0.18, 0.025, 10, 32]}
          />

          <meshStandardMaterial
            color={COLORS.blueBright}
            emissive={COLORS.blue}
            emissiveIntensity={0.45}
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>

        <mesh
          position={[0.67, 0.01, -0.01]}
          scale={[0.78, 1.15, 0.38]}
        >
          <torusGeometry
            args={[0.18, 0.025, 10, 32]}
          />

          <meshStandardMaterial
            color={COLORS.blueBright}
            emissive={COLORS.blue}
            emissiveIntensity={0.45}
            metalness={0.45}
            roughness={0.2}
          />
        </mesh>

        {/* BANDA SUPERIOR */}

        <mesh
          position={[0, 0.42, 0.01]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry
            args={[0.66, 0.04, 10, 48, Math.PI]}
          />

          <meshStandardMaterial
            color={COLORS.blue}
            emissive={COLORS.blueBright}
            emissiveIntensity={0.35}
            metalness={0.4}
            roughness={0.25}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   LOGO PEAKSCORE
============================================================ */

function PeakLogo() {
  return (
    <group position={[0, 0.03, -0.43]}>
      <mesh>
        <boxGeometry args={[0.28, 0.31, 0.035]} />

        <meshStandardMaterial
          color={COLORS.blue}
          emissive={COLORS.blueBright}
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </mesh>

      {/* SÍMBOLO */}

      <mesh
        position={[0, 0, -0.025]}
        rotation={[0, 0, -0.2]}
      >
        <boxGeometry args={[0.075, 0.19, 0.02]} />

        <meshBasicMaterial color={COLORS.cyanBright} />
      </mesh>

      <mesh
        position={[0.035, -0.03, -0.03]}
        rotation={[0, 0, 0.5]}
      >
        <boxGeometry args={[0.08, 0.16, 0.02]} />

        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
    </group>
  );
}

/* ============================================================
   CUERPO / HOODIE
============================================================ */

function PeakHoodie() {
  return (
    <group position={[0, 0.48, 0]}>
      {/* TORSO */}

      <RoundedBox
        args={[0.95, 1.05, 0.6]}
        radius={0.18}
        smoothness={5}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={COLORS.hoodie}
          roughness={0.62}
        />
      </RoundedBox>

      {/* PARTE SUPERIOR */}

      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry
          args={[0.52, 32, 20]}
        />

        <meshStandardMaterial
          color={COLORS.hoodie}
          roughness={0.62}
        />
      </mesh>

      {/* CAPUCHA */}

      <mesh
        position={[0, 0.53, 0.02]}
        scale={[0.7, 0.42, 0.62]}
      >
        <torusGeometry
          args={[0.48, 0.11, 16, 40, Math.PI]}
        />

        <meshStandardMaterial
          color={COLORS.hoodieLight}
          roughness={0.65}
        />
      </mesh>

      {/* CUELLO */}

      <mesh
        position={[0, 0.44, -0.01]}
        scale={[0.45, 0.25, 0.34]}
      >
        <sphereGeometry args={[0.5, 24, 18]} />

        <meshStandardMaterial
          color={COLORS.blueDark}
          roughness={0.6}
        />
      </mesh>

      <PeakLogo />

      {/* BOLSILLO */}

      <RoundedBox
        args={[0.55, 0.27, 0.04]}
        radius={0.07}
        smoothness={4}
        position={[0, -0.18, -0.33]}
      >
        <meshStandardMaterial
          color={COLORS.blueDark}
          roughness={0.62}
        />
      </RoundedBox>

      {/* CORDONES */}

      <mesh
        position={[-0.13, 0.31, -0.34]}
        rotation={[0, 0, 0.06]}
      >
        <cylinderGeometry args={[0.012, 0.012, 0.34, 10]} />

        <meshStandardMaterial
          color="#F7F9FF"
          roughness={0.55}
        />
      </mesh>

      <mesh
        position={[0.13, 0.31, -0.34]}
        rotation={[0, 0, -0.06]}
      >
        <cylinderGeometry args={[0.012, 0.012, 0.34, 10]} />

        <meshStandardMaterial
          color="#F7F9FF"
          roughness={0.55}
        />
      </mesh>

      {/* PUNTAS DE CORDÓN */}

      <mesh
        position={[-0.145, 0.14, -0.34]}
      >
        <boxGeometry args={[0.035, 0.08, 0.025]} />

        <meshStandardMaterial
          color={COLORS.blueBright}
          emissive={COLORS.blue}
          emissiveIntensity={0.3}
        />
      </mesh>

      <mesh
        position={[0.145, 0.14, -0.34]}
      >
        <boxGeometry args={[0.035, 0.08, 0.025]} />

        <meshStandardMaterial
          color={COLORS.blueBright}
          emissive={COLORS.blue}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* DETALLE CYAN */}

      <mesh
        position={[0.34, -0.02, -0.34]}
        rotation={[0, 0, -0.35]}
      >
        <boxGeometry args={[0.035, 0.16, 0.02]} />

        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
    </group>
  );
}

/* ============================================================
   BRAZO
============================================================ */

function PeakArm({
  side,
}: {
  side: "left" | "right";
}) {
  const x = side === "left" ? -0.62 : 0.62;
  const rotation =
    side === "left" ? -0.38 : 0.38;

  return (
    <group
      position={[x, 0.55, 0]}
      rotation={[0, 0, rotation]}
    >
      {/* MANGA */}

      <mesh
        position={[0, -0.06, 0]}
        scale={[0.28, 0.72, 0.29]}
      >
        <capsuleGeometry args={[0.22, 0.48, 12, 20]} />

        <meshStandardMaterial
          color={COLORS.hoodie}
          roughness={0.62}
        />
      </mesh>

      {/* PUÑO */}

      <mesh
        position={[0, -0.43, 0]}
        scale={[0.31, 0.17, 0.32]}
      >
        <sphereGeometry args={[0.24, 20, 16]} />

        <meshStandardMaterial
          color={COLORS.hoodieLight}
          roughness={0.62}
        />
      </mesh>

      {/* MANO */}

      <mesh
        position={[0, -0.6, 0]}
        scale={[0.28, 0.42, 0.24]}
      >
        <sphereGeometry args={[0.25, 20, 16]} />

        <meshStandardMaterial
          color={COLORS.white}
          roughness={0.55}
        />
      </mesh>

      {/* PLUMAS DE MANO */}

      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[
            side === "left"
              ? -0.05 - index * 0.07
              : 0.05 + index * 0.07,
            -0.76,
            0.01,
          ]}
          rotation={[
            0,
            0,
            side === "left"
              ? -0.15 - index * 0.08
              : 0.15 + index * 0.08,
          ]}
          scale={[0.11, 0.32, 0.1]}
        >
          <sphereGeometry
            args={[0.16, 16, 12]}
          />

          <meshStandardMaterial
            color={
              index === 2
                ? COLORS.blueBright
                : COLORS.white
            }
            roughness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   CAPA
============================================================ */

function PeakCape() {
  const capeGeometry = useMemo(() => {
    const shape = new THREE.Shape();

    shape.moveTo(-0.15, 0.8);
    shape.lineTo(-0.62, 0.55);
    shape.lineTo(-0.95, -0.65);
    shape.quadraticCurveTo(
      -0.45,
      -0.48,
      0,
      -0.72
    );
    shape.quadraticCurveTo(
      0.45,
      -0.48,
      0.95,
      -0.65
    );
    shape.lineTo(0.62, 0.55);
    shape.lineTo(0.15, 0.8);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });
  }, []);

  useEffect(() => {
    return () => {
      capeGeometry.dispose();
    };
  }, [capeGeometry]);

  return (
    <group
      position={[0, 0.48, 0.19]}
      rotation={[0.02, 0, 0]}
    >
      <mesh geometry={capeGeometry}>
        <meshStandardMaterial
          color={COLORS.blueDark}
          roughness={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* BORDE CYAN */}

      <mesh
        position={[-0.7, -0.08, -0.045]}
        rotation={[0, 0, -0.15]}
        scale={[0.035, 1.05, 0.02]}
      >
        <boxGeometry args={[1, 1, 1]} />

        <meshBasicMaterial color={COLORS.blueBright} />
      </mesh>

      <mesh
        position={[0.7, -0.08, -0.045]}
        rotation={[0, 0, 0.15]}
        scale={[0.035, 1.05, 0.02]}
      >
        <boxGeometry args={[1, 1, 1]} />

        <meshBasicMaterial color={COLORS.blueBright} />
      </mesh>
    </group>
  );
}

/* ============================================================
   PIERNA
============================================================ */

function PeakLeg({
  side,
}: {
  side: "left" | "right";
}) {
  const x = side === "left" ? -0.22 : 0.22;

  return (
    <group position={[x, -0.36, 0]}>
      {/* PIERNA */}

      <mesh
        scale={[0.27, 0.58, 0.29]}
      >
        <capsuleGeometry
          args={[0.2, 0.34, 12, 20]}
        />

        <meshStandardMaterial
          color={COLORS.white}
          roughness={0.58}
        />
      </mesh>

      {/* CALCETÍN */}

      <mesh
        position={[0, -0.29, 0]}
        scale={[0.27, 0.28, 0.3]}
      >
        <sphereGeometry args={[0.23, 20, 16]} />

        <meshStandardMaterial
          color={COLORS.whiteWarm}
          roughness={0.58}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   TENIS
============================================================ */

function PeakShoe({
  side,
}: {
  side: "left" | "right";
}) {
  const x = side === "left" ? -0.22 : 0.22;

  return (
    <group position={[x, -0.88, -0.04]}>
      {/* PARTE PRINCIPAL */}

      <RoundedBox
        args={[0.43, 0.28, 0.65]}
        radius={0.09}
        smoothness={4}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={COLORS.shoeWhite}
          roughness={0.4}
        />
      </RoundedBox>

      {/* TALÓN AZUL */}

      <RoundedBox
        args={[0.42, 0.24, 0.28]}
        radius={0.07}
        smoothness={4}
        position={[0, 0.03, 0.16]}
      >
        <meshStandardMaterial
          color={COLORS.blue}
          roughness={0.38}
          metalness={0.1}
        />
      </RoundedBox>

      {/* SUELA */}

      <RoundedBox
        args={[0.46, 0.075, 0.68]}
        radius={0.025}
        smoothness={3}
        position={[0, -0.17, -0.01]}
      >
        <meshStandardMaterial
          color={COLORS.sole}
          roughness={0.55}
        />
      </RoundedBox>

      {/* PUNTA AZUL */}

      <mesh
        position={[0, -0.01, -0.31]}
        scale={[0.35, 0.16, 0.14]}
      >
        <sphereGeometry args={[0.25, 20, 14]} />

        <meshStandardMaterial
          color={COLORS.blue}
          roughness={0.38}
        />
      </mesh>

      {/* CORDONES */}

      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[
            0,
            0.08 - index * 0.055,
            -0.05,
          ]}
        >
          <boxGeometry
            args={[0.28, 0.025, 0.045]}
          />

          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.45}
          />
        </mesh>
      ))}

      {/* LOGO A */}

      <mesh
        position={[0, 0.16, 0.12]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.12, 0.12]} />

        <meshBasicMaterial color={COLORS.blueDark} />
      </mesh>
    </group>
  );
}

/* ============================================================
   CUERPO COMPLETO
============================================================ */

function PeakBody() {
  return (
    <group>
      <PeakCape />

      <PeakHoodie />

      <PeakArm side="left" />

      <PeakArm side="right" />

      <PeakLeg side="left" />

      <PeakLeg side="right" />

      <PeakShoe side="left" />

      <PeakShoe side="right" />
    </group>
  );
}

/* ============================================================
   OJOS QUE SIGUEN EL CURSOR
============================================================ */

function PeakController({
  state,
}: {
  state: PeakMascotState;
}) {
  const { pointer } = useThree();

  const root = useRef<THREE.Group>(null);

  const look = useRef({
    x: 0,
    y: 0,
  });

  const targetLook = useRef({
    x: 0,
    y: 0,
  });

  useFrame((_, delta) => {
    if (!root.current) return;

    /* --------------------------------------------------------
       CURSOR
    -------------------------------------------------------- */

    targetLook.current.x = pointer.x;
    targetLook.current.y = pointer.y;

    /* --------------------------------------------------------
       CORREO
       Mira hacia abajo
    -------------------------------------------------------- */

    if (state === "email") {
      targetLook.current.x *= 0.25;
      targetLook.current.y = -0.9;
    }

    /* --------------------------------------------------------
       CONTRASEÑA
       Mira ligeramente al centro
    -------------------------------------------------------- */

    if (state === "password") {
      targetLook.current.x *= 0.15;
      targetLook.current.y = -0.05;
    }

    /* --------------------------------------------------------
       PASSWORD VISIBLE
       Mira al usuario
    -------------------------------------------------------- */

    if (state === "password-visible") {
      targetLook.current.x *= 0.3;
      targetLook.current.y *= 0.1;
    }

    /* --------------------------------------------------------
       SUAVIZADO
    -------------------------------------------------------- */

    look.current.x = THREE.MathUtils.damp(
      look.current.x,
      targetLook.current.x,
      5,
      delta
    );

    look.current.y = THREE.MathUtils.damp(
      look.current.y,
      targetLook.current.y,
      5,
      delta
    );

    /* --------------------------------------------------------
       MOVIMIENTO DE CABEZA
    -------------------------------------------------------- */

    const targetHeadY =
      look.current.x * 0.08;

    const targetHeadX =
      -look.current.y * 0.035;

    root.current.rotation.y =
      THREE.MathUtils.damp(
        root.current.rotation.y,
        targetHeadY,
        4,
        delta
      );

    root.current.rotation.x =
      THREE.MathUtils.damp(
        root.current.rotation.x,
        targetHeadX,
        4,
        delta
      );
  });

  const bothClosed =
    state === "password";

  const passwordVisible =
    state === "password-visible";

  return (
    <group ref={root}>
      <PeakHead
        lookX={look.current.x}
        lookY={look.current.y}
        eyesClosed={bothClosed}
      />

      <PeakBody />

      {/* ------------------------------------------------------
          MANO SOBRE UN OJO CUANDO PASSWORD ES VISIBLE
      ------------------------------------------------------ */}

      {passwordVisible && (
        <group
          position={[-0.48, 1.67, -0.55]}
          rotation={[0, 0, -0.4]}
        >
          <mesh
            scale={[0.23, 0.48, 0.22]}
          >
            <sphereGeometry
              args={[0.23, 20, 16]}
            />

            <meshStandardMaterial
              color={COLORS.white}
              roughness={0.52}
            />
          </mesh>

          <mesh
            position={[0, -0.29, -0.02]}
            scale={[0.12, 0.32, 0.1]}
          >
            <sphereGeometry
              args={[0.18, 16, 12]}
            />

            <meshStandardMaterial
              color={COLORS.white}
              roughness={0.52}
            />
          </mesh>
        </group>
      )}

      {/* ------------------------------------------------------
          MANOS SOBRE LOS OJOS EN PASSWORD
      ------------------------------------------------------ */}

      {bothClosed && (
        <>
          <group
            position={[-0.34, 1.68, -0.62]}
            rotation={[0, 0, -0.18]}
          >
            <mesh
              scale={[0.22, 0.42, 0.18]}
            >
              <sphereGeometry
                args={[0.22, 20, 16]}
              />

              <meshStandardMaterial
                color={COLORS.white}
                roughness={0.5}
              />
            </mesh>
          </group>

          <group
            position={[0.34, 1.68, -0.62]}
            rotation={[0, 0, 0.18]}
          >
            <mesh
              scale={[0.22, 0.42, 0.18]}
            >
              <sphereGeometry
                args={[0.22, 20, 16]}
              />

              <meshStandardMaterial
                color={COLORS.white}
                roughness={0.5}
              />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
}

/* ============================================================
   LUZ
============================================================ */

function PeakLighting() {
  return (
    <>
      <ambientLight intensity={1.5} />

      <directionalLight
        position={[3, 5, 5]}
        intensity={3.2}
      />

      <directionalLight
        position={[-4, 2, 2]}
        intensity={1.5}
      />

      <pointLight
        position={[0, 2, 3]}
        intensity={1.4}
        distance={8}
      />

      <pointLight
        position={[0, 0, -3]}
        intensity={0.8}
        distance={6}
      />
    </>
  );
}

/* ============================================================
   ESCENA
============================================================ */

function PeakScene({
  state,
}: {
  state: PeakMascotState;
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 1.05, 5.1]}
        fov={32}
      />

      <PeakLighting />

      <Environment preset="city" />

      <Float
        speed={1.3}
        rotationIntensity={0.08}
        floatIntensity={0.22}
      >
        <PeakController state={state} />
      </Float>

      <Shadow
        position={[0, -1.04, 0]}
        scale={2.2}
        opacity={0.16}
      />
    </>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function PeakMascot({
  state = "idle",
  className = "",
}: PeakMascotProps) {
  return (
    <div
      className={`h-full w-full ${className}`}
      style={{
        minHeight: 360,
        minWidth: 280,
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          position: [0, 1, 5],
          fov: 32,
        }}
      >
        <PeakScene state={state} />
      </Canvas>
    </div>
  );
}