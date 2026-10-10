"use client";

import Link from "next/link";
import {
  AtSign,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  UserRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { supabase } from "@/lib/supabase/browser";

type Notice = {
  kind: "success" | "error" | "info";
  text: string;
};

type TotpFactor = {
  id: string;
  friendly_name: string | null;
  status: string;
};

type PendingEnrollment = {
  id: string;
  qrCode: string;
  secret: string;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-violet-200/80">
      {children}
    </span>
  );
}

function TextField(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={`min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

function Card({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#100d1d]/95 shadow-[0_16px_46px_rgba(0,0,0,.18)]">
      <div className="flex items-start gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-violet-400/10 text-violet-200">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-extrabold text-white sm:text-lg">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-white/55 sm:text-sm">{description}</p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export default function ConfiguracionPanel({
  initialEmail,
  initialFullName,
  initialPhone,
  isAdmin,
}: {
  initialEmail: string;
  initialFullName: string;
  initialPhone: string;
  isAdmin: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [fullName, setFullName] = useState(initialFullName);
  const [nameInput, setNameInput] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [pendingPhone, setPendingPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reauthCode, setReauthCode] = useState("");
  const [needsReauthCode, setNeedsReauthCode] = useState(false);

  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [enrollment, setEnrollment] = useState<PendingEnrollment | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [disableFactorId, setDisableFactorId] = useState<string | null>(null);

  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadFactors = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      setNotice({
        kind: "error",
        text: "No se pudo consultar la autenticación en dos pasos. Comprueba la configuración de Supabase Auth.",
      });
      return;
    }

    setFactors(
      data.totp
        .filter((factor) => factor.status === "verified")
        .map((factor) => ({
          id: factor.id,
          friendly_name: factor.friendly_name,
          status: factor.status,
        })),
    );
  }, []);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const cleanName = nameInput.trim();
    if (cleanName.length < 2 || cleanName.length > 70) {
      setNotice({ kind: "error", text: "El nombre debe tener entre 2 y 70 caracteres." });
      return;
    }

    setBusy("name");
    try {
      const response = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: cleanName }),
      });
      const result = (await response.json()) as { error?: string; success?: boolean; fullName?: string };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "No se pudo guardar el nombre.");
      }

      setFullName(result.fullName ?? cleanName);
      setNameInput(result.fullName ?? cleanName);
      setNotice({ kind: "success", text: "Nombre actualizado." });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "No se pudo guardar el nombre.",
      });
    } finally {
      setBusy("");
    }
  }

  async function requestEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const nextEmail = emailInput.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nextEmail) || nextEmail.length > 254) {
      setNotice({ kind: "error", text: "Escribe un correo válido." });
      return;
    }

    if (nextEmail === email.toLowerCase()) {
      setNotice({ kind: "info", text: "Ese ya es el correo actual de la cuenta." });
      return;
    }

    setBusy("email");
    const { error } = await supabase.auth.updateUser({ email: nextEmail });

    if (error) {
      setNotice({ kind: "error", text: error.message });
    } else {
      setNotice({
        kind: "success",
        text: "Solicitud enviada. Sigue los enlaces de confirmación que Supabase envíe para completar el cambio de correo.",
      });
    }
    setBusy("");
  }

  async function requestPhoneChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const nextPhone = phoneInput.trim();

    if (!/^\+[1-9]\d{7,14}$/.test(nextPhone)) {
      setNotice({ kind: "error", text: "Usa el formato internacional, por ejemplo +573001234567." });
      return;
    }

    setBusy("phone");
    const { error } = await supabase.auth.updateUser({ phone: nextPhone });

    if (error) {
      setNotice({
        kind: "error",
        text: error.message.toLowerCase().includes("phone_provider_disabled")
          ? "El proveedor de teléfono/SMS no está habilitado en Supabase Auth. El número no se vinculó."
          : error.message,
      });
    } else {
      setPendingPhone(nextPhone);
      setPhoneCode("");
      setNotice({
        kind: "info",
        text: "Supabase envió un código de verificación si el proveedor SMS está configurado. Confirma el número para terminar de vincularlo.",
      });
    }
    setBusy("");
  }

  async function verifyPhoneChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!pendingPhone || !/^\d{6,8}$/.test(phoneCode.trim())) {
      setNotice({ kind: "error", text: "Introduce el código de verificación recibido por SMS." });
      return;
    }

    setBusy("phone-verify");
    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: phoneCode.trim(),
      type: "phone_change",
    });

    if (error) {
      setNotice({ kind: "error", text: error.message });
    } else {
      const confirmedPhone = data.user?.phone ?? pendingPhone;
      setPhone(confirmedPhone);
      setPhoneInput(confirmedPhone);
      setPendingPhone("");
      setPhoneCode("");
      setNotice({ kind: "success", text: "Número de teléfono verificado y vinculado." });
    }
    setBusy("");
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!currentPassword) {
      setNotice({ kind: "error", text: "Introduce tu contraseña actual." });
      return;
    }

    if (newPassword.length < 15 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setNotice({ kind: "error", text: "Usa al menos 15 caracteres e incluye mayúscula, minúscula, número y símbolo." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ kind: "error", text: "Las contraseñas nuevas no coinciden." });
      return;
    }

    setBusy("password");
    const attributes = needsReauthCode
      ? { password: newPassword, current_password: currentPassword, nonce: reauthCode.trim() }
      : { password: newPassword, current_password: currentPassword };

    const { error } = await supabase.auth.updateUser(attributes);

    if (error && error.code === "reauthentication_needed" && !needsReauthCode) {
      const reauth = await supabase.auth.reauthenticate();
      if (reauth.error) {
        setNotice({ kind: "error", text: reauth.error.message });
      } else {
        setNeedsReauthCode(true);
        setNotice({
          kind: "info",
          text: "Supabase envió un código de reautenticación al contacto verificado. Introdúcelo y vuelve a confirmar el cambio.",
        });
      }
    } else if (error) {
      setNotice({ kind: "error", text: error.message });
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setReauthCode("");
      setNeedsReauthCode(false);
      setNotice({ kind: "success", text: "Contraseña actualizada." });
    }
    setBusy("");
  }

  async function beginTotpEnrollment() {
    setNotice(null);
    setBusy("mfa-enroll");

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "PeakScore - Authenticator",
    });

    if (error) {
      setNotice({ kind: "error", text: error.message });
    } else {
      setEnrollment({
        id: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setDisableFactorId(null);
      setMfaCode("");
      setNotice({
        kind: "info",
        text: "Escanea el QR con tu aplicación de autenticación y verifica el primer código para activar la protección.",
      });
    }
    setBusy("");
  }

  async function confirmTotp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const factorId = enrollment?.id ?? disableFactorId;
    if (!factorId || !/^\d{6,8}$/.test(mfaCode.trim())) {
      setNotice({ kind: "error", text: "Introduce el código de 6 a 8 dígitos de tu aplicación de autenticación." });
      return;
    }

    setBusy("mfa-verify");

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setNotice({ kind: "error", text: challenge.error.message });
      setBusy("");
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: mfaCode.trim(),
    });

    if (verification.error) {
      setNotice({ kind: "error", text: verification.error.message });
      setBusy("");
      return;
    }

    if (disableFactorId) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        setNotice({ kind: "error", text: error.message });
      } else {
        setNotice({ kind: "success", text: "Autenticación en dos pasos desactivada para ese dispositivo." });
        setDisableFactorId(null);
        setMfaCode("");
        await loadFactors();
      }
    } else {
      setNotice({ kind: "success", text: "Autenticación en dos pasos activada correctamente." });
      setEnrollment(null);
      setMfaCode("");
      await loadFactors();
    }

    setBusy("");
  }

  const verifiedTotp = factors.length > 0;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-violet-300/15 bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,.18),transparent_62%),#100d1d] p-5 sm:p-7">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-violet-300 sm:text-[10px]">
          CUENTA Y PROTECCIÓN
        </p>
        <h1 className="mt-3 text-2xl font-black sm:text-3xl">Configuración</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
          Gestiona la identidad de tu cuenta, tus datos de contacto y los métodos de seguridad.
        </p>
      </header>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${notice.kind === "success"
            ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
            : notice.kind === "error"
              ? "border-red-300/20 bg-red-400/10 text-red-200"
              : "border-violet-300/20 bg-violet-400/10 text-violet-100"}`}
        >
          {notice.kind === "success" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : notice.kind === "error" ? <XCircle size={18} className="mt-0.5 shrink-0" /> : <ShieldCheck size={18} className="mt-0.5 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <Card
        title="Identidad"
        description="El nombre se muestra en tu perfil y en el menú del personaje."
        icon={<UserRound size={19} />}
      >
        <form onSubmit={saveName} className="space-y-3">
          <label className="block">
            <FieldLabel>Nombre visible</FieldLabel>
            <TextField autoComplete="name" maxLength={70} minLength={2} value={nameInput} onChange={(event) => setNameInput(event.target.value)} required />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={busy === "name"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-violet-400 disabled:opacity-50">
              {busy === "name" && <LoaderCircle size={16} className="animate-spin" />}
              Guardar nombre
            </button>
            <span className="text-xs text-white/40">Nombre actual: {fullName || "Sin nombre"}</span>
          </div>
        </form>
      </Card>

      <Card
        title="Correo electrónico"
        description="Los cambios de correo requieren confirmación según la configuración de Supabase Auth."
        icon={<Mail size={19} />}
      >
        <p className="break-all rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/75">{email || "Correo no disponible"}</p>
        <form onSubmit={requestEmailChange} className="space-y-3">
          <label className="block">
            <FieldLabel>Nuevo correo</FieldLabel>
            <TextField type="email" autoComplete="email" maxLength={254} value={emailInput} onChange={(event) => setEmailInput(event.target.value)} required />
          </label>
          <button disabled={busy === "email"} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-300/25 bg-violet-400/10 px-4 py-2.5 text-sm font-extrabold text-violet-100 hover:bg-violet-400/15 disabled:opacity-50">
            {busy === "email" && <LoaderCircle size={16} className="animate-spin" />}
            Solicitar cambio de correo
          </button>
        </form>
      </Card>

      <Card
        title="Número de celular"
        description="Vincula un número internacional y confírmalo con el código SMS de Supabase."
        icon={<Phone size={19} />}
      >
        <p className="text-sm text-white/65">Número verificado: {phone || "Ninguno vinculado"}</p>
        {!pendingPhone ? (
          <form onSubmit={requestPhoneChange} className="space-y-3">
            <label className="block">
              <FieldLabel>Número nuevo (formato internacional)</FieldLabel>
              <TextField type="tel" inputMode="tel" autoComplete="tel" placeholder="+573001234567" value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)} required />
            </label>
            <button disabled={busy === "phone"} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50">
              {busy === "phone" && <LoaderCircle size={16} className="animate-spin" />}
              Enviar código SMS
            </button>
          </form>
        ) : (
          <form onSubmit={verifyPhoneChange} className="space-y-3">
            <p className="text-xs leading-5 text-violet-100/75">Código enviado para {pendingPhone}. Si no llega, comprueba el proveedor SMS y los límites de Auth de tu proyecto.</p>
            <label className="block">
              <FieldLabel>Código SMS</FieldLabel>
              <TextField inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, ""))} required />
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy === "phone-verify"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-extrabold disabled:opacity-50">
                {busy === "phone-verify" && <LoaderCircle size={16} className="animate-spin" />}
                Verificar número
              </button>
              <button type="button" onClick={() => { setPendingPhone(""); setPhoneCode(""); }} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/70 hover:bg-white/5">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </Card>

      <Card
        title="Contraseña"
        description="Se exige una contraseña robusta. Si Supabase solicita reautenticación, se pedirá un código adicional."
        icon={<KeyRound size={19} />}
      >
        <form onSubmit={changePassword} className="space-y-3">
          <label className="block">
            <FieldLabel>Contraseña actual</FieldLabel>
            <TextField type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
          <label className="block">
            <FieldLabel>Nueva contraseña</FieldLabel>
            <TextField type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={15} required />
          </label>
          <label className="block">
            <FieldLabel>Confirmar nueva contraseña</FieldLabel>
            <TextField type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={15} required />
          </label>
          {needsReauthCode && (
            <label className="block">
              <FieldLabel>Código de reautenticación</FieldLabel>
              <TextField inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={reauthCode} onChange={(event) => setReauthCode(event.target.value.trim())} required />
            </label>
          )}
          <p className="text-xs leading-5 text-white/45">Mínimo 15 caracteres, con mayúscula, minúscula, número y símbolo. No reutilices contraseñas de otros sitios.</p>
          <button disabled={busy === "password"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-violet-400 disabled:opacity-50">
            {busy === "password" && <LoaderCircle size={16} className="animate-spin" />}
            {needsReauthCode ? "Confirmar código y cambiar contraseña" : "Actualizar contraseña"}
          </button>
        </form>
      </Card>

      <Card
        title="Autenticación en dos pasos"
        description="Añade una aplicación de autenticación para exigir un código temporal además de tu contraseña. El TOTP está disponible en Supabase Auth."
        icon={<LockKeyhole size={19} />}
      >
        {verifiedTotp ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-200">
              <CheckCircle2 size={18} />
              Protección con aplicación activa
            </div>
            <div className="space-y-2">
              {factors.map((factor) => (
                <div key={factor.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <div>
                    <p className="text-sm font-bold text-white">{factor.friendly_name || "Aplicación de autenticación"}</p>
                    <p className="mt-1 text-xs text-white/40">Factor verificado</p>
                  </div>
                  <button type="button" onClick={() => { setDisableFactorId(factor.id); setEnrollment(null); setMfaCode(""); setNotice({kind:"info",text:"Verifica un último código de la aplicación para desactivar este factor."}); }} className="min-h-10 rounded-lg border border-red-300/20 px-3 text-xs font-bold text-red-200 hover:bg-red-400/10">
                    Desactivar
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : enrollment ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-white/65">Escanea este QR con Google Authenticator, Microsoft Authenticator u otra aplicación TOTP compatible.</p>
            <div className="inline-flex rounded-xl bg-white p-3">
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qrCode)}`}
                alt="Código QR para configurar la autenticación en dos pasos"
                className="h-44 w-44"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200/70">Clave manual (mantener privada)</p>
              <p className="mt-2 break-all font-mono text-sm text-white">{enrollment.secret}</p>
            </div>
            <form onSubmit={confirmTotp} className="space-y-3">
              <label className="block">
                <FieldLabel>Código de la aplicación</FieldLabel>
                <TextField inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))} required />
              </label>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy === "mfa-verify"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-extrabold disabled:opacity-50">
                  {busy === "mfa-verify" && <LoaderCircle size={16} className="animate-spin" />}
                  Verificar y activar
                </button>
                <button type="button" onClick={() => { setEnrollment(null); setMfaCode(""); }} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/70 hover:bg-white/5">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : disableFactorId ? (
          <form onSubmit={confirmTotp} className="space-y-3">
            <p className="text-sm leading-6 text-white/65">Introduce el código actual de tu aplicación para confirmar la desactivación.</p>
            <label className="block">
              <FieldLabel>Código de la aplicación</FieldLabel>
              <TextField inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))} required />
            </label>
            <div className="flex flex-wrap gap-2">
              <button disabled={busy === "mfa-verify"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-50">
                Confirmar desactivación
              </button>
              <button type="button" onClick={() => { setDisableFactorId(null); setMfaCode(""); }} className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/70 hover:bg-white/5">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-white/65">No hay una aplicación de autenticación verificada en esta cuenta. Configúrala con un autenticador TOTP. La verificación en dos pasos debe comprobarse también en los flujos de inicio de sesión y en los endpoints que protegen datos sensibles.</p>
            <button type="button" onClick={beginTotpEnrollment} disabled={busy === "mfa-enroll"} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-violet-400 disabled:opacity-50">
              {busy === "mfa-enroll" && <LoaderCircle size={16} className="animate-spin" />}
              Configurar autenticación en dos pasos
            </button>
          </div>
        )}
      </Card>

      {isAdmin && (
        <Card
          title="Administración de PeakScore"
          description="Accesos reservados a tu cuenta administradora global."
          icon={<ShieldCheck size={19} />}
        >
          <Link href="/dashboard/admin" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-300/25 bg-violet-400/10 px-4 py-2.5 text-sm font-extrabold text-violet-100 transition hover:bg-violet-400/15">
            <ShieldCheck size={17} />
            Abrir panel de administración
          </Link>
        </Card>
      )}

      <p className="flex items-start gap-2 text-xs leading-5 text-white/35">
        <Smartphone size={15} className="mt-0.5 shrink-0" />
        El correo y el teléfono cambian solamente tras las confirmaciones que exija Supabase Auth. Nunca compartas códigos TOTP, SMS o de reautenticación.
      </p>
    </div>
  );
}
