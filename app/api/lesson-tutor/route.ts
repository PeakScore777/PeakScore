import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAI } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TutorMessage = { role: "user" | "assistant"; content: string };

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanJson(value: string): string {
  return value.replace(/^\s*```json\s*/i, "").replace(/^\s*```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Inicia sesión para conversar con el profesor de PeakScore." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
    }

    const subject = cleanText(body.subject, 80) || "Ciencias Naturales";
    const topic = cleanText(body.topic, 160) || "Los cristales misteriosos: materia y propiedades";
    const stage = body.stage === "practice" ? "práctica" : "teoría";
    const question = cleanText(body.question, 1200);
    const context = cleanText(body.context, 1600);
    const userMessage = cleanText(body.message, 1200);
    const history = Array.isArray(body.history)
      ? (body.history as TutorMessage[])
          .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
          .slice(-8)
          .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) }))
      : [];

    if (!userMessage) {
      return NextResponse.json({ error: "Escribe tu duda para que el profesor pueda ayudarte." }, { status: 400 });
    }

    const conversation = history.map((item) => `${item.role === "user" ? "ESTUDIANTE" : "PROFESOR"}: ${item.content}`).join("\n");
    const prompt = `
Eres el profesor titular de PeakScore, una plataforma de preparación para Saber 11 en Colombia. Enseñas a estudiantes de grado 11 con rigor, paciencia y claridad. Tu objetivo es que aprendan a razonar y resolver preguntas nuevas, no que memoricen respuestas.

MATERIA: ${subject}
TEMA/NIVEL: ${topic}
MOMENTO: ${stage}
ENUNCIADO ACTUAL (si existe): ${question || "No se proporcionó una pregunta concreta."}
CONTEXTO DISPONIBLE: ${context || "No hay contexto adicional."}

REGLAS PEDAGÓGICAS OBLIGATORIAS:
1. Responde en español colombiano natural, respetuoso y cercano, como un excelente docente de preparación Saber 11. No uses jerga excesiva, no infantilices ni inventes una historia que distraiga de aprender.
2. Empieza respondiendo la duda concreta. Después explica el concepto desde la base que el estudiante necesita.
3. Si hay un problema, guía paso a paso: qué pide, qué datos importan, qué concepto aplica, procedimiento con unidades si corresponde y cómo comprobar el resultado.
4. Explica por qué una idea funciona, no solo qué fórmula usar. Define símbolos y términos nuevos.
5. Conecta la explicación con competencias Saber 11: interpretar información, usar conceptos, explicar fenómenos, evaluar evidencia, analizar perspectivas o resolver problemas según la materia.
6. Si hay opciones de respuesta, explica el criterio para elegir y por qué los distractores típicos fallan; no afirmes que una opción es correcta si no hay información suficiente.
7. Si el estudiante está confundido, cambia de estrategia: ejemplo cotidiano, analogía precisa o ejemplo numérico sencillo. No repitas literalmente la explicación anterior.
8. Nunca inventes datos del enunciado, resultados, fuentes, funciones de la plataforma ni contenido curricular específico. Si falta información, dilo y pregunta lo mínimo necesario.
9. Cierra con una mini pregunta de comprobación o una acción breve para que el estudiante intente aplicar la idea. No reveles la solución de esa comprobación en la misma respuesta.
10. Mantén una respuesta útil y sustanciosa pero legible: normalmente 2–6 párrafos, con pasos o viñetas cuando ayuden. Usa texto plano/Markdown básico.
11. El contenido y los ejemplos deben ser originales, sin copiar preguntas ni materiales protegidos.
12. El estudiante puede pedir una pista, una explicación más sencilla, un ejemplo distinto o revisar un error. Atiende esa intención.

CONVERSACIÓN RECIENTE:
${conversation || "Todavía no hay mensajes anteriores."}
NUEVA DUDA DEL ESTUDIANTE:
${userMessage}

Devuelve únicamente un objeto JSON válido con esta forma exacta:
{"reply":"respuesta completa en español, usando \\n para saltos de línea si hacen falta","checkQuestion":"una pregunta breve para comprobar comprensión"}
No agregues markdown fences ni texto fuera del JSON.
`.trim();

    const result = await generateAI({ task: "tutor", prompt, useFallback: true });
    const raw = typeof result.text === "string" ? result.text.trim() : "";

    if (!raw) {
      return NextResponse.json({ error: "El profesor no generó una respuesta. Inténtalo de nuevo." }, { status: 503 });
    }

    let parsed: { reply?: unknown; checkQuestion?: unknown };
    try {
      parsed = JSON.parse(cleanJson(raw));
    } catch {
      // Groq puede devolver texto directo en caso de no seguir el formato estructurado.
      parsed = { reply: raw, checkQuestion: "" };
    }

    const reply = cleanText(parsed.reply, 7000);
    const checkQuestion = cleanText(parsed.checkQuestion, 500);
    if (!reply) {
      return NextResponse.json({ error: "La respuesta llegó incompleta. Vuelve a intentarlo." }, { status: 502 });
    }

    return NextResponse.json({ reply, checkQuestion });
  } catch (error) {
    console.error("[PeakScore Tutor] No se pudo responder.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "El profesor no está disponible por ahora. Inténtalo de nuevo en unos segundos." }, { status: 503 });
  }
}
