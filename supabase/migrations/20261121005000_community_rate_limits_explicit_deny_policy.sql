-- Explicit deny-all policy documents the intentional client isolation
-- and clears the advisor's no-policy notice for this private internal table.
drop policy if exists community_rate_limits_deny_client
  on private.community_rate_limits;

create policy community_rate_limits_deny_client
  on private.community_rate_limits
  for all to public
  using (false)
  with check (false);
