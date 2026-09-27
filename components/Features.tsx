"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

/* ============================================================
   TIPOS
============================================================ */

export type LandingTheme = "light" | "dark";

type FeatureCardProps = {
  src: string;
  alt: string;
  delay: number;
  priority?: boolean;
  theme: LandingTheme;
};

/* ============================================================
   TARJETA ESTILO GAME UI
============================================================ */

function FeatureCard({
  src,
  alt,
  delay,
  priority = false,
  theme,
}: FeatureCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, {
    stiffness: 180,
    damping: 22,
    mass: 0.5,
  });

  const springY = useSpring(mouseY, {
    stiffness: 180,
    damping: 22,
    mass: 0.5,
  });

  const rotateY = useTransform(
    springX,
    [-1, 1],
    [-7, 7]
  );

  const rotateX = useTransform(
    springY,
    [-1, 1],
    [7, -7]
  );

  const translateY = useTransform(
    springY,
    [-1, 1],
    [3, -3]
  );

  /* ==========================================================
     MOUSE MOVE
  ========================================================== */

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (shouldReduceMotion) return;

    const rect =
      event.currentTarget.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) /
      rect.width;

    const y =
      (event.clientY - rect.top) /
      rect.height;

    mouseX.set(x * 2 - 1);
    mouseY.set(y * 2 - 1);
  };

  /* ==========================================================
     MOUSE LEAVE
  ========================================================== */

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const isDark = theme === "dark";

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 35,
            }
      }
      whileInView={
        shouldReduceMotion
          ? undefined
          : {
              opacity: 1,
              y: 0,
            }
      }
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        group
        relative
        w-full
        [perspective:1200px]
      "
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ======================================================
          GLOW EXTERIOR
      ====================================================== */}

      <motion.div
        className={`
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[58%]
          w-[72%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          blur-[70px]
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
          ${
            isDark
              ? "bg-violet-500/20"
              : "bg-lime-400/20"
          }
        `}
      />

      {/* ======================================================
          CONTENEDOR 3D
      ====================================================== */}

      <motion.div
        style={{
          rotateX,
          rotateY,
          y: translateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                scale: 1.035,
              }
        }
        whileTap={
          shouldReduceMotion
            ? undefined
            : {
                scale: 0.985,
              }
        }
        transition={{
          scale: {
            type: "spring",
            stiffness: 260,
            damping: 20,
          },
        }}
        className="
          relative
          z-10
          mx-auto
          w-full
          max-w-[520px]
          cursor-pointer
          overflow-hidden
          rounded-[28px]
          will-change-transform
        "
      >
        {/* ====================================================
            IMAGEN
        ==================================================== */}

        <Image
          src={src}
          alt={alt}
          width={1000}
          height={1000}
          priority={priority}
          unoptimized
          sizes="
            (max-width: 639px) 92vw,
            (max-width: 1023px) 70vw,
            31vw
          "
          className={`
            relative
            z-10
            h-auto
            w-full
            object-contain
            transition-[filter]
            duration-500
            ${
              isDark
                ? "drop-shadow-[0_24px_38px_rgba(0,0,0,0.45)] group-hover:drop-shadow-[0_35px_52px_rgba(0,0,0,0.65)]"
                : "drop-shadow-[0_22px_30px_rgba(15,23,42,0.18)] group-hover:drop-shadow-[0_32px_42px_rgba(15,23,42,0.30)]"
            }
          `}
        />

        {/* ====================================================
            BRILLO
        ==================================================== */}

        <motion.div
          className="
            pointer-events-none
            absolute
            inset-0
            z-20
            -translate-x-[120%]
            skew-x-[-18deg]
            bg-gradient-to-r
            from-transparent
            via-white/35
            to-transparent
            opacity-0
            group-hover:opacity-100
          "
          transition={{
            duration: 0.7,
            ease: "easeOut",
          }}
          whileHover={{
            x: "230%",
          }}
        />

        {/* ====================================================
            BORDE INTERACTIVO
        ==================================================== */}

        <div
          className={`
            pointer-events-none
            absolute
            inset-0
            z-30
            rounded-[28px]
            border
            border-transparent
            transition-all
            duration-500
            ${
              isDark
                ? "group-hover:border-violet-400/45"
                : "group-hover:border-lime-400/55"
            }
          `}
        />

        {/* ====================================================
            REFLEJO SUPERIOR
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-[12%]
            top-0
            z-30
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/60
            to-transparent
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   PEAKY
============================================================ */

function FeaturesPeaky({
  theme,
}: {
  theme: LandingTheme;
}) {
  const isDark = theme === "dark";

  return (
    <>
      {/* ======================================================
          PEAKY DESKTOP / TABLET
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-[-42px]
          right-[-5px]
          z-40
          hidden
          h-[230px]
          w-[185px]
          sm:block
          md:h-[255px]
          md:w-[205px]
          lg:bottom-[-48px]
          lg:right-[-5px]
          lg:h-[285px]
          lg:w-[225px]
          xl:right-[15px]
          xl:h-[315px]
          xl:w-[250px]
        "
      >
        {/* PEAKY OSCURO */}

        <Image
          src="/peaky/homepage/featurespeakyoscuro.webp"
          alt=""
          fill
          unoptimized
          sizes="
            (max-width: 767px) 205px,
            (max-width: 1023px) 225px,
            250px
          "
          className={`
            absolute
            inset-0
            object-contain
            object-bottom
            transition-opacity
            duration-500
            ease-out
            ${
              isDark
                ? "opacity-100"
                : "opacity-0"
            }
            ${
              isDark
                ? "drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]"
                : ""
            }
          `}
        />

        {/* PEAKY CLARO */}

        <Image
          src="/peaky/homepage/featurespeakyclaro.webp"
          alt=""
          fill
          unoptimized
          sizes="
            (max-width: 767px) 205px,
            (max-width: 1023px) 225px,
            250px
          "
          className={`
            absolute
            inset-0
            object-contain
            object-bottom
            transition-opacity
            duration-500
            ease-out
            ${
              isDark
                ? "opacity-0"
                : "opacity-100"
            }
            ${
              !isDark
                ? "drop-shadow-[0_20px_30px_rgba(20,50,25,0.25)]"
                : ""
            }
          `}
        />
      </div>

      {/* ======================================================
          PEAKY MOBILE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          relative
          mx-auto
          mt-[-8px]
          h-[190px]
          w-[155px]
          sm:hidden
        "
      >
        {/* PEAKY OSCURO */}

        <Image
          src="/peaky/homepage/featurespeakyoscuro.webp"
          alt=""
          fill
          unoptimized
          sizes="155px"
          className={`
            absolute
            inset-0
            object-contain
            object-bottom
            transition-opacity
            duration-500
            ease-out
            ${
              isDark
                ? "opacity-100"
                : "opacity-0"
            }
            ${
              isDark
                ? "drop-shadow-[0_18px_28px_rgba(0,0,0,0.65)]"
                : ""
            }
          `}
        />

        {/* PEAKY CLARO */}

        <Image
          src="/peaky/homepage/featurespeakyclaro.webp"
          alt=""
          fill
          unoptimized
          sizes="155px"
          className={`
            absolute
            inset-0
            object-contain
            object-bottom
            transition-opacity
            duration-500
            ease-out
            ${
              isDark
                ? "opacity-0"
                : "opacity-100"
            }
            ${
              !isDark
                ? "drop-shadow-[0_18px_25px_rgba(20,50,25,0.25)]"
                : ""
            }
          `}
        />
      </div>
    </>
  );
}

/* ============================================================
   FEATURES
============================================================ */

type FeaturesProps = {
  theme: LandingTheme;
};

export default function Features({
  theme,
}: FeaturesProps) {
  const shouldReduceMotion = useReducedMotion();

  const isDark = theme === "dark";

  return (
    <section
      id="features"
      className={`
        relative
        isolate
        overflow-hidden
        py-20
        sm:py-24
        lg:py-28
        transition-colors
        duration-300
        ease-out
        ${
          isDark
            ? "bg-[#050713]"
            : "bg-[#f5f8ff]"
        }
      `}
    >
      {/* ======================================================
          FONDOS
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-20
        "
      >
        {/* ====================================================
            DESKTOP OSCURO
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresoscuro.webp"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={`
            absolute
            inset-0
            hidden
            object-cover
            object-center
            transition-opacity
            duration-500
            ease-out
            md:block
            ${
              isDark
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/* ====================================================
            DESKTOP CLARO
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresclaro.webp"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={`
            absolute
            inset-0
            hidden
            object-cover
            object-center
            transition-opacity
            duration-500
            ease-out
            md:block
            ${
              isDark
                ? "opacity-0"
                : "opacity-100"
            }
          `}
        />

        {/* ====================================================
            MOBILE OSCURO
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresmobileoscuro.webp"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={`
            absolute
            inset-0
            object-cover
            object-center
            transition-opacity
            duration-500
            ease-out
            md:hidden
            ${
              isDark
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/* ====================================================
            MOBILE CLARO
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresmobileclaro.webp"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className={`
            absolute
            inset-0
            object-cover
            object-center
            transition-opacity
            duration-500
            ease-out
            md:hidden
            ${
              isDark
                ? "opacity-0"
                : "opacity-100"
            }
          `}
        />

        {/* ====================================================
            CAPA DE LEGIBILIDAD
        ==================================================== */}

        <div
          className={`
            absolute
            inset-0
            transition-colors
            duration-500
            ease-out
            ${
              isDark
                ? "bg-[#02030b]/20"
                : "bg-white/5"
            }
          `}
        />

        {/* ====================================================
            DEGRADADO INFERIOR
        ==================================================== */}

        <div
          className={`
            absolute
            inset-x-0
            bottom-0
            h-32
            bg-gradient-to-t
            to-transparent
            transition-colors
            duration-500
            ease-out
            ${
              isDark
                ? "from-[#050713]"
                : "from-[#f5f8ff]"
            }
          `}
        />
      </div>

      {/* ======================================================
          CONTENIDO
      ====================================================== */}

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-[1450px]
          px-5
          sm:px-8
          lg:px-12
          xl:px-16
        "
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 25,
                }
          }
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                  y: 0,
                }
          }
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            mx-auto
            max-w-3xl
            text-center
          "
        >
          {/* ==================================================
              ETIQUETA
          ================================================== */}

          <div
            className="
              mb-5
              flex
              items-center
              justify-center
              gap-3
            "
          >
            <span
              className={`
                h-px
                w-8
                transition-colors
                duration-300
                ${
                  isDark
                    ? "bg-lime-400"
                    : "bg-emerald-500"
                }
              `}
            />

            <span
              className={`
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.24em]
                transition-colors
                duration-300
                ${
                  isDark
                    ? "text-lime-300"
                    : "text-emerald-700"
                }
              `}
            >
              Todo en un solo lugar
            </span>

            <span
              className={`
                h-px
                w-8
                transition-colors
                duration-300
                ${
                  isDark
                    ? "bg-lime-400"
                    : "bg-emerald-500"
                }
              `}
            />
          </div>

          {/* ==================================================
              TÍTULO
          ================================================== */}

          <h2
            className={`
              text-[38px]
              font-black
              leading-[1]
              tracking-[-0.045em]
              transition-colors
              duration-300
              ease-out
              sm:text-[48px]
              lg:text-[58px]
              ${
                isDark
                  ? "text-white"
                  : "text-slate-950"
              }
            `}
          >
            Prepárate.
            <br />

            <span
              className={`
                bg-gradient-to-r
                bg-clip-text
                text-transparent
                transition-all
                duration-300
                ${
                  isDark
                    ? "from-lime-300 via-emerald-300 to-cyan-300"
                    : "from-emerald-600 via-teal-500 to-blue-600"
                }
              `}
            >
              Practica. Mejora.
            </span>
          </h2>

          {/* ==================================================
              DESCRIPCIÓN
          ================================================== */}

          <p
            className={`
              mx-auto
              mt-5
              max-w-xl
              text-[13px]
              font-medium
              leading-6
              transition-colors
              duration-300
              ease-out
              sm:text-[15px]
              ${
                isDark
                  ? "text-white/60"
                  : "text-slate-600"
              }
            `}
          >
            Simulacros tipo ICFES, práctica enfocada y
            seguimiento de tu progreso. Todo lo que
            necesitas para prepararte en un solo lugar.
          </p>
        </motion.div>

        {/* ====================================================
            TARJETAS
        ==================================================== */}

        <div
          className="
            relative
            mt-10
            grid
            grid-cols-1
            items-center
            justify-items-center
            gap-8
            sm:mt-12
            sm:gap-10
            lg:grid-cols-3
            lg:gap-6
            xl:gap-8
          "
        >
          {/* ==================================================
              SIMULACROS
          ================================================== */}

          <FeatureCard
            src="/peaky/homepage/featuressimulacros.webp"
            alt="Simulacros PeakScore"
            delay={0}
            priority
            theme={theme}
          />

          {/* ==================================================
              PRÁCTICA
          ================================================== */}

          <FeatureCard
            src="/peaky/homepage/featurespractica.webp"
            alt="Práctica PeakScore"
            delay={0.1}
            theme={theme}
          />

          {/* ==================================================
              PROGRESO
          ================================================== */}

          <FeatureCard
            src="/peaky/homepage/featuresprogreso.webp"
            alt="Progreso PeakScore"
            delay={0.2}
            theme={theme}
          />
        </div>

        {/* ====================================================
            PEAKY
            FUERA DEL GRID PARA QUE NUNCA ELIMINE UNA TARJETA
        ==================================================== */}

        <FeaturesPeaky theme={theme} />
      </div>
    </section>
  );
}