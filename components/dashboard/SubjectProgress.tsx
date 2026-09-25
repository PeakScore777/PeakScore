"use client";

interface SubjectProps {
  subject: string;
  percentage: number;
}

interface SubjectStyle {
  image: string;
  color: string;
  glow: string;
  bar: string;
  border: string;
  particle: string;
}

function getSubjectStyle(subject: string): SubjectStyle {
  const normalized = subject
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // =========================================================
  // MATEMÁTICAS
  // =========================================================

  if (normalized.includes("matem")) {
    return {
      image: "/dashboard/matematicaprogress.png",
      color: "#67e8f9",
      glow: "rgba(34,211,238,0.70)",
      bar: "from-cyan-400 via-sky-400 to-cyan-300",
      border: "border-cyan-400/30",
      particle: "bg-cyan-300",
    };
  }

  // =========================================================
  // LECTURA CRÍTICA
  // =========================================================

  if (normalized.includes("lectura")) {
    return {
      image: "/dashboard/lecturaprogress.png",
      color: "#6ee7b7",
      glow: "rgba(52,211,153,0.70)",
      bar: "from-emerald-400 via-teal-400 to-emerald-300",
      border: "border-emerald-400/30",
      particle: "bg-emerald-300",
    };
  }

  // =========================================================
  // CIENCIAS NATURALES
  // =========================================================

  if (normalized.includes("ciencias")) {
    return {
      image: "/dashboard/naturalesprogress.png",
      color: "#86efac",
      glow: "rgba(74,222,128,0.70)",
      bar: "from-green-400 via-emerald-400 to-green-300",
      border: "border-green-400/30",
      particle: "bg-green-300",
    };
  }

  // =========================================================
  // SOCIALES Y CIUDADANAS
  // =========================================================

  if (normalized.includes("sociales")) {
    return {
      image: "/dashboard/socialesprogress.png",
      color: "#fcd34d",
      glow: "rgba(251,191,36,0.70)",
      bar: "from-amber-400 via-yellow-400 to-orange-300",
      border: "border-amber-400/30",
      particle: "bg-amber-300",
    };
  }

  // =========================================================
  // INGLÉS
  // =========================================================

  if (normalized.includes("ingles")) {
    return {
      image: "/dashboard/inglesprogress.png",
      color: "#c4b5fd",
      glow: "rgba(167,139,250,0.70)",
      bar: "from-violet-400 via-purple-400 to-fuchsia-300",
      border: "border-violet-400/30",
      particle: "bg-violet-300",
    };
  }

  // =========================================================
  // FALLBACK
  // =========================================================

  return {
    image: "/dashboard/lecturaprogress.png",
    color: "#67e8f9",
    glow: "rgba(34,211,238,0.55)",
    bar: "from-cyan-400 to-blue-400",
    border: "border-cyan-400/20",
    particle: "bg-cyan-300",
  };
}

export default function SubjectProgress({
  subject,
  percentage,
}: SubjectProps) {
  const safePercentage = Math.min(
    Math.max(Number(percentage) || 0, 0),
    100
  );

  const style = getSubjectStyle(subject);

  return (
    <div className="group relative">

      {/* =====================================================
          FILA PRINCIPAL
      ===================================================== */}

      <div
        className={`
          relative
          flex
          min-h-[76px]
          items-center
          overflow-hidden
          rounded-[18px]
          border
          ${style.border}
          bg-[#061a31]
          px-4
          py-2
          transition-all
          duration-300
          hover:bg-[#09223b]
        `}
      >

        {/* ===================================================
            GLOW AMBIENTAL
        =================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-0
            top-1/2
            h-[100px]
            w-[130px]
            -translate-y-1/2
            rounded-full
            blur-3xl
            opacity-15
            transition-all
            duration-500
            group-hover:opacity-30
          "
          style={{
            backgroundColor: style.glow,
          }}
        />

        {/* ===================================================
            PARTÍCULAS
        =================================================== */}

        <span
          className={`
            absolute
            left-[12px]
            top-[13px]
            h-[4px]
            w-[4px]
            rounded-full
            ${style.particle}
            opacity-80
          `}
          style={{
            boxShadow: `0 0 8px ${style.glow}`,
          }}
        />

        <span
          className={`
            absolute
            left-[45px]
            top-[8px]
            h-[3px]
            w-[3px]
            rounded-full
            ${style.particle}
            opacity-60
          `}
          style={{
            boxShadow: `0 0 7px ${style.glow}`,
          }}
        />

        <span
          className={`
            absolute
            bottom-[10px]
            left-[24px]
            h-[3px]
            w-[3px]
            rounded-full
            ${style.particle}
            opacity-60
          `}
          style={{
            boxShadow: `0 0 7px ${style.glow}`,
          }}
        />

        {/* ===================================================
            ICONO DE LA MATERIA
        =================================================== */}

        <div
          className="
            relative
            z-10
            flex
            h-[68px]
            w-[76px]
            shrink-0
            items-center
            justify-center
          "
        >

          {/* Halo */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              h-[58px]
              w-[58px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              blur-xl
              opacity-20
              transition-all
              duration-500
              group-hover:scale-125
              group-hover:opacity-35
            "
            style={{
              backgroundColor: style.glow,
            }}
          />

          {/* Imagen real */}

          <img
            src={style.image}
            alt={`Icono de ${subject}`}
            className="
              relative
              z-10
              h-[66px]
              w-[66px]
              object-contain
              transition-transform
              duration-300
              group-hover:scale-110
            "
          />

          {/* Partícula superior */}

          <span
            className={`
              absolute
              right-[2px]
              top-[6px]
              z-20
              h-[4px]
              w-[4px]
              rounded-full
              ${style.particle}
            `}
            style={{
              boxShadow: `0 0 8px ${style.glow}`,
            }}
          />

          {/* Partícula inferior */}

          <span
            className={`
              absolute
              bottom-[5px]
              left-[5px]
              z-20
              h-[3px]
              w-[3px]
              rounded-full
              ${style.particle}
            `}
            style={{
              boxShadow: `0 0 7px ${style.glow}`,
            }}
          />
        </div>

        {/* ===================================================
            NOMBRE
        =================================================== */}

        <div
          className="
            relative
            z-10
            w-[175px]
            shrink-0
            md:w-[200px]
          "
        >
          <span
            className="
              block
              truncate
              text-[13px]
              font-black
              text-white
              md:text-[14px]
            "
          >
            {subject}
          </span>
        </div>

        {/* ===================================================
            BARRA
        =================================================== */}

        <div className="relative z-10 min-w-0 flex-1">

          <div
            className="
              relative
              h-[11px]
              w-full
              overflow-hidden
              rounded-full
              border
              border-[#315b84]
              bg-[#102b49]
              shadow-[inset_0_2px_5px_rgba(0,0,0,0.45)]
            "
          >

            {/* Glow */}

            {safePercentage > 0 && (
              <div
                className="
                  absolute
                  inset-y-0
                  left-0
                  rounded-full
                  blur-[6px]
                  opacity-50
                "
                style={{
                  width: `${safePercentage}%`,
                  backgroundColor: style.glow,
                }}
              />
            )}

            {/* Barra */}

            <div
              className={`
                relative
                h-full
                rounded-full
                bg-gradient-to-r
                ${style.bar}
                transition-[width]
                duration-1000
                ease-out
              `}
              style={{
                width: `${safePercentage}%`,
                boxShadow:
                  safePercentage > 0
                    ? `0 0 12px ${style.glow}`
                    : "none",
              }}
            >

              {/* Brillo superior */}

              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-0
                  h-[3px]
                  rounded-full
                  bg-white/40
                "
              />

            </div>
          </div>
        </div>

        {/* ===================================================
            PORCENTAJE
        =================================================== */}

        <div
          className="
            relative
            z-10
            ml-5
            flex
            w-[48px]
            shrink-0
            justify-end
          "
        >
          <span
            className="
              text-[16px]
              font-black
              tabular-nums
            "
            style={{
              color: style.color,
              textShadow: `0 0 10px ${style.glow}`,
            }}
          >
            {safePercentage}%
          </span>
        </div>

      </div>
    </div>
  );
}