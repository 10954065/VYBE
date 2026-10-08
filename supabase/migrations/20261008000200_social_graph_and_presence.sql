-- "Friends" and "outside now" for the Stitch screens (home's People Are
-- Outside strip, discover's social-proof chips, profile's "Outside Now"
-- pill). Neither needed new state: "friend" is exactly the mutual-follow
-- case is_content_visible_to() already uses for 'friends' visibility, and
-- "outside now" is derived from real check-in recency — this app has no
-- device-location or live-presence tracking, and none is being added here.

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    a is not null and b is not null and a <> b
    and exists (select 1 from public.follows where follower_id = a and following_id = b)
    and exists (select 1 from public.follows where follower_id = b and following_id = a);
$$;

comment on function public.are_friends is
  'Two profiles are "friends" iff they mutually follow each other — the same definition is_content_visible_to() uses for its friends visibility case. There is no separate friends table.';

-- For a card showing "target" to "viewer": are they already friends, and if
-- not, how many of the viewer's own friends are also friends with target
-- ("2 mutuals")? Scanning the viewer's own follow list keeps this cheap —
-- no full profiles-table scan.
create or replace function public.get_social_proof(viewer uuid, target uuid)
returns table (is_friend boolean, mutual_friend_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    public.are_friends(viewer, target),
    (
      select count(*) from public.follows f
      where f.follower_id = viewer
        and public.are_friends(viewer, f.following_id)
        and public.are_friends(target, f.following_id)
    );
$$;

comment on function public.get_social_proof is
  'is_friend: whether viewer and target already mutually follow each other. mutual_friend_count: how many of the viewer''s own friends are also friends with target.';

-- security invoker (the default, stated explicitly): check_ins RLS still
-- applies, so this only reports "outside now" using evidence the caller
-- could already see directly — it never leaks presence past what a plain
-- select against check_ins would already allow.
create or replace function public.is_outside_now(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.check_ins
    where user_id = p_user_id
      and visibility <> 'only_me'
      and created_at > now() - interval '4 hours'
  );
$$;

comment on function public.is_outside_now is
  'A profile is "outside now" if they have a non-private check-in in the last 4 hours — derived from real check-in activity. There is no live location tracking; security invoker means this only sees what the caller''s own check_ins RLS already allows.';

-- Aggregate counts only (no identities), so these are safe as
-- SECURITY DEFINER — same reasoning as crews.member_count or
-- get_event_attendee_summary being public: a count alone doesn't expose
-- who. 'only_me' check-ins are still excluded out of respect for that
-- explicit choice, even though only a count is at stake.
create or replace function public.get_city_outside_count(p_city_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct ci.user_id)
  from public.check_ins ci
  join public.profiles pr on pr.id = ci.user_id
  where pr.city_id = p_city_id
    and ci.visibility <> 'only_me'
    and ci.created_at > now() - interval '4 hours';
$$;

comment on function public.get_city_outside_count is
  'How many distinct profiles in this city have checked in (non-only_me) in the last 4 hours. Aggregate-only, no identities exposed.';

create or replace function public.get_crew_outside_count(p_crew_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct ci.user_id)
  from public.check_ins ci
  join public.crew_members cm on cm.user_id = ci.user_id and cm.crew_id = p_crew_id and cm.status = 'approved'
  where ci.visibility <> 'only_me'
    and ci.created_at > now() - interval '4 hours';
$$;

comment on function public.get_crew_outside_count is
  'How many approved members of this crew have checked in (non-only_me) in the last 4 hours. Aggregate-only, no identities exposed.';
