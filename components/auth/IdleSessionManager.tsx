
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/browser";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const WARNING_AFTER_MS = IDLE_TIMEOUT_MS - WARNING_MS;

export default function IdleSessionManager() {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const authenticatedRef = useRef(false);
  const warningRef = useRef(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logoutForInactivity = useCallback(async () => {
    clearTimers();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error(
          "[IdleSessionManager] Error cerrando sesión:",
          error,
        );
      }
    } catch (error) {
      console.error(
        "[IdleSessionManager] Error inesperado:",
        error,
      );
    } finally {
      window.location.replace("/login?reason=inactive");
    }
  }, [clearTimers]);

  const startTimers = useCallback(() => {
    clearTimers();

    warningRef.current = false;
    setWarning(false);
    setSecondsLeft(60);

    if (!authenticatedRef.current) return;

    warningTimerRef.current = setTimeout(() => {
      if (!authenticatedRef.current) return;

      warningRef.current = true;
      setWarning(true);
      setSecondsLeft(60);

      countdownRef.current = setInterval(() => {
        setSecondsLeft((previous) => Math.max(0, previous - 1));
      }, 1000);

      logoutTimerRef.current = setTimeout(() => {
        void logoutForInactivity();
      }, WARNING_MS);
    }, WARNING_AFTER_MS);
  }, [clearTimers, logoutForInactivity]);

  useEffect(() => {
    let mounted = true;

    const activityEvents = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ] as const;

    function handleActivity() {
      if (!authenticatedRef.current || warningRef.current) return;
      startTimers();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      authenticatedRef.current = Boolean(session?.user);

      if (!authenticatedRef.current) {
        clearTimers();
        warningRef.current = false;
        setWarning(false);
        return;
      }

      startTimers();
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error(
          "[IdleSessionManager] No se pudo verificar la sesión.",
          error,
        );
        return;
      }

      authenticatedRef.current = Boolean(data.session?.user);

      if (authenticatedRef.current) {
        startTimers();
      }
    });

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, handleActivity, {
        passive: true,
      });
    }

    return () => {
      mounted = false;
      clearTimers();
      subscription.unsubscribe();

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, handleActivity);
      }

    };
  }, [clearTimers, startTimers]);

  async function continueSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.user) {
      await logoutForInactivity();
      return;
    }

    startTimers();
  }

  if (!warning) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-session-title"
      aria-describedby="idle-session-description"
    >
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11111c] p-6 text-white shadow-2xl sm:p-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-6 w-6"
          >
            <circle cx="12" cy="12" r="9" />
            <path
              strokeLinecap="round"
              d="M12 7v5l3 2"
            />
          </svg>
        </div>

        <h2
          id="idle-session-title"
          className="text-xl font-bold tracking-tight"
        >
          ¿Sigues ahí?
        </h2>

        <p
          id="idle-session-description"
          className="mt-3 text-sm leading-6 text-white/65"
        >
          Tu sesión está a punto de cerrarse porque no hemos
          detectado actividad. Puedes continuar para mantenerla
          abierta.
        </p>

        <div className="my-5 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
          <p className="text-xs text-white/50">
            Cierre automático en
          </p>
          <p
            className="mt-1 text-3xl font-bold tabular-nums text-amber-300"
            aria-live="off"
          >
            {`00:${String(secondsLeft).padStart(2, "0")}`}
          </p>
        </div>

        <button
          type="button"
          autoFocus
          onClick={() => void continueSession()}
          className="h-12 w-full rounded-xl bg-[#c5f467] px-4 text-sm font-bold text-[#171a12] transition hover:bg-[#d5ff86]"
        >
          Seguir conectado
        </button>

        <button
          type="button"
          onClick={() => void logoutForInactivity()}
          className="mt-3 h-10 w-full rounded-xl text-sm font-medium text-white/60 transition hover:bg-white/[0.05] hover:text-white"
        >
          Cerrar sesión ahora
        </button>
      </section>
    </div>
  );
}
