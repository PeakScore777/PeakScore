# OmegaX visual model experiment — FLUX.2 Klein 4B

**Branch:** `feat/founder-intro`  
**Status:** integration prepared; live inference and visual QA pending.

## Goal

Compare Cloudflare FLUX.2 Klein 4B against the existing FLUX.1 Schnell baseline using the existing authenticated `POST /api/orby/generate-image` route. This experiment changes only the image-generation model. It does not replace Gemini Live, the board renderer, board actions, or the SVG sanitizer.

## Server configuration

Set this variable only in the Preview environment for `feat/founder-intro`:

```env
CLOUDFLARE_IMAGE_MODEL=klein4b
```

Allowed values:
- `schnell` — default; existing FLUX.1 Schnell path.
- `klein4b` — FLUX.2 Klein 4B experiment.

Any other value fails closed. The browser cannot select a provider/model through request JSON. Remove the variable or set it to `schnell` to restore the baseline.

Existing Cloudflare credentials and `PEAKSCORE_CLOUDFLARE_FREE_TIER_CONFIRMED=true` are still required. The shared internal Cloudflare budget reservation remains enabled. Klein 4B currently reserves 180 Neurons per request as a conservative estimate against the project's 8,000-Neuron internal daily cap; confirm actual usage in Cloudflare analytics before increasing test volume.

## Implementation details

- Klein 4B uses multipart/form-data with prompt and 1024×768 output dimensions.
- Schnell retains its JSON request with configurable 4–8 steps.
- Both use the same authenticated Cloudflare account and the same no-charge guard.
- No automatic paid fallback exists.
- The route returns the actual selected model ID in its response.
- The response continues to be treated as a JPEG data URL, matching the current image consumer contract. Confirm the returned MIME type against a real Klein response before broad rollout.

## Visual test protocol

Use the same prompts for Schnell and Klein 4B:
1. Mitosis: one large, friendly but scientifically accurate cell illustration with visible chromosomes, no text.
2. DNA replication: a clear biological mechanism with a recognizable DNA double helix and a copier metaphor, no labels.
3. Plant photosynthesis: plant, sunlight, water and gas exchange, no labels.
4. Neuron: recognizable cell body, dendrites and axon, no labels.
5. Simple electric circuit: battery, wires, switch and bulb, correct connections, no labels.

Score each output from 1–5 for:
- scientific correctness;
- recognizability and detail;
- clean outlines and soft shading;
- composition and negative space;
- absence of malformed text/pseudo-letters;
- consistency with the PeakScore educational illustration direction.

Keep labels, arrows, equations and explanatory Spanish text in the existing board renderer, not baked into generated images.

## Release gates

1. Run `npm run test:orby`, lint and production build on the updated branch.
2. Deploy only a Preview build after CI is green.
3. Run a small authenticated test set and inspect actual MIME type, latency, returned model ID and Cloudflare Neuron usage.
4. Compare outputs side by side with Schnell.
5. Do not change the default from Schnell until the visual comparison and real quota accounting confirm a clear improvement.
6. Do not enable a paid provider or alter production/main as part of this experiment.

## Known limitation

This is an integration spike, not proof that Klein 4B matches Studdy's illustration quality. In particular, image consistency across separate generations and scientific accuracy must be evaluated visually.