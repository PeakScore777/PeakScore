# PeakScore database migration reconciliation
Date: 2026-11-21
Working branch: `repair/db-migration-reconciliation-2026-11-21`
Base: `feat/founder-intro`
Supabase project: `avmywztnsrnyjhvbaiio`

## Safety boundary
- This branch is isolated from `main` and `feat/founder-intro`.
- No production DDL, data writes, migration applies, resets, or history repairs were performed during this audit.
- Do not run `supabase db push` until the migration source set and production schema have been reconciled and tested.

## Inventory snapshot
At the inspected branch head:
- GitHub contains 149 SQL migration files.
- There are 148 distinct migration version prefixes because two files share version `20261121020000`.
- Supabase migration history reports 181 entries.
- 36 entries match exactly by version and name.
- 87 local files share a migration name with a remote history entry but use a different version prefix.
- 27 local migration names are not present in remote history.
- 60 remote migration names are not present in this branch's migration directory.

These are filename/history comparisons only. They do not prove SQL equivalence or that a migration's effects are absent/present in the schema.

## Duplicate local version
Both files use `20261121020000`:
- `20261121020000_community_founder_moderation_guardrails.sql`
- `20261121020000_community_independent_member_profiles.sql`

The independent-profile migration is already recorded in production under version `20261121161520` and its table exists. The guardrails migration is not recorded under its local version and its target founder/restriction/audit tables are absent from the inspected production schema.

## Conflicting founder designs
Two local migrations create overlapping private objects with incompatible definitions:
- `20261121018000_community_founder_authority_and_moderation.sql`
- `20261121020000_community_founder_moderation_guardrails.sql`

The first defines `community_founder_config`, `community_lifecycle`, a history-style `community_member_restrictions`, and a service-role bootstrap RPC. The second defines `community_founder_control`, a singleton/current-state `community_member_restrictions`, a different `community_security_audit`, and a bootstrap that requires exactly one existing admin. Both define overlapping moderation and founder authority. They must be consolidated into one deliberate design; they must not both be blindly applied.

## Production schema spot-check
Confirmed present:
- `public.community_member_profiles`
- `public.community_public_role_badges`
- `public.community_messages`
- `public.community_message_comments`
- `public.community_live_sessions`
- `public.get_community_message_metrics(uuid[])`
- `public.search_community_mention_members(uuid,text,integer)`
- `public.resolve_community_mention_members(uuid,uuid[])`

Not found in the inspected schema:
- `public.edit_community_message(uuid,text)`
- `public.community_profile_cosmetics`
- `public.user_profile_cosmetics`
- `public.user_profile_cosmetic_equipment`
- `public.get_peakstyle_public_profile(uuid)`
- `private.community_founder_config`
- `private.community_founder_control`
- `private.community_lifecycle`
- `private.community_member_restrictions`
- `private.community_security_audit`

Storage bucket `community-profile-avatars` exists. `community-profile-banners` was not found in the inspected bucket list.

A missing relation/function in this spot-check is evidence that the corresponding object was not found by the query; it is not a full audit of every policy, grant, trigger, index, or dependent application route.

## Recovery constraints and next steps
1. Retrieve SQL source for remote-only migrations from Git history/branches, CI artifacts, or another authoritative source. Supabase migration history provides version/name metadata, not the original SQL body.
2. Compare all 87 same-name/different-version SQL files before deciding which timestamp is canonical.
3. Reconcile the 27 local-only migrations against live schema and application dependencies.
4. Consolidate the two founder/moderation migrations and assign unique, ordered version prefixes to the resulting migration set.
5. Validate migrations against a disposable database or Supabase development branch before production.
6. Apply only forward, additive, verified changes; do not rewrite production history or mark migrations applied merely to silence drift.

## Evidence limitations
The branch tree scan covered `feat/founder-intro` and selected backup/feature branches. It did not exhaust every historical commit or every branch. Remote migration names absent from the checked trees remain unresolved, not proven lost.
