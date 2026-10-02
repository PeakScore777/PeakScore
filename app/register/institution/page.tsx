"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Turnstile } from "@marsidev/react-turnstile";

/* ============================================================
   TIPOS
============================================================ */

type Step = 1 | 2 | 3;

type InstitutionForm = {
  institutionName: string;
  nit: string;
  institutionType: string;

  department: string;
  city: string;
  address: string;

  institutionalEmail: string;
  institutionalPhone: string;

  rectorName: string;
  documentType: string;
  documentNumber: string;
  rectorEmail: string;
  rectorPhone: string;

  acceptTerms: boolean;
  acceptPrivacy: boolean;
  marketing: boolean;
};

type DepartmentOption = {
  code: string;
  name: string;
};

type MunicipalityOption = {
  code: string;
  name: string;
  departmentCode: string;
};

/* ============================================================
   DEPARTAMENTOS
============================================================ */

const DEPARTMENTS: DepartmentOption[] = [
  { code: "05", name: "Antioquia" },
  { code: "08", name: "Atlántico" },
  { code: "11", name: "Bogotá D.C." },
  { code: "13", name: "Bolívar" },
  { code: "15", name: "Boyacá" },
  { code: "17", name: "Caldas" },
  { code: "18", name: "Caquetá" },
  { code: "19", name: "Cauca" },
  { code: "20", name: "Cesar" },
  { code: "23", name: "Córdoba" },
  { code: "25", name: "Cundinamarca" },
  { code: "27", name: "Chocó" },
  { code: "41", name: "Huila" },
  { code: "44", name: "La Guajira" },
  { code: "47", name: "Magdalena" },
  { code: "50", name: "Meta" },
  { code: "52", name: "Nariño" },
  { code: "54", name: "Norte de Santander" },
  { code: "63", name: "Quindío" },
  { code: "66", name: "Risaralda" },
  { code: "68", name: "Santander" },
  { code: "70", name: "Sucre" },
  { code: "73", name: "Tolima" },
  { code: "76", name: "Valle del Cauca" },
  { code: "81", name: "Arauca" },
  { code: "85", name: "Casanare" },
  { code: "86", name: "Putumayo" },
  {
    code: "88",
    name: "Archipiélago de San Andrés, Providencia y Santa Catalina",
  },
  { code: "91", name: "Amazonas" },
  { code: "94", name: "Guainía" },
  { code: "95", name: "Guaviare" },
  { code: "97", name: "Vaupés" },
  { code: "99", name: "Vichada" },
];

/* ============================================================
   TIPOS DE INSTITUCIÓN
============================================================ */

const INSTITUTION_TYPES = [
  {
    value: "official",
    label: "Institución educativa oficial",
  },
  {
    value: "private",
    label: "Institución educativa privada",
  },
];

/* ============================================================
   COMPONENTES REUTILIZABLES
   IMPORTANTE:
   Están fuera del componente principal para evitar que los
   inputs pierdan el foco en cada render.
============================================================ */

function FieldLabel({
  children,
  required = true,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-slate-200 sm:text-[11px]">
      {children}

      {required && (
        <span className="ml-1 text-fuchsia-400">
          *
        </span>
      )}
    </label>
  );
}

function InputWrapper({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-cyan-300">
        {icon}
      </div>

      {children}
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-words font-mono text-[10px] leading-4 text-slate-200">
        {value || "—"}
      </p>
    </div>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function InstitutionRegisterPage() {
  const [step, setStep] = useState<Step>(1);

  const [form, setForm] = useState<InstitutionForm>({
    institutionName: "",
    nit: "",
    institutionType: "",

    department: "",
    city: "",
    address: "",

    institutionalEmail: "",
    institutionalPhone: "",

    rectorName: "",
    documentType: "CC",
    documentNumber: "",
    rectorEmail: "",
    rectorPhone: "",

    acceptTerms: false,
    acceptPrivacy: false,
    marketing: false,
  });

  const [municipalities, setMunicipalities] = useState<
    MunicipalityOption[]
  >([]);

  const [loadingMunicipalities, setLoadingMunicipalities] =
    useState(false);

  const [captchaToken, setCaptchaToken] =
    useState("");

  const [error, setError] = useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  /* ==========================================================
     CLASES
  ========================================================== */

  const inputClassName = `
    h-11
    w-full
    rounded-lg
    border
    border-white/10
    bg-[#050814]/85
    pl-10
    pr-3
    font-mono
    text-xs
    text-white
    outline-none
    placeholder:text-slate-500
    transition-all
    duration-200
    focus:border-cyan-400/60
    focus:bg-[#050814]/95
    focus:ring-2
    focus:ring-cyan-400/10
  `;

  const selectClassName = `
    h-11
    w-full
    appearance-none
    rounded-lg
    border
    border-white/10
    bg-[#050814]/85
    pl-10
    pr-10
    font-mono
    text-xs
    text-white
    outline-none
    transition-all
    duration-200
    focus:border-cyan-400/60
    focus:bg-[#050814]/95
    focus:ring-2
    focus:ring-cyan-400/10
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  /* ==========================================================
     ACTUALIZAR CAMPO
  ========================================================== */

  const updateField = <
    K extends keyof InstitutionForm
  >(
    field: K,
    value: InstitutionForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  };

  /* ==========================================================
     CAMBIO DE DEPARTAMENTO
  ========================================================== */

  const handleDepartmentChange = (
    departmentCode: string
  ) => {
    setForm((previous) => ({
      ...previous,
      department: departmentCode,
      city: "",
    }));

    setMunicipalities([]);
    setError("");
  };

  /* ==========================================================
     CARGAR MUNICIPIOS
     
     IMPORTANTE:
     Aquí NO consultamos DANE directamente.
     Consultamos nuestro route.ts:
     
     /api/locations/municipalities
  ========================================================== */

  useEffect(() => {
    if (!form.department) {
      setMunicipalities([]);
      setLoadingMunicipalities(false);
      return;
    }

    const controller =
      new AbortController();

    const loadMunicipalities =
      async () => {
        setLoadingMunicipalities(true);
        setMunicipalities([]);
        setError("");

        try {
          const response =
            await fetch(
              `/api/locations/municipalities?department=${encodeURIComponent(
                form.department
              )}`,
              {
                method: "GET",
                cache: "no-store",
                signal:
                  controller.signal,
              }
            );

          if (!response.ok) {
            throw new Error(
              `Error HTTP ${response.status}`
            );
          }

          const data =
            await response.json();

          if (!Array.isArray(data)) {
            throw new Error(
              "Respuesta inválida del servidor."
            );
          }

          const parsedMunicipalities: MunicipalityOption[] =
            data
              .map((item: any) => ({
                code: String(
                  item.code ?? ""
                ),
                name: String(
                  item.name ?? ""
                ),
                departmentCode:
                  String(
                    item.departmentCode ??
                      ""
                  ),
              }))
              .filter(
                (
                  item: MunicipalityOption
                ) =>
                  item.code &&
                  item.name
              );

          setMunicipalities(
            parsedMunicipalities
          );
        } catch (fetchError) {
          if (
            fetchError instanceof
              DOMException &&
            fetchError.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "[PeakScore] Error cargando municipios:",
            fetchError
          );

          setMunicipalities([]);

          setError(
            "No pudimos cargar los municipios. Verifica tu conexión e inténtalo nuevamente."
          );
        } finally {
          setLoadingMunicipalities(
            false
          );
        }
      };

    loadMunicipalities();

    return () => {
      controller.abort();
    };
  }, [form.department]);

  /* ==========================================================
     VALIDAR PASO 1
  ========================================================== */

  const validateStepOne = () => {
    if (
      !form.institutionName.trim()
    ) {
      return "Ingresa el nombre de la institución.";
    }

    if (!form.nit.trim()) {
      return "Ingresa el NIT de la institución.";
    }

    if (!form.institutionType) {
      return "Selecciona el tipo de institución.";
    }

    if (!form.department) {
      return "Selecciona el departamento.";
    }

    if (!form.city) {
      return "Selecciona el municipio o ciudad.";
    }

    if (!form.address.trim()) {
      return "Ingresa la dirección de la institución.";
    }

    if (
      !form.institutionalEmail.trim()
    ) {
      return "Ingresa el correo institucional.";
    }

    if (
      !form.institutionalPhone.trim()
    ) {
      return "Ingresa el teléfono institucional.";
    }

    return "";
  };

  /* ==========================================================
     VALIDAR PASO 2
  ========================================================== */

  const validateStepTwo = () => {
    if (!form.rectorName.trim()) {
      return "Ingresa el nombre completo del rector.";
    }

    if (form.documentType !== "CC") {
      return "El tipo de documento del rector debe ser C.C.";
    }

    if (!form.documentNumber.trim()) {
      return "Ingresa el número de documento.";
    }

    if (!form.rectorEmail.trim()) {
      return "Ingresa el correo electrónico del rector.";
    }

    if (!form.rectorPhone.trim()) {
      return "Ingresa el teléfono de contacto.";
    }

    return "";
  };

  /* ==========================================================
     SIGUIENTE
  ========================================================== */

  const handleNext = () => {
    setError("");

    if (step === 1) {
      const validationError =
        validateStepOne();

      if (validationError) {
        setError(validationError);
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      const validationError =
        validateStepTwo();

      if (validationError) {
        setError(validationError);
        return;
      }

      setStep(3);
    }
  };

  /* ==========================================================
     ATRÁS
  ========================================================== */

  const handlePrevious = () => {
    setError("");

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
    }
  };

  /* ==========================================================
     ENVIAR SOLICITUD
  ========================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const institutionError =
      validateStepOne();

    if (institutionError) {
      setStep(1);
      setError(institutionError);
      return;
    }

    const rectorError =
      validateStepTwo();

    if (rectorError) {
      setStep(2);
      setError(rectorError);
      return;
    }

    if (!form.acceptTerms) {
      setError(
        "Debes aceptar los Términos y Condiciones de PeakScore."
      );
      return;
    }

    if (!form.acceptPrivacy) {
      setError(
        "Debes aceptar el tratamiento de datos personales."
      );
      return;
    }

    if (!captchaToken) {
      setError(
        "Completa la verificación de Cloudflare."
      );
      return;
    }

    setSubmitting(true);

    try {
      const requestData = {
        institutionName:
          form.institutionName.trim(),

        nit:
          form.nit.trim(),

        institutionType:
          form.institutionType,

        department:
          form.department,

        city:
          form.city,

        address:
          form.address.trim(),

        institutionalEmail:
          form.institutionalEmail
            .trim()
            .toLowerCase(),

        institutionalPhone:
          form.institutionalPhone.trim(),

        rectorName:
          form.rectorName.trim(),

        // El backend también lo fuerza a CC.
        documentType: "CC",

        documentNumber:
          form.documentNumber.trim(),

        rectorEmail:
          form.rectorEmail
            .trim()
            .toLowerCase(),

        rectorPhone:
          form.rectorPhone.trim(),

        termsAccepted:
          form.acceptTerms,

        privacyAccepted:
          form.acceptPrivacy,

        marketingAccepted:
          form.marketing,

        captchaToken,
      };

      const response = await fetch(
        "/api/institution/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();
 
      if (!response.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "No fue posible enviar la solicitud."
        );

        return;
      }

      setSubmitted(true);
    } catch {
      setError(
        "No pudimos conectar con el servidor. Inténtalo nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     PANTALLA DE ÉXITO
  ========================================================== */

  if (submitted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#02040c]">

        {/* DESKTOP */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-0
            hidden
            bg-cover
            bg-center
            bg-no-repeat
            lg:block
          "
          style={{
            backgroundImage:
              "url('/images/register/register_institution_panel_bg.webp')",
          }}
        />

        {/* MOBILE */}
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
              "url('/images/register/register_institution_panel_bg-mobile.webp')",
          }}
        />

        <div className="absolute inset-0 bg-[#020817]/20" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8">
          <div
            className="
              w-full
              max-w-[520px]
              rounded-2xl
              border
              border-cyan-300/20
              bg-[#050814]/90
              p-7
              shadow-[0_30px_100px_rgba(0,0,0,0.65)]
              backdrop-blur-xl
              sm:p-10
            "
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
              <Check className="h-8 w-8" />
            </div>

            <div className="mt-6 text-center">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                PeakScore Instituciones
              </p>

              <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                Solicitud enviada
              </h1>

              <p className="mx-auto mt-4 max-w-md font-mono text-xs leading-6 text-slate-300">
                Tu solicitud institucional fue registrada correctamente y quedó pendiente de verificación por parte de PeakScore.
              </p>
            </div>

            <Link
              href="/register"
              className="
                mt-8
                flex
                h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-gradient-to-r
                from-emerald-400
                to-purple-500
                font-mono
                text-xs
                font-black
                uppercase
                tracking-[0.08em]
                text-white
                transition-all
                hover:-translate-y-0.5
              "
            >
              Volver al registro

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     PÁGINA PRINCIPAL
  ========================================================== */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02040c]">

      {/* ========================================================
          FONDO DESKTOP
          
          RUTA EXACTA:
          images/register/register_institution_panel_bg.webp
      ======================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          hidden
          bg-cover
          bg-center
          bg-no-repeat
          lg:block
        "
        style={{
          backgroundImage:
            "url('/images/register/register_institution_panel_bg.webp')",
        }}
      />

      {/* ========================================================
          FONDO MOBILE

          RUTA EXACTA:
          images/register/register_institution_panel_bg-mobile.webp
      ======================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-cover
          bg-center
          bg-no-repeat
          lg:hidden
        "
        style={{
          backgroundImage:
            "url('/images/register/register_institution_panel_bg-mobile.webp')",
        }}
      />

      {/* ========================================================
          OVERLAY
      ======================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[#020817]/10
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
          xl:px-10
        "
      >
        <div
          className="
            flex
            w-full
            max-w-[1500px]
            items-center
            justify-center
            lg:justify-end
          "
        >

          {/* ====================================================
              PANEL
          ==================================================== */}

          <section
            className="
              w-full
              max-w-[390px]

              lg:w-[550px]
              lg:max-w-[550px]
              lg:translate-x-16

              xl:w-[570px]
              xl:max-w-[570px]
              xl:translate-x-24

              2xl:translate-x-32
            "
          >
            <div
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/10
                bg-[#050814]/80
                shadow-[0_30px_100px_rgba(0,0,0,0.65)]
                backdrop-blur-xl
              "
            >

              {/* ==================================================
                  CONTENIDO
              ================================================== */}

              <div className="relative z-10 p-4 sm:p-5 lg:p-6">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Registro institucional
                    </p>

                    <h1 className="mt-1 text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
                      Registra tu institución
                    </h1>

                    <p className="mt-2 max-w-sm font-mono text-[10px] leading-5 text-slate-400">
                      Completa la información para solicitar el registro de tu institución educativa.
                    </p>
                  </div>

                  <div
                    className="
                      shrink-0
                      rounded-lg
                      border
                      border-emerald-400/20
                      bg-emerald-400/5
                      px-2.5
                      py-2
                      text-right
                    "
                  >
                    <ShieldCheck className="ml-auto h-4 w-4 text-emerald-300" />

                    <p className="mt-1 font-mono text-[8px] font-bold uppercase tracking-wide text-emerald-300">
                      Solo rectores
                    </p>
                  </div>
                </div>

                {/* =================================================
                    STEPPER
                ================================================= */}

                <div className="mb-5 grid grid-cols-4 gap-1.5">
                  {[
                    {
                      number: 1,
                      label: "Institución",
                    },
                    {
                      number: 2,
                      label: "Rector",
                    },
                    {
                      number: 3,
                      label: "Revisión",
                    },
                    {
                      number: 4,
                      label: "Solicitud",
                    },
                  ].map((item) => {
                    const active =
                      step >= item.number;

                    const current =
                      step === item.number;

                    return (
                      <div
                        key={item.number}
                        className="min-w-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`
                              flex
                              h-6
                              w-6
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border
                              font-mono
                              text-[9px]
                              font-black
                              transition-all
                              ${
                                active
                                  ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-200"
                                  : "border-white/10 bg-white/[0.03] text-slate-600"
                              }
                              ${
                                current
                                  ? "shadow-[0_0_15px_rgba(34,211,238,0.18)]"
                                  : ""
                              }
                            `}
                          >
                            {item.number}
                          </div>

                          {item.number <
                            4 && (
                            <div
                              className={`
                                h-px
                                flex-1
                                ${
                                  step >
                                  item.number
                                    ? "bg-cyan-400/50"
                                    : "bg-white/10"
                                }
                              `}
                            />
                          )}
                        </div>

                        <p
                          className={`
                            mt-1
                            truncate
                            font-mono
                            text-[7px]
                            font-bold
                            uppercase
                            tracking-wide
                            sm:text-[8px]
                            ${
                              active
                                ? "text-slate-200"
                                : "text-slate-600"
                            }
                          `}
                        >
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                  <div
                    role="alert"
                    className="
                      mb-4
                      rounded-lg
                      border
                      border-red-400/20
                      bg-red-400/10
                      px-3
                      py-2.5
                      font-mono
                      text-[10px]
                      leading-5
                      text-red-200
                    "
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>

                  {/* =================================================
                      PASO 1
                  ================================================= */}

                  {step === 1 && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-300">
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div>
                          <h2 className="font-mono text-sm font-black uppercase text-white">
                            Datos de la institución
                          </h2>

                          <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                            Información básica de tu institución educativa.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">

                        {/* NOMBRE */}
                        <div className="sm:col-span-2">
                          <FieldLabel>
                            Nombre de la institución
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <Building2 className="h-4 w-4" />
                            }
                          >
                            <input
                              type="text"
                              value={
                                form.institutionName
                              }
                              onChange={(event) =>
                                updateField(
                                  "institutionName",
                                  event.target.value
                                )
                              }
                              placeholder="Nombre oficial de la institución"
                              className={
                                inputClassName
                              }
                              autoComplete="organization"
                            />
                          </InputWrapper>
                        </div>

                        {/* NIT */}
                        <div>
                          <FieldLabel>
                            NIT de la institución
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <FileText className="h-4 w-4" />
                            }
                          >
                            <input
                              type="text"
                              value={
                                form.nit
                              }
                              onChange={(event) =>
                                updateField(
                                  "nit",
                                  event.target.value
                                )
                              }
                              placeholder="Ej: 900123456-7"
                              className={
                                inputClassName
                              }
                            />
                          </InputWrapper>
                        </div>

                        {/* TIPO */}
                        <div>
                          <FieldLabel>
                            Tipo de institución
                          </FieldLabel>

                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-cyan-300">
                              <Building2 className="h-4 w-4" />
                            </div>

                            <select
                              value={
                                form.institutionType
                              }
                              onChange={(event) =>
                                updateField(
                                  "institutionType",
                                  event.target.value
                                )
                              }
                              className={
                                selectClassName
                              }
                            >
                              <option
                                value=""
                                className="bg-[#050814]"
                              >
                                Selecciona el tipo
                              </option>

                              {INSTITUTION_TYPES.map(
                                (item) => (
                                  <option
                                    key={
                                      item.value
                                    }
                                    value={
                                      item.value
                                    }
                                    className="bg-[#050814]"
                                  >
                                    {item.label}
                                  </option>
                                )
                              )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                        </div>

                        {/* DEPARTAMENTO */}
                        <div>
                          <FieldLabel>
                            Departamento
                          </FieldLabel>

                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-cyan-300">
                              <MapPin className="h-4 w-4" />
                            </div>

                            <select
                              value={
                                form.department
                              }
                              onChange={(event) =>
                                handleDepartmentChange(
                                  event.target.value
                                )
                              }
                              className={
                                selectClassName
                              }
                            >
                              <option
                                value=""
                                className="bg-[#050814]"
                              >
                                Selecciona el departamento
                              </option>

                              {DEPARTMENTS.map(
                                (
                                  department
                                ) => (
                                  <option
                                    key={
                                      department.code
                                    }
                                    value={
                                      department.code
                                    }
                                    className="bg-[#050814]"
                                  >
                                    {
                                      department.name
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                        </div>

                        {/* MUNICIPIO */}
                        <div>
                          <FieldLabel>
                            Municipio / ciudad
                          </FieldLabel>

                          <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-cyan-300">
                              <MapPin className="h-4 w-4" />
                            </div>

                            <select
                              value={
                                form.city
                              }
                              onChange={(event) =>
                                updateField(
                                  "city",
                                  event.target.value
                                )
                              }
                              disabled={
                                !form.department ||
                                loadingMunicipalities
                              }
                              className={
                                selectClassName
                              }
                            >
                              <option
                                value=""
                                className="bg-[#050814]"
                              >
                                {loadingMunicipalities
                                  ? "Cargando municipios..."
                                  : form.department
                                    ? "Selecciona el municipio"
                                    : "Primero selecciona el departamento"}
                              </option>

                              {municipalities.map(
                                (
                                  municipality
                                ) => (
                                  <option
                                    key={
                                      municipality.code
                                    }
                                    value={
                                      municipality.name
                                    }
                                    className="bg-[#050814]"
                                  >
                                    {
                                      municipality.name
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          </div>
                        </div>

                        {/* DIRECCIÓN */}
                        <div className="sm:col-span-2">
                          <FieldLabel>
                            Dirección de la institución
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <MapPin className="h-4 w-4" />
                            }
                          >
                            <input
                              type="text"
                              value={
                                form.address
                              }
                              onChange={(event) =>
                                updateField(
                                  "address",
                                  event.target.value
                                )
                              }
                              placeholder="Dirección completa de la institución"
                              className={
                                inputClassName
                              }
                              autoComplete="street-address"
                            />
                          </InputWrapper>
                        </div>

                        {/* CORREO */}
                        <div>
                          <FieldLabel>
                            Correo institucional
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <Mail className="h-4 w-4" />
                            }
                          >
                            <input
                              type="email"
                              value={
                                form.institutionalEmail
                              }
                              onChange={(event) =>
                                updateField(
                                  "institutionalEmail",
                                  event.target.value
                                )
                              }
                              placeholder="colegio@institucion.edu.co"
                              className={
                                inputClassName
                              }
                              autoComplete="email"
                            />
                          </InputWrapper>
                        </div>

                        {/* TELÉFONO */}
                        <div>
                          <FieldLabel>
                            Teléfono institucional
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <Phone className="h-4 w-4" />
                            }
                          >
                            <input
                              type="tel"
                              value={
                                form.institutionalPhone
                              }
                              onChange={(event) =>
                                updateField(
                                  "institutionalPhone",
                                  event.target.value
                                )
                              }
                              placeholder="Ej: 300 123 4567"
                              className={
                                inputClassName
                              }
                              autoComplete="tel"
                            />
                          </InputWrapper>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      PASO 2
                  ================================================= */}

                  {step === 2 && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-300/20 bg-purple-300/10 text-purple-300">
                          <UserRound className="h-4 w-4" />
                        </div>

                        <div>
                          <h2 className="font-mono text-sm font-black uppercase text-white">
                            Datos del rector
                          </h2>

                          <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                            Información del representante de la institución.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">

                        {/* NOMBRE */}
                        <div className="sm:col-span-2">
                          <FieldLabel>
                            Nombre completo del rector
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <UserRound className="h-4 w-4" />
                            }
                          >
                            <input
                              type="text"
                              value={
                                form.rectorName
                              }
                              onChange={(event) =>
                                updateField(
                                  "rectorName",
                                  event.target.value
                                )
                              }
                              placeholder="Tu nombre completo"
                              className={
                                inputClassName
                              }
                              autoComplete="name"
                            />
                          </InputWrapper>
                        </div>

                        {/* DOCUMENTO */}
                        <div>
                          <FieldLabel>
                            Tipo de documento
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <FileText className="h-4 w-4" />
                            }
                          >
                            <div
                              className={`${inputClassName} flex items-center font-bold text-cyan-200`}
                              aria-label="Tipo de documento: C.C."
                            >
                              C.C.
                            </div>
                          </InputWrapper>
                        </div>

                        {/* NÚMERO */}
                        <div>
                          <FieldLabel>
                            Número de documento
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <FileText className="h-4 w-4" />
                            }
                          >
                            <input
                              type="text"
                              value={
                                form.documentNumber
                              }
                              onChange={(event) =>
                                updateField(
                                  "documentNumber",
                                  event.target.value.replace(/\D/g, "")
                                )
                              }
                              inputMode="numeric"
                              autoComplete="off"
                              placeholder="Número de cédula"
                              className={
                                inputClassName
                              }
                            />
                          </InputWrapper>
                        </div>

                        {/* CORREO */}
                        <div>
                          <FieldLabel>
                            Correo electrónico
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <Mail className="h-4 w-4" />
                            }
                          >
                            <input
                              type="email"
                              value={
                                form.rectorEmail
                              }
                              onChange={(event) =>
                                updateField(
                                  "rectorEmail",
                                  event.target.value
                                )
                              }
                              placeholder="tu@correo.com"
                              className={
                                inputClassName
                              }
                              autoComplete="email"
                            />
                          </InputWrapper>
                        </div>

                        {/* TELÉFONO */}
                        <div>
                          <FieldLabel>
                            Teléfono de contacto
                          </FieldLabel>

                          <InputWrapper
                            icon={
                              <Phone className="h-4 w-4" />
                            }
                          >
                            <input
                              type="tel"
                              value={
                                form.rectorPhone
                              }
                              onChange={(event) =>
                                updateField(
                                  "rectorPhone",
                                  event.target.value
                                )
                              }
                              placeholder="Ej: 300 123 4567"
                              className={
                                inputClassName
                              }
                              autoComplete="tel"
                            />
                          </InputWrapper>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-purple-400/15 bg-purple-400/[0.05] p-3">
                        <div className="flex gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-300" />

                          <p className="font-mono text-[9px] leading-5 text-slate-400">
                            El registro institucional está destinado exclusivamente al rector de la institución. La información será utilizada para verificar la solicitud.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      PASO 3
                  ================================================= */}

                  {step === 3 && (
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                          <ShieldCheck className="h-4 w-4" />
                        </div>

                        <div>
                          <h2 className="font-mono text-sm font-black uppercase text-white">
                            Revisión
                          </h2>

                          <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                            Verifica la información antes de enviar.
                          </p>
                        </div>
                      </div>

                      {/* RESUMEN INSTITUCIÓN */}
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-300">
                          Institución
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <SummaryItem
                            label="Nombre"
                            value={
                              form.institutionName
                            }
                          />

                          <SummaryItem
                            label="NIT"
                            value={
                              form.nit
                            }
                          />

                          <SummaryItem
                            label="Tipo"
                            value={
                              INSTITUTION_TYPES.find(
                                (item) =>
                                  item.value ===
                                  form.institutionType
                              )?.label ??
                              form.institutionType
                            }
                          />

                          <SummaryItem
                            label="Departamento"
                            value={
                              DEPARTMENTS.find(
                                (item) =>
                                  item.code ===
                                  form.department
                              )?.name ??
                              form.department
                            }
                          />

                          <SummaryItem
                            label="Municipio / ciudad"
                            value={
                              form.city
                            }
                          />

                          <SummaryItem
                            label="Correo"
                            value={
                              form.institutionalEmail
                            }
                          />

                          <SummaryItem
                            label="Teléfono"
                            value={
                              form.institutionalPhone
                            }
                          />

                          <SummaryItem
                            label="Dirección"
                            value={
                              form.address
                            }
                          />
                        </div>
                      </div>

                      {/* RESUMEN RECTOR */}
                      <div className="mt-3 rounded-xl border border-purple-400/10 bg-purple-400/[0.04] p-4">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-purple-300">
                          Rector
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <SummaryItem
                            label="Nombre"
                            value={
                              form.rectorName
                            }
                          />

                          <SummaryItem
                            label="Documento"
                            value={`C.C. · ${form.documentNumber}`}
                          />

                          <SummaryItem
                            label="Correo"
                            value={
                              form.rectorEmail
                            }
                          />

                          <SummaryItem
                            label="Teléfono"
                            value={
                              form.rectorPhone
                            }
                          />
                        </div>
                      </div>

                      {/* AVISO */}
                      <div className="mt-4 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.04] p-3">
                        <div className="flex gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />

                          <p className="font-mono text-[9px] leading-5 text-slate-400">
                            Una vez enviada la solicitud, la información deberá ser revisada y verificada antes de activar la institución.
                          </p>
                        </div>
                      </div>

                      {/* POLÍTICAS */}
                      <div className="mt-4 space-y-3">

                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={
                              form.acceptTerms
                            }
                            onChange={(event) =>
                              updateField(
                                "acceptTerms",
                                event.target.checked
                              )
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-cyan-400"
                          />

                          <span className="font-mono text-[9px] leading-5 text-slate-300">
                            Acepto los{" "}
                            <span className="font-bold text-cyan-300">
                              Términos y Condiciones
                            </span>{" "}
                            de PeakScore.
                          </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={
                              form.acceptPrivacy
                            }
                            onChange={(event) =>
                              updateField(
                                "acceptPrivacy",
                                event.target.checked
                              )
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-cyan-400"
                          />

                          <span className="font-mono text-[9px] leading-5 text-slate-300">
                            He leído el{" "}
                            <span className="font-bold text-cyan-300">
                              Aviso de Privacidad
                            </span>{" "}
                            y autorizo el tratamiento de datos personales conforme a la Política de Tratamiento de Datos Personales de PeakScore.
                          </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={
                              form.marketing
                            }
                            onChange={(event) =>
                              updateField(
                                "marketing",
                                event.target.checked
                              )
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-purple-400"
                          />

                          <span className="font-mono text-[9px] leading-5 text-slate-400">
                            Deseo recibir información y novedades de PeakScore.
                            <span className="ml-1 text-slate-600">
                              (opcional)
                            </span>
                          </span>
                        </label>
                      </div>

                      {/* CLOUDFLARE */}
                      <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-300" />

                          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-slate-300">
                            Verificación de seguridad
                          </span>
                        </div>

                        <Turnstile
                          siteKey={
                            process.env
                              .NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
                            ""
                          }
                          onSuccess={(token) => {
                            setCaptchaToken(
                              token
                            );

                            setError("");
                          }}
                          onExpire={() => {
                            setCaptchaToken(
                              ""
                            );
                          }}
                          onError={() => {
                            setCaptchaToken(
                              ""
                            );

                            setError(
                              "No pudimos completar la verificación de seguridad."
                            );
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      BOTONES
                  ================================================= */}

                  <div className="mt-6 flex items-center justify-between gap-3">

                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={
                          handlePrevious
                        }
                        className="
                          flex
                          h-11
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          border
                          border-white/10
                          bg-white/[0.03]
                          px-4
                          font-mono
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-300
                          transition-all
                          hover:border-white/20
                          hover:bg-white/[0.06]
                          hover:text-white
                        "
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />

                        Atrás
                      </button>
                    ) : (
                      <Link
                        href="/register"
                        className="
                          flex
                          h-11
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          border
                          border-white/10
                          bg-white/[0.03]
                          px-4
                          font-mono
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-400
                          transition-all
                          hover:border-white/20
                          hover:bg-white/[0.06]
                          hover:text-white
                        "
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />

                        Volver
                      </Link>
                    )}

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="
                          flex
                          h-11
                          flex-1
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          bg-gradient-to-r
                          from-cyan-400
                          to-purple-500
                          px-5
                          font-mono
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-white
                          shadow-[0_12px_35px_rgba(34,211,238,0.15)]
                          transition-all
                          hover:-translate-y-0.5
                        "
                      >
                        Continuar

                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={
                          submitting ||
                          !captchaToken ||
                          !form.acceptTerms ||
                          !form.acceptPrivacy
                        }
                        className="
                          flex
                          h-11
                          flex-1
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          bg-gradient-to-r
                          from-emerald-400
                          to-purple-500
                          px-5
                          font-mono
                          text-[10px]
                          font-black
                          uppercase
                          tracking-[0.08em]
                          text-white
                          shadow-[0_12px_35px_rgba(139,92,246,0.18)]
                          transition-all
                          hover:-translate-y-0.5
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                      >
                        {submitting
                          ? "Enviando..."
                          : "Enviar solicitud"}

                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </form>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="mt-5 flex items-center justify-center gap-2">
                  <div className="h-px flex-1 bg-white/5" />

                  <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-slate-600">
                    PeakScore · Instituciones
                  </p>

                  <div className="h-px flex-1 bg-white/5" />
                </div>

              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}