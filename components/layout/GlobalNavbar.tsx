"use client";

import { useCallback, useEffect, useState } from "react";

import Navbar, {
  type GlobalTheme,
} from "@/components/layout/Navbar";

type ProfileData = {
  id: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  streak: number;
  coins: number;
  selectedCharacter: string | null;
};

type GlobalNavbarProps = {
  initialProfile?: ProfileData | null;
};

const THEME_STORAGE_KEY = "peakscore-theme";

function isGlobalTheme(value: unknown): value is GlobalTheme {
  return value === "light" || value === "dark";
}

export default function GlobalNavbar({
  initialProfile = null,
}: GlobalNavbarProps) {
  const [theme, setTheme] = useState<GlobalTheme>("dark");
  const [themeInitialized, setThemeInitialized] = useState(false);

  // Recuperar la preferencia guardada al montar el navbar.
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(
        THEME_STORAGE_KEY,
      );

      if (isGlobalTheme(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch {
      // Se mantiene el tema oscuro como alternativa.
    } finally {
      setThemeInitialized(true);
    }
  }, []);

  // Aplicar el tema global a todo el documento.
  useEffect(() => {
    if (!themeInitialized) return;

    const root = document.documentElement;

    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // El tema continúa funcionando aunque no haya almacenamiento.
    }

    window.dispatchEvent(
      new CustomEvent<GlobalTheme>("peakscore-theme-change", {
        detail: theme,
      }),
    );
  }, [theme, themeInitialized]);

  // Sincronizar cambios realizados desde otros componentes o pestañas.
  useEffect(() => {
    function handleThemeChange(event: Event) {
      const customEvent = event as CustomEvent<GlobalTheme>;

      if (isGlobalTheme(customEvent.detail)) {
        setTheme((current) =>
          current === customEvent.detail
            ? current
            : customEvent.detail,
        );
      }
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === THEME_STORAGE_KEY &&
        isGlobalTheme(event.newValue)
      ) {
        setTheme(event.newValue);
      }
    }

    window.addEventListener(
      "peakscore-theme-change",
      handleThemeChange,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "peakscore-theme-change",
        handleThemeChange,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleThemeChange = useCallback((nextTheme: GlobalTheme) => {
    setTheme(nextTheme);
  }, []);

  return (
    <Navbar
      theme={theme}
      onThemeChange={handleThemeChange}
      initialProfile={initialProfile}
    />
  );
}