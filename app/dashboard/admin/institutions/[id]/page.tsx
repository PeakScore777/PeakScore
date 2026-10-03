import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";
import ReviewActions from "./ReviewActions";

type VerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "changes_requested"
  | "rejected";

type InstitutionVerificationRequest = {
  id: string;

  institution_id: string;

  representative_user_id:
    | string
    | null;

  representative_full_name: string;
  representative_document_type: string;
  representative_document_number: string;
  representative_role: string;

  institutional_email: string;
  contact_phone: string;

  institution_name: string;
  institution_nit: string;
  institution_type: string;
  institution_address: string;
  institution_city: string;

  verification_status:
    VerificationStatus;

  terms_accepted_at: string;
  privacy_notice_version: string;

  submitted_at: string;

  reviewed_at:
    | string
    | null;

  reviewed_by:
    | string
    | null;

  applicant_message:
    | string
    | null;

  internal_review_notes:
    | string
    | null;

  created_at: string;
  updated_at: string;
};

function getStatusLabel(
  status: VerificationStatus
) {
  switch (status) {
    case "pending":
      return "Pendiente";

    case "under_review":
      return "En revisión";

    case "approved":
      return "Aprobada";

    case "changes_requested":
      return "Cambios solicitados";

    case "rejected":
      return "Rechazada";

    default:
      return status;
  }
}

function getStatusClasses(
  status: VerificationStatus
) {
  switch (status) {
    case "pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "under_review":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "approved":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "changes_requested":
      return "border-purple-400/20 bg-purple-400/10 text-purple-300";

    case "rejected":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    default:
      return "border-white/10 bg-white/[0.04] text-slate-300";
  }
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "No disponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No disponible";
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function maskDocument(
  value: string
) {
  if (value.length <= 4) {
    return value;
  }

  return `${"•".repeat(
    Math.max(0, value.length - 4)
  )}${value.slice(-4)}`;
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-black/20
        p-4
      "
    >
      <div className="flex items-start gap-3">
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-white/10
            bg-white/[0.04]
            text-cyan-300
          "
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[0.13em]
              text-slate-600
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1.5
              break-words
              text-sm
              leading-5
              text-slate-200
            "
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function InstitutionRequestDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  await requireAdmin();

  const params = await props.params;
  const id = params.id;

  /*
   * Validación básica del UUID antes de consultar
   * PostgreSQL. Evita enviar valores arbitrarios
   * al filtro de la consulta.
   */
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from(
      "institution_verification_requests"
    )
    .select(
      `
        id,
        institution_id,
        representative_user_id,
        representative_full_name,
        representative_document_type,
        representative_document_number,
        representative_role,
        institutional_email,
        contact_phone,
        institution_name,
        institution_nit,
        institution_type,
        institution_address,
        institution_city,
        verification_status,
        terms_accepted_at,
        privacy_notice_version,
        submitted_at,
        reviewed_at,
        reviewed_by,
        applicant_message,
        internal_review_notes,
        created_at,
        updated_at
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    notFound();
  }

  const requestItem =
    data as InstitutionVerificationRequest;

  return (
    <main
      className="
        min-h-screen
        bg-[#060B18]
        px-4
        py-6
        text-white
        sm:px-6
        sm:py-8
        lg:px-8
      "
    >
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            NAVEGACIÓN
        ===================================================== */}

        <div className="mb-7">
          <Link
            href="/dashboard/admin/institutions"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-slate-500
              transition
              hover:text-cyan-300
            "
          >
            <ArrowLeft size={16} />
            Volver a solicitudes
          </Link>
        </div>

        {/* =====================================================
            CABECERA
        ===================================================== */}

        <header
          className="
            rounded-3xl
            border
            border-white/10
            bg-white/[0.025]
            p-5
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="flex min-w-0 items-start gap-4">
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-cyan-400/20
                  bg-cyan-400/10
                  text-cyan-300
                "
              >
                <Building2 size={27} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.18em]
                    text-cyan-300/80
                  "
                >
                  PeakScore Instituciones
                </p>

                <h1
                  className="
                    mt-1
                    break-words
                    text-2xl
                    font-black
                    tracking-tight
                    text-white
                    sm:text-3xl
                  "
                >
                  {requestItem.institution_name}
                </h1>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                  "
                >
                  Solicitud recibida el{" "}
                  {formatDate(
                    requestItem.submitted_at
                  )}
                </p>
              </div>
            </div>

            <div
              className={`
                inline-flex
                w-fit
                shrink-0
                items-center
                rounded-full
                border
                px-3
                py-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                ${getStatusClasses(
                  requestItem.verification_status
                )}
              `}
            >
              {getStatusLabel(
                requestItem.verification_status
              )}
            </div>
          </div>
        </header>

        {/* =====================================================
            CONTENIDO
        ===================================================== */}

        <div
          className="
            mt-6
            grid
            gap-6
            xl:grid-cols-[minmax(0,1fr)_340px]
          "
        >

          {/* ===================================================
              INFORMACIÓN PRINCIPAL
          =================================================== */}

          <div className="space-y-6">

            {/* INSTITUCIÓN */}

            <section
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.025]
                p-5
                sm:p-6
              "
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-cyan-400/20
                    bg-cyan-400/10
                    text-cyan-300
                  "
                >
                  <Building2 size={18} />
                </div>

                <div>
                  <h2
                    className="
                      text-lg
                      font-black
                      text-white
                    "
                  >
                    Información de la institución
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    Datos declarados en la solicitud.
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <InfoItem
                  label="Nombre"
                  value={
                    requestItem.institution_name
                  }
                  icon={
                    <Building2 size={17} />
                  }
                />

                <InfoItem
                  label="NIT"
                  value={
                    requestItem.institution_nit
                  }
                  icon={
                    <FileText size={17} />
                  }
                />

                <InfoItem
                  label="Tipo"
                  value={
                    requestItem.institution_type ===
                    "official"
                      ? "Institución educativa oficial"
                      : "Institución educativa privada"
                  }
                  icon={
                    <ShieldCheck size={17} />
                  }
                />

                <InfoItem
                  label="Ciudad / municipio"
                  value={
                    requestItem.institution_city
                  }
                  icon={
                    <MapPin size={17} />
                  }
                />

                <InfoItem
                  label="Dirección"
                  value={
                    requestItem.institution_address
                  }
                  icon={
                    <MapPin size={17} />
                  }
                />

                <InfoItem
                  label="Correo institucional"
                  value={
                    requestItem.institutional_email
                  }
                  icon={
                    <Mail size={17} />
                  }
                />

                <InfoItem
                  label="Teléfono institucional"
                  value={
                    requestItem.contact_phone
                  }
                  icon={
                    <Phone size={17} />
                  }
                />
              </div>
            </section>

            {/* RECTOR */}

            <section
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.025]
                p-5
                sm:p-6
              "
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-purple-400/20
                    bg-purple-400/10
                    text-purple-300
                  "
                >
                  <UserRound size={18} />
                </div>

                <div>
                  <h2
                    className="
                      text-lg
                      font-black
                      text-white
                    "
                  >
                    Representante / rector
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    Información declarada del representante.
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <InfoItem
                  label="Nombre completo"
                  value={
                    requestItem.representative_full_name
                  }
                  icon={
                    <UserRound size={17} />
                  }
                />

                <InfoItem
                  label="Cargo"
                  value={
                    requestItem.representative_role ===
                    "rector"
                      ? "Rector"
                      : requestItem.representative_role
                  }
                  icon={
                    <ShieldCheck size={17} />
                  }
                />

                <InfoItem
                  label="Documento"
                  value={`${requestItem.representative_document_type} · ${maskDocument(
                    requestItem.representative_document_number
                  )}`}
                  icon={
                    <FileText size={17} />
                  }
                />

                <InfoItem
                  label="Correo utilizado para contacto"
                  value={
                    requestItem.institutional_email
                  }
                  icon={
                    <Mail size={17} />
                  }
                />

                <InfoItem
                  label="Teléfono de contacto"
                  value={
                    requestItem.contact_phone
                  }
                  icon={
                    <Phone size={17} />
                  }
                />
              </div>
            </section>

            {/* LEGAL / TRAZABILIDAD */}

            <section
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.025]
                p-5
                sm:p-6
              "
            >
              <div className="mb-5 flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-emerald-400/20
                    bg-emerald-400/10
                    text-emerald-300
                  "
                >
                  <FileText size={18} />
                </div>

                <div>
                  <h2
                    className="
                      text-lg
                      font-black
                      text-white
                    "
                  >
                    Trazabilidad de la solicitud
                  </h2>

                  <p
                    className="
                      mt-0.5
                      text-xs
                      text-slate-500
                    "
                  >
                    Datos de registro y estado.
                  </p>
                </div>
              </div>

              <div
                className="
                  grid
                  gap-3
                  sm:grid-cols-2
                "
              >
                <InfoItem
                  label="Solicitud creada"
                  value={formatDate(
                    requestItem.created_at
                  )}
                  icon={
                    <CalendarDays size={17} />
                  }
                />

                <InfoItem
                  label="Última actualización"
                  value={formatDate(
                    requestItem.updated_at
                  )}
                  icon={
                    <CalendarDays size={17} />
                  }
                />

                <InfoItem
                  label="Aceptación de términos"
                  value={formatDate(
                    requestItem.terms_accepted_at
                  )}
                  icon={
                    <CheckCircle2 size={17} />
                  }
                />

                <InfoItem
                  label="Versión del aviso de privacidad"
                  value={
                    requestItem.privacy_notice_version
                  }
                  icon={
                    <ShieldCheck size={17} />
                  }
                />

                <InfoItem
                  label="Revisión realizada"
                  value={formatDate(
                    requestItem.reviewed_at
                  )}
                  icon={
                    <CalendarDays size={17} />
                  }
                />

                <InfoItem
                  label="Representante asociado"
                  value={
                    requestItem.representative_user_id
                      ? "Cuenta asociada"
                      : "Sin cuenta asociada"
                  }
                  icon={
                    <UserRound size={17} />
                  }
                />
              </div>
            </section>

            {/* MENSAJE DEL SOLICITANTE */}

            {requestItem.applicant_message && (
              <section
                className="
                  rounded-3xl
                  border
                  border-white/10
                  bg-white/[0.025]
                  p-5
                  sm:p-6
                "
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-cyan-400/20
                      bg-cyan-400/10
                      text-cyan-300
                    "
                  >
                    <Mail size={18} />
                  </div>

                  <div>
                    <h2
                      className="
                        text-lg
                        font-black
                        text-white
                      "
                    >
                      Mensaje del solicitante
                    </h2>
                  </div>
                </div>

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-black/20
                    p-4
                    text-sm
                    leading-6
                    text-slate-300
                  "
                >
                  {requestItem.applicant_message}
                </div>
              </section>
            )}

          </div>

          {/* ===================================================
              COLUMNA DERECHA
          =================================================== */}

          <aside className="space-y-6">

            {/* ESTADO */}

            <section
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.025]
                p-5
              "
            >
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-slate-600
                "
              >
                Estado actual
              </p>

              <div
                className={`
                  mt-3
                  rounded-2xl
                  border
                  p-4
                  ${getStatusClasses(
                    requestItem.verification_status
                  )}
                `}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} />

                  <div>
                    <p className="text-sm font-bold">
                      {getStatusLabel(
                        requestItem.verification_status
                      )}
                    </p>

                    <p
                      className="
                        mt-1
                        text-[11px]
                        opacity-70
                      "
                    >
                      La solicitud todavía está en proceso
                      de verificación.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ACCIONES DE REVISIÓN */}

            <ReviewActions
              requestId={requestItem.id}
              status={requestItem.verification_status}
            />

            {/* DATOS INTERNOS */}

            <section
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.025]
                p-5
              "
            >
              <p
                className="
                  text-[9px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-slate-600
                "
              >
                Identificador de solicitud
              </p>

              <p
                className="
                  mt-2
                  break-all
                  font-mono
                  text-[10px]
                  leading-5
                  text-slate-500
                "
              >
                {requestItem.id}
              </p>
            </section>

          </aside>
        </div>
      </div>
    </main>
  );
}