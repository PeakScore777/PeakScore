"use client";

import { useEffect, useState } from "react";

import Navbar, {
  type LandingTheme,
} from "@/components/Navbar";

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  const [theme, setTheme] =
    useState<LandingTheme>("dark");

  /* ==========================================================
     RECUPERAR TEMA GUARDADO
  ========================================================== */

  useEffect(() => {
    try {
      const savedTheme =
        window.localStorage.getItem(
          "peakscore-theme"
        );

      if (
        savedTheme === "light" ||
        savedTheme === "dark"
      ) {
        setTheme(savedTheme);
      }
    } catch {
      // Si localStorage falla, se mantiene el tema oscuro.
    }
  }, []);

  /* ==========================================================
     SINCRONIZAR TEMA GLOBAL
     
     Permite que los componentes que todavía utilizan
     clases dark: de Tailwind también respondan al tema.
  ========================================================== */

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.dataset.theme = theme;

    try {
      window.localStorage.setItem(
        "peakscore-theme",
        theme
      );
    } catch {
      // El cambio visual continúa aunque localStorage falle.
    }
  }, [theme]);

  /* ==========================================================
     CAMBIO DE TEMA
     
     Usa View Transitions cuando el navegador lo soporta.
     Si no lo soporta, simplemente cambia el tema normalmente.
  ========================================================== */

  const handleThemeChange = (
    nextTheme: LandingTheme
  ) => {
    if (nextTheme === theme) return;

    const updateTheme = () => {
      setTheme(nextTheme);
    };

    if (
      typeof document !== "undefined" &&
      "startViewTransition" in document
    ) {
      (
        document as Document & {
          startViewTransition?: (
            callback: () => void
          ) => unknown;
        }
      ).startViewTransition?.(updateTheme);

      return;
    }

    setTheme(nextTheme);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen">
      <Navbar
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      <Hero theme={theme} />

      <Features theme={theme} />

      <HowItWorks theme={theme} />

      <DashboardPreview theme={theme} />

      <CTA />

      <Footer />
    </main>
  );
}