"use client";

import { useEffect, useState } from "react";

import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import DashboardPreview from "@/components/DashboardPreview";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

type LandingTheme = "light" | "dark";

export default function Home() {
  const [theme, setTheme] =
    useState<LandingTheme>("dark");

  useEffect(() => {
    const syncTheme = (event: Event) => {
      const customEvent =
        event as CustomEvent<LandingTheme>;

      if (
        customEvent.detail === "light" ||
        customEvent.detail === "dark"
      ) {
        setTheme(customEvent.detail);
      }
    };

    try {
      const savedTheme =
        window.localStorage.getItem(
          "peakscore-theme",
        );

      if (
        savedTheme === "light" ||
        savedTheme === "dark"
      ) {
        setTheme(savedTheme);
      }
    } catch {
      // Se mantiene el tema oscuro como fallback.
    }

    window.addEventListener(
      "peakscore-theme-change",
      syncTheme,
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

      <CTA />

      <Footer />
    </main>
  );
}
