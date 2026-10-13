"use client";

import { useSyncExternalStore } from "react";

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

type LandingTheme = "light" | "dark";

function getLandingTheme(): LandingTheme {
  try {
    const savedTheme = window.localStorage.getItem("peakscore-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Se mantiene el tema oscuro como fallback.
  }

  return "dark";
}

function subscribeToLandingTheme(onChange: () => void) {
  window.addEventListener("peakscore-theme-change", onChange);

  return () => {
    window.removeEventListener("peakscore-theme-change", onChange);
  };
}

function getServerLandingTheme(): LandingTheme {
  return "dark";
}

export default function Home() {
  const theme = useSyncExternalStore(
    subscribeToLandingTheme,
    getLandingTheme,
    getServerLandingTheme,
  );

  return (
    <main className="min-h-screen">
      <Hero theme={theme} />

      <Features theme={theme} />

      <HowItWorks theme={theme} />

      <DashboardPreview theme={theme} />

      <CTA />

      <Footer />
    </main>
  );
}
