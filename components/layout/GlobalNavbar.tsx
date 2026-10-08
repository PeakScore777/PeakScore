"use client";

import { useEffect, useState } from "react";

import Navbar, {
  type GlobalTheme,
} from "@/components/layout/Navbar";

export default function GlobalNavbar() {
  const [theme, setTheme] =
    useState<GlobalTheme>("dark");

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
      // El tema sigue funcionando aunque localStorage no esté disponible.
    }

    window.dispatchEvent(
      new CustomEvent<GlobalTheme>(
        "peakscore-theme-change",
        {
          detail: theme,
        },
      ),
    );
  }, [theme]);

  return (
    <Navbar
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}
