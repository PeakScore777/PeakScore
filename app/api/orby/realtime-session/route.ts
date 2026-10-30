import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max: number, fallback: string) {
  return typeof value === "string" ? value.trim().slice(0, max) || fallback : fallback;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para hablar con Orby." }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "El servicio de voz no está configurado en el servidor." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const subject = clean(body?.subject, 80, "Preparación Saber 11");
    const topic = clean(body?.topic, 160, "Estudio y aprendizaje");
    const context = clean(body?.context, 1200, "Ayuda al estudiante con sus dudas académicas.");

    const instructions = [
      "Eres Orby, el tutor conversacional de PeakScore. Habla en español colombiano natural, cálido y claro.",
      "La conversación es por voz y debe sentirse como hablar con una persona: escucha, responde directamente y permite que el usuario te interrumpa.",
      "Sé breve por defecto: 1 a 3 frases y normalmente 20 a 45 palabras. Amplía solo si te lo piden o si un paso académico es indispensable.",
      "No leas encabezados, listas largas ni fórmulas complejas en voz. Explica una idea por vez y pregunta si quiere que profundices.",
      "No uses muletillas repetitivas ni hables como locutor. Mantén un ritmo ágil, natural y expresivo.",
      "Si no sabes algo, dilo. No inventes datos ni respuestas de Saber 11.",
      "Contexto académico: " + subject + ". Tema: " + topic + ". " + context,
    ].join("\n");

    const safetyIdentifier = createHash("sha256").update(user.id).digest("hex");
    const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyIdentifier,
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model: "gpt-realtime-2.1",
          instructions,
          output_modalities: ["audio"],
          max_output_tokens: 256,
          audio: {
            input: {
              noise_reduction: { type: "near_field" },
              transcription: { model: "gpt-realtime-whisper", language: "es" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 480,
                create_response: true,
                interrupt_response: true,
              },
            },
            output: { voice: "marin", speed: 1.12 },
          },
        },
      }),
      cache: "no-store",
    });

    const payload = await upstream.json().catch(() => ({}));
    const secret = payload?.value ?? payload?.client_secret?.value;
    if (!upstream.ok || typeof secret !== "string") {
      console.error("[Orby Realtime] Session secret creation failed.", {
        status: upstream.status,
        errorType: typeof payload?.error?.type === "string" ? payload.error.type : "unknown",
        errorCode: typeof payload?.error?.code === "string" ? payload.error.code : "unknown",
      });
      return NextResponse.json({ error: "No se pudo iniciar la voz en tiempo real. Comprueba la configuración de OpenAI e inténtalo de nuevo." }, { status: 502 });
    }

    return NextResponse.json({ clientSecret: secret, expiresAt: payload?.expires_at ?? null }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("[Orby Realtime] Unexpected setup failure.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "No se pudo preparar la conversación de voz." }, { status: 500 });
  }
}
