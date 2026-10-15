-- Prevent authenticated clients from minting XP/coins by calling the reward RPC directly.
-- finish_simulation_atomic is SECURITY DEFINER and can call this function as its owner.
-- The application server does not need to call this function directly.
REVOKE ALL ON FUNCTION public.grant_simulation_rewards(uuid, uuid, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_simulation_rewards(uuid, uuid, uuid, integer)
  TO service_role;
