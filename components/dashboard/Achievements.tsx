"use client";

const achievements = [
  {
    title: "Primer simulacro",
    description: "Completa tu primer simulacro.",
    code: "01",
    completed: false,
  },
  {
    title: "Racha de 7 días",
    description: "Estudia durante 7 días seguidos.",
    code: "07",
    completed: false,
  },
  {
    title: "Meta 500",
    description: "Alcanza un puntaje de 500.",
    code: "500",
    completed: false,
  },
  {
    title: "50 preguntas",
    description: "Responde 50 preguntas.",
    code: "50",
    completed: false,
  },
  {
    title: "Nivel Intermedio",
    description: "Obtén un promedio de 350 puntos.",
    code: "350",
    completed: false,
  },
];

export default function Achievements() {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[24px]
        border
        border-slate-200/80
        bg-white
        p-7
        shadow-[0_4px_20px_rgba(15,23,42,0.045)]
        transition-all
        duration-300
        hover:border-slate-300
        hover:shadow-[0_14px_35px_rgba(15,23,42,0.07)]
      "
    >
      {/* DETALLE DECORATIVO */}

      <div
        className="
          pointer-events-none
          absolute
          -right-24
          -top-24
          h-56
          w-56
          rounded-full
          bg-blue-500/[0.035]
          blur-3xl
        "
      />

      {/* CABECERA */}

      <div className="relative mb-7">

        <p
          className="
            text-[10px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-blue-600
          "
        >
          Progreso
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">

          <div>
            <h2
              className="
                text-[21px]
                font-bold
                tracking-[-0.025em]
                text-slate-950
              "
            >
              Logros
            </h2>

            <p className="mt-1 text-[12px] font-medium text-slate-400">
              Reconocimientos que desbloqueas mientras avanzas.
            </p>
          </div>

          <span
            className="
              hidden
              rounded-full
              border
              border-slate-200
              bg-slate-50
              px-3
              py-1.5
              text-[10px]
              font-semibold
              text-slate-500
              sm:block
            "
          >
            {achievements.filter(
              (achievement) => achievement.completed
            ).length}{" "}
            / {achievements.length}
          </span>

        </div>
      </div>

      {/* LISTA */}

      <div className="relative space-y-3">

        {achievements.map((achievement, index) => {

          const completed = achievement.completed;

          return (
            <article
              key={achievement.title}
              className={`
                group
                relative
                flex
                items-center
                gap-4
                overflow-hidden
                rounded-[18px]
                border
                px-4
                py-4
                transition-all
                duration-200

                ${
                  completed
                    ? `
                      border-blue-100
                      bg-blue-50/40
                      hover:border-blue-200
                      hover:bg-blue-50/70
                    `
                    : `
                      border-slate-200
                      bg-white
                      hover:border-slate-300
                      hover:bg-slate-50/60
                    `
                }
              `}
            >
              {/* INDICADOR LATERAL */}

              <div
                className={`
                  absolute
                  left-0
                  top-0
                  h-full
                  w-[3px]
                  transition-all
                  duration-200

                  ${
                    completed
                      ? "bg-blue-600"
                      : "bg-slate-200 group-hover:bg-blue-300"
                  }
                `}
              />

              {/* IDENTIFICADOR */}

              <div
                className={`
                  flex
                  h-[46px]
                  w-[46px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-[14px]
                  border
                  text-[10px]
                  font-bold
                  tracking-[0.08em]
                  transition-all
                  duration-200

                  ${
                    completed
                      ? `
                        border-blue-100
                        bg-blue-50
                        text-blue-600
                      `
                      : `
                        border-slate-200
                        bg-slate-50
                        text-slate-400
                        group-hover:border-blue-100
                        group-hover:bg-blue-50
                        group-hover:text-blue-500
                      `
                  }
                `}
              >
                {achievement.code}
              </div>

              {/* INFORMACIÓN */}

              <div className="min-w-0 flex-1">

                <div className="flex items-center gap-2">

                  <h3
                    className={`
                      truncate
                      text-[13px]
                      font-bold
                      ${
                        completed
                          ? "text-slate-950"
                          : "text-slate-800"
                      }
                    `}
                  >
                    {achievement.title}
                  </h3>

                  <span
                    className="
                      hidden
                      h-1
                      w-1
                      shrink-0
                      rounded-full
                      bg-slate-300
                      sm:block
                    "
                  />

                  <span
                    className="
                      hidden
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.1em]
                      text-slate-400
                      sm:block
                    "
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                </div>

                <p
                  className="
                    mt-1
                    truncate
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  {achievement.description}
                </p>

              </div>

              {/* ESTADO */}

              <div
                className={`
                  shrink-0
                  rounded-full
                  border
                  px-3
                  py-1.5
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.08em]

                  ${
                    completed
                      ? `
                        border-emerald-100
                        bg-emerald-50
                        text-emerald-600
                      `
                      : `
                        border-slate-200
                        bg-slate-50
                        text-slate-400
                      `
                  }
                `}
              >
                {completed ? "Desbloqueado" : "Pendiente"}
              </div>

            </article>
          );
        })}

      </div>
    </section>
  );
}