-- Keep rankings outside Community and correct nested comment parent scoping.
update public.community_channels
set slug = 'logros',
    name = 'logros',
    description = 'Comparte tus avances y celebra los hitos de aprendizaje.'
where slug = 'logros-y-rankings'
  and not exists (select 1 from public.community_channels where slug = 'logros');

drop policy if exists community_comments_insert_as_self
  on public.community_message_comments;

create policy community_comments_insert_as_self
  on public.community_message_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.community_messages m
      join public.community_channels c on c.id = m.channel_id
      where m.id = community_message_comments.message_id
        and c.is_archived = false
        and c.is_read_only = false
        and (
          c.is_private = false
          or exists (
            select 1
            from public.community_member_roles mr
            where mr.user_id = (select auth.uid())
              and mr.role_key in ('profesor', 'moderador', 'administrador')
          )
        )
    )
    and (
      community_message_comments.parent_comment_id is null
      or exists (
        select 1
        from public.community_message_comments parent
        where parent.id = community_message_comments.parent_comment_id
          and parent.message_id = community_message_comments.message_id
          and parent.parent_comment_id is null
      )
    )
  );
