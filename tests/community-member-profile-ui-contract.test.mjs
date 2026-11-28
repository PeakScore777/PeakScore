import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import testCase from "node:test";

const [page, styles] = await Promise.all([
  readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../app/community-member-profile-ui.css", import.meta.url), "utf8"),
]);

testCase("clicking a member or chat author opens the read-only profile dialog without a hover popout", () => {
  assert.match(page, /async function openCommunityProfile\(memberId: string\)/);
  assert.match(page, /void openCommunityProfile\(member\.id\)/);
  assert.match(page, /onClick=\{\(\) => message\.author && void openCommunityProfile\(message\.author\.id\)\}/);
  assert.match(page, /onClick=\{\(\) => void openCommunityProfile\(message\.author!\.id\)\}/);
  assert.match(page, /ps-community-profile-overlay/);
  assert.match(page, /ps-community-profile-dialog/);
  assert.doesNotMatch(page, /openMemberHoverPreview|hoverCommunityProfile|ps-community-member-popout/);
});

testCase("the full profile is read-only and only its owner can open the profile editor", () => {
  assert.match(page, /ps-community-profile-dialog/);
  assert.match(page, /ps-community-profile-live-readonly-body/);
  assert.match(page, /ps-community-profile-bio-readonly/);
  assert.match(
    page,
    /selectedCommunityProfile\.isOwnProfile\s*&&\s*\(\s*<button[^>]*className="ps-community-profile-editor-button"/,
  );
  assert.match(page, /Abrir editor de perfil/);
  assert.match(page, /setCommunityProfileStudioOpen\(true\)/);
  assert.match(page, /CommunityProfileStudio/);
});

testCase("the full profile shows banner, identity, roles, biography and membership details", () => {
  assert.match(page, /ps-community-editor-preview-banner/);
  assert.match(page, /selectedCommunityProfile\.bannerUrl \?/);
  assert.match(page, /ps-community-editor-preview-avatar/);
  assert.match(page, /ps-community-editor-presence-dot/);
  assert.match(page, /ps-community-editor-preview-name-static/);
  assert.match(page, /ps-community-profile-role-list/);
  assert.match(page, /ps-community-editor-preview-about/);
  assert.match(page, /ps-community-profile-bio-readonly/);
  assert.match(page, /ps-community-editor-preview-meta/);
  assert.match(page, /MIEMBRO DESDE/);
});

testCase("the profile dialog is responsive, accessible and respects reduced motion", () => {
  assert.match(page, /role="dialog"\s+aria-modal="true"/);
  assert.match(page, /aria-labelledby="ps-community-profile-title"/);
  assert.match(page, /aria-label="Cerrar perfil"/);
  assert.match(styles, /\.ps-community-profile-overlay\s*\{/);
  assert.match(styles, /\.ps-community-profile-dialog\s*\{/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});


testCase("every community member handle is loaded before profile opening", async () => {
  const [communityPage, profileRoute, handleMigration, backfillMigration, profileStyles, profileStudio] = await Promise.all([
    readFile(new URL("../app/comunidad/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/community/profile/[userId]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20261127133000_community_member_account_handles.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20261127134000_backfill_missing_community_member_handles.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/community-member-profile-ui.css", import.meta.url), "utf8"),
    readFile(new URL("../components/community/CommunityProfileStudio.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(communityPage, /\.select\("user_id,account_name"\)/);
  assert.match(communityPage, /memberAccountNames\.set\(row\.user_id, row\.account_name\.trim\(\)\)/);
  assert.match(communityPage, /accountName: member\?\.account_name\?\.trim\(\) \|\| \(memberId === userId \? registeredAccountName\.trim\(\) : ""\)/);
  assert.match(communityPage, /accountNameReady: Boolean\(member\?\.account_name\?\.trim\(\) \|\| \(memberId === userId && registeredAccountName\.trim\(\)\)\)/);
  assert.match(communityPage, /account_name: memberAccountNames\.get\(member\.user_id\) \?\? null/);
  assert.match(communityPage, /selectedCommunityProfile\.accountName/);
  assert.match(communityPage, /"@" \+ selectedCommunityProfile\.accountName\.trim\(\)/);
  assert.match(communityPage, /ps-community-profile-account-handle/);
  assert.match(communityPage, /ps-community-editor-preview-identity-line/);
  assert.match(profileStyles, /\.ps-community-profile-live-readonly-body \.ps-community-editor-preview-identity-line[\s\S]*?flex-direction: row[\s\S]*?flex-wrap: nowrap/);
  assert.match(profileStyles, /\.ps-community-profile-live-readonly-body \.ps-community-profile-account-handle[\s\S]*?background: transparent/);
  assert.match(profileStudio, /ps-community-profile-account-handle/);
  assert.match(profileRoute, /\.select\("user_id,display_name,avatar_path,pronouns,status_text,about,created_at"\)/);
  assert.match(profileRoute, /\.select\("account_name"\)/);
  assert.match(profileRoute, /accountName: accountNameResult\.error \? "" : accountNameResult\.data\?\.account_name \?\? ""/);
  assert.match(handleMigration, /alter column account_name set not null/);
  assert.match(handleMigration, /create unique index if not exists community_member_profiles_account_name_lower_uidx/);
  assert.match(backfillMigration, /insert into public\.community_member_profiles \(user_id, display_name, account_name\)/);
});
