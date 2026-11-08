-- Expand the personal study library with first-class resource categories.
-- Existing rows remain note/topic; access stays owner-scoped through the existing RLS policies.

alter table public.orby_learning_items
  drop constraint if exists orby_learning_items_kind_check;

alter table public.orby_learning_items
  add constraint orby_learning_items_kind_check
  check (kind in ('note', 'topic', 'flashcard', 'summary', 'recording'));

comment on column public.orby_learning_items.kind is
  'Owner-scoped learning resource: note, topic, flashcard, summary, or recording transcript. Raw audio is not persisted here.';
