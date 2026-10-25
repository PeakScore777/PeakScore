"use client";

import Image from "next/image";
import { useState } from "react";

const RIVER_VIDEO =
  "https://videos.pexels.com/video-files/4192175/4192175-hd_1920_1080_25fps.mp4";

const rainDrops = Array.from({ length: 44 }, (_, index) => index);

/**
 * Atmospheric layers for Caso Cero.
 * The generated room background is kept separate from the moving river,
 * so evidence cards can stay interactive React elements above this layer.
 */
export default function CasoCeroAmbientBackdrop() {
  const [backgroundUnavailable, setBackgroundUnavailable] = useState(false);
  const [riverUnavailable, setRiverUnavailable] = useState(false);

  return (
    <div
      aria-hidden="true"
      className="caso-cero-ambient absolute inset-0 z-0 overflow-hidden bg-[#081116]"
    >
      {!backgroundUnavailable && (
        <Image
          src="/images/backgrounds/caso-cero-laboratorio-nocturno.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1280px"
          onError={() => setBackgroundUnavailable(true)}
          className="caso-cero-room-image object-fill"
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,9,14,.05)_0%,rgba(3,9,14,.12)_45%,rgba(2,6,10,.63)_100%)]" />

      {/* River video sits behind recreated window muntins. Source: Pexels video 4192175. */}
      <div className="caso-cero-window-motion absolute left-0 top-0 h-[59.5%] w-[39.4%] overflow-hidden">
        {!riverUnavailable ? (
          <video
            className="caso-cero-river-video absolute inset-0 h-full w-full object-cover"
            src={RIVER_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={() => setRiverUnavailable(true)}
            tabIndex={-1}
          />
        ) : (
          <div className="caso-cero-water-fallback absolute inset-0 overflow-hidden bg-transparent">
            <span className="caso-cero-water-ripple absolute left-[-20%] top-[54%] h-[35%] w-[140%] rounded-[50%] border border-sky-200/20" />
            <span className="caso-cero-water-ripple absolute left-[-15%] top-[63%] h-[24%] w-[130%] rounded-[50%] border border-sky-100/20 [animation-delay:-2s]" />
            <span className="absolute inset-0 bg-gradient-to-b from-[#0b1d31]/10 via-transparent to-[#07131e]/10" />
          </div>
        )}

        <div className="caso-cero-glass-rain absolute inset-0 overflow-hidden">
          {rainDrops.map((drop) => (
            <span
              key={drop}
              className="caso-cero-rain-streak absolute block rounded-full"
              style={{
                left: ((drop * 37) % 97) + "%",
                top: ((drop * 53) % 93) + "%",
                height: 12 + ((drop * 7) % 19) + "px",
                animationDelay: "-" + ((drop * 11) % 29) / 4 + "s",
                animationDuration: 2.7 + ((drop * 3) % 12) / 10 + "s",
                opacity: 0.13 + ((drop * 5) % 7) / 30,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-sky-200/[0.07] mix-blend-screen" />
        </div>

        {/* Window wood frame/muntins stay above the video. */}
        <div className="caso-cero-window-frame pointer-events-none absolute inset-0 border-[9px] border-[#2d2117] shadow-[inset_0_0_0_2px_rgba(190,137,75,.34),0_0_20px_rgba(0,0,0,.45)]">
          <span className="absolute inset-y-0 left-[33.2%] w-[7px] bg-gradient-to-r from-[#1d160f] via-[#68482b] to-[#21170f] shadow-[1px_0_4px_rgba(0,0,0,.7)]" />
          <span className="absolute inset-y-0 left-[67.1%] w-[7px] bg-gradient-to-r from-[#1d160f] via-[#68482b] to-[#21170f] shadow-[1px_0_4px_rgba(0,0,0,.7)]" />
          <span className="absolute inset-x-0 top-[55%] h-[7px] bg-gradient-to-b from-[#1e160f] via-[#75502d] to-[#21170f] shadow-[0_2px_5px_rgba(0,0,0,.65)]" />
          <span className="absolute inset-x-0 bottom-[2%] h-[9px] bg-gradient-to-b from-[#674629] via-[#302216] to-[#17110c] shadow-[0_3px_7px_rgba(0,0,0,.7)]" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_52%_20%,rgba(42,112,111,.14),transparent_47%),radial-gradient(ellipse_at_89%_33%,rgba(255,171,78,.09),transparent_30%)]" />

      <style jsx>{`
        .caso-cero-room-image {
          object-position: left top;
        }

        .caso-cero-rain-streak {
          width: 1.5px;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(216, 237, 255, 0.84) 38%,
            rgba(198, 225, 244, 0.25)
          );
          filter: drop-shadow(0 0 2px rgba(176, 222, 255, 0.25));
          animation: caso-cero-rain-fall linear infinite;
        }

        .caso-cero-water-ripple {
          animation: caso-cero-water-drift 6s ease-in-out infinite alternate;
        }

        @keyframes caso-cero-rain-fall {
          from { transform: translate3d(3px, -35px, 0); }
          to { transform: translate3d(-4px, 160px, 0); }
        }

        @keyframes caso-cero-water-drift {
          from { transform: translateX(-3%) scaleY(.92); opacity: .35; }
          to { transform: translateX(4%) scaleY(1.08); opacity: .85; }
        }

        @media (max-width: 640px) {
          .caso-cero-room-image {
            object-position: left top;
          }
          .caso-cero-window-motion {
            opacity: .75;
          }
          .caso-cero-rain-streak {
            width: 1px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .caso-cero-rain-streak,
          .caso-cero-water-ripple {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
