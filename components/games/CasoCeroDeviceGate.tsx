"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, ShieldCheck, Smartphone, Waves } from "lucide-react";

type DeviceMode = "checking" | "desktop" | "mobile";

function isPhoneDevice() {
  const userAgent = navigator.userAgent || "";
  const phoneUserAgent =
    /iPhone|iPod|Android.*Mobile|Windows Phone|IEMobile|Opera Mini|Mobile/i.test(userAgent);
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const compactTouchViewport = window.matchMedia(
    "(pointer: coarse) and (max-width: 900px)",
  ).matches;

  // The user-agent check still catches a phone held in landscape orientation.
  return phoneUserAgent || narrowViewport || compactTouchViewport;
}

function DeviceCheckScreen() {
  return (
    <main className="grid min-h-[calc(100svh-72px)] place-items-center bg-[#070a10] px-4 py-12 text-white">
      <div className="flex items-center gap-3 text-xs font-bold tracking-[.18em] text-[#b9c7d5]">
        <span className="grid h-10 w-10 place-items-center border border-[#d7ab61]/50 bg-[#18140e] text-[#e8bd75]">
          <Monitor className="h-5 w-5" />
        </span>
        COMPROBANDO DISPOSITIVO
      </div>
    </main>
  );
}

function CasoCeroDesktopLoading() {
  return (
    <main className="grid min-h-[calc(100svh-72px)] place-items-center bg-[#070a10] px-4 py-12 text-white">
      <div className="flex items-center gap-3 border border-[#313b46] bg-[#101721] px-5 py-4 text-sm text-[#d9e1e9]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#e0ae60]" />
        Preparando el laboratorio…
      </div>
    </main>
  );
}

// Keep the 3D laboratory bundle out of the initial mobile route.
const CasoCeroDesktopGame = dynamic(
  () => import("@/components/games/CasoCeroGame"),
  {
    ssr: false,
    loading: () => <CasoCeroDesktopLoading />,
  },
);

function MobileUnavailableScreen() {
  return (
    <main className="relative isolate grid min-h-[calc(100svh-72px)] place-items-center overflow-hidden bg-[#070a10] px-4 py-10 text-white sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 16% 8%, rgba(64,115,135,.19), transparent 42%), radial-gradient(ellipse at 86% 88%, rgba(185,126,54,.14), transparent 40%)",
        }}
      />
      <div className="w-full max-w-xl overflow-hidden border border-[#3c4652] bg-[#0c121b]/95 shadow-[0_28px_90px_rgba(0,0,0,.48)]">
        <div className="h-1 bg-gradient-to-r from-[#7ca5b1] via-[#d3a35b] to-[#6f8d9d]" />

        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center border border-[#d5aa64]/45 bg-[#211a10] text-[#e7ba70]">
                <Waves className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black tracking-wide text-white">PeakScore</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.2em] text-[#91a1b3]">
                  Caso Cero · Archivo 001
                </p>
              </div>
            </div>
            <span className="hidden items-center gap-1.5 border border-[#53616c] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.12em] text-[#bdc9d3] sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Experiencia de escritorio
            </span>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center border border-[#d9ad65]/55 bg-[#1b1b19]">
              <Monitor className="h-10 w-10 text-[#e7bd79]" strokeWidth={1.4} />
              <span className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-2 border-[#0c121b] bg-[#20303a] text-[#e0edf2]">
                <Smartphone className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#d6ad6b]">
                Dispositivo no compatible
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                Este juego no está disponible en tu dispositivo.
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-[#c4cfdb] sm:text-base">
            Caso Cero no está disponible en teléfonos móviles. El laboratorio combina
            lluvia animada, vídeo y evidencias tridimensionales; necesita una pantalla
            amplia y recursos gráficos que permitan mantener la experiencia fluida.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-[#303d49] bg-[#111923] p-3.5">
              <Monitor className="h-4 w-4 text-[#e2b56e]" />
              <p className="mt-2 text-xs font-extrabold text-[#edf2f7]">
                Para jugar Caso Cero
              </p>
              <p className="mt-1 text-xs leading-5 text-[#9eacbb]">
                Abre PeakScore desde un computador de escritorio o portátil.
              </p>
            </div>
            <div className="border border-[#303d49] bg-[#111923] p-3.5">
              <Smartphone className="h-4 w-4 text-[#8eb8c4]" />
              <p className="mt-2 text-xs font-extrabold text-[#edf2f7]">
                Tu cuenta sigue disponible
              </p>
              <p className="mt-1 text-xs leading-5 text-[#9eacbb]">
                Puedes continuar usando los demás apartados y juegos de PeakScore desde tu móvil.
              </p>
            </div>
          </div>

          <Link
            href="/aprender/juegos"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-[#edc47f] bg-[#bd7729] px-4 py-3 text-sm font-black text-[#fff7e8] shadow-[3px_3px_0_#513013] transition hover:bg-[#d08a3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0cb8a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c121b]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a todos los juegos
          </Link>

          <p className="mt-4 text-center text-[10px] leading-5 text-[#728195]">
            Esta restricción solo aplica a Caso Cero, no al resto de PeakScore.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CasoCeroDeviceGate() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("checking");

  useEffect(() => {
    const updateDeviceMode = () => {
      setDeviceMode(isPhoneDevice() ? "mobile" : "desktop");
    };

    updateDeviceMode();
    window.addEventListener("resize", updateDeviceMode);
    window.addEventListener("orientationchange", updateDeviceMode);

    return () => {
      window.removeEventListener("resize", updateDeviceMode);
      window.removeEventListener("orientationchange", updateDeviceMode);
    };
  }, []);

  if (deviceMode === "checking") return <DeviceCheckScreen />;
  if (deviceMode === "mobile") return <MobileUnavailableScreen />;

  return <CasoCeroDesktopGame />;
}
