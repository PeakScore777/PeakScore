-- Expand the personal study library with first-class resource categories.
-- Existing rows remain note/topic; access stays owner-scoped through explicit RLS policies.

alter table public.orby_learning_items
  drop constraint if exists orby_learning_items_kind_check;

alter table public.orby_learning_items
  add constraint orby_learning_items_kind_check
  check (kind in ('note', 'topic', 'flashcard', 'summary', 'recording', 'quiz'));

-- Flashcard mastery and note editing update only a row owned by the authenticated user.
grant update on public.orby_learning_items to authenticated;

drop policy if exists "Users update their own Orby learning items" on public.orby_learning_items;
create policy "Users update their own Orby learning items"
  on public.orby_learning_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on column public.orby_learning_items.kind is
  'Owner-scoped learning resource: note, topic, flashcard, summary, recording transcript, or quiz. Raw audio is not persisted here.';
