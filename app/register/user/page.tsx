"use client";

import { FormEvent, useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  /* ============================================================
     REGISTRO
  ============================================================ */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================================================
     CAPTCHA
  ============================================================ */

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  /* ============================================================
     POLÍTICAS
  ============================================================ */

  const [legalAccepted, setLegalAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  /* ============================================================
     VERIFICACIÓN
  ============================================================ */

  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [verificationLoading, setVerificationLoading] =
    useState(false);

  const [verificationError, setVerificationError] = useState("");

  const [verificationSeconds, setVerificationSeconds] =
    useState(600);

  const [resendCooldown, setResendCooldown] = useState(60);

  /* ============================================================
     RECUPERAR REGISTRO PENDIENTE
  ============================================================ */

  useEffect(() => {
    const pendingEmail = window.sessionStorage.getItem(
      "peakscore_pending_signup_email"
    );

    if (pendingEmail) {
      setVerificationEmail(pendingEmail);
      setVerificationMode(true);
      setVerificationSeconds(600);
      setResendCooldown(0);
    }
  }, []);

  /* ============================================================
     CONTADOR OTP
  ============================================================ */

  useEffect(() => {
    if (!verificationMode) return;

    const interval = window.setInterval(() => {
      setVerificationSeconds((previous) =>
        Math.max(previous - 1, 0)
      );

      setResendCooldown((previous) =>
        Math.max(previous - 1, 0)
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [verificationMode]);

  /* ============================================================
     FUERZA DE CONTRASEÑA
  ============================================================ */

  const hasMinLength = password.length >= 15;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const passwordStrength = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  /* ============================================================
     TIEMPO
  ============================================================ */

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  /* ============================================================
     REGISTRO
  ============================================================ */

  const handleRegister = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    /* ----------------------------------------------------------
       CAMPOS
    ---------------------------------------------------------- */

    if (
      !cleanName ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Completa todos los campos para continuar."
      );
      return;
    }

    /* ----------------------------------------------------------
       NOMBRE
    ---------------------------------------------------------- */

    if (
      cleanName.length < 2 ||
      cleanName.length > 120
    ) {
      setError("Introduce un nombre válido.");
      return;
    }

    /* ----------------------------------------------------------
       EMAIL
    ---------------------------------------------------------- */

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        normalizedEmail
      ) ||
      normalizedEmail.includes("..")
    ) {
      setError(
        "Introduce un correo electrónico válido."
      );
      return;
    }

    /* ----------------------------------------------------------
       CONTRASEÑA
    ---------------------------------------------------------- */

    const strongPassword =
      password.length >= 15 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      setError(
        "La contraseña debe tener al menos 15 caracteres e incluir mayúsculas, minúsculas, números y símbolos."
      );
      return;
    }

    /* ----------------------------------------------------------
       CONFIRMAR CONTRASEÑA
    ---------------------------------------------------------- */

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    /* ----------------------------------------------------------
       LEGAL
    ---------------------------------------------------------- */

    if (!legalAccepted) {
      setError(
        "Debes aceptar los Términos y Condiciones y el Aviso de Privacidad para crear tu cuenta."
      );
      return;
    }

    /* ----------------------------------------------------------
       CAPTCHA
    ---------------------------------------------------------- */

    if (!captchaToken) {
      setError(
        "Completa la verificación de seguridad para continuar."
      );
      return;
    }

    setLoading(true);

    /* ==========================================================
       SUPABASE
    ========================================================== */

    const {
      data,
      error: registerError,
    } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        captchaToken,
        data: {
          full_name: cleanName,
        },
      },
    });

    /* ==========================================================
       ERROR
    ========================================================== */

    if (registerError) {
      console.error(
        "[PeakScore] Registro rechazado por Auth.",
        {
          errorCode:
            registerError.code ?? "UNKNOWN",
          status:
            registerError.status ?? "UNKNOWN",
        }
      );

      setLoading(false);

      if (data.user && !data.session) {
        window.sessionStorage.setItem(
          "peakscore_pending_signup_email",
          normalizedEmail
        );

        setVerificationEmail(normalizedEmail);
        setVerificationCode("");

        setVerificationError(
          registerError.code ===
            "over_email_send_rate_limit"
            ? "La cuenta puede haberse creado, pero el correo alcanzó un límite temporal. Intenta reenviar el código más tarde."
            : "La cuenta puede haber quedado pendiente de verificación. Revisa tu correo o solicita un nuevo código."
        );

        setVerificationSeconds(600);

        setResendCooldown(
          registerError.code ===
            "over_email_send_rate_limit"
            ? 60
            : 0
        );

        setCaptchaToken("");

        setCaptchaKey(
          (previous) => previous + 1
        );

        setVerificationMode(true);

        setPassword("");
        setConfirmPassword("");

        return;
      }

      setError(
        registerError.code ===
          "over_email_send_rate_limit"
          ? "El servicio de correo alcanzó un límite temporal. Espera unos minutos antes de intentarlo nuevamente."
          : "No fue posible crear la cuenta. Verifica los datos e inténtalo nuevamente."
      );

      return;
    }

    /* ==========================================================
       PASAR A VERIFICACIÓN
    ========================================================== */

    setVerificationEmail(normalizedEmail);
    setVerificationCode("");
    setVerificationError("");

    setVerificationSeconds(600);
    setResendCooldown(60);

    setCaptchaToken("");

    setCaptchaKey(
      (previous) => previous + 1
    );

    window.sessionStorage.setItem(
      "peakscore_pending_signup_email",
      normalizedEmail
    );

    setVerificationMode(true);

    setPassword("");
    setConfirmPassword("");

    setLoading(false);
  };

  /* ============================================================
     VERIFICAR CÓDIGO
  ============================================================ */

  const handleVerifyCode = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setVerificationError("");

    const code = verificationCode.trim();

    if (!/^\d{8}$/.test(code)) {
      setVerificationError(
        "Introduce el código completo de 8 dígitos."
      );
      return;
    }

    if (verificationSeconds <= 0) {
      setVerificationError(
        "El código ha expirado. Solicita un nuevo código."
      );
      return;
    }

    setVerificationLoading(true);

    const { error: verifyError } =
      await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: code,
        type: "email",
      });

    if (verifyError) {
      setVerificationLoading(false);

      setVerificationError(
        "El código no es válido o ya expiró. Revisa el código e inténtalo nuevamente."
      );

      return;
    }

    await supabase.auth.signOut();

    window.sessionStorage.removeItem(
      "peakscore_pending_signup_email"
    );

    setVerificationLoading(false);

    window.location.href =
      "/login?verified=1";
  };

  /* ============================================================
     REENVIAR CÓDIGO
  ============================================================ */

  const handleResendCode = async () => {
    setVerificationError("");

    if (resendCooldown > 0) return;

    if (!verificationEmail) {
      setVerificationError(
        "No encontramos el correo de verificación."
      );
      return;
    }

    if (!captchaToken) {
      setVerificationError(
        "Completa la verificación de seguridad antes de reenviar el código."
      );
      return;
    }

    setVerificationLoading(true);

    const { error: resendError } =
      await supabase.auth.resend({
        type: "signup",
        email: verificationEmail,
        options: {
          captchaToken,
        },
      });

    if (resendError) {
      console.error(
        "[PeakScore] Error reenviando código.",
        {
          errorCode:
            resendError.code ?? "UNKNOWN",
          status:
            resendError.status ?? "UNKNOWN",
        }
      );

      setVerificationLoading(false);

      setCaptchaToken("");

      setCaptchaKey(
        (previous) => previous + 1
      );

      setVerificationError(
        resendError.message
          ?.toLowerCase()
          .includes("captcha")
          ? "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente."
          : "No pudimos reenviar el código. Espera unos segundos e inténtalo nuevamente."
      );

      return;
    }

    setVerificationCode("");
    setCaptchaToken("");

    setCaptchaKey(
      (previous) => previous + 1
    );

    setVerificationSeconds(600);
    setResendCooldown(60);

    setVerificationLoading(false);
  };

  /* ============================================================
     VOLVER
  ============================================================ */

  const handleBackToRegister = () => {
    window.sessionStorage.removeItem(
      "peakscore_pending_signup_email"
    );

    setVerificationMode(false);
    setVerificationCode("");
    setCaptchaToken("");

    setCaptchaKey(
      (previous) => previous + 1
    );

    setVerificationError("");
    setVerificationSeconds(600);
    setResendCooldown(60);
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02040c]">

      {/* ========================================================
          FONDO EXTERIOR ORIGINAL
      ======================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-cover
          bg-center
          bg-no-repeat
          hidden
          lg:block
        "
        style={{
          backgroundImage:
            "url('/images/register/register_user_bg.webp')",
        }}
      />

      {/* ========================================================
          FONDO EXTERIOR MOBILE
      ======================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-cover
          bg-center
          bg-no-repeat
          lg:hidden
        "
        style={{
          backgroundImage:
            "url('/images/register/register_user_bg-mobile.webp')",
        }}
      />

      {/* ========================================================
          OVERLAY EXTERIOR
      ======================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-black/10
        "
      />

      {/* ========================================================
          CONTENEDOR
      ======================================================== */}

      <div
        className="
          relative
          z-10
          flex
          min-h-screen
          w-full
          items-center
          justify-center
          px-3
          py-6
          sm:px-5
          sm:py-8
          lg:px-8
          lg:py-10
        "
      >

        {/* ======================================================
            REGISTER
        ====================================================== */}

        <section
          className="
            w-full
            max-w-[570px]
          "
        >

          {/* ====================================================
              PANEL

              AQUÍ ESTÁ EL FONDO REAL DEL REGISTER.
              NO SE DIBUJA CON TAILWIND.
          ==================================================== */}

          <div
            className="
              relative
              overflow-hidden
              border
              border-black/30
              shadow-[0_30px_90px_rgba(0,0,0,0.72)]
            "
            style={{
              backgroundImage:
                "url('/images/register/register-user-fondo.webp')",

              /*
                IMPORTANTE:
                Se muestra TODO el fondo.
                No usamos cover porque eso recortaba
                la parte superior.
              */

              backgroundSize: "100% 100%",

              backgroundPosition: "center center",

              backgroundRepeat: "no-repeat",
            }}
          >

            {/* ==================================================
                OSCURECIMIENTO MÍNIMO

                NO CREA COLORES.
                SOLO AYUDA A QUE LOS INPUTS NEGROS
                TENGAN CONTRASTE.
            ================================================== */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-0
                bg-black/5
              "
            />

            {/* ==================================================
                CONTENIDO

                SIN:
                - PEAKSCORE HTML
                - CREA TU CUENTA HTML
                - SUBTÍTULO HTML
                - NEW PLAYER HTML

                TODO ESO YA VIENE EN LA IMAGEN.
            ================================================== */}

            <div
              className="
                relative
                z-10
                px-6
                pb-7
                pt-[190px]
                sm:px-8
                sm:pb-8
                sm:pt-[205px]
                lg:px-9
                lg:pb-9
                lg:pt-[215px]
              "
            >

              {/* =================================================
                  FORMULARIO
              ================================================= */}

              {verificationMode ? (
                <>

                  {/* =============================================
                      VERIFICACIÓN
                  ============================================= */}

                  <div>

                    <h2
                      className="
                        text-[18px]
                        font-black
                        uppercase
                        tracking-wide
                        text-white
                        drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]
                      "
                    >
                      Confirma tu correo
                    </h2>

                    <p
                      className="
                        mt-2
                        text-[10px]
                        leading-5
                        text-white/80
                      "
                    >
                      Enviamos un código de 8 dígitos a:
                    </p>

                    <p
                      className="
                        mt-1
                        break-all
                        text-[10px]
                        font-bold
                        text-emerald-300
                      "
                    >
                      {verificationEmail}
                    </p>

                  </div>

                  <form
                    onSubmit={handleVerifyCode}
                    className="mt-5 space-y-4"
                  >

                    <div>

                      <label
                        htmlFor="verification-code"
                        className="
                          mb-2
                          block
                          text-[9px]
                          font-black
                          uppercase
                          tracking-wide
                          text-white
                        "
                      >
                        Código de verificación
                      </label>

                      <input
                        id="verification-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        placeholder="00000000"
                        value={verificationCode}
                        onChange={(e) => {
                          const onlyNumbers =
                            e.target.value.replace(
                              /\D/g,
                              ""
                            );

                          setVerificationCode(
                            onlyNumbers.slice(0, 8)
                          );

                          setVerificationError("");
                        }}
                        className="
                          h-12
                          w-full
                          border
                          border-white/10
                          bg-black/80
                          px-4
                          text-center
                          text-lg
                          font-black
                          tracking-[0.35em]
                          text-white
                          outline-none
                          placeholder:text-white/25
                          focus:border-cyan-400
                          focus:ring-2
                          focus:ring-cyan-400/20
                        "
                        required
                      />

                    </div>

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        border
                        border-white/15
                        bg-black/40
                        px-4
                        py-3
                      "
                    >

                      <span
                        className="
                          text-[8px]
                          uppercase
                          tracking-wide
                          text-white/50
                        "
                      >
                        Tiempo restante
                      </span>

                      <span
                        className="
                          text-[11px]
                          font-black
                          text-emerald-300
                        "
                      >
                        {formatTime(
                          verificationSeconds
                        )}
                      </span>

                    </div>

                    <div className="flex justify-center">

                      <Turnstile
                        key={`verification-captcha-${captchaKey}`}
                        siteKey={
                          process.env
                            .NEXT_PUBLIC_TURNSTILE_SITE_KEY!
                        }
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setVerificationError("");
                        }}
                        onExpire={() => {
                          setCaptchaToken("");

                          setVerificationError(
                            "La verificación de seguridad expiró."
                          );
                        }}
                        onError={() => {
                          setCaptchaToken("");

                          setVerificationError(
                            "No se pudo cargar la verificación."
                          );
                        }}
                        options={{
                          language: "es",
                          size: "flexible",
                        }}
                      />

                    </div>

                    {verificationError && (
                      <div
                        className="
                          border
                          border-red-400/30
                          bg-red-400/10
                          px-3
                          py-2.5
                          text-[9px]
                          leading-4
                          text-red-100
                        "
                      >
                        {verificationError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        verificationLoading ||
                        verificationCode.length !== 8
                      }
                      className="
                        flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        gap-2
                        bg-gradient-to-r
                        from-emerald-400
                        via-cyan-300
                        to-fuchsia-500
                        text-[9px]
                        font-black
                        uppercase
                        tracking-wide
                        text-black
                        shadow-[4px_4px_0_rgba(0,0,0,0.5)]
                        transition
                        hover:brightness-110
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >

                      {verificationLoading ? (
                        <>
                          <span
                            className="
                              h-3
                              w-3
                              animate-spin
                              border-2
                              border-black/20
                              border-t-black
                            "
                          />

                          Verificando...
                        </>
                      ) : (
                        <>
                          Verificar correo
                          <Check className="h-3.5 w-3.5" />
                        </>
                      )}

                    </button>

                  </form>

                  <div className="mt-5 text-center">

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={
                        verificationLoading ||
                        resendCooldown > 0
                      }
                      className="
                        text-[9px]
                        font-black
                        uppercase
                        text-cyan-300
                        hover:text-white
                        disabled:text-white/25
                      "
                    >
                      {resendCooldown > 0
                        ? `Reenviar en ${resendCooldown}s`
                        : "Reenviar código"}
                    </button>

                  </div>

                  <button
                    type="button"
                    onClick={handleBackToRegister}
                    className="
                      mt-4
                      block
                      w-full
                      text-center
                      text-[9px]
                      text-white/50
                      hover:text-white
                    "
                  >
                    ← Volver al registro
                  </button>

                </>
              ) : (
                <>

                  {/* ===========================================
                      NOMBRE
                  =========================================== */}

                  <form
                    onSubmit={handleRegister}
                    className="space-y-4"
                  >

                    <div>

                      <label
                        htmlFor="name"
                        className="
                          mb-1.5
                          block
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-white
                          drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]
                        "
                      >
                        Nombre completo
                      </label>

                      <div className="relative">

                        <User
                          className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-emerald-400
                          "
                        />

                        <input
                          id="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Tu nombre"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError("");
                          }}
                          className="
                            h-12
                            w-full
                            border
                            border-white/10
                            bg-black/75
                            pl-10
                            pr-4
                            text-[11px]
                            font-medium
                            text-white
                            outline-none
                            transition
                            placeholder:text-white/35
                            focus:border-emerald-400
                            focus:bg-black/85
                            focus:ring-2
                            focus:ring-emerald-400/20
                          "
                          required
                        />

                      </div>

                    </div>

                    {/* ==========================================
                        EMAIL
                    ========================================== */}

                    <div>

                      <label
                        htmlFor="email"
                        className="
                          mb-1.5
                          block
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-white
                          drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]
                        "
                      >
                        Correo electrónico
                      </label>

                      <div className="relative">

                        <Mail
                          className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-cyan-300
                          "
                        />

                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="tu@correo.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                          }}
                          className="
                            h-12
                            w-full
                            border
                            border-white/10
                            bg-black/75
                            pl-10
                            pr-4
                            text-[11px]
                            font-medium
                            text-white
                            outline-none
                            transition
                            placeholder:text-white/35
                            focus:border-cyan-400
                            focus:bg-black/85
                            focus:ring-2
                            focus:ring-cyan-400/20
                          "
                          required
                        />

                      </div>

                    </div>

                    {/* ==========================================
                        CONTRASEÑA
                    ========================================== */}

                    <div>

                      <div
                        className="
                          mb-1.5
                          flex
                          items-center
                          justify-between
                          gap-3
                        "
                      >

                        <label
                          htmlFor="password"
                          className="
                            text-[9px]
                            font-black
                            uppercase
                            tracking-[0.08em]
                            text-white
                            drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]
                          "
                        >
                          Contraseña
                        </label>

                        <span
                          className="
                            text-[7px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-emerald-300
                          "
                        >
                          Mínimo 15 caracteres
                        </span>

                      </div>

                      <div className="relative">

                        <Lock
                          className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-emerald-400
                          "
                        />

                        <input
                          id="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          placeholder="Crea una contraseña segura"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          className="
                            h-12
                            w-full
                            border
                            border-white/10
                            bg-black/75
                            pl-10
                            pr-11
                            text-[11px]
                            font-medium
                            text-white
                            outline-none
                            transition
                            placeholder:text-white/35
                            focus:border-emerald-400
                            focus:bg-black/85
                            focus:ring-2
                            focus:ring-emerald-400/20
                          "
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) => !value
                            )
                          }
                          className="
                            absolute
                            right-1
                            top-1/2
                            flex
                            h-10
                            w-10
                            -translate-y-1/2
                            items-center
                            justify-center
                            text-white/50
                            transition
                            hover:text-white
                          "
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>

                      </div>

                      {/* FUERZA */}

                      {password.length > 0 && (
                        <div className="mt-1.5">

                          <div className="flex gap-1">

                            {[1, 2, 3, 4, 5].map(
                              (level) => (
                                <span
                                  key={level}
                                  className={`
                                    h-[3px]
                                    flex-1
                                    ${
                                      passwordStrength >=
                                      level
                                        ? level <= 2
                                          ? "bg-red-400"
                                          : level <= 4
                                          ? "bg-emerald-400"
                                          : "bg-fuchsia-400"
                                        : "bg-white/15"
                                    }
                                  `}
                                />
                              )
                            )}

                          </div>

                        </div>
                      )}

                    </div>

                    {/* ==========================================
                        CONFIRMAR
                    ========================================== */}

                    <div>

                      <label
                        htmlFor="confirm-password"
                        className="
                          mb-1.5
                          block
                          text-[9px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-white
                          drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]
                        "
                      >
                        Confirmar contraseña
                      </label>

                      <div className="relative">

                        <Lock
                          className="
                            pointer-events-none
                            absolute
                            left-3
                            top-1/2
                            h-4
                            w-4
                            -translate-y-1/2
                            text-fuchsia-400
                          "
                        />

                        <input
                          id="confirm-password"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          placeholder="Repite tu contraseña"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(
                              e.target.value
                            );
                            setError("");
                          }}
                          className={`
                            h-12
                            w-full
                            border
                            bg-black/75
                            pl-10
                            pr-11
                            text-[11px]
                            font-medium
                            text-white
                            outline-none
                            transition
                            placeholder:text-white/35
                            focus:ring-2

                            ${
                              confirmPassword &&
                              confirmPassword !==
                                password
                                ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                                : confirmPassword &&
                                  confirmPassword ===
                                    password
                                ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20"
                                : "border-white/10 focus:border-fuchsia-400 focus:ring-fuchsia-400/20"
                            }
                          `}
                          required
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) => !value
                            )
                          }
                          className="
                            absolute
                            right-1
                            top-1/2
                            flex
                            h-10
                            w-10
                            -translate-y-1/2
                            items-center
                            justify-center
                            text-white/50
                            transition
                            hover:text-white
                          "
                          aria-label={
                            showConfirmPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>

                      </div>

                    </div>

                    {/* ==========================================
                        LEGAL
                    ========================================== */}

                    <div
                      className="
                        border
                        border-white/20
                        bg-black/55
                        px-4
                        py-4
                        shadow-[0_4px_20px_rgba(0,0,0,0.25)]
                      "
                    >

                      {/* ----------------------------------------
                          LEGAL OBLIGATORIO
                      ---------------------------------------- */}

                      <label
                        className="
                          flex
                          cursor-pointer
                          items-start
                          gap-3
                        "
                      >

                        <input
                          type="checkbox"
                          checked={legalAccepted}
                          onChange={(e) => {
                            setLegalAccepted(
                              e.target.checked
                            );

                            setError("");
                          }}
                          className="
                            mt-0.5
                            h-5
                            w-5
                            shrink-0
                            cursor-pointer
                            accent-emerald-400
                          "
                        />

                        <span
                          className="
                            text-[9px]
                            leading-[1.55]
                            text-white/90
                            sm:text-[10px]
                          "
                        >
                          Acepto los{" "}
                          <strong className="text-emerald-300">
                            Términos y Condiciones
                          </strong>{" "}
                          y he leído el{" "}
                          <strong className="text-fuchsia-300">
                            Aviso de Privacidad
                          </strong>{" "}
                          y la{" "}
                          <strong className="text-fuchsia-300">
                            Política de Tratamiento de Datos
                          </strong>{" "}
                          de PeakScore.
                        </span>

                      </label>

                      {/* ----------------------------------------
                          MARKETING
                      ---------------------------------------- */}

                      <label
                        className="
                          mt-3
                          flex
                          cursor-pointer
                          items-start
                          gap-3
                        "
                      >

                        <input
                          type="checkbox"
                          checked={marketingAccepted}
                          onChange={(e) =>
                            setMarketingAccepted(
                              e.target.checked
                            )
                          }
                          className="
                            mt-0.5
                            h-4
                            w-4
                            shrink-0
                            cursor-pointer
                            accent-fuchsia-400
                          "
                        />

                        <span
                          className="
                            text-[8px]
                            leading-5
                            text-white/45
                            sm:text-[9px]
                          "
                        >
                          Quiero recibir novedades,
                          promociones y contenido de
                          PeakScore.{" "}
                          <span className="text-white/25">
                            (Opcional)
                          </span>
                        </span>

                      </label>

                    </div>

                    {/* ==========================================
                        TURNSTILE
                    ========================================== */}

                    <div className="flex justify-center">

                      <Turnstile
                        key={`register-captcha-${captchaKey}`}
                        siteKey={
                          process.env
                            .NEXT_PUBLIC_TURNSTILE_SITE_KEY!
                        }
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setError("");
                        }}
                        onExpire={() => {
                          setCaptchaToken("");

                          setError(
                            "La verificación de seguridad expiró. Completa el CAPTCHA nuevamente."
                          );
                        }}
                        onError={() => {
                          setCaptchaToken("");

                          setError(
                            "No se pudo cargar la verificación de seguridad."
                          );
                        }}
                        options={{
                          language: "es",
                          size: "flexible",
                        }}
                      />

                    </div>

                    {/* ==========================================
                        ERROR
                    ========================================== */}

                    {error && (
                      <div
                        className="
                          border
                          border-red-400/30
                          bg-red-400/10
                          px-4
                          py-3
                          text-[9px]
                          leading-5
                          text-red-100
                        "
                      >
                        {error}
                      </div>
                    )}

                    {/* ==========================================
                        BOTÓN
                    ========================================== */}

                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !captchaToken ||
                        !legalAccepted
                      }
                      className="
                        group
                        relative
                        flex
                        h-13
                        w-full
                        items-center
                        justify-center
                        gap-2
                        overflow-hidden
                        bg-gradient-to-r
                        from-emerald-400
                        via-emerald-300
                        to-fuchsia-500
                        text-[9px]
                        font-black
                        uppercase
                        tracking-[0.08em]
                        text-black
                        shadow-[4px_4px_0_rgba(0,0,0,0.5)]
                        transition
                        hover:brightness-110
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >

                      <span
                        aria-hidden="true"
                        className="
                          pointer-events-none
                          absolute
                          -left-24
                          top-0
                          h-full
                          w-12
                          skew-x-[-20deg]
                          bg-white/40
                          transition-all
                          duration-700
                          group-hover:left-[115%]
                        "
                      />

                      <span className="relative z-10">
                        {loading
                          ? "CREANDO CUENTA..."
                          : "CREAR MI CUENTA"}
                      </span>

                      {!loading && (
                        <ArrowRight
                          className="
                            relative
                            z-10
                            h-4
                            w-4
                            transition-transform
                            group-hover:translate-x-1
                          "
                        />
                      )}

                    </button>

                  </form>

                  {/* ==========================================
                      LOGIN
                  ========================================== */}

                  <div
                    className="
                      mt-5
                      text-center
                    "
                  >

                    <span
                      className="
                        text-[9px]
                        text-white/60
                      "
                    >
                      ¿Ya tienes una cuenta?
                    </span>

                    <Link
                      href="/login"
                      className="
                        ml-2
                        border-b
                        border-cyan-300/70
                        pb-0.5
                        text-[9px]
                        font-black
                        uppercase
                        tracking-wide
                        text-cyan-300
                        transition
                        hover:border-fuchsia-400
                        hover:text-fuchsia-300
                      "
                    >
                      INICIAR SESIÓN
                    </Link>

                  </div>

                </>
              )}

            </div>

          </div>

          {/* ====================================================
              FOOTER
          ==================================================== */}

          <p
            className="
              mt-3
              text-center
              text-[6px]
              uppercase
              tracking-[0.14em]
              text-white/30
            "
          >
            PEAKSCORE · PREPARACIÓN ICFES
          </p>

        </section>

      </div>

    </main>
  );
}