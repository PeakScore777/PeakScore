import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { searchOrbyKnowledge, getOrbyRelatedKnowledge, searchOrbyKnowledgeConcepts } from "@/lib/ai/orby-knowledge";
import { classifyOutOfScopeRequest, normalizeIcfesSubject } from "@/lib/ai/orby-scope";
import { preflightOrbyRequest, sanitizeOrbyKnowledgeExcerpt } from "@/lib/ai/orby-request-filter";
import { searchOrbyPublicSources, shouldSearchOrbyPublicSources } from "@/lib/ai/orby-web-research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Inicia sesión para consultar el conocimiento de Orby.", 401);

    const length = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(length) && length > 12000) return fail("La consulta supera el tamaño permitido.", 413);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("La consulta no es válida.", 400);

    const query = typeof body.query === "string" ? body.query.trim().slice(0, 2400) : "";
    const subjectInput = typeof body.subject === "string" ? body.subject.slice(0, 80) : "";
    if (query.length < 3) return fail("Escribe un tema académico más concreto.", 400);

    // Prefer the subject explicitly present in this question over the
    // stale subject supplied by a conversation that may just have switched.
    const subject = normalizeIcfesSubject("", query) ?? normalizeIcfesSubject(subjectInput, query);
    // English-language exam stems are valid inside English and the other
    // active Saber 11 areas. Pass the active area to the same academic-frame
    // classifier used by the tutor so a safe English question is not blocked
    // as an unrelated general-chat request.
    const preflightContext = subject ? "Área de estudio: " + subject : "";
    const preflight = preflightOrbyRequest(query, preflightContext);
    if (!preflight.allowed) return fail(preflight.reply, 400);
    const outOfScope = classifyOutOfScopeRequest(query);
    if (outOfScope) return fail("La consulta está fuera de las cinco áreas de Saber 11.", 400);

    const { data: limitData, error: limitError } = await supabaseAdmin.rpc("orby_take_rate_limit", {
      p_user_id: user.id,
      p_bucket: "orby_voice_knowledge",
      p_max_requests: 24,
      p_window_seconds: 60,
    });
    if (limitError || !limitData || typeof limitData !== "object") {
      return fail("La consulta del conocimiento no está disponible temporalmente.", 503);
    }
    const limit = limitData as { allowed?: boolean; retryAfter?: number };
    if (!limit.allowed) {
      const retryAfter = Math.max(1, Math.min(120, Number(limit.retryAfter) || 30));
      return NextResponse.json({ error: "Orby está consultando varios temas. Continúa hablando y vuelve a intentarlo en un momento." }, {
        status: 429,
        headers: { "Retry-After": String(retryAfter), "Cache-Control": "private, no-store" },
      });
    }

    type VoiceKnowledgeFragment = {
      document_id: string;
      title: string;
      subject: string;
      topic: string;
      page_number: number;
      content: string;
      profile_summary?: string;
      profile_concepts?: unknown;
      profile_competencies?: unknown;
      profile_topics?: unknown;
    };
    const [fragmentResult, conceptResult, publicResult] = await Promise.allSettled([
      searchOrbyKnowledge({
        query,
        subject,
        visibility: "published",
        limit: 6,
      }),
      searchOrbyKnowledgeConcepts({
        query,
        subject,
        visibility: "published",
        limit: 32,
      }),
      shouldSearchOrbyPublicSources(query)
        ? searchOrbyPublicSources(query, { maxSources: 4 })
        : Promise.resolve({ sources: [], searched: [], warnings: [] }),
    ]);
    const fragments: VoiceKnowledgeFragment[] = fragmentResult.status === "fulfilled"
      ? fragmentResult.value as VoiceKnowledgeFragment[]
      : [];
    const conceptHits = conceptResult.status === "fulfilled" ? conceptResult.value : [];
    const publicResearch = publicResult.status === "fulfilled"
      ? publicResult.value
      : { sources: [], searched: ["Wikimedia", "OpenAlex"], warnings: ["PUBLIC_RESEARCH_UNAVAILABLE"] };

    if (fragmentResult.status === "rejected") {
      console.warn("[Orby Voice Knowledge] Private Lab retrieval unavailable.");
    }
    if (conceptResult.status === "rejected") {
      console.warn("[Orby Voice Knowledge] Concept retrieval unavailable.");
    }
    if (publicResult.status === "rejected") {
      console.warn("[Orby Voice Knowledge] Public research unavailable.");
    }

    let related: Awaited<ReturnType<typeof getOrbyRelatedKnowledge>> = [];
    const documentIds = [...new Set(fragments.map((item) => item.document_id))];
    if (documentIds.length) {
      try {
        related = await getOrbyRelatedKnowledge(documentIds, "published", 3);
      } catch {
        console.warn("[Orby Voice Knowledge] Related-document retrieval unavailable.");
      }
    }

    const concepts = conceptHits.slice(0, 24).map((item) => ({
      name: item.concept_name,
      area: item.area || item.subject || "Transversal",
      family: item.parent_concept || "",
      aliases: item.aliases.slice(0, 6),
      evidence: sanitizeOrbyKnowledgeExcerpt(item.evidence_summary, item.title).slice(0, 650),
      confidence: item.confidence,
      importance: item.importance,
    }));

    const excerpts = fragments.map((item) => ({
      area: item.subject || "Transversal",
      topic: item.topic || "",
      content: sanitizeOrbyKnowledgeExcerpt(item.content, item.title).slice(0, 1300),
    })).filter((item) => item.content.length > 30);

    const profiles = [...new Map(fragments
      .filter((item) => item.profile_summary || item.profile_concepts)
      .map((item) => [item.document_id, item])).values()]
      .map((item) => ({
        summary: sanitizeOrbyKnowledgeExcerpt(item.profile_summary || "", item.title).slice(0, 700),
        topics: Array.isArray(item.profile_topics) ? item.profile_topics.slice(0, 12) : [],
        concepts: Array.isArray(item.profile_concepts) ? item.profile_concepts.slice(0, 18) : [],
        competencies: Array.isArray(item.profile_competencies) ? item.profile_competencies.slice(0, 10) : [],
      }));

    const relatedContext = related.map((item) => ({
      summary: (item.summary || "").slice(0, 700),
      shared_concepts: Array.isArray(item.shared_concepts) ? item.shared_concepts.slice(0, 12) : [],
      areas: Array.isArray(item.areas) ? item.areas.slice(0, 8) : [],
      topics: Array.isArray(item.topics) ? item.topics.slice(0, 12) : [],
    }));

    return NextResponse.json({
      found: excerpts.length > 0 || concepts.length > 0,
      subject,
      excerpts,
      concepts,
      profiles,
      related: relatedContext,
      public_sources: publicResearch.sources,
      guidance: excerpts.length
        ? "Usa este contenido para mejorar la explicación, conectar prerrequisitos, crear una ruta de aprendizaje o preparar ejercicios originales según la pregunta del estudiante. No menciones nombres ni procedencia de las fuentes."
        : "No se encontraron fragmentos publicados directamente relacionados. Responde con conocimiento académico fiable y no afirmes que la biblioteca contiene información que no fue recuperada.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[Orby Voice Knowledge] Search failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return fail("No se pudo consultar el conocimiento académico en este momento.", 503);
  }
}
