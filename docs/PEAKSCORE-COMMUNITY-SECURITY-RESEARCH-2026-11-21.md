# PeakScore — Community Security Research & Hardening Plan

**Date:** 2026-11-21  
**Branch:** `feat/founder-intro`  
**Scope:** Discord-style community UX with GameCode visual language. Security controls are independent of presentation.

## 1. Research basis

This document separates first-party platform documentation from general security guidance and implementation decisions.

### Discord first-party behavior and controls reviewed

- AutoMod can block messages before publication, alert a private moderation/log channel, and apply timeouts for supported rules. Keyword, spam-content, and mention-spam filters are documented. Custom rules can match links and symbols; the built-in spam classifier has limitations and does not catch every repeated/copy-paste or DM spam pattern.
- Raid protection guidance recommends AutoMod, restricting @everyone/@here/role-wide mentions to trusted roles, raid alerts, CAPTCHA/verification friction for suspicious join bursts, explicit-media filtering, and recruiting trusted moderators.
- Discord documents suspicious-link filtering and user warnings for suspicious links/files; this should be treated as defense-in-depth, not proof that every dangerous URL/file is caught.
- Discord's permission model and audit log provide role-scoped administrative capabilities and an audit trail for moderation actions.

Sources:
- https://discord.com/safety/auto-moderation-in-discord
- https://support.discord.com/hc/en-us/articles/4421269296535-AutoMod-FAQ
- https://support.discord.com/hc/en-us/articles/10989121220631-How-to-Protect-Your-Server-from-Raids-101
- https://support.discord.com/hc/en-us/articles/7326747355159-Why-was-my-message-not-delivered
- https://discord.com/community/permissions-on-discord-discord
- https://discord.com/safety-library

### WhatsApp-style image privacy

WhatsApp's public help material explains media compression/quality behavior, but does not provide a comprehensive contractual guarantee that every EXIF/XMP/IPTC field is removed in every photo-sharing mode. Independent tests report that normal photo sharing re-encodes images and removes common EXIF/GPS/camera/date fields, while sending as a document may preserve the original. Behavior can vary by app version and mode.

PeakScore will not rely on another platform's undocumented behavior. Every accepted image is decoded and re-encoded server-side, regardless of how the user selected or transferred it.

Sources:
- https://faq.whatsapp.com/453914586839706/
- https://imgtweak.com/blog/does-whatsapp-remove-exif-data
- https://editprivacy.com/whatsapp-photo-metadata/

### OWASP upload and SSRF guidance

- Allowlist formats, validate actual content rather than trusting MIME or filename, generate storage names, cap size, authorize uploads, keep private storage, and use safe parsing/re-encoding with resource limits.
- Re-encoding removes unnecessary metadata but does not guarantee all malicious content is removed; image processors are themselves attack surfaces and need current dependencies, constrained resources, and tests.
- URL preview fetchers are SSRF-sensitive. DNS resolution must be checked against private/reserved IP ranges at connection time; redirects, rebinding, retries and fallback connections must not bypass the policy.

Sources:
- https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

## 2. Threats and planned defenses

| Threat | PeakScore control |
|---|---|
| Spam / repeated messages | DB-backed rate limits; message similarity/repetition windows; per-channel and account-level throttles; moderation queue and alerts |
| Mention raids | Cap unique mentions; reserve mass mentions for trusted roles; block before insert; alert moderators |
| Join raids / disposable accounts | Join velocity and account-risk signals; temporary restricted mode; CAPTCHA/verification step when risk threshold is reached; no blanket ban based on one signal |
| Phishing / malicious links | Parse URLs safely; display punycode-aware hostname; warn on external/shortened/suspicious destinations; block known malicious domains; never fetch arbitrary URLs without SSRF-safe egress |
| Fake login / session theft | MFA for staff; secure session lifecycle; re-auth for destructive actions; revoke sessions on role removal/incident |
| Compromised moderator | Least privilege; two-person confirmation for destructive bulk actions and role grants; immutable audit events; emergency revoke |
| Malicious images | PNG/JPEG/WebP allowlist; signature/dimension checks; streaming request ceiling; decoder limits; re-encode; private storage; signed read URLs |
| EXIF/GPS leakage | Re-encode all raster images and verify output contains no EXIF/GPS/XMP/IPTC/comment/profile metadata; never offer an original-file bypass in community chat |
| SVG/HTML/polyglot upload | Reject active formats; do not render user-provided SVG/HTML |
| XSS in messages/previews | Plain-text rendering by default; safe URL parsing; strict output encoding; no raw HTML; CSP as defense-in-depth |
| SSRF in previews | Isolated fetcher; HTTP(S) only; reject credentials and non-public IPs; resolve and pin IP at connect; re-check redirects; strict time/byte/content-type limits |
| Bot/API abuse | Server-side authorization on every operation; database-backed rate limits; idempotency where relevant; anomaly detection |
| Private-channel IDOR | RLS plus server-side object/channel membership checks; test cross-user and cross-role access |
| Moderator abuse / evidence loss | Append-only audit records for role, ban, timeout, delete, report and bulk operations; redact sensitive payloads |

## 3. Image privacy pipeline implemented on this branch

File: `lib/security/sanitize-raster-image.ts`

1. Only static PNG, JPEG and WebP are accepted.
2. The server validates signatures and dimensions before decoding.
3. The server decodes and draws pixels to a fresh canvas.
4. It re-encodes into a canonical raster file; the original byte stream is never stored.
5. The output is inspected for metadata-bearing JPEG APP1–APP15/COM segments, PNG EXIF/text/time/profile chunks, and WebP EXIF/XMP/ICC chunks. If any are found, the upload fails closed.
6. Storage names are random and stored in the private community bucket.
7. The source image's filename is not used as the storage key.

Metadata deliberately not retained includes GPS coordinates, camera make/model/serial fields, original capture timestamp, EXIF MakerNotes/thumbnail, XMP, IPTC where represented in metadata-bearing segments/chunks, comments and embedded color profiles. Basic dimensions and pixel data remain.

Important limitation: metadata stripping protects the copy stored and shared by PeakScore. The original file has already reached PeakScore's upload endpoint before server-side processing. If users need to prevent the platform itself from receiving original metadata, a future client-side pre-upload scrubber can be added; server-side sanitization remains mandatory as a second barrier.

## 4. Next implementation sequence

### P0 — Complete safe multi-image uploads
- Up to 5 images per message; strict per-image and aggregate request ceilings.
- Validate and re-encode each image independently.
- Use a transaction/compensating cleanup so failed message creation cannot leave orphaned objects.
- Store attachment rows in a normalized child table, with RLS tied to the parent message/channel.
- Generate short-lived signed URLs only after verifying the viewer can read the parent message.
- Delete attachments when the parent message is deleted; add orphan cleanup.

### P0 — Safe link previews
- Parse links on the client/server without fetching arbitrary user URLs from the main app server.
- Prefer a constrained preview worker with public-IP-only egress and DNS pinning.
- No cookies, authorization headers, internal service credentials, or user session forwarded.
- Reject localhost, private, link-local, multicast, reserved and IPv4-mapped IPv6 destinations.
- Revalidate every redirect and final resolved IP; cap redirects, response bytes, time and content type.
- Never render returned HTML. Extract bounded metadata and escape all text.
- Provide a plain link fallback when preview generation fails.

### P1 — Discord-inspired moderation
- Rules engine for keywords, repeated content, mention floods, invite spam and known malicious links.
- Block/hold/alert actions with a private moderator event stream.
- Report, block, mute, timeout, ban and appeal workflows.
- Raid mode that temporarily restricts new accounts and mass mentions; alert before high-impact actions.
- Human review for ambiguous cases; no permanent punishment solely from an ML score.

### P1 — GIF selector
- Curated provider or self-hosted approved catalog; do not allow arbitrary GIF uploads initially.
- GIF results are treated as untrusted media; proxy/cache only through a constrained image pipeline.
- Rate-limit search and posting; apply the same privacy and content moderation rules.
- No paid API dependency or silent paid fallback.

### P1 — Staff and platform hardening
- MFA for administrators/moderators; least privilege and role hierarchy.
- Append-only audit log and re-authentication for bulk/destructive operations.
- CSP, safe external-link handling, dependency scanning, secret scanning and scheduled security tests.
- Review RLS, SECURITY DEFINER functions, Storage policies and every API route for IDOR/BOLA.
- Rate limits must fail closed for sensitive writes.

## 5. Verification checklist

- EXIF GPS, camera model, timestamp, MakerNotes, thumbnail, XMP, IPTC, PNG text/time and WebP EXIF/XMP test fixtures are not present in stored output.
- Invalid MIME, mismatched signatures, truncated files, polyglots, animated files, huge dimensions, decompression bombs and oversized chunked bodies are rejected.
- A user cannot read another user's private attachment by guessing its object path.
- A user without channel membership cannot obtain signed URLs or preview private content.
- Preview tests cover localhost, RFC1918, IPv6 ULA/link-local, metadata IP, redirects to private IPs, DNS rebinding, unusual ports, credentials in URL and oversized responses.
- Moderation tests cover repeated spam, mass mentions, invite flooding, false positives, staff permissions and audit events.
- Run full tests, TypeScript, ESLint, production build, OSV/Gitleaks/CodeQL; verify checks against the exact commit SHA.

## 6. Status and limitations

The image sanitizer metadata verification and a contract test were committed to `feat/founder-intro`. This is not a claim that the entire security roadmap or multi-image/link/GIF features are complete. CI and runtime tests must pass on the resulting commit before marking the change verified.

No Supabase production migration, `main` update or production deployment is authorized by this document.
