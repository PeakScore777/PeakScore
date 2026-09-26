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

type FeatureCardProps = {
  src: string;
  alt: string;
  delay: number;
  priority?: boolean;
};

/* ============================================================
   TARJETA ESTILO GAME UI
============================================================ */

function FeatureCard({
  src,
  alt,
  delay,
  priority = false,
}: FeatureCardProps) {
  const shouldReduceMotion = useReducedMotion();

  /*
   * Valores de movimiento del mouse.
   *
   * Se mantienen en 0 cuando no estamos interactuando.
   */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  /*
   * Spring para que el movimiento no sea brusco.
   */
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

  /*
   * Rotación 3D.
   *
   * El rango es pequeño para que se vea premium
   * y no como una animación exagerada.
   */
  const rotateY = useTransform(springX, [-1, 1], [-7, 7]);
  const rotateX = useTransform(springY, [-1, 1], [7, -7]);

  /*
   * Movimiento vertical muy leve.
   */
  const translateY = useTransform(springY, [-1, 1], [3, -3]);

  /* ==========================================================
     MOUSE ENTER
  ========================================================== */

  const handleMouseEnter = () => {
    if (shouldReduceMotion) return;
  };

  /* ==========================================================
     MOUSE MOVE
  ========================================================== */

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (shouldReduceMotion) return;

    const rect = event.currentTarget.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) / rect.width;

    const y =
      (event.clientY - rect.top) / rect.height;

    /*
     * Convertimos 0 → 1 en -1 → 1.
     */
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
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ======================================================
          GLOW EXTERIOR
      ====================================================== */}

      <motion.div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[58%]
          w-[72%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-blue-400/10
          blur-[70px]
          opacity-0
          transition-opacity
          duration-500
          group-hover:opacity-100
          dark:bg-violet-500/15
        "
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
            IMAGEN DE LA TARJETA
        ==================================================== */}

        <Image
          src={src}
          alt={alt}
          width={1000}
          height={1000}
          priority={priority}
          sizes="
            (max-width: 639px) 92vw,
            (max-width: 1023px) 70vw,
            31vw
          "
          className="
            relative
            z-10
            h-auto
            w-full
            object-contain
            transition-[filter]
            duration-500
            drop-shadow-[0_22px_30px_rgba(15,23,42,0.18)]
            group-hover:drop-shadow-[0_32px_42px_rgba(15,23,42,0.30)]
            dark:drop-shadow-[0_24px_38px_rgba(0,0,0,0.45)]
            dark:group-hover:drop-shadow-[0_35px_52px_rgba(0,0,0,0.65)]
          "
        />

        {/* ====================================================
            BRILLO GAME UI
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
          className="
            pointer-events-none
            absolute
            inset-0
            z-30
            rounded-[28px]
            border
            border-transparent
            transition-all
            duration-500
            group-hover:border-blue-400/35
            dark:group-hover:border-violet-400/40
          "
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
            via-white/50
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

function FeaturesPeaky() {
  return (
    <div
      className="
        pointer-events-none
        absolute
        bottom-[-18px]
        right-[-10px]
        z-40
        hidden
        h-[185px]
        w-[150px]
        sm:block
        md:h-[215px]
        md:w-[175px]
        lg:bottom-[-35px]
        lg:right-[-5px]
        lg:h-[255px]
        lg:w-[205px]
        xl:right-[10px]
        xl:h-[280px]
        xl:w-[225px]
      "
    >
      {/* ======================================================
          PEAKY CLARO
      ====================================================== */}

      <Image
        src="/peaky/homepage/featurespeakyclaro.png"
        alt=""
        fill
        sizes="225px"
        className="
          object-contain
          object-bottom
          drop-shadow-[0_20px_25px_rgba(20,50,25,0.25)]
          dark:hidden
        "
      />

      {/* ======================================================
          PEAKY OSCURO / MORADO
      ====================================================== */}

      <Image
        src="/peaky/homepage/featurespeakyscuro.png"
        alt=""
        fill
        sizes="225px"
        className="
          hidden
          object-contain
          object-bottom
          drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]
          dark:block
        "
      />
    </div>
  );
}

/* ============================================================
   FEATURES
============================================================ */

export default function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="
        relative
        isolate
        overflow-hidden
        bg-[#f5f8ff]
        py-20
        sm:py-24
        lg:py-28
        dark:bg-[#050713]
      "
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
            CLARO DESKTOP
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresclaro.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="
            hidden
            object-cover
            object-center
            md:block
            dark:hidden
          "
        />

        {/* ====================================================
            CLARO MOBILE
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresmobileclaro.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="
            object-cover
            object-center
            md:hidden
            dark:hidden
          "
        />

        {/* ====================================================
            OSCURO DESKTOP
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresoscuro.png"
          alt=""
          fill
          sizes="100vw"
          className="
            hidden
            object-cover
            object-center
            md:block
            dark:block
          "
        />

        {/* ====================================================
            OSCURO MOBILE
        ==================================================== */}

        <Image
          src="/peaky/homepage/featuresmobileoscuro.png"
          alt=""
          fill
          sizes="100vw"
          className="
            object-cover
            object-center
            md:hidden
            dark:block
          "
        />

        {/* ====================================================
            CAPA DE LEGIBILIDAD
        ==================================================== */}

        <div
          className="
            absolute
            inset-0
            bg-white/5
            dark:bg-[#02030b]/20
          "
        />

        {/* ====================================================
            DEGRADADO INFERIOR
        ==================================================== */}

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            h-32
            bg-gradient-to-t
            from-[#f5f8ff]
            to-transparent
            dark:from-[#050713]
          "
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
          {/* Etiqueta */}

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
              className="
                h-px
                w-8
                bg-emerald-500
                dark:bg-lime-400
              "
            />

            <span
              className="
                text-[9px]
                font-extrabold
                uppercase
                tracking-[0.24em]
                text-emerald-700
                dark:text-lime-300
              "
            >
              Todo en un solo lugar
            </span>

            <span
              className="
                h-px
                w-8
                bg-emerald-500
                dark:bg-lime-400
              "
            />
          </div>

          {/* Título */}

          <h2
            className="
              text-[38px]
              font-black
              leading-[1]
              tracking-[-0.045em]
              text-slate-950
              sm:text-[48px]
              lg:text-[58px]
              dark:text-white
            "
          >
            Prepárate.
            <br />

            <span
              className="
                bg-gradient-to-r
                from-emerald-600
                via-teal-500
                to-blue-600
                bg-clip-text
                text-transparent
                dark:from-lime-300
                dark:via-emerald-300
                dark:to-cyan-300
              "
            >
              Practica. Mejora.
            </span>
          </h2>

          {/* Descripción */}

          <p
            className="
              mx-auto
              mt-5
              max-w-xl
              text-[13px]
              font-medium
              leading-6
              text-slate-600
              sm:text-[15px]
              dark:text-white/60
            "
          >
            Simulacros tipo ICFES, práctica enfocada y seguimiento
            de tu progreso. Todo lo que necesitas para prepararte
            en un solo lugar.
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
            src="/peaky/homepage/featuressimulacros.png"
            alt="Simulacros PeakScore"
            delay={0}
            priority
          />

          {/* ==================================================
              PRÁCTICA
          ================================================== */}

          <FeatureCard
            src="/peaky/homepage/featurespractica.png"
            alt="Práctica PeakScore"
            delay={0.1}
          />

          {/* ==================================================
              PROGRESO
          ================================================== */}

          <FeatureCard
            src="/peaky/homepage/featuresprogreso.png"
            alt="Progreso PeakScore"
            delay={0.2}
          />

          {/* ==================================================
              PEAKY
          ================================================== */}

          <FeaturesPeaky />
        </div>
      </div>
    </section>
  );
}