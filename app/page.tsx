"use client";

import { useSyncExternalStore } from "react";

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

type LandingTheme = "light" | "dark";

function subscribeLandingTheme(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "peakscore-theme") onChange();
  };
  const handleThemeChange = (event: Event) => {
    const nextTheme = (event as CustomEvent<LandingTheme>).detail;
    if (nextTheme !== "light" && nextTheme !== "dark") return;
    try {
      window.localStorage.setItem("peakscore-theme", nextTheme);
    } catch {
      // El tema sigue funcionando durante esta sesión.
    }
    onChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("peakscore-theme-change", handleThemeChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("peakscore-theme-change", handleThemeChange);
  };
}

function getLandingThemeSnapshot(): LandingTheme {
  try {
    const savedTheme = window.localStorage.getItem("peakscore-theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  } catch {
    return "dark";
  }
}

function getServerLandingThemeSnapshot(): LandingTheme {
  return "dark";
}


export default function Home() {
  const theme = useSyncExternalStore(
    subscribeLandingTheme,
    getLandingThemeSnapshot,
    getServerLandingThemeSnapshot,
  );

  return () => {
      window.removeEventListener(
        "peakscore-theme-change",
        syncTheme,
      );
    };
  }, []);

  return (
    <main className="min-h-screen">
      <Hero theme={theme} />

      <Features theme={theme} />

      <HowItWorks theme={theme} />

      <DashboardPreview theme={theme} />

      <CTA theme={theme} />

      <Footer />
    </main>
  );
}
