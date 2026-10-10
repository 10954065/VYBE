-- Suspended users can't write; rate limits hold; clients can't backdate.
begin;
select plan(14);

create function pg_temp.make_user(p_email text) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}');
  update public.profiles set onboarding_completed_at = now() where id = v_id;
  return v_id;
end $$;

create function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end $$;

select pg_temp.make_user('t_writer@test.vybe') as writer_id \gset
select pg_temp.make_user('t_other@test.vybe') as other_id \gset
insert into public.posts (id, author_id, kind, body, visibility)
values ('44444444-4444-4444-8444-444444444444', :'other_id', 'text', 'someone else''s post', 'everyone');

-- ------------------------------------------------------------- suspension
update public.profiles set suspended_at = now(), suspended_reason = 'test' where id = :'writer_id';
select pg_temp.act_as(:'writer_id');

select throws_ok(
  $$insert into public.posts (author_id, kind, body, visibility) values (auth.uid(), 'text', 'still here', 'everyone')$$,
  '42501', null, 'a suspended user cannot post'
);
select throws_ok(
  $$insert into public.comments (post_id, author_id, body) values ('44444444-4444-4444-8444-444444444444', auth.uid(), 'hi')$$,
  '42501', null, 'a suspended user cannot comment'
);
select throws_ok(
  $$insert into public.reactions (user_id, post_id, reaction_type) values (auth.uid(), '44444444-4444-4444-8444-444444444444', 'like')$$,
  '42501', null, 'a suspended user cannot react'
);
select throws_ok(
  format($$insert into public.follows (follower_id, following_id) values (auth.uid(), %L)$$, :'other_id'),
  '42501', null, 'a suspended user cannot follow'
);
select is(
  (select suspended_reason from public.profiles where id = auth.uid()),
  'test', 'a suspended user can still read their own profile (the app shows the reason)'
);

reset role;
update public.profiles set suspended_at = null, suspended_reason = null where id = :'writer_id';
select pg_temp.act_as(:'writer_id');
select lives_ok(
  $$insert into public.comments (post_id, author_id, body) values ('44444444-4444-4444-8444-444444444444', auth.uid(), 'back again')$$,
  'once reinstated, the user can write again'
);

-- -------------------------------------------------------------- timestamps
select lives_ok(
  $$insert into public.posts (id, author_id, kind, body, visibility, created_at)
    values ('55555555-5555-4555-8555-555555555555', auth.uid(), 'text', 'backdated?', 'everyone', '2020-01-01')$$,
  'inserting with a client created_at is accepted'
);
select ok(
  (select created_at > now() - interval '1 minute' from public.posts where id = '55555555-5555-4555-8555-555555555555'),
  '...but created_at is stamped by the server'
);

-- A backdated check-in used to dodge the 120-second check-in limit.
select lives_ok(
  $$insert into public.check_ins (user_id, place_id, visibility)
    values (auth.uid(), (select id from public.places order by name limit 1), 'followers')$$,
  'a first check-in works'
);
select throws_like(
  $$insert into public.check_ins (user_id, place_id, visibility, created_at)
    values (auth.uid(), (select id from public.places order by name offset 1 limit 1), 'followers', now() - interval '1 hour')$$,
  '%check_in_rate_limited%', 'a backdated second check-in is still rate limited'
);

-- ------------------------------------------------------------ rate limits
-- One post exists already (above); the limit is 10 per 5 minutes.
select lives_ok(
  $$insert into public.posts (author_id, kind, body, visibility)
    select auth.uid(), 'text', 'post ' || n, 'everyone' from generate_series(1, 9) n$$,
  'up to 10 posts in 5 minutes are fine'
);
select throws_like(
  $$insert into public.posts (author_id, kind, body, visibility) values (auth.uid(), 'text', 'one too many', 'everyone')$$,
  '%rate_limited%', 'the 11th post in 5 minutes is rejected'
);
select throws_like(
  $$insert into public.comments (post_id, author_id, body)
    select '44444444-4444-4444-8444-444444444444', auth.uid(), 'c' || n from generate_series(1, 15) n$$,
  '%rate_limited%', 'more than 15 comments a minute is rejected'
);

-- Anonymous analytics have no actor, so they're not limited by user.
reset role;
select set_config('role', 'anon', true);
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select lives_ok(
  $$insert into public.analytics_events (event_name) select 'app_opened' from generate_series(1, 600)$$,
  'anonymous analytics are not rate limited per user'
);

select * from finish();
rollback;
