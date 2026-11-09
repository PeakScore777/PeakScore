import { NextResponse } from "next/server";
import { getOrbyOwner } from "@/lib/auth/orby-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CloudflareSubscription = {
  currency?: unknown;
  current_period_end?: unknown;
  price?: unknown;
  rate_plan?: {
    id?: unknown;
    public_name?: unknown;
    scope?: unknown;
  };
  state?: unknown;
};

function safeString(value: unknown, max = 100): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

/**
 * Owner-only, read-only diagnostic. It never runs an inference request and
 * never changes a plan or sets the free-tier attestation.
 */
export async function GET() {
  const owner = await getOrbyOwner();
  if (!owner) {
    return NextResponse.json({ error: "No autorizado." }, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? "";
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() ?? "";
  const attestationSet = process.env.PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED === "true";

  const configuration = {
    accountIdPresent: /^[a-f0-9]{32}$/i.test(accountId),
    apiTokenPresent: Boolean(apiToken),
    freeTierAttestationSet: attestationSet,
  };

  if (!configuration.accountIdPresent || !apiToken) {
    return NextResponse.json({
      configuration,
      subscriptionCheck: {
        status: "not_attempted",
        detail: "Falta el identificador de cuenta válido o el token de Cloudflare en este entorno.",
      },
      planStatus: "unverified",
      inferenceRequested: false,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/subscriptions`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );

    const payload = await response.json().catch(() => null) as {
      success?: unknown;
      errors?: Array<{ code?: unknown; message?: unknown }>;
      result?: CloudflareSubscription[];
    } | null;

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        configuration,
        subscriptionCheck: {
          status: "permission_unavailable",
          httpStatus: response.status,
          detail: "El token no pudo consultar las suscripciones de la cuenta. Puede faltar el permiso Billing Read; comprueba el plan directamente en Cloudflare.",
        },
        planStatus: "unverified",
        inferenceRequested: false,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!response.ok || !payload?.success || !Array.isArray(payload.result)) {
      const providerCode = payload?.errors?.[0]?.code;
      return NextResponse.json({
        configuration,
        subscriptionCheck: {
          status: "provider_error",
          httpStatus: response.status,
          providerCode: typeof providerCode === "number" ? providerCode : null,
          detail: "Cloudflare no devolvió una lista verificable de suscripciones. Revisa la cuenta desde su panel.",
        },
        planStatus: "unverified",
        inferenceRequested: false,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const subscriptions = payload.result.slice(0, 30).map((item) => ({
      name: safeString(item.rate_plan?.public_name),
      ratePlan: safeString(item.rate_plan?.id, 40),
      scope: safeString(item.rate_plan?.scope, 40),
      state: safeString(item.state, 40),
      price: typeof item.price === "number" && Number.isFinite(item.price) ? item.price : null,
      currency: safeString(item.currency, 8),
      periodEnd: safeString(item.current_period_end, 40),
    }));

    return NextResponse.json({
      configuration,
      subscriptionCheck: {
        status: "success",
        count: payload.result.length,
        subscriptions,
        detail: "Consulta de solo lectura completada. La lista de suscripciones, por sí sola, no constituye una prueba suficiente del plan Workers Free.",
      },
      planStatus: "requires_cloudflare_dashboard_confirmation",
      inferenceRequested: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      configuration,
      subscriptionCheck: {
        status: "connection_error",
        detail: error instanceof Error && error.name === "TimeoutError"
          ? "Cloudflare tardó demasiado en responder a la consulta de solo lectura."
          : "No fue posible consultar las suscripciones de Cloudflare.",
      },
      planStatus: "unverified",
      inferenceRequested: false,
    }, { headers: { "Cache-Control": "no-store" } });
  }
}
