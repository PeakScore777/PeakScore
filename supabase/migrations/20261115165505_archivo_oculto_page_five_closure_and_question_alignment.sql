-- Add an applied synthesis as a fifth reading paragraph.
-- Later migration 34000 expands it and adds the source-evaluation section.
update public.game_reading_passages p
set content_blocks = p.content_blocks || jsonb_build_array(
  jsonb_build_object('type','paragraph','text',$synthesis$Para evaluar el expediente conviene distinguir entre lo que cada fuente muestra y lo que permite concluir. La fotografía registra la apariencia del lugar y la hora visible en el reloj; el libro de equipajes deja constancia de un traslado; la declaración recoge la versión del encargado. Al contrastarlas se puede reconocer una inconsistencia, pero no identificar automáticamente a quien movió la maleta ni a quien hizo desaparecer el libro de pasajeros. Una conclusión responsable debe señalar qué está respaldado y qué sigue siendo una hipótesis pendiente de verificación.$synthesis$::text)
)
where p.game_key='archivo-oculto'
  and p.title='El caso de las 9:17'
  and jsonb_array_length(p.content_blocks)=5
  and p.content_blocks->4->>'text' like 'El caso demuestra que reconstruir%';

update public.game_evidence_assets e
set display_after_paragraph = 3
where e.title = 'Declaración del encargado'
  and e.passage_id in (
    select p.id
    from public.game_reading_passages p
    where p.game_key = 'archivo-oculto'
      and p.title = 'El caso de las 9:17'
  );
