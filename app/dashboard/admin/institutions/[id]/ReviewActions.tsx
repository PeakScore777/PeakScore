"use client";

import { useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PlayCircle,
  XCircle,
} from "lucide-react";

type ReviewAction =
  | "start_review"
  | "approve"
  | "request_changes"
  | "reject";

type VerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "changes_requested"
  | "rejected";

type ReviewActionsProps = {
  requestId: string;
  status: VerificationStatus;
};

const ACTION_LABELS: Record<
  ReviewAction,
  string
> = {
  start_review: "Tomar en revisión",
  approve: "Aprobar solicitud",
  request_changes: "Solicitar cambios",
  reject: "Rechazar solicitud",
};

export default function ReviewActions({
  requestId,
  status,
}: ReviewActionsProps) {
  const [loadingAction, setLoadingAction] =
    useState<ReviewAction | null>(null);

  const [reasonAction, setReasonAction] =
    useState<
      "request_changes" | "reject" | null
    >(null);

  const [reason, setReason] =
    useState("");

  const [error, setError] =
    useState("");

  async function executeAction(
    action: ReviewAction,
    actionReason?: string
  ) {
    if (loadingAction) {
      return;
    }

    setError("");
    setLoadingAction(action);

    try {
      const response = await fetch(
        `/api/admin/institutions/${requestId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            ...(actionReason
              ? {
                  reason: actionReason,
                }
              : {}),
          }),
        }
      );

      const data =
        (await response.json()) as {
          success?: boolean;
          error?: string;
        };

      if (!response.ok) {
        setError(
          data.error ??
            "No fue posible actualizar la solicitud."
        );

        return;
      }

      window.location.reload();
    } catch {
      setError(
        "No fue posible conectar con el servidor."
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function handleSimpleAction(
    action:
      | "start_review"
      | "approve"
  ) {
    const messages = {
      start_review:
        "¿Quieres tomar esta solicitud en revisión?",
      approve:
        "¿Confirmas que deseas aprobar esta solicitud?",
    };

    const confirmed = window.confirm(
      messages[action]
    );

    if (!confirmed) {
      return;
    }

    executeAction(action);
  }

  function openReasonForm(
    action:
      | "request_changes"
      | "reject"
  ) {
    setError("");
    setReason("");
    setReasonAction(action);
  }

  function closeReasonForm() {
    if (loadingAction) {
      return;
    }

    setReasonAction(null);
    setReason("");
    setError("");
  }

  async function handleReasonSubmit() {
    if (!reasonAction || loadingAction) {
      return;
    }

    const cleanReason = reason
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanReason.length < 10) {
      setError(
        "Escribe un motivo de al menos 10 caracteres."
      );

      return;
    }

    if (cleanReason.length > 1000) {
      setError(
        "El motivo no puede superar los 1000 caracteres."
      );

      return;
    }

    await executeAction(
      reasonAction,
      cleanReason
    );
  }

  if (
    status !== "pending" &&
    status !== "under_review"
  ) {
    return (
      <section
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/[0.025]
          p-5
        "
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <div>
            <h2
              className="
                text-sm
                font-black
                text-white
              "
            >
              Revisión finalizada
            </h2>

            <p
              className="
                mt-2
                text-xs
                leading-5
                text-slate-500
              "
            >
              Esta solicitud ya no admite nuevas
              acciones de revisión.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className="
          rounded-3xl
          border
          border-cyan-400/10
          bg-cyan-400/[0.025]
          p-5
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-cyan-400/20
              bg-cyan-400/10
              text-cyan-300
            "
          >
            <PlayCircle size={19} />
          </div>

          <div>
            <h2
              className="
                text-sm
                font-black
                text-white
              "
            >
              Revisión administrativa
            </h2>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-500
              "
            >
              Gestiona el estado de la solicitud
              desde este panel.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-red-400/20
              bg-red-400/10
              p-3
              text-xs
              leading-5
              text-red-200
            "
          >
            {error}
          </div>
        )}

        <div className="mt-5 space-y-3">

          {/* TOMAR EN REVISIÓN */}

          {status === "pending" && (
            <button
              type="button"
              onClick={() =>
                handleSimpleAction(
                  "start_review"
                )
              }
              disabled={loadingAction !== null}
              className="
                flex
                h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-cyan-400/20
                bg-cyan-400/10
                px-4
                text-xs
                font-black
                uppercase
                tracking-wide
                text-cyan-300
                transition
                hover:bg-cyan-400/15
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loadingAction ===
              "start_review" ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <PlayCircle size={16} />
              )}

              Tomar en revisión
            </button>
          )}

          {/* ACCIONES FINALES */}

          {status === "under_review" && (
            <>
              <button
                type="button"
                onClick={() =>
                  handleSimpleAction("approve")
                }
                disabled={
                  loadingAction !== null
                }
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-400
                  to-cyan-400
                  px-4
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-slate-950
                  transition
                  hover:-translate-y-0.5
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {loadingAction ===
                "approve" ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2 size={16} />
                )}

                Aprobar solicitud
              </button>

              <button
                type="button"
                onClick={() =>
                  openReasonForm(
                    "request_changes"
                  )
                }
                disabled={
                  loadingAction !== null
                }
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-purple-400/20
                  bg-purple-400/10
                  px-4
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-purple-300
                  transition
                  hover:bg-purple-400/15
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <AlertTriangle size={16} />

                Solicitar cambios
              </button>

              <button
                type="button"
                onClick={() =>
                  openReasonForm("reject")
                }
                disabled={
                  loadingAction !== null
                }
                className="
                  flex
                  h-11
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-red-400/20
                  bg-red-400/10
                  px-4
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-red-300
                  transition
                  hover:bg-red-400/15
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <XCircle size={16} />

                Rechazar solicitud
              </button>
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          MODAL DE MOTIVO
      ===================================================== */}

      {reasonAction && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/70
            p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full
              max-w-lg
              rounded-3xl
              border
              border-white/10
              bg-[#0B1020]
              p-5
              shadow-2xl
              sm:p-6
            "
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border

                  ${
                    reasonAction ===
                    "reject"
                      ? "border-red-400/20 bg-red-400/10 text-red-300"
                      : "border-purple-400/20 bg-purple-400/10 text-purple-300"
                  }
                `}
              >
                {reasonAction ===
                "reject" ? (
                  <XCircle size={19} />
                ) : (
                  <AlertTriangle size={19} />
                )}
              </div>

              <div>
                <h3
                  className="
                    text-base
                    font-black
                    text-white
                  "
                >
                  {ACTION_LABELS[
                    reasonAction
                  ]}
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-500
                  "
                >
                  Escribe el motivo que quedará
                  registrado junto con la decisión.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="review-reason"
                className="
                  mb-2
                  block
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-slate-500
                "
              >
                Motivo
              </label>

              <textarea
                id="review-reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                maxLength={1000}
                rows={6}
                autoFocus
                placeholder={
                  reasonAction ===
                  "reject"
                    ? "Explica por qué la solicitud no puede ser aprobada..."
                    : "Indica qué información o cambios debe realizar el solicitante..."
                }
                disabled={
                  loadingAction !== null
                }
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/25
                  px-4
                  py-3
                  text-sm
                  leading-6
                  text-white
                  outline-none
                  placeholder:text-slate-700
                  focus:border-cyan-400/30
                "
              />

              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-between
                "
              >
                <span
                  className="
                    text-[10px]
                    text-slate-600
                  "
                >
                  Mínimo 10 caracteres
                </span>

                <span
                  className="
                    text-[10px]
                    text-slate-600
                  "
                >
                  {reason.length}/1000
                </span>
              </div>
            </div>

            <div
              className="
                mt-5
                flex
                gap-3
              "
            >
              <button
                type="button"
                onClick={closeReasonForm}
                disabled={
                  loadingAction !== null
                }
                className="
                  h-11
                  flex-1
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  px-4
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-slate-400
                  transition
                  hover:bg-white/[0.06]
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  handleReasonSubmit
                }
                disabled={
                  loadingAction !== null ||
                  reason.trim().length < 10
                }
                className={`
                  h-11
                  flex-1
                  rounded-xl
                  px-4
                  text-xs
                  font-black
                  uppercase
                  tracking-wide
                  text-white
                  transition
                  disabled:cursor-not-allowed
                  disabled:opacity-40

                  ${
                    reasonAction ===
                    "reject"
                      ? "bg-gradient-to-r from-red-500 to-purple-500 hover:-translate-y-0.5"
                      : "bg-gradient-to-r from-purple-500 to-cyan-400 hover:-translate-y-0.5"
                  }
                `}
              >
                {loadingAction !==
                null ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Guardando...
                  </span>
                ) : (
                  "Confirmar decisión"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}