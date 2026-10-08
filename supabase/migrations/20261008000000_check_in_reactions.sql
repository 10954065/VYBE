-- Check-ins can be reacted to, same as posts and comments. Profile's
-- check-in timeline (Stitch) shows a heart/reaction count per check-in;
-- without this, that count would have nowhere real to come from.
-- Comments stay post-only for now — extending that too would require
-- making comments.post_id nullable, a bigger structural change for less
-- payoff than reactions.

alter table public.reactions add column check_in_id uuid references public.check_ins (id) on delete cascade;

alter table public.reactions drop constraint exactly_one_target;
alter table public.reactions add constraint exactly_one_target check (
  (post_id is not null)::int + (comment_id is not null)::int + (check_in_id is not null)::int = 1
);

create unique index reactions_unique_check_in_reaction
  on public.reactions (user_id, check_in_id, reaction_type) where check_in_id is not null;
create index reactions_check_in_id_idx on public.reactions (check_in_id) where check_in_id is not null;

drop policy "reactions_select_visible" on public.reactions;
create policy "reactions_select_visible"
  on public.reactions for select
  using (
    (post_id is not null and exists (
      select 1 from public.posts p
      where p.id = reactions.post_id
        and p.deleted_at is null
        and public.is_content_visible_to(auth.uid(), p.author_id, p.visibility, p.crew_id)
    ))
    or
    (comment_id is not null and exists (
      select 1 from public.comments c
      join public.posts p on p.id = c.post_id
      where c.id = reactions.comment_id
        and c.deleted_at is null
        and p.deleted_at is null
        and public.is_content_visible_to(auth.uid(), p.author_id, p.visibility, p.crew_id)
    ))
    or
    (check_in_id is not null and exists (
      select 1 from public.check_ins ci
      where ci.id = reactions.check_in_id
        and (ci.user_id = auth.uid() or public.is_content_visible_to(auth.uid(), ci.user_id, ci.visibility, ci.crew_id))
    ))
  );

comment on constraint exactly_one_target on public.reactions is
  'Exactly one of post_id/comment_id/check_in_id must be set — a reaction always targets exactly one kind of content.';
