import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [migration, livePage, socialProfiles] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261121014000_harden_community_live_session_ownership_and_definer_paths.sql", import.meta.url), "utf8"),
  readFile(new URL("../app/comunidad/en-vivo/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261121020000_community_independent_member_profiles.sql", import.meta.url), "utf8"),
]);

testCase("live-session updates retain host ownership after the update", () => {
  assert.match(
    migration,
    /create policy community_live_sessions_update_owner_scheduled[\s\S]*?for update to authenticated[\s\S]*?using\s*\([\s\S]*?host_id\s*=\s*\(select auth\.uid\(\)\)[\s\S]*?with check\s*\([\s\S]*?host_id\s*=\s*\(select auth\.uid\(\)\)/i,
  );
  assert.match(
    migration,
    /with check\s*\([\s\S]*?role_key\s*=\s*'profesor'/i,
  );
  assert.match(
    migration,
    /host_id, status and provider_room_name remain non-updatable by clients/i,
  );
  assert.doesNotMatch(
    migration,
    /grant\s+update\s+on\s+public\.community_live_sessions/i,
  );
});

testCase("SECURITY DEFINER functions use an empty execution search path", () => {
  assert.match(
    migration,
    /alter function public\.ensure_current_user_season\(\)\s+set search_path to ''/i,
  );
  assert.match(
    migration,
    /alter function public\.sync_community_public_profile\(\)\s+set search_path to ''/i,
  );
});


testCase("live session hosts use the independent community identity, not the game profile", () => {
  assert.match(livePage, /from\("community_member_profiles"\)/);
  assert.match(livePage, /display_name,avatar_path/);
  assert.match(livePage, /community-profile-avatars/);
  assert.doesNotMatch(livePage, /community_public_profiles|from\("profiles"\)/);
  assert.match(socialProfiles, /create table if not exists public\.community_member_profiles/);
});


testCase("live schedule never claims a media stream exists before a real room provider is connected", () => {
  assert.match(livePage, /Evento en curso/);
  assert.match(livePage, /Sala multimedia pendiente/);
  assert.match(livePage, /La emisión de cámara, micrófono y pantalla se activará cuando se conecte LiveKit/);
  assert.doesNotMatch(livePage, /Transmisión activa/);
  assert.doesNotMatch(livePage, /Acceso protegido/);
});


testCase("live schedule details are available without exposing provider credentials or pretending to join", () => {
  assert.match(livePage, /Ver detalles/);
  assert.match(livePage, /community-live-detail-dialog/);
  assert.match(livePage, /aria-modal="true"/);
  assert.match(livePage, /Sala multimedia todavía no habilitada/);
  assert.match(livePage, /No necesitas conceder permisos del dispositivo todavía/);
  assert.doesNotMatch(livePage, /provider_room_name|access_token|LIVEKIT_API_SECRET/);
});
