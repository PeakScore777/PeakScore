"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export type LandingTheme = "light" | "dark";

type CTAProps = {
  theme?: LandingTheme;
};

export default function CTA({ theme: externalTheme }: CTAProps) {
  const [internalTheme, setInternalTheme] =
    useState<LandingTheme>("dark");

  /*
   * ============================================================
   * TEMA
   *
   * Si page.tsx entrega el tema, ese es el que manda.
   *
   * El fallback interno solamente existe para no romper
   * el componente si se utiliza en otro lugar.
   * ============================================================
   */

  useEffect(() => {
    if (externalTheme) {
      setInternalTheme(externalTheme);
      return;
    }

    const syncTheme = () => {
      const currentTheme =
        document.documentElement.dataset.theme;

      setInternalTheme(
        currentTheme === "light" ? "light" : "dark"
      );
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
    };
  }, [externalTheme]);

  const theme = externalTheme ?? internalTheme;
  const isDark = theme === "dark";

  /*
   * ============================================================
   * FONDOS OFICIALES DEL CTA
   *
   * NO SE CAMBIAN.
   * ============================================================
   */

  const desktopLight =
    "/peaky/homepage/CTA-desktop-claro.webp";

  const desktopDark =
    "/peaky/homepage/CTA-desktop-oscuro.webp";

  const mobileLight =
    "/peaky/homepage/CTA-mobile-claro.webp";

  const mobileDark =
    "/peaky/homepage/CTA-mobile-oscuro.webp";

  /*
   * ============================================================
   * COLORES
   * ============================================================
   */

  const titleAccent = isDark
    ? "bg-gradient-to-r from-[#a87cff] via-[#8e70ff] to-[#52ddff] bg-clip-text text-transparent"
    : "bg-gradient-to-r from-[#246fd3] via-[#1687cf] to-[#38b86f] bg-clip-text text-transparent";

  const description = isDark
    ? "text-white/82"
    : "text-[#173252]/88";

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */

  return (
    <section
      id="cta"
      aria-labelledby="cta-title"
      className={`
        relative
        isolate
        min-h-[760px]
        overflow-hidden
        transition-colors
        duration-500
        sm:min-h-[800px]
        lg:min-h-[820px]
        ${
          isDark
            ? "bg-[#02030d]"
            : "bg-[#eaf7ff]"
        }
      `}
    >
      {/* ========================================================
          FONDO DESKTOP OSCURO
      ========================================================= */}

      <div
        className={`
          absolute
          inset-0
          hidden
          md:block
          transition-opacity
          duration-500
          ${
            isDark
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      >
        <Image
          src={desktopDark}
          alt=""
          fill
          priority
          sizes="100%"
          className="
            object-cover
            object-center
          "
        />
      </div>

      {/* ========================================================
          FONDO DESKTOP CLARO
      ========================================================= */}

      <div
        className={`
          absolute
          inset-0
          hidden
          md:block
          transition-opacity
          duration-500
          ${
            isDark
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }
        `}
      >
        <Image
          src={desktopLight}
          alt=""
          fill
          priority
          sizes="100%"
          className="
            object-cover
            object-center
          "
        />
      </div>

      {/* ========================================================
          FONDO MOBILE OSCURO
      ========================================================= */}

      <div
        className={`
          absolute
          inset-0
          md:hidden
          transition-opacity
          duration-500
          ${
            isDark
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      >
        <Image
          src={mobileDark}
          alt=""
          priority
          fill
          sizes="100%"
          className="
            object-cover
            object-center
          "
        />
      </div>

      {/* ========================================================
          FONDO MOBILE CLARO
      ========================================================= */}

      <div
        className={`
          absolute
          inset-0
          md:hidden
          transition-opacity
          duration-500
          ${
            isDark
              ? "pointer-events-none opacity-0"
              : "opacity-100"
          }
        `}
      >
        <Image
          src={mobileLight}
          alt=""
          fill
          sizes="100%"
          className="
            object-cover
            object-center
          "
        />
      </div>

      {/* ========================================================
          CAPA DE LEGIBILIDAD

          El objetivo es proteger el contenido sin tapar
          la ilustración de Peaky.
      ========================================================= */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          inset-0
          ${
            isDark
              ? `
                bg-[linear-gradient(
                  90deg,
                  rgba(1,3,15,0.985)_0%,
                  rgba(2,4,18,0.94)_22%,
                  rgba(2,4,18,0.78)_40%,
                  rgba(2,4,18,0.40)_57%,
                  rgba(2,4,18,0.08)_73%,
                  transparent_84%
                )]
                md:bg-[linear-gradient(
                  90deg,
                  rgba(1,3,15,0.985)_0%,
                  rgba(2,4,18,0.93)_23%,
                  rgba(2,4,18,0.74)_42%,
                  rgba(2,4,18,0.32)_59%,
                  rgba(2,4,18,0.05)_76%,
                  transparent_88%
                )]
              `
              : `
                bg-[linear-gradient(
                  90deg,
                  rgba(240,250,255,0.985)_0%,
                  rgba(240,250,255,0.94)_22%,
                  rgba(240,250,255,0.80)_42%,
                  rgba(240,250,255,0.47)_59%,
                  rgba(240,250,255,0.12)_76%,
                  transparent_88%
                )]
                md:bg-[linear-gradient(
                  90deg,
                  rgba(240,250,255,0.985)_0%,
                  rgba(240,250,255,0.91)_23%,
                  rgba(240,250,255,0.72)_43%,
                  rgba(240,250,255,0.38)_60%,
                  rgba(240,250,255,0.08)_78%,
                  transparent_90%
                )]
              `
          }
        `}
      />

      {/* ========================================================
          HALO DE LEGIBILIDAD

          No es una tarjeta.
          Es una capa atmosférica detrás del contenido.
      ========================================================= */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          left-[-12%]
          top-[16%]
          h-[62%]
          w-[62%]
          rounded-full
          blur-[90px]
          ${
            isDark
              ? "bg-[#030617]/55"
              : "bg-[#effaff]/65"
          }
        `}
      />

      {/* ========================================================
          GRADIENTE INFERIOR
      ========================================================= */}

      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-[35%]
          ${
            isDark
              ? "bg-gradient-to-t from-[#02030d] via-[#02030d]/65 to-transparent"
              : "bg-gradient-to-t from-[#eaf7ff]/75 via-[#eaf7ff]/20 to-transparent"
          }
        `}
      />

      {/* ========================================================
          CONTENIDO
      ========================================================= */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-[760px]
          max-w-[1500px]
          items-start
          px-5
          pb-24
          pt-28
          sm:px-8
          sm:pt-32
          lg:min-h-[820px]
          lg:items-center
          lg:px-14
          lg:py-24
          xl:px-20
        "
      >
        <motion.div
          initial={{
            opacity: 0,
            x: -35,
          }}
          whileInView={{
            opacity: 1,
            x: 0,
          }}
          viewport={{
            once: true,
            margin: "-100px",
          }}
          transition={{
            duration: 0.75,
            ease: "easeOut",
          }}
          className="
            relative
            w-full
            max-w-[570px]
          "
        >
          {/* ====================================================
              IDENTIDAD PEAKSCORE
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -15,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.08,
              duration: 0.45,
            }}
            className="mb-7 flex items-center"
          >
            <div
              className={`
                relative
                flex
                h-8
                items-center
                overflow-hidden
                border
                px-3.5
                ${
                  isDark
                    ? "border-[#806cff]/55 bg-[#050719]/88 shadow-[0_0_22px_rgba(104,82,255,0.18)]"
                    : "border-[#276ed0]/35 bg-[#f8fdff]/88 shadow-[0_8px_25px_rgba(39,91,150,0.12)]"
                }
              `}
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 9px) 0, 100% 9px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
              }}
            >
              <span
                aria-hidden="true"
                className={`
                  mr-2
                  h-1.5
                  w-1.5
                  ${
                    isDark
                      ? "bg-[#5ee7ff] shadow-[0_0_10px_rgba(94,231,255,0.95)]"
                      : "bg-[#2e7de0] shadow-[0_0_8px_rgba(46,125,224,0.45)]"
                  }
                `}
              />

              <span
                className={`
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.28em]
                  ${
                    isDark
                      ? "text-white/80"
                      : "text-[#102e52]"
                  }
                `}
              >
                CRUZAR EL PORTAL
              </span>

              <span
                aria-hidden="true"
                className={`
                  ml-3
                  h-1
                  w-1
                  ${
                    isDark
                      ? "bg-[#a276ff]"
                      : "bg-[#48a7e8]"
                  }
                `}
              />
            </div>

            <span
              aria-hidden="true"
              className={`
                ml-3
                h-px
                w-16
                ${
                  isDark
                    ? "bg-gradient-to-r from-[#8b6dff] to-transparent"
                    : "bg-gradient-to-r from-[#2e7de0] to-transparent"
                }
              `}
            />
          </motion.div>

          {/* ====================================================
              TITULO
          ===================================================== */}

          <motion.h2
            id="cta-title"
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.14,
              duration: 0.65,
            }}
            className={`
              max-w-[620px]
              text-[48px]
              font-black
              leading-[0.91]
              tracking-[-0.055em]
              sm:text-[62px]
              lg:text-[76px]
              ${
                isDark
                  ? "text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.42)]"
                  : "text-[#071a35] drop-shadow-[0_2px_0_rgba(255,255,255,0.65)]"
              }
            `}
          >
            Tu próximo
            <br />
            nivel
            <br />
            <span className={titleAccent}>
              empieza aquí.
            </span>
          </motion.h2>

          {/* ====================================================
              LINEA DE ENERGÍA
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              scaleX: 0,
            }}
            whileInView={{
              opacity: 1,
              scaleX: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.28,
              duration: 0.55,
            }}
            className={`
              mt-6
              h-[3px]
              w-32
              origin-left
              ${
                isDark
                  ? "bg-gradient-to-r from-[#a274ff] via-[#726cff] to-[#58ddff] shadow-[0_0_16px_rgba(117,103,255,0.55)]"
                  : "bg-gradient-to-r from-[#246fd3] via-[#1687cf] to-[#38b86f] shadow-[0_0_12px_rgba(45,139,190,0.20)]"
              }
            `}
          />

          {/* ====================================================
              DESCRIPCIÓN
          ===================================================== */}

          <motion.p
            initial={{
              opacity: 0,
              y: 14,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.34,
              duration: 0.5,
            }}
            className={`
              mt-6
              max-w-[500px]
              text-[14px]
              leading-6
              sm:text-[15px]
              sm:leading-7
              ${description}
            `}
          >
            Tu preparación no termina en un simulacro.
            Cada práctica te acerca a entender mejor tus
            resultados, fortalecer tus áreas y avanzar con
            más confianza hacia el ICFES.
          </motion.p>

          {/* ====================================================
              BOTÓN PRINCIPAL — ÚNETE
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 18,
              scale: 0.96,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.45,
              duration: 0.55,
              ease: "easeOut",
            }}
            className="mt-9"
          >
            <Link
              href="/register"
              aria-label="Únete a PeakScore"
              className={`
                group
                relative
                inline-flex
                min-h-[48px]
                min-w-[116px]
                items-center
                justify-center
                overflow-hidden
                rounded-[9px]
                px-6
                py-3
                text-[14px]
                font-black
                tracking-[-0.01em]
                outline-none
                transition-all
                duration-300
                hover:-translate-y-1
                active:translate-y-0
                active:scale-[0.97]
                focus-visible:ring-2
                focus-visible:ring-offset-2
                ${
                  isDark
                    ? "bg-[#7ed957] text-[#07110a] shadow-[0_10px_30px_rgba(126,217,87,0.22)] hover:bg-[#8bea62] hover:shadow-[0_14px_38px_rgba(126,217,87,0.34)] focus-visible:ring-[#7ed957] focus-visible:ring-offset-[#050719]"
                    : "bg-[#7ed957] text-[#07110a] shadow-[0_10px_26px_rgba(72,153,45,0.20)] hover:bg-[#8bea62] hover:shadow-[0_14px_34px_rgba(72,153,45,0.28)] focus-visible:ring-[#5ebf3e] focus-visible:ring-offset-[#eaf7ff]"
                }
              `}
            >
              <span
                aria-hidden="true"
                className="
                  absolute
                  inset-x-0
                  top-0
                  h-px
                  bg-white/45
                "
              />

              <span
                aria-hidden="true"
                className="
                  absolute
                  -left-8
                  top-0
                  h-full
                  w-8
                  -skew-x-12
                  bg-white/30
                  opacity-0
                  transition-all
                  duration-500
                  group-hover:left-[120%]
                  group-hover:opacity-100
                "
              />

              <span className="relative z-10">
                Únete
              </span>
            </Link>
          </motion.div>

          {/* ====================================================
              MICROCOPY
          ===================================================== */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            whileInView={{
              opacity: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.62,
              duration: 0.45,
            }}
            className="mt-5 flex items-center gap-3"
          >
            <span
              aria-hidden="true"
              className={`
                h-px
                w-7
                ${
                  isDark
                    ? "bg-[#8c76ff]/50"
                    : "bg-[#3975d7]/30"
                }
              `}
            />

            <span
              className={`
                text-[8px]
                font-bold
                uppercase
                tracking-[0.28em]
                ${
                  isDark
                    ? "text-white/48"
                    : "text-[#19365b]/52"
                }
              `}
            >
              Explora · practica · supera tus límites
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* ========================================================
          FIRMA PEAKSCORE
      ========================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-5
          left-1/2
          z-20
          hidden
          -translate-x-1/2
          items-center
          gap-3
          md:flex
        "
      >
        <span
          className={`
            h-px
            w-10
            ${
              isDark
                ? "bg-white/18"
                : "bg-[#17365b]/18"
            }
          `}
        />

        <span
          className={`
            text-[8px]
            font-bold
            uppercase
            tracking-[0.32em]
            ${
              isDark
                ? "text-white/32"
                : "text-[#17365b]/35"
            }
          `}
        >
          PeakScore
        </span>

        <span
          className={`
            h-px
            w-10
            ${
              isDark
                ? "bg-white/18"
                : "bg-[#17365b]/18"
            }
          `}
        />
      </div>
    </section>
  );
}