import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/admin";

type VerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "changes_requested"
  | "rejected";

type InstitutionRequest = {
  id: string;
  institution_name: string;
  institution_nit: string;
  institution_type: string;
  institution_city: string;
  representative_full_name: string;
  institutional_email: string;
  verification_status: VerificationStatus;
  submitted_at: string;
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

export default async function InstitutionRequestsPage() {
  await requireAdmin();

  const supabase = await createClient();

  const {
    data: requests,
    error,
  } = await supabase
    .from("institution_verification_requests")
    .select(
      "id, institution_name, institution_nit, institution_type, institution_city, representative_full_name, institutional_email, verification_status, submitted_at"
    )
    .order("submitted_at", {
      ascending: false,
    });

  const institutionRequests: InstitutionRequest[] =
    requests ?? [];

  const pendingCount =
    institutionRequests.filter(
      (item) =>
        item.verification_status ===
          "pending" ||
        item.verification_status ===
          "under_review"
    ).length;

  const approvedCount =
    institutionRequests.filter(
      (item) =>
        item.verification_status ===
        "approved"
    ).length;

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
            CABECERA
        ===================================================== */}

        <div
          className="
            flex
            flex-col
            gap-5
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div>
            <Link
              href="/dashboard/admin"
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
              Volver a administración
            </Link>

            <div className="mt-5 flex items-center gap-3">
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-cyan-400/20
                  bg-cyan-400/10
                  text-cyan-300
                "
              >
                <Building2 size={24} />
              </div>

              <div>
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
                    text-2xl
                    font-black
                    tracking-tight
                    text-white
                    sm:text-3xl
                  "
                >
                  Solicitudes institucionales
                </h1>

                <p
                  className="
                    mt-1
                    max-w-2xl
                    text-sm
                    leading-6
                    text-slate-400
                  "
                >
                  Revisa y controla las solicitudes
                  recibidas de instituciones educativas.
                </p>
              </div>
            </div>
          </div>

          {/* RESUMEN */}

          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:w-auto
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-amber-400/15
                bg-amber-400/[0.05]
                px-5
                py-4
              "
            >
              <div className="flex items-center gap-2">
                <Clock3
                  size={15}
                  className="text-amber-300"
                />

                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-slate-500
                  "
                >
                  Pendientes
                </span>
              </div>

              <p
                className="
                  mt-2
                  text-2xl
                  font-black
                  text-white
                "
              >
                {pendingCount}
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-emerald-400/15
                bg-emerald-400/[0.05]
                px-5
                py-4
              "
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-emerald-300"
                />

                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-slate-500
                  "
                >
                  Aprobadas
                </span>
              </div>

              <p
                className="
                  mt-2
                  text-2xl
                  font-black
                  text-white
                "
              >
                {approvedCount}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-red-400/20
              bg-red-400/10
              px-4
              py-3
              text-sm
              text-red-200
            "
          >
            No fue posible cargar las solicitudes
            institucionales.
          </div>
        )}

        {/* =====================================================
            CONTENIDO
        ===================================================== */}

        <section className="mt-8">

          {institutionRequests.length === 0 ? (
            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-white/[0.025]
                px-6
                py-16
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-cyan-400/20
                  bg-cyan-400/10
                  text-cyan-300
                "
              >
                <Building2 size={28} />
              </div>

              <h2
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-white
                "
              >
                No hay solicitudes todavía
              </h2>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Las nuevas solicitudes institucionales
                aparecerán aquí cuando sean registradas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {institutionRequests.map(
                (requestItem) => (
                  <article
                    key={requestItem.id}
                    className="
                      group
                      overflow-hidden
                      rounded-3xl
                      border
                      border-white/10
                      bg-white/[0.025]
                      transition
                      hover:border-cyan-400/20
                      hover:bg-white/[0.04]
                    "
                  >
                    <div className="p-5 sm:p-6">

                      <div
                        className="
                          flex
                          flex-col
                          gap-5
                          xl:flex-row
                          xl:items-start
                          xl:justify-between
                        "
                      >

                        {/* INFORMACIÓN PRINCIPAL */}

                        <div className="min-w-0">
                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                            "
                          >
                            <span
                              className={`
                                inline-flex
                                items-center
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-wide
                                ${getStatusClasses(
                                  requestItem.verification_status
                                )}
                              `}
                            >
                              {getStatusLabel(
                                requestItem.verification_status
                              )}
                            </span>

                            <span
                              className="
                                rounded-full
                                border
                                border-white/10
                                bg-white/[0.03]
                                px-2.5
                                py-1
                                text-[10px]
                                font-medium
                                text-slate-500
                              "
                            >
                              {requestItem.institution_type ===
                              "official"
                                ? "Oficial"
                                : "Privada"}
                            </span>
                          </div>

                          <h2
                            className="
                              mt-4
                              text-xl
                              font-black
                              tracking-tight
                              text-white
                              sm:text-2xl
                            "
                          >
                            {requestItem.institution_name}
                          </h2>

                          <div
                            className="
                              mt-4
                              grid
                              gap-3
                              sm:grid-cols-2
                              xl:grid-cols-3
                            "
                          >

                            {/* CIUDAD */}

                            <div
                              className="
                                flex
                                min-w-0
                                items-start
                                gap-2.5
                              "
                            >
                              <MapPin
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-cyan-300/70
                                "
                              />

                              <div className="min-w-0">
                                <p
                                  className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-600
                                  "
                                >
                                  Ubicación
                                </p>

                                <p
                                  className="
                                    mt-1
                                    truncate
                                    text-sm
                                    text-slate-300
                                  "
                                >
                                  {requestItem.institution_city}
                                </p>
                              </div>
                            </div>

                            {/* REPRESENTANTE */}

                            <div
                              className="
                                flex
                                min-w-0
                                items-start
                                gap-2.5
                              "
                            >
                              <UserRound
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-purple-300/70
                                "
                              />

                              <div className="min-w-0">
                                <p
                                  className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-600
                                  "
                                >
                                  Representante
                                </p>

                                <p
                                  className="
                                    mt-1
                                    truncate
                                    text-sm
                                    text-slate-300
                                  "
                                >
                                  {
                                    requestItem.representative_full_name
                                  }
                                </p>
                              </div>
                            </div>

                            {/* CORREO */}

                            <div
                              className="
                                flex
                                min-w-0
                                items-start
                                gap-2.5
                              "
                            >
                              <Mail
                                size={16}
                                className="
                                  mt-0.5
                                  shrink-0
                                  text-emerald-300/70
                                "
                              />

                              <div className="min-w-0">
                                <p
                                  className="
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.12em]
                                    text-slate-600
                                  "
                                >
                                  Correo institucional
                                </p>

                                <p
                                  className="
                                    mt-1
                                    truncate
                                    text-sm
                                    text-slate-300
                                  "
                                >
                                  {
                                    requestItem.institutional_email
                                  }
                                </p>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* LATERAL */}

                        <div
                          className="
                            flex
                            shrink-0
                            flex-col
                            gap-3
                            xl:w-[220px]
                          "
                        >
                          <div
                            className="
                              rounded-2xl
                              border
                              border-white/10
                              bg-black/20
                              px-4
                              py-3
                            "
                          >
                            <p
                              className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                                text-slate-600
                              "
                            >
                              Recibida
                            </p>

                            <p
                              className="
                                mt-1
                                text-sm
                                text-slate-300
                              "
                            >
                              {formatDate(
                                requestItem.submitted_at
                              )}
                            </p>
                          </div>

                          <Link
                            href={`/dashboard/admin/institutions/${requestItem.id}`}
                            className="
                              inline-flex
                              h-11
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-gradient-to-r
                              from-cyan-400
                              to-violet-500
                              px-4
                              text-xs
                              font-black
                              uppercase
                              tracking-wide
                              text-white
                              transition
                              hover:-translate-y-0.5
                            "
                          >
                            Revisar solicitud
                            <ChevronRight size={16} />
                          </Link>
                        </div>

                      </div>
                    </div>
                  </article>
                )
              )}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}