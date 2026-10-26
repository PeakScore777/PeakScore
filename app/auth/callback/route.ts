import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  // Supabase can return an OAuth error before it gives us an authorization code.
  if (requestUrl.searchParams.has("error") || !code) {
    return NextResponse.redirect(
      new URL("/login?authError=google", requestUrl.origin),
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[PeakScore] OAuth callback failed.", {
        provider: "google",
        errorCode: error.code ?? "UNKNOWN",
        status: error.status ?? "UNKNOWN",
      });

      return NextResponse.redirect(
        new URL("/login?authError=google", requestUrl.origin),
      );
    }

    return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
  } catch (error) {
    console.error("[PeakScore] OAuth callback threw an exception.", {
      provider: "google",
      errorName: error instanceof Error ? error.name : "UNKNOWN",
    });

    return NextResponse.redirect(
      new URL("/login?authError=google", requestUrl.origin),
    );
  }
}
