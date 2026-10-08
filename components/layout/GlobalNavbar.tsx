"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import Navbar, {
  type GlobalTheme,
} from "@/components/layout/Navbar";

type GlobalNavbarProps = {
  children?: ReactNode;
};

export default function GlobalNavbar({
  children,
}: GlobalNavbarProps) {
  const [theme, setTheme] =
    useState<GlobalTheme>("dark");

  /* ==========================================================
     RECUPERAR TEMA
  ========================================================== */

  useEffect(() => {
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
      // Se conserva dark como fallback.
    }
  }, []);

  /* ==========================================================
     SINCRONIZAR TEMA GLOBAL
  ========================================================== */

  useEffect(() => {
    const root =
      document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.dataset.theme = theme;

    try {
      window.localStorage.setItem(
        "peakscore-theme",
        theme,
      );
    } catch {
      // El tema sigue funcionando aunque
      // localStorage no esté disponible.
    }
  }, [theme]);

  /* ==========================================================
     CAMBIO DE TEMA
  ========================================================== */

  const handleThemeChange = (
    nextTheme: GlobalTheme,
  ) => {
    if (nextTheme === theme) return;

    setTheme(nextTheme);
  };

  return (
    <>
      <Navbar
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {children}
    </>
  );
}