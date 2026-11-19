import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  }

  const url = new URL(request.url);
  const passageId = url.searchParams.get("passageId");
  if (!passageId || passageId.length > 64) {
    return NextResponse.json({ error: "Expediente no válido." }, { status: 400 });
  }

  const { data: passage, error: passageError } = await supabase
    .from("game_reading_passages")
    .select("id,status")
    .eq("id", passageId)
    .eq("game_key", "archivo-oculto")
    .eq("status", "published")
    .maybeSingle();

  if (passageError || !passage) {
    return NextResponse.json({ error: "El expediente no está disponible." }, { status: 404 });
  }

  const [{ data: records, error: recordsError }, { data: evidenceAssets, error: evidenceAssetsError }] =
    await Promise.all([
      supabase
        .from("game_case_records")
        .select("id,record_type,occurred_at,title,body,source,sender,recipient,subject,suspect_id,evidence_asset_id,evidence_code,document_reference,page_number,seal,signature_note,classification,display_order")
        .eq("passage_id", passageId)
        .order("display_order")
        .order("occurred_at")
        .limit(500),
      supabase
        .from("game_evidence_assets")
        .select("id,title,description,image_url,tag,passage_id,display_after_paragraph,created_at")
        .eq("passage_id", passageId)
        .order("display_after_paragraph", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

  if (recordsError) {
    console.error("[archivo-oculto] Could not load case records:", recordsError.message);
    return NextResponse.json({ error: "No se pudieron cargar los registros del expediente." }, { status: 500 });
  }
  if (evidenceAssetsError) {
    console.warn("[archivo-oculto] Could not load the book evidence index:", evidenceAssetsError.message);
  }

  const rows = records ?? [];
  const suspectIds = [...new Set(rows.map((row) => row.suspect_id).filter((id): id is string => Boolean(id)))];
  const evidenceIds = [...new Set(rows.map((row) => row.evidence_asset_id).filter((id): id is string => Boolean(id)))];

  const [{ data: suspects }, { data: linkedEvidence }] = await Promise.all([
    suspectIds.length
      ? supabase.from("game_reading_suspects").select("id,name").in("id", suspectIds)
      : Promise.resolve({ data: [] }),
    evidenceIds.length
      ? supabase.from("game_evidence_assets").select("id,title,description,image_url,tag").in("id", evidenceIds)
      : Promise.resolve({ data: [] }),
  ]);

  const suspectMap = new Map((suspects ?? []).map((item) => [item.id, item.name]));
  const evidenceMap = new Map((linkedEvidence ?? []).map((item) => [item.id, item]));

  return NextResponse.json({
    records: rows.map((record) => {
      const asset = record.evidence_asset_id ? evidenceMap.get(record.evidence_asset_id) : null;
      return {
        ...record,
        suspect_name: record.suspect_id ? suspectMap.get(record.suspect_id) ?? "Persona vinculada" : "",
        evidence_title: asset?.title ?? "",
        evidence_description: asset?.description ?? "",
        evidence_url: asset?.image_url ?? "",
      };
    }),
    // Include every evidence item belonging to this book, not just records
    // already cross-linked to a mail/message/timeline entry.
    evidenceAssets: evidenceAssets ?? [],
  });
}
