# PeakScore Community Live & Security Architecture

Date: 2026-11-20  
Implementation branch: `feat/founder-intro`

## Executive decision

Keep the current Next.js + Supabase + Vercel architecture. Do not make Supabase Realtime carry audio/video.

- Supabase: users, profiles, verified community roles, channels, event metadata, class schedule, access decisions, chat/messages, Q&A, polls, moderation records and usage ledger.
- LiveKit Cloud WebRTC: interactive teacher-led sessions with two-way audio/video and screen share.
- Cloudflare Stream: candidate for later public one-to-many broadcasts and replay delivery if its usage-based delivery/storage pricing is approved.
- YouTube Live: optional external public discovery stream only. Unlisted is not suitable for paid/private classes or protected course delivery.

## Verified provider research (20/21 Nov 2026)

### LiveKit Cloud Build (free)

Official quota documentation:
https://docs.livekit.io/deploy/admin/quotas-and-limits/

The free Build plan currently includes:
- 100 concurrent participants across all rooms.
- 5,000 WebRTC participant minutes per month.
- 50 GB downstream transfer.
- 2 Ingress requests and 2 Egress requests concurrently.
- 60 transcoding minutes and 60 track-egress minutes.
- The free allowance is a hard cap: once exceeded, new operations of that type fail rather than incurring overage charges.
- Monthly included allowances reset on the first day of the calendar month and do not roll over.

This is an appropriate capped pilot, not a promise of unlimited broadcasts. Participant minutes count connected SDK participants. Example: a 45-minute session with one teacher plus 20 students consumes 945 participant-minutes (21 × 45), before reconnects or other sessions. A 60-minute session with 80 total participants consumes 4,800 minutes and nearly exhausts the monthly allowance.

Documentation also says free limits are shared across a user's free projects. Do not create extra projects to try to multiply the quota.

### Cloudflare Stream

Official docs:
- https://developers.cloudflare.com/stream/pricing/
- https://developers.cloudflare.com/stream/webrtc/
- https://developers.cloudflare.com/stream/stream-live/

Current pricing found:
- WebRTC live delivery is $1 per 1,000 minutes delivered; billing for Stream Live WebRTC began 15 Oct 2026.
- Storage capacity is sold in prepaid increments of $5/month per 1,000 stored minutes.
- WebRTC live broadcasts cannot currently be recorded.
- RTMPS/SRT live inputs can be configured with automatic recording and HLS/DASH playback.

It is not a free default under PeakScore's strict free-only rule. Re-evaluate only when usage/revenue justifies an explicit budget.

### YouTube Live

The official YouTube Live Streaming API can create broadcasts, assign privacy states such as unlisted, bind a stream and transition broadcast state. An unlisted URL is not an authorization system; anyone who gets it may share it. Use only for public promotional sessions, not purchased course rooms or private teacher/student meetings.

## Product model for PeakScore

### Live destinations
1. **En vivo**: public discovery page listing public streams, scheduled lessons and upcoming sessions.
2. **Aula en vivo**: private or unlisted class room. Students join after an authorization check.
3. **Reunión**: small invited group with audio/video and screen share.
4. **Replays**: disabled in the first release. Add only after storage retention, consent and budget are specified.

### Roles and permissions
- Profesor PeakScore: verified creator, may schedule/start own sessions and manage their own audience.
- Estudiante / member: may join only published/open sessions they are authorized for.
- Moderador: may mute/remove participants, remove messages, close reports and apply temporary restrictions.
- Administrador: may manage all sessions and roles.
- Institutional roles are out of scope. Do not treat a school Docente or Rector as a PeakScore creator unless separately verified and assigned both scopes.

A creator must never assign their own role, mint a token with arbitrary grants, or change ownership of a session.

## LiveKit token architecture

1. Browser calls `POST /api/community/live/token` using the authenticated Supabase session.
2. Route handler verifies Supabase user server-side with `auth.getUser()`.
3. Server loads the live-session row and validates status, start/end time, audience scope, enrolment/entitlement and current room participant count.
4. Server checks community role and session ownership. A teacher must own the scheduled session and still hold `profesor`.
5. Apply per-user join limits and a project-level participant/minute budget before issuing a token.
6. Server mints a short-lived LiveKit JWT (target TTL 5–10 minutes) with room name and immutable identity.
7. Token grants are least-privilege:
   - teacher: join + publish audio/video + publish data + subscribe;
   - student: join + subscribe + publish data only when questions/chat are enabled; publish audio/video false by default;
   - moderator: explicit moderation grants only for authorized rooms.
8. Explicitly set `canPublish`, `canSubscribe` and `canPublishData`. Never rely on omitted defaults.
9. Browser receives only the short-lived room token and public server URL, never the LiveKit API secret.
10. Ending a session invalidates future token issuance; force-disconnect participants and close the room server-side.

For self-hosted LiveKit deployments, official docs warn that removing a participant or changing their permissions does not invalidate existing participant tokens; short TTLs are needed to limit rejoin with old permissions. Apply that same short-lived token discipline to PeakScore.

## Cost guardrails

- No paid fallback, automatic plan upgrade or auto top-up.
- Enforce a conservative internal ceiling below provider allowance (for example, reserve 20% for tests/overheads).
- Maintain a server-side ledger of estimated participant minutes and last known provider usage.
- Refuse new live-room creation or token issuance at the guard threshold; show the teacher a clear quota warning.
- Hard cap class size and duration (pilot values: 30 students, 60 minutes).
- No Egress, recording or replay in MVP.
- Do not use live transcription/AI agents in the first release; those are separately metered workloads.
- Keep public YouTube/Cloudflare distribution out of the paid/private student entitlement path.

## Security controls before public launch

### Identity and authorization
- All live token minting is server-side; no token or publish URL stored in client metadata.
- Role and ownership checked against database rows on every token request.
- Session state validated on every token request. Cancelled/ended sessions cannot issue tokens.
- Per-session participant cap enforced transactionally in database or server coordinator.
- Staff/admin privileges require MFA on staff accounts.
- Do not use user_metadata/profile fields supplied from browser for privileged role decisions.

### Web and API protection
- Keep current CSP and security headers; extend connect-src only with the exact LiveKit Cloud signaling/WebSocket host once the official project URL exists. Do not wildcard arbitrary origins.
- Add request body size caps, schema validation, auth checks, origin/CSRF protection for cookie-authenticated mutations and method allowlists.
- Apply per-user and per-IP rate limits at the edge and database; return 429 with Retry-After.
- Cloudflare Turnstile on signup, invite creation and high-risk repeated actions.
- Keep Service Role, LiveKit API secret, Cloudflare API tokens, YouTube OAuth refresh tokens server-only.
- Do not expose private channel IDs, publish secrets or stream keys in logs/errors.
- Configure Vercel WAF/managed bot rules and security event monitoring where the account plan permits it.

### Community abuse and moderation
- Post/comment/reaction rate limits at the database boundary.
- Length limits, URL/link abuse detection, duplicate spam controls.
- Report/block/mute flows, moderator audit log and appeal path.
- File uploads via server-issued signed URLs, private buckets, strict content type/size limits, malware scan/quarantine and short-lived downloads. Do not accept arbitrary external URLs as embed sources.
- Public channels and private teacher channels must have separate RLS predicates. Realtime DELETE events are not filtered by RLS, so do not expose raw Postgres Changes DELETE payloads for private content. Use authorized server-side broadcast or a refetch strategy instead.

## First live release scope

- Public page of upcoming/live events.
- Teacher can schedule an event and invite/list it.
- Teacher starts a LiveKit room from browser.
- Authorized students join as viewers (mic/camera off; raise hand/request mic only when teacher approves).
- Chat and polls continue through Supabase, separately from media.
- Teacher controls: mute participant, remove participant, end room.
- No replay/recording, no paid provider, no livestream to thousands, no student broadcast by default.

## Open prerequisites (do not invent values)

Before implementing token API, add server environment variables:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

Values must be created in the LiveKit project dashboard and stored only in Vercel/Supabase server secrets. Never commit them or ask the browser to supply them.

Also confirm whether the existing Vercel CSP can be extended with the exact LiveKit signaling origin, and verify the free plan's current usage inside the PeakScore-owned LiveKit project before inviting users.
