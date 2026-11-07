import type { NextConfig } from "next";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "";

// Resumable Orby uploads use Supabase's dedicated Storage hostname rather
// than the project's REST/Auth hostname. Keep this exact origin in the CSP
// instead of broadly allowing every Supabase subdomain.
const supabaseStorageOrigin = (() => {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl) return "";

  try {
    const hostname = new URL(configuredUrl).hostname;
    const projectRef = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/i)?.[1];
    return projectRef ? `https://${projectRef}.storage.supabase.co` : "";
  } catch {
    return "";
  }
})();

const posthogOrigin = process.env.NEXT_PUBLIC_POSTHOG_HOST
  ? new URL(process.env.NEXT_PUBLIC_POSTHOG_HOST).origin
  : "";

const isDevelopment =
  process.env.NODE_ENV === "development";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(self), camera=(self), clipboard-read=(), clipboard-write=(), display-capture=(), geolocation=(), gyroscope=(), microphone=(self), payment=(), usb=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",

      [
        "script-src",
        "'self'",
        "'unsafe-inline'",
        ...(isDevelopment ? ["'unsafe-eval'"] : []),
        "https://challenges.cloudflare.com",
        "https://us-assets.i.posthog.com",
      ].join(" "),

      "style-src 'self' 'unsafe-inline'",

      ["img-src 'self' data: blob:", supabaseOrigin, "https://*.supabase.co", "https://*.supabase.in"].filter(Boolean).join(" "),

      "font-src 'self' data:",

      [
        "connect-src",
        "'self'",
        supabaseOrigin,
        supabaseStorageOrigin,
        posthogOrigin,
        "https://us-assets.i.posthog.com",
        "https://challenges.cloudflare.com",
        "https://generativelanguage.googleapis.com",
        "wss://generativelanguage.googleapis.com",
      ]
        .filter(Boolean)
        .join(" "),

      "frame-src 'self' https://challenges.cloudflare.com",

      "worker-src 'self' blob:",

      "media-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Keep Turbopack anchored to this app, avoiding ambiguous workspace-root detection.
  turbopack: {
    root: process.cwd(),
  },

  serverExternalPackages: [
    "pdf-parse",
    "@napi-rs/canvas",
  ],

  images: {
    qualities: [75, 78, 85],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
