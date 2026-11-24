import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2026-05-30",

  // Keep navigation events, manual capture() calls, and feature flags.
  // Disable high-volume automatic collection until event volume is audited.
  autocapture: false,
  capture_performance: false,
  capture_heatmaps: false,
});
