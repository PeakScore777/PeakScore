# PeakScore Community — Founder authority, moderation and mobile

**Date:** 2026-11-21  
**Branch:** `feat/founder-intro`  
**Visual direction:** GameCode identity + Discord channel ergonomics.

## Authority model

### Founder — unique owner
Only the founder can:
- Grant or revoke community roles, including administrator/moderator.
- Change community lifecycle (disable/restore).
- Perform owner-level actions and manage privileged accounts.
- Recover from an incident involving moderators or administrators.

The founder identity is stored in a private singleton table. It cannot be reassigned through the app. The initial identity is bootstrapped once by a server-only function that accepts calls from the Supabase service role; the application route additionally checks a server-only allowlist.

### Administrator — moderation only
Administrators can only:
- Kick a normal member from the PeakScore community.
- Apply a temporary timeout (1 minute to 28 days).
- Record a reason and leave an audit event.

An administrator cannot:
- Assign/revoke roles or promote another administrator.
- Modify channels, community settings or permissions.
- Delete/disable the community.
- Moderate the founder, administrators, moderators or teachers.

### Moderator
A moderator role does not imply administrator powers. It can be used for review/triage tools when implemented, but cannot call role-management or member-moderation functions.

## Founder setup required before use

Set this server-only environment variable in Vercel for Preview/Production as appropriate:

```env
COMMUNITY_FOUNDER_USER_ID=<the founder's Supabase Auth user UUID>
```

Find the UUID in Supabase Dashboard → Authentication → Users. Do not expose it with a `NEXT_PUBLIC_` prefix and do not put it in browser code.

The first founder-only request to the role/lifecycle endpoints calls `bootstrap_community_founder`. It inserts the founder singleton once and adds the non-transferable `fundador` role. If the singleton already belongs to a different UUID, bootstrap returns false and does not replace the founder. A server environment change alone cannot transfer ownership.

If the environment variable is missing or incorrect, privileged actions fail closed. Do not manually grant the `fundador` role to another account.

## Server-side endpoints

- `POST /api/community/roles`: founder-only role grant/revoke. Body: `target_user_id`, `role_key`, `action` (`grant` or `revoke`).
- `POST /api/community/moderation`: administrator/founder moderation. Body: `target_user_id`, `action` (`kick` or `timeout`), optional `reason`, and `duration_minutes` for timeout.
- `POST /api/community/lifecycle`: founder-only `disable` or `restore`.

All endpoints require a same-origin mutation and an authenticated Supabase session. Authorization is checked again inside PostgreSQL SECURITY DEFINER functions; hiding buttons in the client is not considered security.

## Kick, timeout and audit

Restrictions are stored in a private table. A kick is an indefinite community restriction (not deletion of the student's PeakScore account). A timeout expires automatically. A later restriction replaces an existing active restriction.

Restrictive RLS policies apply the enabled/restricted check to channels, messages, reactions, comments and live sessions. This blocks direct Supabase requests as well as the normal UI. The restriction is not merely a frontend banner.

Sensitive actions append an event to `private.community_security_audit`. The audit table is not readable or writable by authenticated clients. The database records actor, target, action and bounded metadata.

## Community deletion semantics

The founder-only lifecycle action is a reversible soft-disable. It blocks community access through restrictive RLS but preserves messages, attachments and audit evidence. Physical deletion of the database tables or evidence is intentionally not exposed as an application RPC. A true data purge requires a separate retention/legal review and a deliberate off-platform backup/restore plan.

## Mobile adaptation

The mobile layout is not a squeezed desktop layout:
- GameCode's top header and bottom navigation remain visible.
- Server rail is hidden to reclaim width.
- A Discord-like channel drawer opens over the chat and closes after channel selection.
- The chat takes the remaining viewport; header, message list and composer are separate flex regions.
- The composer and drawer reserve space for the GameCode bottom nav and iOS/Android safe-area insets.
- Message actions and touch targets are enlarged; the desktop member-count row is hidden on narrow screens.

The mobile work is CSS-scoped to `.community-page` and keeps the current GameCode dark navy/cyan/lime palette and typography.

## Security verification required

Before production:
1. Set `COMMUNITY_FOUNDER_USER_ID` in the correct Vercel environment.
2. Apply migration `20261121018000_community_founder_authority_and_moderation.sql` to Supabase.
3. Confirm the founder account bootstraps and receives the founder badge.
4. Verify a normal user cannot call role/lifecycle RPCs.
5. Verify an administrator cannot grant/revoke roles, disable the community, or moderate privileged accounts.
6. Verify kick/timeout blocks direct SELECT/INSERT requests against all protected community tables; verify timeout expires.
7. Verify founder can restore community lifecycle after a soft-disable.
8. Run the full test suite, ESLint, TypeScript and production build; check CI on the exact commit.

No production migration or deployment is authorized by this commit.
