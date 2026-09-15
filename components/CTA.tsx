"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#09051b]">
      {/* =========================================================
          CIELO DEL ATARDECER
      ========================================================== */}

      <div className="absolute inset-0">
        {/* Gradiente principal */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#08051c] via-[#24104b] to-[#ff5f91]" />

        {/* Luz del horizonte */}
        <div className="absolute bottom-[22%] left-1/2 h-[260px] w-[900px] -translate-x-1/2 rounded-full bg-[#ff7b9c]/25 blur-[100px]" />

        {/* Luz azul superior */}
        <div className="absolute left-1/2 top-0 h-[300px] w-[900px] -translate-x-1/2 bg-[#3156ff]/10 blur-[120px]" />

        {/* =====================================================
            PIXEL STARS
        ====================================================== */}

        <div className="absolute left-[8%] top-[18%] h-2 w-2 bg-[#55dfff]" />
        <div className="absolute left-[8.7%] top-[17.5%] h-1 w-1 bg-[#55dfff]" />

        <div className="absolute left-[19%] top-[27%] h-1.5 w-1.5 bg-[#c477ff]" />

        <div className="absolute left-[31%] top-[12%] h-1 w-1 bg-[#5ce5ff]" />

        <div className="absolute right-[17%] top-[20%] h-2 w-2 bg-[#f47cff]" />
        <div className="absolute right-[17.8%] top-[19.5%] h-1 w-1 bg-[#f47cff]" />

        <div className="absolute right-[8%] top-[35%] h-1.5 w-1.5 bg-[#5ce5ff]" />

        <div className="absolute left-[42%] top-[17%] h-1 w-1 bg-white/60" />

        <div className="absolute right-[38%] top-[11%] h-1 w-1 bg-white/50" />

        {/* =====================================================
            NUBES PIXELADAS
        ====================================================== */}

        {/* Nube izquierda */}
        <div className="absolute bottom-[31%] left-[-20px] h-[75px] w-[280px] opacity-90">
          <div className="absolute bottom-0 left-0 h-8 w-full bg-[#6d267e]" />
          <div className="absolute bottom-7 left-8 h-9 w-24 bg-[#87358d]" />
          <div className="absolute bottom-7 left-20 h-12 w-24 bg-[#8e398f]" />
          <div className="absolute bottom-7 left-36 h-7 w-20 bg-[#70277f]" />
          <div className="absolute bottom-16 left-14 h-6 w-20 bg-[#9c4297]" />
          <div className="absolute bottom-14 left-48 h-5 w-14 bg-[#8d398d]" />
        </div>

        {/* Nube derecha */}
        <div className="absolute bottom-[34%] right-[-30px] h-[95px] w-[330px] opacity-90">
          <div className="absolute bottom-0 right-0 h-9 w-full bg-[#662477]" />
          <div className="absolute bottom-8 right-8 h-10 w-28 bg-[#833184]" />
          <div className="absolute bottom-8 right-20 h-14 w-28 bg-[#963c8f]" />
          <div className="absolute bottom-8 right-44 h-8 w-20 bg-[#742a7e]" />
          <div className="absolute bottom-20 right-28 h-7 w-24 bg-[#a34594]" />
          <div className="absolute bottom-18 right-4 h-6 w-16 bg-[#8e358a]" />
        </div>

        {/* =====================================================
            SOL PIXELADO
        ====================================================== */}

        <div className="absolute bottom-[27%] left-1/2 h-[150px] w-[150px] -translate-x-1/2">
          {/* resplandor */}
          <div className="absolute -inset-16 bg-[#ff9b75]/20 blur-[60px]" />

          {/* pixel sun */}
          <div className="absolute left-[35px] top-[35px] h-[80px] w-[80px] bg-[#ffcf78]" />

          <div className="absolute left-[25px] top-[45px] h-[60px] w-[100px] bg-[#ffb06e]" />

          <div className="absolute left-[45px] top-[25px] h-[100px] w-[60px] bg-[#ffc873]" />

          <div className="absolute left-[35px] top-[35px] h-[80px] w-[80px] bg-gradient-to-b from-[#ffd979] to-[#ff8b79]" />
        </div>

        {/* =====================================================
            HORIZONTE
        ========================================================== */}

        <div className="absolute bottom-0 left-0 right-0 h-[31%]">
          {/* montaña lejana */}
          <div className="absolute bottom-0 left-[-5%] h-[190px] w-[65%] bg-[#130d31] [clip-path:polygon(0_100%,0_75%,18%_55%,30%_68%,44%_38%,57%_65%,73%_45%,100%_75%,100%_100%)]" />

          {/* montaña derecha */}
          <div className="absolute bottom-0 right-[-5%] h-[220px] w-[70%] bg-[#100a2b] [clip-path:polygon(0_100%,0_72%,16%_58%,29%_72%,45%_35%,59%_62%,74%_45%,100%_72%,100%_100%)]" />

          {/* montaña central */}
          <div className="absolute bottom-0 left-1/2 h-[250px] w-[560px] -translate-x-1/2 bg-[#0b0825] [clip-path:polygon(0_100%,18%_72%,31%_80%,50%_28%,68%_78%,83%_61%,100%_100%)]" />

          {/* reflejo pixelado del horizonte */}
          <div className="absolute bottom-[18%] left-0 right-0 h-[3px] bg-[#ff6f9d]/40" />
          <div className="absolute bottom-[13%] left-[8%] h-[3px] w-[130px] bg-[#b34b91]/40" />
          <div className="absolute bottom-[10%] right-[12%] h-[3px] w-[180px] bg-[#b34b91]/30" />
        </div>

        {/* =====================================================
            PIXEL PARTICLES CERCA DEL HORIZONTE
        ========================================================== */}

        <div className="absolute bottom-[25%] left-[14%] h-2 w-6 bg-[#e75c9d]/50" />
        <div className="absolute bottom-[29%] left-[22%] h-1.5 w-10 bg-[#ff8aa7]/40" />

        <div className="absolute bottom-[27%] right-[20%] h-2 w-8 bg-[#db5799]/50" />
        <div className="absolute bottom-[32%] right-[11%] h-1.5 w-12 bg-[#ff89a8]/40" />

        {/* degradado inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-gradient-to-t from-[#050417] to-transparent" />
      </div>

      {/* =========================================================
          CONTENIDO
      ========================================================== */}

      <div className="relative z-10 mx-auto flex min-h-[680px] max-w-5xl items-center justify-center px-6 py-24">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            margin: "-100px",
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
          className="relative mx-auto max-w-3xl text-center"
        >
          {/* =====================================================
              ETIQUETA
          ========================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.15,
              duration: 0.5,
            }}
            className="mb-7 inline-flex items-center border border-white/20 bg-[#09051b]/55 px-5 py-2 backdrop-blur-md"
          >
            <span className="mr-3 h-1.5 w-1.5 bg-[#ff7aa8]" />

            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/80">
              El siguiente paso
            </span>

            <span className="ml-3 h-1.5 w-1.5 bg-[#48dfff]" />
          </motion.div>

          {/* =====================================================
              TITULO
          ========================================================== */}

          <h2 className="text-5xl font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl">
            Tu meta no está
            <br />

            <span className="relative inline-block">
              tan lejos.
              <span className="absolute -bottom-2 left-1/2 h-[3px] w-[75%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ff78a5] to-transparent opacity-80" />
            </span>
          </h2>

          {/* =====================================================
              DESCRIPCIÓN
          ========================================================== */}

          <p className="mx-auto mt-8 max-w-xl text-sm leading-7 text-white/75 md:text-base">
            Empieza a practicar, descubre dónde puedes mejorar y convierte
            cada sesión en un paso hacia tu mejor resultado en el ICFES.
          </p>

          {/* =====================================================
              BOTÓN
          ========================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            whileInView={{
              opacity: 1,
              scale: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.35,
              duration: 0.5,
            }}
            className="mt-10"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center overflow-hidden border border-white/40 bg-[#0a0720]/90 px-8 py-4 text-sm font-bold text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/70 hover:bg-[#120b31]"
            >
              {/* reflejo */}
              <span className="absolute inset-y-0 -left-12 w-8 -skew-x-12 bg-white/30 transition-all duration-500 group-hover:left-[120%]" />

              <span className="relative">
                Empieza gratis
              </span>

              <span className="relative ml-4 text-lg text-[#ff80a8] transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>

          {/* =====================================================
              TEXTO INFERIOR
          ========================================================== */}

          <div className="mt-7 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />

            <span className="text-[8px] font-medium uppercase tracking-[0.22em] text-white/40">
              Prepárate · avanza · alcanza tu objetivo
            </span>

            <span className="h-px w-12 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}