-- Persistencia de progreso del minijuego. No concede XP ni Peak Coins.
-- El progreso pertenece exclusivamente al usuario autenticado.
create table if not exists public.game_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null,
  best_score integer not null default 0 check (best_score >= 0),
  best_correct integer not null default 0 check (best_correct between 0 and 10),
  games_completed integer not null default 0 check (games_completed >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_key),
  constraint game_progress_game_key_check check (game_key in ('que-es-esa-vaina'))
);

alter table public.game_progress enable row level security;

drop policy if exists "Users can read own game progress" on public.game_progress;
create policy "Users can read own game progress"
  on public.game_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own game progress" on public.game_progress;
create policy "Users can insert own game progress"
  on public.game_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own game progress" on public.game_progress;
create policy "Users can update own game progress"
  on public.game_progress for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.game_progress to authenticated;
