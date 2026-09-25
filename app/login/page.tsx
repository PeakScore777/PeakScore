"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  Clock3,
  Eye,
  EyeOff,
  FlaskConical,
  Flame,
  LockKeyhole,
  Mail,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { Turnstile } from "@marsidev/react-turnstile";
import { supabase } from "@/lib/supabase/browser";
import PeakMascot from "@/components/login/PeakMascot";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const mascotCoverEyes =
    password.length > 0 && !showPassword;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    if (!captchaToken) {
      setError("Completa la verificación de seguridad antes de iniciar sesión.");
      return;
    }

    setLoading(true);

    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: {
          captchaToken,
        },
      });

    if (signInError) {
      console.error(
        "[PeakScore] Error iniciando sesión:",
        signInError
      );

      setCaptchaToken("");
      setCaptchaKey((previous) => previous + 1);

      if (signInError.message.toLowerCase().includes("captcha")) {
        setError(
          "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente e inténtalo otra vez."
        );
      } else {
        setError(
          "El correo o la contraseña no son correctos."
        );
      }

      setLoading(false);
      return;
    }

    if (!data.session) {
      setCaptchaToken("");
      setCaptchaKey((previous) => previous + 1);
      setError(
        "No se pudo establecer la sesión. Intenta nuevamente."
      );

      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#6178e9]">

      {/* =====================================================
          FONDO
      ===================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >

        {/* Fondo principal */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_50%_48%,#ffffff_0%,#eaf1ff_18%,#aabfff_43%,#748cf0_70%,#596bd8_100%)]
          "
        />

        {/* Azul profundo superior */}

        <div
          className="
            absolute
            inset-x-0
            top-0
            h-[55%]
            bg-gradient-to-b
            from-indigo-700/65
            via-blue-600/30
            to-transparent
          "
        />

        {/* Iluminación central */}

        <div
          className="
            absolute
            left-1/2
            top-1/2
            h-[850px]
            w-[850px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-white/70
            blur-[130px]
          "
        />

        {/* Brillo detrás de Peaky */}

        <div
          className="
            absolute
            left-1/2
            top-[34%]
            h-[480px]
            w-[700px]
            -translate-x-1/2
            rounded-full
            bg-blue-100/70
            blur-[100px]
          "
        />

        {/* =================================================
            PARTÍCULAS PIXEL
        ================================================= */}

        <div className="absolute left-[28%] top-[18%] h-3 w-3 bg-white/70" />
        <div className="absolute left-[31%] top-[21%] h-2 w-2 bg-blue-200" />
        <div className="absolute left-[15%] top-[34%] h-4 w-4 bg-blue-300/60" />
        <div className="absolute left-[35%] top-[72%] h-3 w-3 bg-white/70" />
        <div className="absolute left-[42%] top-[15%] h-2 w-2 bg-white/80" />

        <div className="absolute right-[30%] top-[19%] h-3 w-3 bg-white/70" />
        <div className="absolute right-[25%] top-[31%] h-2 w-2 bg-blue-200" />
        <div className="absolute right-[17%] top-[46%] h-4 w-4 bg-white/60" />
        <div className="absolute right-[33%] bottom-[22%] h-3 w-3 bg-blue-200/70" />
        <div className="absolute right-[41%] bottom-[15%] h-2 w-2 bg-white/70" />

        {/* =================================================
            SÍMBOLOS PIXELADOS
        ================================================= */}

        <div className="absolute left-[32%] top-[8%] text-4xl font-black text-white/20">
          +
        </div>

        <div className="absolute left-[14%] top-[57%] text-5xl font-black text-white/20">
          π
        </div>

        <div className="absolute left-[37%] bottom-[18%] text-4xl font-black text-white/25">
          √
        </div>

        <div className="absolute right-[31%] top-[12%] text-4xl font-black text-white/20">
          Σ
        </div>

        <div className="absolute right-[15%] top-[50%] text-5xl font-black text-white/20">
          %
        </div>

        <div className="absolute right-[35%] bottom-[17%] text-4xl font-black text-white/20">
          ×
        </div>

        {/* =================================================
            TARJETA SIMULACRO IZQUIERDA
        ================================================= */}

        <motion.div
          className="
            absolute
            -left-[125px]
            -top-[35px]
            hidden
            w-[455px]
            rotate-[-15deg]
            overflow-hidden
            rounded-[30px]
            bg-white
            shadow-[0_45px_110px_rgba(30,45,140,0.38)]
            lg:block
          "
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-10 py-8">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
              Simulacro ICFES
            </p>
          </div>

          <div className="p-10">
            <p className="text-[27px] font-black leading-tight text-slate-800">
              Selecciona la
              <br />
              respuesta correcta
            </p>

            <div className="mt-8 space-y-5">
              {["A", "B", "C", "D"].map(
                (letter, index) => (
                  <div
                    key={letter}
                    className="flex items-center gap-4"
                  >
                    <div
                      className={`
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        text-sm
                        font-black
                        ${
                          index === 2
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-blue-300 text-blue-500"
                        }
                      `}
                    >
                      {letter}
                    </div>

                    <div
                      className={`
                        h-3
                        rounded-full
                        ${
                          index === 2
                            ? "w-[75%] bg-blue-500"
                            : "w-[70%] bg-slate-200"
                        }
                      `}
                    />
                  </div>
                )
              )}
            </div>

            <div className="mt-8 h-3 w-[60%] rounded-full bg-blue-200" />
          </div>
        </motion.div>

        {/* =================================================
            LÁPIZ
        ================================================= */}

        <motion.div
          className="
            absolute
            left-[15%]
            top-[16%]
            hidden
            rotate-[25deg]
            lg:block
          "
          animate={{
            y: [0, 14, 0],
            rotate: [25, 29, 25],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative h-[190px] w-[30px] rounded-full bg-gradient-to-b from-blue-400 via-blue-600 to-blue-800 shadow-2xl">
            <div className="absolute left-1/2 top-0 h-[32px] w-[30px] -translate-x-1/2 rounded-t-full bg-pink-300" />

            <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-amber-700" />
          </div>
        </motion.div>

        {/* =================================================
            PLAN DE ESTUDIO
        ================================================= */}

        <motion.div
          className="
            absolute
            left-[23%]
            top-[2%]
            hidden
            w-[220px]
            rotate-[-5deg]
            rounded-[25px]
            bg-white
            p-6
            shadow-[0_30px_80px_rgba(25,40,130,0.28)]
            lg:block
          "
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600">
            Plan de estudio
          </p>

          <p className="mt-2 text-[21px] font-black text-slate-800">
            Esta semana
          </p>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map(
              (_, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square
                    rounded-[5px]
                    ${
                      [0, 5, 9, 13, 20, 27].includes(
                        index
                      )
                        ? "bg-blue-500"
                        : "bg-blue-100"
                    }
                  `}
                />
              )
            )}
          </div>
        </motion.div>

        {/* =================================================
            PEAK AI
        ================================================= */}

        <motion.div
          className="
            absolute
            left-[18%]
            top-[29%]
            hidden
            w-[195px]
            rotate-[-7deg]
            rounded-[24px]
            bg-white
            p-6
            shadow-[0_30px_70px_rgba(25,40,130,0.25)]
            lg:block
          "
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600">
              Peak AI
            </p>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
              <Brain
                size={17}
                className="text-blue-600"
              />
            </div>
          </div>

          <p className="mt-4 text-[17px] font-black leading-tight text-slate-700">
            Explicaciones
            <br />
            inteligentes
          </p>

          <div className="mt-5 h-2 rounded-full bg-slate-200">
            <div className="h-full w-[72%] rounded-full bg-blue-500" />
          </div>
        </motion.div>

        {/* =================================================
            META
        ================================================= */}

        <motion.div
          className="
            absolute
            left-[29%]
            top-[25%]
            hidden
            w-[160px]
            rotate-[3deg]
            rounded-[22px]
            bg-white
            p-5
            shadow-[0_25px_65px_rgba(25,40,130,0.22)]
            lg:block
          "
          animate={{ y: [0, 9, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
            Meta semanal
          </p>

          <p className="mt-2 text-[27px] font-black text-slate-700">
            150
          </p>

          <p className="text-[9px] text-slate-400">
            preguntas resueltas
          </p>

          <div className="mt-4 h-2 rounded-full bg-blue-100">
            <div className="h-full w-[68%] rounded-full bg-blue-500" />
          </div>
        </motion.div>

        {/* =================================================
            READING
        ================================================= */}

        <motion.div
          className="
            absolute
            -left-[75px]
            top-[39%]
            hidden
            w-[365px]
            rotate-[8deg]
            overflow-hidden
            rounded-[30px]
            bg-white
            shadow-[0_45px_100px_rgba(25,40,130,0.38)]
            lg:block
          "
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="bg-slate-800 px-8 py-7">
            <div className="flex items-center gap-3">
              <BookOpen
                size={18}
                className="text-blue-300"
              />

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-300">
                English
              </p>
            </div>

            <p className="mt-3 text-[28px] font-black text-white">
              Reading
            </p>
          </div>

          <div className="p-8">
            <p className="text-[12px] font-semibold leading-5 text-slate-600">
              Read the following text and answer
              the questions.
            </p>

            <div className="mt-6 space-y-3">
              <div className="h-3 rounded-full bg-slate-200" />
              <div className="h-3 w-[88%] rounded-full bg-slate-200" />
              <div className="h-3 w-[74%] rounded-full bg-blue-300" />
              <div className="h-3 w-[91%] rounded-full bg-slate-200" />
              <div className="h-3 w-[68%] rounded-full bg-slate-200" />
            </div>

            <div className="mt-7 grid grid-cols-4 gap-3">
              {["A", "B", "C", "D"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-blue-100 py-3 text-center text-xs font-black text-blue-600"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* =================================================
            CIENCIAS
        ================================================= */}

        <motion.div
          className="
            absolute
            -right-[75px]
            top-[38%]
            hidden
            w-[365px]
            rotate-[-7deg]
            overflow-hidden
            rounded-[30px]
            bg-white
            shadow-[0_45px_100px_rgba(25,40,130,0.38)]
            lg:block
          "
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-7">
            <div className="flex items-center gap-3">
              <FlaskConical
                size={18}
                className="text-white"
              />

              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                Ciencias naturales
              </p>
            </div>

            <p className="mt-3 text-[27px] font-black leading-tight text-white">
              Explora.
              <br />
              Comprende.
            </p>
          </div>

          <div className="p-8">
            <div className="flex justify-center">
              <div className="flex h-[150px] w-[150px] items-center justify-center rounded-full border-[7px] border-blue-200">
                <div className="flex h-[85px] w-[85px] items-center justify-center rounded-full border-[6px] border-blue-500">
                  <div className="h-4 w-4 rounded-full bg-cyan-400" />
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-[10px] font-semibold text-slate-400">
              Analiza la información científica
            </p>
          </div>
        </motion.div>

        {/* =================================================
            LOGRO
        ================================================= */}

        <motion.div
          className="
            absolute
            right-[26%]
            top-[3%]
            hidden
            w-[220px]
            rotate-[4deg]
            rounded-[25px]
            bg-white
            p-6
            shadow-[0_30px_75px_rgba(25,40,130,0.25)]
            lg:block
          "
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
            Logro desbloqueado
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Trophy
                size={27}
                className="text-amber-500"
              />
            </div>

            <div>
              <p className="text-[15px] font-black text-slate-700">
                Constancia
              </p>

              <p className="mt-1 text-[9px] text-slate-400">
                7 días seguidos
              </p>
            </div>
          </div>
        </motion.div>

        {/* =================================================
            MATEMÁTICAS
        ================================================= */}

        <motion.div
          className="
            absolute
            -right-[120px]
            -top-[30px]
            hidden
            w-[455px]
            rotate-[13deg]
            overflow-hidden
            rounded-[30px]
            bg-white
            shadow-[0_45px_110px_rgba(30,45,140,0.38)]
            lg:block
          "
          animate={{ y: [0, 11, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="bg-gradient-to-r from-indigo-700 via-blue-600 to-purple-600 px-10 py-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Matemáticas
            </p>

            <p className="mt-3 text-[28px] font-black text-white">
              Razonamiento
            </p>
          </div>

          <div className="p-9">
            <div className="rounded-[25px] bg-blue-50 p-8">
              <p className="text-center text-[32px] font-black text-blue-600">
                x² + y² = r²
              </p>

              <p className="mt-4 text-center text-[10px] text-slate-400">
                Resuelve y encuentra la solución
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {["π", "√", "%"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl bg-blue-100 py-4 text-center text-xl font-black text-blue-600"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </motion.div>

        {/* =================================================
            RELOJ
        ================================================= */}

        <motion.div
          className="
            absolute
            right-[28%]
            top-[22%]
            hidden
            h-[125px]
            w-[125px]
            items-center
            justify-center
            rounded-full
            border-[7px]
            border-blue-300
            bg-white/90
            shadow-[0_30px_70px_rgba(25,40,130,0.25)]
            lg:flex
          "
          animate={{ y: [0, -9, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Clock3
            size={76}
            strokeWidth={1.4}
            className="text-blue-500"
          />
        </motion.div>

        {/* =================================================
            OBJETIVO
        ================================================= */}

        <motion.div
          className="
            absolute
            right-[20%]
            top-[30%]
            hidden
            w-[165px]
            rotate-[4deg]
            rounded-[23px]
            bg-amber-50
            p-5
            shadow-[0_30px_65px_rgba(25,40,130,0.24)]
            lg:block
          "
          animate={{ y: [0, 9, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[8px] font-black uppercase tracking-[0.17em] text-slate-600">
            Objetivo diario
          </p>

          <p className="mt-2 text-[28px] font-black text-slate-700">
            20
          </p>

          <p className="text-[9px] text-slate-400">
            preguntas hoy
          </p>

          <div className="mt-4 h-2 rounded-full bg-amber-200">
            <div className="h-full w-[72%] rounded-full bg-blue-500" />
          </div>
        </motion.div>

        {/* =================================================
            RENDIMIENTO
        ================================================= */}

        <motion.div
          className="
            absolute
            right-[19%]
            top-[49%]
            hidden
            w-[255px]
            rotate-[2deg]
            rounded-[25px]
            bg-white
            p-6
            shadow-[0_30px_75px_rgba(25,40,130,0.25)]
            lg:block
          "
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
            Rendimiento
          </p>

          <div className="relative mt-5 h-[120px]">
            <div className="absolute inset-x-0 top-[20%] h-px bg-slate-100" />
            <div className="absolute inset-x-0 top-[50%] h-px bg-slate-100" />
            <div className="absolute inset-x-0 top-[80%] h-px bg-slate-100" />

            <svg
              viewBox="0 0 240 120"
              className="absolute inset-0 h-full w-full"
            >
              <polyline
                points="5,98 35,65 65,78 95,50 125,64 155,34 185,53 215,23 235,11"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-blue-500"
              />

              {[
                [5, 98],
                [35, 65],
                [65, 78],
                [95, 50],
                [125, 64],
                [155, 34],
                [185, 53],
                [215, 23],
                [235, 11],
              ].map(([cx, cy], index) => (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r="4"
                  className="fill-blue-500"
                />
              ))}
            </svg>
          </div>
        </motion.div>

        {/* =================================================
            TARJETA PIXEL - RACHA
        ================================================= */}

        <motion.div
          className="
            absolute
            bottom-[5%]
            left-[23%]
            hidden
            w-[205px]
            rotate-[4deg]
            rounded-[25px]
            border-2
            border-blue-200
            bg-white
            p-6
            shadow-[0_30px_70px_rgba(25,40,130,0.25)]
            lg:block
          "
          animate={{ y: [0, 9, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
              Racha de estudio
            </p>

            <Flame
              size={18}
              className="text-orange-400"
            />
          </div>

          <div className="mt-3 flex items-end gap-2">
            <p className="text-[35px] font-black text-slate-800">
              12
            </p>

            <p className="mb-2 text-[9px] font-bold text-slate-400">
              días
            </p>
          </div>

          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: 7 }).map(
              (_, index) => (
                <div
                  key={index}
                  className={`
                    h-6
                    flex-1
                    rounded-md
                    ${
                      index < 5
                        ? "bg-blue-500"
                        : "bg-slate-200"
                    }
                  `}
                />
              )
            )}
          </div>
        </motion.div>

        {/* =================================================
            TU PROGRESO
        ================================================= */}

        <motion.div
          className="
            absolute
            bottom-[2%]
            left-[2%]
            hidden
            w-[325px]
            rotate-[-7deg]
            rounded-[30px]
            bg-white
            p-7
            shadow-[0_45px_100px_rgba(25,40,130,0.38)]
            lg:block
          "
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
            Tu progreso
          </p>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[40px] font-black text-slate-800">
              78%
            </p>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
              ↑12
            </div>
          </div>

          <div className="mt-6 flex h-[105px] items-end justify-center gap-4">
            {[35, 55, 95, 72, 52].map(
              (height, index) => (
                <div
                  key={index}
                  className={`
                    w-10
                    rounded-t-xl
                    ${
                      index === 2
                        ? "bg-blue-600"
                        : "bg-blue-300"
                    }
                  `}
                  style={{
                    height: `${height}%`,
                  }}
                />
              )
            )}
          </div>

          <div className="mt-5 h-3 rounded-full bg-slate-200">
            <div className="h-full w-[78%] rounded-full bg-blue-500" />
          </div>
        </motion.div>

        {/* =================================================
            TROFEO PIXEL
        ================================================= */}

        <motion.div
          className="
            absolute
            bottom-[-30px]
            left-[16%]
            hidden
            lg:block
          "
          animate={{
            y: [0, -10, 0],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex h-[175px] w-[175px] items-center justify-center rounded-full bg-white/10">
            <Trophy
              size={110}
              strokeWidth={1.2}
              className="text-amber-400 drop-shadow-[0_15px_35px_rgba(245,158,11,0.5)]"
            />
          </div>
        </motion.div>

        {/* =================================================
            ICONO PIXEL FIRE
        ================================================= */}

        <motion.div
          className="
            absolute
            bottom-[4%]
            left-[29%]
            hidden
            h-[95px]
            w-[95px]
            items-center
            justify-center
            rounded-[20px]
            border-4
            border-blue-400
            bg-blue-600
            shadow-[0_25px_60px_rgba(25,40,130,0.3)]
            lg:flex
          "
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Zap
            size={52}
            fill="currentColor"
            className="text-cyan-200"
          />
        </motion.div>

        {/* =================================================
            BANCO DE PREGUNTAS
        ================================================= */}

        <motion.div
          className="
            absolute
            bottom-[5%]
            right-[23%]
            hidden
            w-[225px]
            rotate-[-4deg]
            rounded-[25px]
            bg-white
            p-6
            shadow-[0_30px_75px_rgba(25,40,130,0.25)]
            lg:block
          "
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-blue-600">
              Banco de preguntas
            </p>

            <Sparkles
              size={16}
              className="text-blue-500"
            />
          </div>

          <p className="mt-3 text-[27px] font-black text-slate-800">
            +2.500
          </p>

          <p className="text-[10px] text-slate-400">
            preguntas
          </p>

          <div className="mt-5 space-y-2">
            <div className="h-3 rounded-full bg-slate-200" />
            <div className="h-3 w-[82%] rounded-full bg-blue-300" />
            <div className="h-3 w-[65%] rounded-full bg-slate-200" />
          </div>

          <div className="mt-5 rounded-xl bg-blue-50 py-3 text-center text-[9px] font-black text-blue-600">
            PRACTICAR AHORA →
          </div>
        </motion.div>

        {/* =================================================
            RESULTADO
        ================================================= */}

        <motion.div
          className="
            absolute
            bottom-[2%]
            right-[2%]
            hidden
            w-[325px]
            rotate-[6deg]
            rounded-[30px]
            bg-white
            p-7
            shadow-[0_45px_100px_rgba(25,40,130,0.38)]
            lg:block
          "
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            Resultado simulacro
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[50px] font-black text-blue-600">
                82
              </p>

              <p className="text-[9px] text-slate-400">
                Puntaje estimado
              </p>
            </div>

            <div className="flex h-[90px] w-[90px] items-center justify-center rounded-full border-[7px] border-blue-400">
              <span className="text-sm font-black text-blue-600">
                +12%
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-center">
              <p className="text-lg font-black text-emerald-600">
                18
              </p>
              <p className="text-[8px] font-bold text-slate-400">
                Correctas
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-3 text-center">
              <p className="text-lg font-black text-red-500">
                5
              </p>
              <p className="text-[8px] font-bold text-slate-400">
                Incorrectas
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 p-3 text-center">
              <p className="text-lg font-black text-slate-600">
                2
              </p>
              <p className="text-[8px] font-bold text-slate-400">
                Pendientes
              </p>
            </div>
          </div>
        </motion.div>

        {/* =================================================
            ESTRELLAS PIXEL
        ================================================= */}

        <motion.div
          className="absolute right-[13%] bottom-[18%] hidden lg:block"
          animate={{
            y: [0, -12, 0],
            rotate: [0, 8, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Star
            size={54}
            fill="currentColor"
            className="text-amber-300 drop-shadow-lg"
          />
        </motion.div>

        <motion.div
          className="absolute left-[12%] bottom-[28%] hidden lg:block"
          animate={{
            y: [0, 10, 0],
            rotate: [0, -8, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles
            size={52}
            className="text-cyan-200"
          />
        </motion.div>

        {/* =================================================
            MINI TARJETA PIXEL OBJETIVO
        ================================================= */}

        <motion.div
          className="
            absolute
            right-[35%]
            bottom-[7%]
            hidden
            w-[150px]
            rotate-[-5deg]
            rounded-[20px]
            border-2
            border-blue-200
            bg-white
            p-5
            shadow-[0_25px_55px_rgba(25,40,130,0.2)]
            lg:block
          "
          animate={{ y: [0, 7, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center gap-2">
            <Target
              size={18}
              className="text-blue-500"
            />

            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-blue-600">
              Objetivo
            </p>
          </div>

          <p className="mt-3 text-[21px] font-black text-slate-700">
            20
          </p>

          <div className="mt-3 grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }).map(
              (_, index) => (
                <div
                  key={index}
                  className={`
                    h-3
                    rounded-[3px]
                    ${
                      index < 7
                        ? "bg-blue-500"
                        : "bg-blue-100"
                    }
                  `}
                />
              )
            )}
          </div>
        </motion.div>

        {/* =================================================
            LIBROS INFERIORES
        ================================================= */}

        <div className="absolute bottom-[-55px] right-[8%] hidden rotate-[-4deg] lg:block">
          <div className="relative h-[145px] w-[380px] rounded-t-[28px] bg-gradient-to-r from-indigo-950 via-blue-800 to-purple-700 shadow-2xl">

            <div className="absolute bottom-0 left-[35px] h-[125px] w-[290px] rounded-t-[22px] bg-white p-6 shadow-xl">
              <p className="text-[16px] font-black text-blue-700">
                ICFES
              </p>

              <div className="mt-4 space-y-2">
                <div className="h-2 rounded-full bg-slate-200" />
                <div className="h-2 w-[78%] rounded-full bg-blue-200" />
                <div className="h-2 w-[88%] rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            RELLENO EXTRA — PIXEL ART / GAMING HUD
            Solo elementos visuales del fondo.
        ================================================= */}

        <div className="absolute left-[5%] top-[9%] hidden lg:block">
          <div className="grid grid-cols-8 gap-1 opacity-50">
            {Array.from({ length: 40 }).map((_, index) => (
              <div
                key={index}
                className={`h-2.5 w-2.5 rounded-[2px] ${
                  [2, 7, 11, 18, 25, 31, 36].includes(index)
                    ? "bg-cyan-200"
                    : "bg-white/35"
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="absolute left-[8%] top-[22%] hidden lg:block"
          animate={{ y: [0, -8, 0], rotate: [-3, 2, -3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative h-[86px] w-[118px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_50px_rgba(20,35,120,0.2)] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[7px] font-black uppercase tracking-[0.18em] text-blue-600">XP</span>
              <span className="h-2 w-2 bg-amber-300" />
            </div>
            <div className="mt-3 flex items-end gap-1">
              {[25, 45, 35, 65, 50, 80].map((height, index) => (
                <div key={index} className="w-2 rounded-t-sm bg-blue-400" style={{ height: `${height / 2}px` }} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[31%] top-[7%] hidden lg:block"
          animate={{ y: [0, 9, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-[92px] w-[145px] rounded-[18px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_45px_rgba(20,35,120,0.18)]">
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-blue-600">Misión diaria</p>
            <p className="mt-2 text-[16px] font-black text-slate-700">20 / 25</p>
            <div className="mt-3 h-2 rounded-full bg-blue-100">
              <div className="h-full w-[80%] rounded-full bg-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[32%] top-[8%] hidden lg:block"
          animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative h-[105px] w-[145px] rounded-[18px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_45px_rgba(20,35,120,0.18)]">
            <p className="text-[7px] font-black uppercase tracking-[0.18em] text-blue-600">Nivel</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className={`h-3 w-3 rounded-[2px] ${index < 7 ? "bg-blue-500" : "bg-blue-100"}`} />
                ))}
              </div>
              <span className="text-[21px] font-black text-slate-700">08</span>
            </div>
            <div className="mt-3 text-[7px] font-bold text-slate-400">Rumbo al siguiente nivel</div>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[7%] top-[19%] hidden lg:block"
          animate={{ y: [0, 8, 0], rotate: [4, -3, 4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-[78px] w-[112px] rounded-[16px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_45px_rgba(20,35,120,0.2)]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-[2px] bg-amber-300" />
              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-slate-600">Bonus</p>
            </div>
            <p className="mt-2 text-[17px] font-black text-blue-600">+250 XP</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[17%] top-[49%] hidden lg:block"
          animate={{ y: [0, 12, 0], rotate: [3, -3, 3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-[145px] rounded-[20px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_50px_rgba(20,35,120,0.18)]">
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-black uppercase tracking-[0.16em] text-blue-600">Quiz rápido</p>
              <span className="text-[10px] font-black text-blue-500">04</span>
            </div>
            <div className="mt-4 space-y-2">
              {['A', 'B', 'C'].map((letter, index) => (
                <div key={letter} className="flex items-center gap-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-[5px] text-[7px] font-black ${index === 1 ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"}`}>{letter}</div>
                  <div className={`h-2 flex-1 rounded-full ${index === 1 ? "bg-blue-400" : "bg-slate-200"}`} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[39%] top-[37%] hidden lg:block"
          animate={{ y: [0, -7, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-[66px] w-[66px] items-center justify-center rounded-[14px] border-2 border-white/80 bg-blue-500/80 shadow-[0_15px_40px_rgba(37,99,235,0.3)]">
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className={`h-2 w-2 ${index === 4 ? "bg-amber-300" : "bg-white/75"}`} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[37%] top-[42%] hidden lg:block"
          animate={{ y: [0, 8, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-[92px] w-[126px] rounded-[17px] border border-white/70 bg-white/75 p-4 shadow-[0_20px_45px_rgba(20,35,120,0.18)]">
            <p className="text-[7px] font-black uppercase tracking-[0.16em] text-slate-500">Combo</p>
            <p className="mt-2 text-[25px] font-black text-blue-600">x12</p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} className={`h-2 flex-1 rounded-sm ${index < 6 ? "bg-blue-500" : "bg-blue-100"}`} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[6%] bottom-[17%] hidden lg:block"
          animate={{ y: [0, -10, 0], rotate: [-4, 3, -4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative h-[112px] w-[150px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_25px_55px_rgba(20,35,120,0.22)]">
            <p className="text-[7px] font-black uppercase tracking-[0.17em] text-blue-600">XP semanal</p>
            <div className="mt-4 flex items-end gap-1.5">
              {[20, 34, 26, 46, 37, 58, 50, 68].map((height, index) => (
                <div key={index} className={`w-3 rounded-t-[3px] ${index === 7 ? "bg-amber-300" : "bg-blue-400"}`} style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute left-[28%] bottom-[15%] hidden lg:block"
          animate={{ y: [0, 8, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-[74px] w-[132px] items-center gap-3 rounded-[17px] border border-white/70 bg-white/80 px-4 shadow-[0_20px_45px_rgba(20,35,120,0.2)]">
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={index} className={`h-2.5 w-2.5 ${index < 9 ? "bg-blue-500" : "bg-slate-200"}`} />
              ))}
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-blue-600">Progreso</p>
              <p className="text-[18px] font-black text-slate-700">75%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[28%] bottom-[17%] hidden lg:block"
          animate={{ y: [0, -9, 0], rotate: [-3, 2, -3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-[142px] rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_50px_rgba(20,35,120,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-blue-600">Precisión</p>
              <span className="text-[10px] font-black text-emerald-500">+8%</span>
            </div>
            <div className="mt-4 grid grid-cols-10 items-end gap-1">
              {[18, 24, 20, 34, 28, 38, 31, 44, 37, 50].map((height, index) => (
                <div key={index} className="rounded-t-[2px] bg-blue-400" style={{ height: `${height / 2}px` }} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[9%] bottom-[28%] hidden lg:block"
          animate={{ y: [0, 10, 0], rotate: [4, -3, 4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex h-[92px] w-[108px] flex-col justify-between rounded-[18px] border border-white/70 bg-white/80 p-4 shadow-[0_20px_45px_rgba(20,35,120,0.2)]">
            <p className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-500">Ranking</p>
            <div className="flex items-end justify-between">
              <span className="text-[25px] font-black text-amber-400">#3</span>
              <div className="grid grid-cols-3 gap-1">
                <span className="h-3 w-3 bg-blue-200" />
                <span className="h-5 w-3 bg-blue-400" />
                <span className="h-7 w-3 bg-blue-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pixel coins */}
        <motion.div
          className="absolute left-[36%] top-[52%] hidden lg:block"
          animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={`h-2 w-2 ${[2, 6, 7, 8, 12, 16, 17, 18, 22].includes(index) ? "bg-amber-300" : "bg-transparent"}`} />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[16%] top-[62%] hidden lg:block"
          animate={{ y: [0, -8, 0], rotate: [0, -7, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative h-[105px] w-[105px] rounded-[22px] border-4 border-blue-400 bg-blue-600 shadow-[0_25px_55px_rgba(30,64,175,0.35)]">
            <div className="absolute left-1/2 top-[20px] h-5 w-5 -translate-x-1/2 bg-cyan-200" />
            <div className="absolute left-[25px] top-[40px] h-5 w-5 bg-cyan-200" />
            <div className="absolute right-[25px] top-[40px] h-5 w-5 bg-cyan-200" />
            <div className="absolute bottom-[20px] left-1/2 h-5 w-5 -translate-x-1/2 bg-cyan-200" />
          </div>
        </motion.div>

        {/* Doodles / game-map connectors */}
        <div className="absolute left-[22%] top-[42%] hidden h-[120px] w-[180px] lg:block">
          <div className="absolute left-2 top-5 h-2 w-2 bg-white/60" />
          <div className="absolute left-12 top-14 h-2 w-2 bg-cyan-200/80" />
          <div className="absolute left-28 top-6 h-2 w-2 bg-white/60" />
          <div className="absolute left-40 top-20 h-2 w-2 bg-blue-200/70" />
          <div className="absolute left-20 top-28 h-2 w-2 bg-white/60" />
          <div className="absolute left-2 top-5 h-px w-12 rotate-[28deg] bg-white/25" />
          <div className="absolute left-14 top-14 h-px w-18 rotate-[-12deg] bg-white/25" />
          <div className="absolute left-30 top-12 h-px w-14 rotate-[32deg] bg-white/25" />
        </div>

        <div className="absolute right-[22%] top-[37%] hidden lg:block">
          <div className="flex items-end gap-1 opacity-40">
            <span className="h-3 w-3 bg-white" />
            <span className="h-5 w-3 bg-white" />
            <span className="h-7 w-3 bg-white" />
            <span className="h-10 w-3 bg-cyan-200" />
            <span className="h-14 w-3 bg-blue-200" />
          </div>
        </div>

        <div className="absolute left-[43%] bottom-[24%] hidden lg:block opacity-40">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, index) => (
              <span key={index} className={`h-2.5 w-2.5 ${index % 4 === 0 ? "bg-amber-200" : "bg-white/60"}`} />
            ))}
          </div>
        </div>

        <div className="absolute right-[43%] bottom-[28%] hidden lg:block text-5xl font-black text-white/15">★</div>
        <div className="absolute left-[46%] top-[24%] hidden lg:block text-4xl font-black text-white/15">◆</div>
        <div className="absolute right-[25%] top-[56%] hidden lg:block text-5xl font-black text-white/15">✦</div>
        <div className="absolute left-[25%] bottom-[36%] hidden lg:block text-4xl font-black text-white/15">◇</div>

        {/* Mini pixel cards */}
        <motion.div
          className="absolute left-[11%] top-[67%] hidden lg:block"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-[118px] rounded-[16px] border-2 border-blue-200/70 bg-white/75 p-3 shadow-[0_20px_45px_rgba(20,35,120,0.18)]">
            <p className="text-[6px] font-black uppercase tracking-[0.15em] text-blue-600">Streak</p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <span key={index} className={`h-4 flex-1 rounded-[3px] ${index < 5 ? "bg-blue-500" : "bg-slate-200"}`} />
              ))}
            </div>
            <p className="mt-2 text-[15px] font-black text-slate-700">12 días</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[34%] bottom-[9%] hidden lg:block"
          animate={{ y: [0, -8, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-[128px] rounded-[17px] border-2 border-blue-200/70 bg-white/75 p-3 shadow-[0_20px_45px_rgba(20,35,120,0.18)]">
            <div className="flex items-center justify-between">
              <p className="text-[6px] font-black uppercase tracking-[0.15em] text-blue-600">Misión</p>
              <span className="text-[8px] font-black text-amber-400">★</span>
            </div>
            <p className="mt-2 text-[16px] font-black text-slate-700">7 / 10</p>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div className="h-full w-[70%] rounded-full bg-blue-500" />
            </div>
          </div>
        </motion.div>

        {/* Pixel diamonds */}
        <motion.div
          className="absolute left-[5%] bottom-[7%] hidden lg:block"
          animate={{ y: [0, -12, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={`h-3 w-3 ${[2, 6, 8, 10, 12, 14, 16, 18, 22].includes(index) ? "bg-cyan-200" : "bg-transparent"}`} />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="absolute right-[4%] bottom-[8%] hidden lg:block"
          animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={`h-3 w-3 ${[2, 6, 8, 10, 12, 14, 16, 18, 22].includes(index) ? "bg-amber-200" : "bg-transparent"}`} />
            ))}
          </div>
        </motion.div>

        {/* Educational doodles */}
        <div className="absolute left-[35%] top-[28%] hidden lg:block text-3xl font-black text-white/20">∑</div>
        <div className="absolute left-[61%] top-[18%] hidden lg:block text-4xl font-black text-white/20">f(x)</div>
        <div className="absolute right-[38%] top-[30%] hidden lg:block text-3xl font-black text-white/20">π</div>
        <div className="absolute left-[13%] bottom-[43%] hidden lg:block text-4xl font-black text-white/20">∫</div>
        <div className="absolute right-[12%] bottom-[42%] hidden lg:block text-4xl font-black text-white/20">%</div>

        {/* Tiny stars / squares distributed around the scene */}
        <div className="absolute left-[4%] top-[39%] hidden lg:block h-3 w-3 bg-cyan-200/60" />
        <div className="absolute left-[10%] top-[53%] hidden lg:block h-2 w-2 bg-white/60" />
        <div className="absolute left-[26%] top-[57%] hidden lg:block h-3 w-3 bg-blue-200/60" />
        <div className="absolute left-[48%] top-[11%] hidden lg:block h-2 w-2 bg-white/70" />
        <div className="absolute left-[54%] top-[31%] hidden lg:block h-3 w-3 bg-cyan-200/60" />
        <div className="absolute left-[64%] top-[52%] hidden lg:block h-2 w-2 bg-white/70" />
        <div className="absolute right-[29%] top-[35%] hidden lg:block h-3 w-3 bg-blue-200/70" />
        <div className="absolute right-[20%] top-[71%] hidden lg:block h-2 w-2 bg-white/60" />
        <div className="absolute right-[6%] top-[56%] hidden lg:block h-3 w-3 bg-cyan-200/60" />

        {/* Small game-style status bars */}
        <div className="absolute left-[44%] top-[67%] hidden lg:block w-[95px] opacity-55">
          <div className="mb-1 flex justify-between text-[6px] font-black uppercase text-white">
            <span>HP</span><span>90%</span>
          </div>
          <div className="h-2 border border-white/60 bg-white/20 p-px">
            <div className="h-full w-[90%] bg-cyan-200" />
          </div>
        </div>

        <div className="absolute right-[46%] top-[72%] hidden lg:block w-[105px] opacity-55">
          <div className="mb-1 flex justify-between text-[6px] font-black uppercase text-white">
            <span>XP</span><span>68%</span>
          </div>
          <div className="h-2 border border-white/60 bg-white/20 p-px">
            <div className="h-full w-[68%] bg-amber-200" />
          </div>
        </div>

        {/* Floating pixel chest */}
        <motion.div
          className="absolute right-[42%] top-[13%] hidden lg:block"
          animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative h-[58px] w-[70px] border-4 border-amber-300 bg-amber-400 shadow-[0_15px_35px_rgba(245,158,11,0.25)]">
            <div className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 bg-amber-200" />
            <div className="absolute left-1/2 top-[22px] h-3 w-5 -translate-x-1/2 border-2 border-amber-600 bg-amber-100" />
          </div>
        </motion.div>

        {/* Floating pixel flag */}
        <motion.div
          className="absolute left-[41%] bottom-[13%] hidden lg:block"
          animate={{ y: [0, 9, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative h-[78px] w-[86px]">
            <div className="absolute bottom-0 left-3 h-[72px] w-2 bg-white/60" />
            <div className="absolute left-5 top-1 grid grid-cols-5 gap-1">
              {Array.from({ length: 20 }).map((_, index) => (
                <span key={index} className={`h-2.5 w-2.5 ${index < 13 ? "bg-blue-300" : "bg-transparent"}`} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Extra ambient glow points */}
        <div className="absolute left-[20%] top-[13%] hidden lg:block h-[140px] w-[140px] rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute right-[21%] top-[14%] hidden lg:block h-[160px] w-[160px] rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute left-[19%] bottom-[12%] hidden lg:block h-[180px] w-[180px] rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute right-[19%] bottom-[11%] hidden lg:block h-[180px] w-[180px] rounded-full bg-cyan-300/10 blur-3xl" />

        {/* =================================================
            BRILLO FINAL PARA PROTEGER EL CENTRO
        ================================================= */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.78)_18%,rgba(255,255,255,0.28)_43%,transparent_68%)]
          "
        />
      </div>

      {/* =====================================================
          CONTENIDO CENTRAL
      ===================================================== */}

      <div className="relative z-30 flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">

        <div className="w-full max-w-[425px]">

          {/* =================================================
              MASCOTA
          ================================================= */}

          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              relative
              z-20
              mb-[-8px]
              flex
              justify-center
            "
          >
            <PeakMascot
              coverEyes={mascotCoverEyes}
              welcome={false}
            />
          </motion.div>

          {/* =================================================
              LOGIN
          ================================================= */}

          <motion.section
            initial={{
              opacity: 0,
              y: 15,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.08,
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              relative
              z-20
              overflow-hidden
              rounded-[28px]
              border
              border-white/95
              bg-white/[0.98]
              px-7
              py-8
              shadow-[0_45px_110px_rgba(27,47,145,0.34)]
              backdrop-blur-xl
              sm:px-9
              sm:py-9
            "
          >

            <div
              className="
                absolute
                left-12
                right-12
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-blue-400
                to-transparent
              "
            />

            {/* =================================================
                LOGO
            ================================================= */}

            <div className="mb-8 flex flex-col items-center">

              <div className="flex items-center gap-2.5">

                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src="/images/branding/peakscore-logo-transparente.png"
                    alt="PeakScore"
                    fill
                    priority
                    sizes="40px"
                    className="object-contain"
                  />
                </div>

                <div className="text-[21px] font-extrabold tracking-[-0.045em]">
                  <span className="text-slate-950">
                    Peak
                  </span>

                  <span className="text-blue-600">
                    Score
                  </span>
                </div>

              </div>

              <p className="mt-2 text-[10px] font-medium text-slate-400">
                Inicia sesión para continuar.
              </p>
            </div>

            {/* =================================================
                FORMULARIO
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-bold text-slate-800"
                >
                  Correo electrónico
                </label>

                <div
                  className={`
                    flex
                    h-[52px]
                    items-center
                    overflow-hidden
                    rounded-[11px]
                    border
                    bg-white
                    transition-all
                    duration-200
                    ${
                      emailFocused
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-slate-200"
                    }
                  `}
                >

                  <div
                    className="
                      ml-2
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-[9px]
                      bg-slate-50
                      text-slate-400
                    "
                  >
                    <Mail
                      size={16}
                      strokeWidth={1.8}
                    />
                  </div>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    onFocus={() =>
                      setEmailFocused(true)
                    }
                    onBlur={() =>
                      setEmailFocused(false)
                    }
                    placeholder="correo@ejemplo.com"
                    className="
                      h-full
                      min-w-0
                      flex-1
                      bg-transparent
                      px-3
                      text-[12px]
                      font-medium
                      text-slate-800
                      outline-none
                      placeholder:text-slate-400
                    "
                  />

                </div>
              </div>

              {/* PASSWORD */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-[11px] font-bold text-slate-800"
                  >
                    Contraseña
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700"
                  >
                    ¿La olvidaste?
                  </Link>

                </div>

                <div
                  className={`
                    flex
                    h-[52px]
                    items-center
                    overflow-hidden
                    rounded-[11px]
                    border
                    bg-white
                    transition-all
                    duration-200
                    ${
                      passwordFocused
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-slate-200"
                    }
                  `}
                >

                  <div
                    className="
                      ml-2
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-[9px]
                      bg-slate-50
                      text-slate-400
                    "
                  >
                    <LockKeyhole
                      size={16}
                      strokeWidth={1.8}
                    />
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    onFocus={() =>
                      setPasswordFocused(true)
                    }
                    onBlur={() =>
                      setPasswordFocused(false)
                    }
                    placeholder="Tu contraseña"
                    className="
                      h-full
                      min-w-0
                      flex-1
                      bg-transparent
                      px-3
                      text-[12px]
                      font-medium
                      text-slate-800
                      outline-none
                      placeholder:text-slate-400
                    "
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="
                      mr-1.5
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-[9px]
                      text-slate-400
                      transition
                      hover:bg-blue-50
                      hover:text-blue-600
                      active:scale-95
                    "
                  >
                    {showPassword ? (
                      <EyeOff
                        size={17}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Eye
                        size={17}
                        strokeWidth={1.8}
                      />
                    )}
                  </button>

                </div>
              </div>

              {/* CAPTCHA */}

              <div className="flex justify-center">
                <Turnstile
                  key={`login-captcha-${captchaKey}`}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => {
                    setCaptchaToken(token);
                    setError("");
                  }}
                  onExpire={() => {
                    setCaptchaToken("");
                    setError(
                      "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente."
                    );
                  }}
                  onError={() => {
                    setCaptchaToken("");
                    setError(
                      "No se pudo cargar la verificación de seguridad. Inténtalo nuevamente."
                    );
                  }}
                  options={{
                    language: "es",
                    size: "flexible",
                    appearance: "always",
                  }}
                />
              </div>

              {/* ERROR */}

              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    rounded-[10px]
                    border
                    border-red-100
                    bg-red-50
                    px-3
                    py-2.5
                    text-center
                    text-[10px]
                    font-semibold
                    text-red-600
                  "
                >
                  {error}
                </motion.div>
              )}

              {/* BOTÓN */}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={
                  !loading
                    ? { y: -1 }
                    : undefined
                }
                whileTap={
                  !loading
                    ? { scale: 0.985 }
                    : undefined
                }
                className="
                  flex
                  h-[52px]
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-[11px]
                  bg-gradient-to-r
                  from-blue-600
                  to-blue-500
                  text-[12px]
                  font-bold
                  text-white
                  shadow-[0_14px_28px_rgba(37,99,235,0.30)]
                  transition
                  hover:from-blue-700
                  hover:to-blue-600
                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              >
                {loading ? (
                  <>
                    <span
                      className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/40
                        border-t-white
                      "
                    />

                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar sesión

                    <ArrowRight
                      size={16}
                      strokeWidth={2}
                    />
                  </>
                )}
              </motion.button>

            </form>

            {/* =================================================
                REGISTRO
            ================================================= */}

            <div className="mt-6 text-center">

              <p className="text-[10px] font-medium text-slate-400">
                ¿No tienes una cuenta?
              </p>

              <Link
                href="/register"
                className="
                  mt-1
                  inline-flex
                  items-center
                  gap-1
                  text-[11px]
                  font-bold
                  text-blue-600
                  hover:text-blue-700
                "
              >
                Crear cuenta

                <ArrowRight
                  size={13}
                  strokeWidth={2}
                />
              </Link>

            </div>

            {/* =================================================
                DIVISOR
            ================================================= */}

            <div className="mt-7 flex items-center justify-center gap-3">

              <span className="h-px w-8 bg-slate-200" />

              <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-slate-300">
                PeakScore
              </span>

              <span className="h-px w-8 bg-slate-200" />

            </div>

          </motion.section>

          {/* =================================================
              VOLVER
          ================================================= */}

          <div className="mt-5 flex justify-center">

            <Link
              href="/"
              className="
                inline-flex
                items-center
                gap-1.5
                text-[10px]
                font-medium
                text-white/80
                transition
                hover:text-white
              "
            >
              <ArrowLeft
                size={13}
                strokeWidth={1.8}
              />

              Volver al inicio
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}