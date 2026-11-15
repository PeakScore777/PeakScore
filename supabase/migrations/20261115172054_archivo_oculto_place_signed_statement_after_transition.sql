update public.game_evidence_assets e
set display_after_paragraph = 3
where e.title = 'Declaración del encargado'
  and e.passage_id in (
    select p.id
    from public.game_reading_passages p
    where p.game_key = 'archivo-oculto'
      and p.title = 'El caso de las 9:17'
  );
