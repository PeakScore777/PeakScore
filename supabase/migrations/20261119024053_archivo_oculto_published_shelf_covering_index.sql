create index if not exists game_reading_passages_archivo_shelf_idx
  on public.game_reading_passages (created_at desc)
  include (id,title,case_code)
  where game_key='archivo-oculto' and status='published';
