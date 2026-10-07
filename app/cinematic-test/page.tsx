"use client";

import { useEffect, useMemo, useState } from "react";

/* =========================================================
   ASSETS
   ========================================================= */

const BIOME_SRC =
  "/biomes/math/level-01/biome.png";

const IDLE_SHEET =
  "/characters/peaky/animations/idle/peaky-idle-sheet.png";

const WALK_SHEET =
  "/characters/peaky/animations/walk-right/peaky-walk-right-sheet.png";

const WALK_STATIC =
  "/characters/peaky/animations/walk-right/peaky-walk-right-static.png";

const CONFUSED =
  "/characters/peaky/explanations/confused.webp";

const HAPPY =
  "/characters/peaky/explanations/happy.webp";

/* =========================================================
   SPRITE
   ========================================================= */

/*
  Idle:

  8 frames en una fila.

  Walk:

  8 frames en una fila.

  Cada frame ocupa 1/8 del sheet.
*/

const FRAME_COUNT = 8;

/* =========================================================
   TIMING
   ========================================================= */

const INTRO_TIME = 1800;

const DIALOGUE_1_TIME = 1800;

const DIALOGUE_2_TIME = 1800;

const PAN_TO_MAGE_TIME = 1000;

const MAGE_HOLD_TIME = 1800;

const RETURN_CAMERA_TIME = 1200;

const WALK_TIME = 5000;

/*
  10 FPS
  1000ms / 10 = 100ms
*/
const WALK_FRAME_TIME = 100;

/* =========================================================
   PEAKY
   ========================================================= */

const START_X = 17;

const END_X = 69;

/*
  PUNTO ÚNICO DEL SUELO PARA PEAKY.

  Idle, Walk y Static utilizan exactamente
  el mismo valor vertical.
*/
const PEAKY_GROUND_BOTTOM = 16.5;

const PEAKY_SIZE =
  "clamp(210px, 23vw, 300px)";

/* =========================================================
   CAMERA
   ========================================================= */

const ZOOM = 1.55;

const PEAKY_FOCUS = {
  x: 0.2,
  y: 0.68,
};

const MAGE_FOCUS = {
  x: 0.82,
  y: 0.55,
};

/* =========================================================
   HELPERS
   ========================================================= */

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    Math.max(value, min),
    max
  );
}

function lerp(
  start: number,
  end: number,
  amount: number
) {
  return (
    start +
    (end - start) * amount
  );
}

function easeInOut(
  value: number
) {
  if (value < 0.5) {
    return (
      4 *
      value *
      value *
      value
    );
  }

  return (
    1 -
    Math.pow(
      -2 * value + 2,
      3
    ) /
      2
  );
}

/* =========================================================
   PHASE
   ========================================================= */

type Phase =
  | "loading"
  | "intro"
  | "dialogue1"
  | "dialogue2"
  | "panToMage"
  | "mageHold"
  | "return"
  | "walk"
  | "finished";

/* =========================================================
   SPRITE FRAME
   ========================================================= */

function SpriteFrame({
  src,
  frame,
}: {
  src: string;
  frame: number;
}) {
  return (
    <div
      className="
        relative
        h-full
        w-full
        overflow-hidden
      "
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="
          absolute
          left-0
          top-0
          h-full
          max-w-none
          select-none
        "
        style={{
          width: `${FRAME_COUNT * 100}%`,
          transform: `translateX(-${
            frame *
            (100 / FRAME_COUNT)
          }%)`,
        }}
      />
    </div>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function CinematicTestPage() {
  const [elapsed, setElapsed] =
    useState(0);

  const [loaded, setLoaded] =
    useState(false);

  const [restart, setRestart] =
    useState(0);

  const [viewport, setViewport] =
    useState({
      width: 1280,
      height: 720,
    });

  /* =======================================================
     LOAD ASSETS
     ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const sources = [
      BIOME_SRC,
      IDLE_SHEET,
      WALK_SHEET,
      WALK_STATIC,
      CONFUSED,
      HAPPY,
    ];

    let loadedCount = 0;

    const checkLoaded = () => {
      loadedCount += 1;

      if (
        loadedCount ===
          sources.length &&
        !cancelled
      ) {
        setLoaded(true);
      }
    };

    const images =
      sources.map((src) => {
        const image =
          new Image();

        image.onload =
          checkLoaded;

        image.onerror =
          checkLoaded;

        image.src = src;

        return image;
      });

    return () => {
      cancelled = true;

      images.forEach(
        (image) => {
          image.onload = null;
          image.onerror = null;
        }
      );
    };
  }, [restart]);

  /* =======================================================
     VIEWPORT
     ======================================================= */

  useEffect(() => {
    const updateViewport =
      () => {
        setViewport({
          width:
            window.innerWidth,
          height:
            window.innerHeight,
        });
      };

    updateViewport();

    window.addEventListener(
      "resize",
      updateViewport
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateViewport
      );
    };
  }, []);

  /* =======================================================
     CLOCK
     ======================================================= */

  useEffect(() => {
    if (!loaded) {
      return;
    }

    let animationFrame = 0;

    const start =
      performance.now();

    const tick = (
      now: number
    ) => {
      setElapsed(
        now - start
      );

      animationFrame =
        requestAnimationFrame(
          tick
        );
    };

    animationFrame =
      requestAnimationFrame(
        tick
      );

    return () => {
      cancelAnimationFrame(
        animationFrame
      );
    };
  }, [loaded, restart]);

  /* =======================================================
     TIMELINE
     ======================================================= */

  const timeline =
    useMemo(() => {
      const introEnd =
        INTRO_TIME;

      const dialogue1End =
        introEnd +
        DIALOGUE_1_TIME;

      const dialogue2End =
        dialogue1End +
        DIALOGUE_2_TIME;

      const panEnd =
        dialogue2End +
        PAN_TO_MAGE_TIME;

      const mageEnd =
        panEnd +
        MAGE_HOLD_TIME;

      const returnEnd =
        mageEnd +
        RETURN_CAMERA_TIME;

      const walkEnd =
        returnEnd +
        WALK_TIME;

      return {
        introEnd,
        dialogue1End,
        dialogue2End,
        panEnd,
        mageEnd,
        returnEnd,
        walkEnd,
      };
    }, []);

  /* =======================================================
     CURRENT PHASE
     ======================================================= */

  const phase =
    useMemo<Phase>(() => {
      if (!loaded) {
        return "loading";
      }

      if (
        elapsed <
        timeline.introEnd
      ) {
        return "intro";
      }

      if (
        elapsed <
        timeline.dialogue1End
      ) {
        return "dialogue1";
      }

      if (
        elapsed <
        timeline.dialogue2End
      ) {
        return "dialogue2";
      }

      if (
        elapsed <
        timeline.panEnd
      ) {
        return "panToMage";
      }

      if (
        elapsed <
        timeline.mageEnd
      ) {
        return "mageHold";
      }

      if (
        elapsed <
        timeline.returnEnd
      ) {
        return "return";
      }

      if (
        elapsed <
        timeline.walkEnd
      ) {
        return "walk";
      }

      return "finished";
    }, [
      elapsed,
      loaded,
      timeline,
    ]);

  /* =======================================================
     PEAKY X POSITION
     ======================================================= */

  const peakyX =
    useMemo(() => {
      /*
        Durante intro, diálogos
        y movimientos de cámara,
        Peaky permanece quieto.
      */

      if (
        phase === "intro" ||
        phase === "dialogue1" ||
        phase === "dialogue2" ||
        phase === "panToMage" ||
        phase === "mageHold" ||
        phase === "return"
      ) {
        return START_X;
      }

      /*
        Cuando termina la caminata.
      */

      if (
        phase === "finished"
      ) {
        return END_X;
      }

      /*
        Durante walk.
      */

      const walkElapsed =
        Math.max(
          0,
          elapsed -
            timeline.returnEnd
        );

      const progress =
        clamp(
          walkElapsed /
            WALK_TIME,
          0,
          1
        );

      return lerp(
        START_X,
        END_X,
        progress
      );
    }, [
      elapsed,
      phase,
      timeline.returnEnd,
    ]);

  /* =======================================================
     WALK FRAME
     ======================================================= */

  const peakyFrame =
    useMemo(() => {
      if (
        phase !== "walk"
      ) {
        return 0;
      }

      const walkElapsed =
        Math.max(
          0,
          elapsed -
            timeline.returnEnd
        );

      return (
        Math.floor(
          walkElapsed /
            WALK_FRAME_TIME
        ) % FRAME_COUNT
      );
    }, [
      elapsed,
      phase,
      timeline.returnEnd,
    ]);

  /* =======================================================
     CAMERA
     ======================================================= */

  const camera =
    useMemo(() => {
      const width =
        viewport.width;

      const height =
        viewport.height;

      const calculateCamera =
        (
          focusX: number,
          focusY: number,
          zoom: number
        ) => {
          const scaledWidth =
            width * zoom;

          const scaledHeight =
            height * zoom;

          const targetX =
            width / 2 -
            focusX *
              scaledWidth;

          const targetY =
            height / 2 -
            focusY *
              scaledHeight;

          const minX =
            width -
            scaledWidth;

          const minY =
            height -
            scaledHeight;

          return {
            x: clamp(
              targetX,
              minX,
              0
            ),
            y: clamp(
              targetY,
              minY,
              0
            ),
            zoom,
          };
        };

      const peakyCamera =
        calculateCamera(
          PEAKY_FOCUS.x,
          PEAKY_FOCUS.y,
          ZOOM
        );

      const mageCamera =
        calculateCamera(
          MAGE_FOCUS.x,
          MAGE_FOCUS.y,
          ZOOM
        );

      /*
        Peaky al inicio.
      */

      if (
        phase === "intro" ||
        phase === "dialogue1" ||
        phase === "dialogue2"
      ) {
        return peakyCamera;
      }

      /*
        Cámara va hacia el mago.
      */

      if (
        phase === "panToMage"
      ) {
        const progress =
          clamp(
            (
              elapsed -
              timeline.dialogue2End
            ) /
              PAN_TO_MAGE_TIME,
            0,
            1
          );

        const eased =
          easeInOut(
            progress
          );

        return {
          x: lerp(
            peakyCamera.x,
            mageCamera.x,
            eased
          ),
          y: lerp(
            peakyCamera.y,
            mageCamera.y,
            eased
          ),
          zoom: ZOOM,
        };
      }

      /*
        Mago.
      */

      if (
        phase === "mageHold"
      ) {
        return mageCamera;
      }

      /*
        Cámara vuelve a Peaky
        y hace zoom out.
      */

      if (
        phase === "return"
      ) {
        const progress =
          clamp(
            (
              elapsed -
              timeline.mageEnd
            ) /
              RETURN_CAMERA_TIME,
            0,
            1
          );

        const eased =
          easeInOut(
            progress
          );

        return {
          x: lerp(
            mageCamera.x,
            0,
            eased
          ),
          y: lerp(
            mageCamera.y,
            0,
            eased
          ),
          zoom: lerp(
            ZOOM,
            1,
            eased
          ),
        };
      }

      /*
        Walk y final:
        bioma completo.
      */

      return {
        x: 0,
        y: 0,
        zoom: 1,
      };
    }, [
      elapsed,
      phase,
      timeline,
      viewport,
    ]);

  /* =======================================================
     DIALOGUE
     ======================================================= */

  const dialogue =
    phase === "dialogue2"
      ? {
          text:
            "¡Ahí está! Voy hacia él",
          expression:
            HAPPY,
        }
      : {
          text:
            "¿Dónde está el mago?",
          expression:
            CONFUSED,
        };

  const showDialogue =
    phase === "dialogue1" ||
    phase === "dialogue2";

  /* =======================================================
     IDLE
     
     ESTE ES EL CAMBIO 1:
     El idle aparece desde el inicio y permanece
     durante toda la parte inicial de la cinemática.
     ======================================================= */

  const showIdle =
    phase === "intro" ||
    phase === "dialogue1" ||
    phase === "dialogue2" ||
    phase === "panToMage" ||
    phase === "mageHold" ||
    phase === "return";

  /* =======================================================
     WORLD TRANSFORM
     ======================================================= */

  const worldTransform = {
    transform: `
      translate3d(
        ${camera.x}px,
        ${camera.y}px,
        0
      )
      scale(${camera.zoom})
    `,
    transformOrigin:
      "top left",
  };

  /* =======================================================
     RESTART
     ======================================================= */

  const restartScene =
    () => {
      setElapsed(0);
      setLoaded(false);

      setRestart(
        (value) =>
          value + 1
      );
    };

  /* =======================================================
     LOADING
     ======================================================= */

  if (!loaded) {
    return (
      <main
        className="
          flex
          h-screen
          w-full
          items-center
          justify-center
          bg-black
        "
      >
        <div
          className="
            text-center
            text-white
          "
        >
          <div
            className="
              mx-auto
              mb-4
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-white/20
              border-t-white
            "
          />

          <p
            className="
              text-sm
              font-bold
              tracking-[0.25em]
              text-white/70
            "
          >
            CARGANDO PEAKY...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      className="
        relative
        h-screen
        w-full
        overflow-hidden
        bg-black
        select-none
      "
    >
      {/* =================================================
          WORLD
          ================================================= */}

      <div
        className="
          absolute
          inset-0
          overflow-hidden
        "
        style={
          worldTransform
        }
      >
        {/* ===============================================
            BIOME
            =============================================== */}

        <img
          src={BIOME_SRC}
          alt=""
          draggable={false}
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
          "
        />

        {/* ===============================================
            PEAKY
            =============================================== */}

        <div
          className="
            absolute
            z-30
          "
          style={{
            left: `${peakyX}%`,

            /*
              CAMBIO 2:

              Idle, Walk y Static usan exactamente
              el mismo punto vertical del suelo.

              No hay ningún otro bottom diferente.
            */
            bottom:
              `${PEAKY_GROUND_BOTTOM}%`,

            width:
              PEAKY_SIZE,

            height:
              PEAKY_SIZE,

            transform:
              "translateX(-50%)",
          }}
        >
          {/* ============================================
              IDLE FRONTAL

              Aparece desde el inicio de la cinemática
              y permanece detrás de los diálogos.
              ============================================ */}

          {showIdle && (
            <SpriteFrame
              src={IDLE_SHEET}
              frame={0}
            />
          )}

          {/* ============================================
              WALK RIGHT
              10 FPS
              ============================================ */}

          {phase === "walk" && (
            <SpriteFrame
              src={WALK_SHEET}
              frame={peakyFrame}
            />
          )}

          {/* ============================================
              STATIC RIGHT
              ============================================ */}

          {phase ===
            "finished" && (
            <img
              src={WALK_STATIC}
              alt=""
              draggable={false}
              className="
                h-full
                w-full
                object-contain
              "
            />
          )}
        </div>
      </div>

      {/* =================================================
          COMIC DIALOGUE
          ================================================= */}

      {showDialogue && (
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            z-50
            flex
            justify-center
            px-4
            pb-6
          "
        >
          <div
            key={
              dialogue.text
            }
            className="
              relative
              w-full
              max-w-6xl
              rounded-[32px]
              border-[5px]
              border-black
              bg-white
              px-6
              pb-8
              pt-14
              shadow-[0_12px_0_rgba(0,0,0,0.35)]
            "
          >
            {/* EXPRESSION */}

            <div
              className="
                absolute
                left-1/2
                top-0
                h-44
                w-44
                -translate-x-1/2
                -translate-y-[80%]
              "
            >
              <img
                src={
                  dialogue.expression
                }
                alt=""
                draggable={false}
                className="
                  h-full
                  w-full
                  object-contain
                  drop-shadow-[0_8px_0_rgba(0,0,0,0.25)]
                "
              />
            </div>

            {/* NAME */}

            <div
              className="
                mb-2
                text-center
                text-xs
                font-black
                uppercase
                tracking-[0.3em]
                text-neutral-400
              "
            >
              PEAKY
            </div>

            {/* TEXT */}

            <p
              className="
                text-center
                text-[clamp(2rem,5vw,5rem)]
                font-black
                leading-none
                text-black
              "
              style={{
                fontFamily:
                  "Arial Rounded MT Bold, Arial, sans-serif",
              }}
            >
              {dialogue.text}
            </p>

            {/* COMIC DECORATION */}

            <div
              className="
                absolute
                left-7
                top-5
                h-3
                w-3
                rounded-full
                bg-black
              "
            />

            <div
              className="
                absolute
                left-14
                top-3
                h-2
                w-2
                rounded-full
                bg-black
              "
            />

            {/* BUBBLE TAIL */}

            <div
              className="
                absolute
                -bottom-7
                left-[14%]
                h-0
                w-0
                border-l-[26px]
                border-r-[26px]
                border-t-[30px]
                border-l-transparent
                border-r-transparent
                border-t-black
              "
            />

            <div
              className="
                absolute
                -bottom-[18px]
                left-[14.5%]
                h-0
                w-0
                border-l-[21px]
                border-r-[21px]
                border-t-[23px]
                border-l-transparent
                border-r-transparent
                border-t-white
              "
            />
          </div>
        </div>
      )}

      {/* =================================================
          FINAL
          ================================================= */}

      {phase ===
        "finished" && (
        <div
          className="
            absolute
            right-5
            top-5
            z-50
            rounded-full
            border
            border-white/20
            bg-black/50
            px-4
            py-2
            text-xs
            font-bold
            uppercase
            tracking-[0.2em]
            text-white
            backdrop-blur
          "
        >
          Frente al mago
        </div>
      )}

      {/* =================================================
          RESTART
          ================================================= */}

      <button
        type="button"
        onClick={
          restartScene
        }
        className="
          absolute
          bottom-4
          left-4
          z-50
          rounded-full
          border
          border-white/20
          bg-black/60
          px-4
          py-2
          text-xs
          font-bold
          text-white
          backdrop-blur
          transition
          hover:bg-black/80
        "
      >
        Reiniciar
      </button>

      {/* =================================================
          DEBUG
          ================================================= */}

      <div
        className="
          absolute
          right-4
          top-4
          z-50
          rounded-lg
          bg-black/50
          px-3
          py-2
          font-mono
          text-[10px]
          text-white/60
          backdrop-blur
        "
      >
        {phase} ·{" "}
        {(elapsed / 1000).toFixed(
          2
        )}
        s
      </div>
    </main>
  );
}