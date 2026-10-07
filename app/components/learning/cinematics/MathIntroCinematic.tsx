"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type MathIntroCinematicProps = {
  onComplete?: () => void;
};

const STARS = [
  [8, 14],
  [17, 28],
  [25, 11],
  [33, 37],
  [42, 18],
  [51, 10],
  [62, 31],
  [71, 16],
  [79, 38],
  [88, 12],
  [94, 29],
  [13, 68],
  [28, 79],
  [43, 65],
  [57, 83],
  [73, 70],
  [87, 80],
] as const;

const PORTAL_PARTICLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function MathIntroCinematic({
  onComplete,
}: MathIntroCinematicProps) {
  const [phase, setPhase] = useState<
    "intro" | "portal" | "title" | "ready"
  >("intro");

  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const skipTimer = window.setTimeout(() => {
      setShowSkip(true);
    }, 1200);

    const portalTimer = window.setTimeout(() => {
      setPhase("portal");
    }, 2600);

    const titleTimer = window.setTimeout(() => {
      setPhase("title");
    }, 5600);

    const readyTimer = window.setTimeout(() => {
      setPhase("ready");
    }, 7600);

    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(portalTimer);
      window.clearTimeout(titleTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  const handleSkip = () => {
    setPhase("ready");
  };

  const handleEnter = () => {
    onComplete?.();
  };

  return (
    <main className="fixed inset-0 z-[9999] overflow-hidden bg-[#02030a] text-white">
      {/* FONDO */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,rgba(76,29,149,0.22),transparent_35%),radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.12),transparent_30%),#02030a]" />

      {/* ESTRELLAS */}
      <div className="absolute inset-0 opacity-80">
        {STARS.map(([left, top], index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${left}%`,
              top: `${top}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.7, 1.3, 0.7],
            }}
            transition={{
              duration: 2 + (index % 3),
              repeat: Infinity,
              delay: index * 0.15,
            }}
          />
        ))}
      </div>

      {/* NEBULOSA */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[65vw] w-[65vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.06] blur-3xl"
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
        }}
      />

      {/* PEAKY INICIAL */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            className="absolute bottom-[10%] left-1/2 w-[220px] -translate-x-1/2 md:w-[280px]"
            initial={{
              opacity: 0,
              y: 100,
              scale: 0.85,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
              y: -40,
            }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
            }}
          >
            <motion.img
              src="/characters/peaky/peaky-study-blink.gif?v=7"
              alt="Peaky"
              className="relative z-10 h-auto w-full object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.9)]"
              animate={{
                y: [0, -7, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* SOMBRA */}
            <div className="absolute bottom-1 left-1/2 h-4 w-[65%] -translate-x-1/2 rounded-full bg-black/70 blur-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PORTAL */}
      <AnimatePresence>
        {(phase === "portal" ||
          phase === "title" ||
          phase === "ready") && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{
              opacity: 0,
              scale: 0.2,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 1.1,
              ease: "easeOut",
            }}
          >
            {/* AURA */}
            <motion.div
              className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl"
              animate={{
                scale: [0.9, 1.12, 0.9],
                opacity: [0.45, 0.8, 0.45],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
              }}
            />

            {/* PORTAL EXTERIOR */}
            <motion.div
              className="relative h-[210px] w-[210px] rounded-full border-[3px] border-violet-300/70 bg-violet-950/20 shadow-[0_0_35px_rgba(139,92,246,0.75),0_0_100px_rgba(124,58,237,0.35)] md:h-[270px] md:w-[270px]"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {/* ANILLOS */}
              <div className="absolute inset-[10px] rounded-full border border-fuchsia-300/60" />

              <div className="absolute inset-[22px] rounded-full border border-cyan-300/40" />

              {/* NÚCLEO */}
              <motion.div
                className="absolute inset-[35px] rounded-full bg-[radial-gradient(circle,#e9d5ff_0%,#8b5cf6_18%,#4c1d95_48%,#090014_75%)]"
                animate={{
                  scale: [0.92, 1.04, 0.92],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* PARTÍCULAS */}
              {PORTAL_PARTICLES.map((rotation) => (
                <motion.span
                  key={rotation}
                  className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.9)]"
                  style={{
                    transform: `rotate(${rotation}deg) translateY(-135px)`,
                  }}
                  animate={{
                    opacity: [0.25, 1, 0.25],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: rotation / 360,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PEAKY ENTRANDO AL PORTAL */}
      <AnimatePresence>
        {phase === "portal" && (
          <motion.div
            className="absolute bottom-[20%] left-1/2 z-20 w-[180px] -translate-x-1/2 md:w-[230px]"
            initial={{
              x: -320,
              opacity: 0,
            }}
            animate={{
              x: 0,
              opacity: 1,
            }}
            exit={{
              scale: 0.15,
              opacity: 0,
            }}
            transition={{
              duration: 1.7,
              ease: "easeInOut",
            }}
          >
            <img
              src="/characters/peaky/peaky-study-blink.gif?v=8"
              alt="Peaky entrando al portal"
              className="w-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TÍTULO */}
      <AnimatePresence>
        {(phase === "title" || phase === "ready") && (
          <motion.section
            className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 1,
            }}
          >
            <motion.p
              className="mb-3 text-[10px] font-black uppercase tracking-[0.45em] text-cyan-300 md:text-xs"
              initial={{
                y: 20,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              transition={{
                delay: 0.15,
              }}
            >
              MUNDO 01
            </motion.p>

            <motion.h1
              className="max-w-3xl text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_25px_rgba(139,92,246,0.45)] md:text-7xl"
              initial={{
                y: 30,
                opacity: 0,
                scale: 0.92,
              }}
              animate={{
                y: 0,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: 0.25,
                duration: 0.8,
              }}
            >
              El Templo
              <br />
              <span className="text-violet-300">
                de los Números
              </span>
            </motion.h1>

            <motion.div
              className="mt-6 max-w-md"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.6,
              }}
            >
              <p className="text-sm leading-6 text-slate-300 md:text-base">
                Domina los fundamentos y demuestra
                que estás listo para avanzar.
              </p>
            </motion.div>

            {phase === "ready" && (
              <motion.button
                type="button"
                onClick={handleEnter}
                className="mt-9 rounded-xl border border-cyan-300/40 bg-cyan-400/10 px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.18)] backdrop-blur-md transition hover:scale-105 hover:bg-cyan-400/20"
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                }}
              >
                Entrar al mundo
              </motion.button>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* BOTÓN SALTAR */}
      {showSkip && phase !== "ready" && (
        <motion.button
          type="button"
          onClick={handleSkip}
          className="absolute right-5 top-5 z-[100] rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
        >
          Saltar
        </motion.button>
      )}

      {/* FLASH */}
      {phase === "title" && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[90] bg-white"
          initial={{
            opacity: 0.7,
          }}
          animate={{
            opacity: 0,
          }}
          transition={{
            duration: 1,
          }}
        />
      )}
    </main>
  );
}