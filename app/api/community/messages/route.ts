import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isSameOriginMutation } from "@/lib/security/request-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function DELETE(request: Request) {
  if (!isSameOriginMutation(request)) return fail("La solicitud no es válida.", 403);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return fail("Debes iniciar sesión.", 401);

  const messageId = new URL(request.url).searchParams.get("message_id") ?? "";
  if (!UUID_PATTERN.test(messageId)) return fail("El mensaje no es válido.", 400);

  let { data: message, error: readError } = await supabase
    .from("community_messages")
    .select("id,author_id,attachment_path")
    .eq("id", messageId)
    .maybeSingle();

  if (readError && ["42703", "PGRST204", "PGRST200"].includes(readError.code ?? "")) {
    const legacy = await supabase.from("community_messages")
      .select("id,author_id")
      .eq("id", messageId)
      .maybeSingle();
    message = legacy.data ? { ...legacy.data, attachment_path: null } : null;
    readError = legacy.error;
  }

  if (readError) return fail("No se pudo comprobar el mensaje.", 503);
  if (!message) return fail("El mensaje ya no existe o no está disponible.", 404);
  if (message.author_id !== user.id) return fail("Solo puedes eliminar tus propios mensajes.", 403);

  const { error: deleteError } = await supabase
    .from("community_messages")
    .delete()
    .eq("id", messageId);

  if (deleteError) {
    return fail(
      deleteError.code === "42501"
        ? "No tienes permiso para eliminar este mensaje."
        : "No se pudo eliminar el mensaje.",
      deleteError.code === "42501" ? 403 : 503,
    );
  }

  // The bucket is private and uses user-id-prefixed paths. Remove the object
  // only after the RLS-checked row deletion succeeds.
  let attachmentCleanup = "not_needed";
  const attachmentPath = message.attachment_path;
  if (attachmentPath && attachmentPath.startsWith(user.id + "/")) {
    const { error: cleanupError } = await supabaseAdmin.storage
      .from("community-attachments")
      .remove([attachmentPath]);
    if (cleanupError) {
      attachmentCleanup = "pending";
      console.error("[community-message-delete] Private attachment cleanup failed.", {
        code: cleanupError.name,
      });
    } else {
      attachmentCleanup = "removed";
    }
  }

  return NextResponse.json(
    { deleted: true, attachmentCleanup },
    { status: 200, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
