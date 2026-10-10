-- Who can see what: the visibility rules from Phases 4, 11, 12 and 13.
begin;
select plan(13);

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

create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
end $$;

create function pg_temp.sees(p_post uuid) returns boolean language sql as $$
  select exists (select 1 from public.posts where id = p_post)
$$;

select pg_temp.make_user('t_author@test.vybe') as author_id \gset
select pg_temp.make_user('t_follower@test.vybe') as follower_id \gset
select pg_temp.make_user('t_stranger@test.vybe') as stranger_id \gset

insert into public.follows (follower_id, following_id) values (:'follower_id', :'author_id');
insert into public.posts (id, author_id, kind, body, visibility) values
  ('a0000000-0000-4000-8000-000000000001', :'author_id', 'text', 'public', 'everyone'),
  ('a0000000-0000-4000-8000-000000000002', :'author_id', 'text', 'followers', 'followers'),
  ('a0000000-0000-4000-8000-000000000003', :'author_id', 'text', 'private', 'only_me');

-- --------------------------------------------------------------- privacy
select pg_temp.act_as(:'stranger_id');
select ok(pg_temp.sees('a0000000-0000-4000-8000-000000000001'), 'a stranger sees a public post');
select ok(not pg_temp.sees('a0000000-0000-4000-8000-000000000002'), 'a stranger does not see a followers-only post');
select pg_temp.act_as(:'follower_id');
select ok(pg_temp.sees('a0000000-0000-4000-8000-000000000002'), 'a follower sees a followers-only post');
select ok(not pg_temp.sees('a0000000-0000-4000-8000-000000000003'), 'a follower does not see an only-me post');
select pg_temp.act_as_anon();
select ok(pg_temp.sees('a0000000-0000-4000-8000-000000000001'), 'an anonymous viewer sees a public post');

-- ------------------------------------------------------------- blocking
reset role;
insert into public.blocks (blocker_id, blocked_id) values (:'author_id', :'stranger_id');
select pg_temp.act_as(:'stranger_id');
select ok(not pg_temp.sees('a0000000-0000-4000-8000-000000000001'), 'a blocked user no longer sees even public posts');
select ok(
  not exists (select 1 from public.profiles where id = :'author_id'),
  'a blocked user cannot see the blocker''s profile'
);
select throws_ok(
  $$insert into public.reactions (user_id, post_id, reaction_type) values (auth.uid(), 'a0000000-0000-4000-8000-000000000001', 'like')$$,
  '42501', null, 'a blocked user cannot react to the blocker''s post'
);

-- ----------------------------------------------------------- suspension
reset role;
delete from public.blocks where blocker_id = :'author_id';
update public.profiles set suspended_at = now() where id = :'author_id';
select pg_temp.act_as(:'follower_id');
select ok(not pg_temp.sees('a0000000-0000-4000-8000-000000000001'), 'a suspended user''s posts are hidden from others');
select pg_temp.act_as(:'author_id');
select ok(not pg_temp.sees('a0000000-0000-4000-8000-000000000001'), '...and from themselves');

-- ------------------------------------------------------------ analytics
reset role;
insert into public.analytics_events (user_id, event_name) values (:'follower_id', 'app_opened');
select pg_temp.act_as(:'follower_id');
select is((select count(*)::int from public.analytics_events), 0, 'users cannot read analytics, even their own');
select throws_ok(
  'select public.get_analytics_overview(7)', '42501', null,
  'users cannot call the admin analytics function'
);
select throws_ok(
  format($$insert into public.analytics_events (user_id, event_name) values (%L, 'app_opened')$$, :'author_id'),
  '42501', null, 'events cannot be attributed to someone else'
);

select * from finish();
rollback;
