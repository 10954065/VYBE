-- Regression tests for the privilege-escalation holes closed in
-- 20261014000000_security_hardening.sql. Each "attack" here succeeded
-- through the real API before that migration (see docs/security.md).
begin;
select plan(20);

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

select pg_temp.make_user('t_owner@test.vybe') as owner_id \gset
select pg_temp.make_user('t_intruder@test.vybe') as intruder_id \gset

-- Fixtures, created as the server.
insert into public.crews (id, name, slug, category, creator_id, privacy)
values ('11111111-1111-4111-8111-111111111111', 'T Private', 't-private', 'other', :'owner_id', 'private'),
       ('22222222-2222-4222-8222-222222222222', 'T Mine', 't-mine', 'other', :'intruder_id', 'public');

-- ---------------------------------------------------------------- profiles
update public.profiles set suspended_at = now(), suspended_reason = 'test' where id = :'intruder_id';
select pg_temp.act_as(:'intruder_id');

select throws_ok(
  format($$update public.profiles set suspended_at = null where id = %L$$, :'intruder_id'),
  '42501', null, 'a suspended user cannot clear their own suspension'
);
select throws_ok(
  format($$update public.profiles set onboarding_completed_at = null where id = %L$$, :'intruder_id'),
  '42501', null, 'onboarding state is server-owned'
);
select lives_ok(
  format($$update public.profiles set bio = 'hello' where id = %L$$, :'intruder_id'),
  'editable profile fields can still be updated'
);
select throws_ok(
  format($$insert into public.profiles (id, username) values (%L, 'sneaky_user')$$, gen_random_uuid()),
  '42501', null, 'profiles cannot be inserted from the API'
);
reset role;
update public.profiles set suspended_at = null, suspended_reason = null where id = :'intruder_id';
select pg_temp.act_as(:'intruder_id');

-- ------------------------------------------------------------ crew_members
select throws_ok(
  format($$insert into public.crew_members (crew_id, user_id, role) values ('11111111-1111-4111-8111-111111111111', %L, 'owner')$$, :'intruder_id'),
  '42501', null, 'cannot join a crew with a chosen role (was: auto-approved owner of a private crew)'
);
select lives_ok(
  format($$insert into public.crew_members (crew_id, user_id) values ('11111111-1111-4111-8111-111111111111', %L)$$, :'intruder_id'),
  'joining with just crew and user still works'
);
reset role;
select is(
  (select status || '/' || role from public.crew_members where crew_id = '11111111-1111-4111-8111-111111111111' and user_id = :'intruder_id'),
  'pending/member', 'joining a private crew is a pending membership request'
);
select pg_temp.act_as(:'intruder_id');

-- The intruder owns their own crew; moving that membership row into the
-- owner's crew was the original hijack.
select throws_ok(
  format($$update public.crew_members set crew_id = '11111111-1111-4111-8111-111111111111'
           where crew_id = '22222222-2222-4222-8222-222222222222' and user_id = %L$$, :'intruder_id'),
  '42501', null, 'cannot move a membership into another crew'
);
select throws_ok(
  $$insert into public.crews (name, slug, category, creator_id, privacy, member_count)
    values ('Fake Big Crew', 'fake-big', 'other', auth.uid(), 'public', 5000)$$,
  '42501', null, 'crew member_count cannot be set by the client'
);
select throws_ok(
  $$update public.crews set member_count = 5000 where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'crew member_count cannot be updated by the client'
);
select lives_ok(
  $$update public.crews set description = 'updated' where id = '22222222-2222-4222-8222-222222222222'$$,
  'crew admins can still edit descriptive fields'
);

-- The owner approves the request; an admin can't hand out ownership.
select pg_temp.act_as(:'owner_id');
select lives_ok(
  format($$update public.crew_members set status = 'approved'
           where crew_id = '11111111-1111-4111-8111-111111111111' and user_id = %L$$, :'intruder_id'),
  'a crew owner can approve a pending member'
);
select throws_ok(
  format($$update public.crew_members set role = 'owner'
           where crew_id = '11111111-1111-4111-8111-111111111111' and user_id = %L$$, :'intruder_id'),
  '42501', null, 'nobody can be promoted to owner through the API'
);

-- -------------------------------------------------------------- businesses
select throws_ok(
  $$insert into public.businesses (name, slug, category, owner_id, verified) values ('Fake Co', 'fake-co', 'other', auth.uid(), true)$$,
  '42501', null, 'a business cannot be created already verified'
);

-- ----------------------------------------------------------------- reports
select pg_temp.act_as(:'intruder_id');
select throws_ok(
  format($$insert into public.reports (reporter_id, target_type, target_id, category, status)
           values (auth.uid(), 'user', %L, 'spam', 'dismissed')$$, :'owner_id'),
  '42501', null, 'a report cannot be filed already dismissed'
);
select lives_ok(
  format($$insert into public.reports (reporter_id, target_type, target_id, category, details)
           values (auth.uid(), 'user', %L, 'spam', 'test')$$, :'owner_id'),
  'filing a normal report still works'
);

-- ----------------------------------------------------------- notifications
reset role;
insert into public.notifications (user_id, type, body) values (:'intruder_id', 'follow', 'original');
select pg_temp.act_as(:'intruder_id');
select throws_ok(
  $$update public.notifications set body = 'forged' where user_id = auth.uid()$$,
  '42501', null, 'notification content is server-owned'
);
select lives_ok(
  $$update public.notifications set read_at = now() where user_id = auth.uid()$$,
  'notifications can still be marked read'
);

-- -------------------------------------------------------- event attendance
reset role;
insert into public.events (id, title, slug, category, organizer_id, start_at, visibility)
values ('33333333-3333-4333-8333-333333333333', 'T Event', 't-event', 'other', :'owner_id', now() + interval '1 day', 'everyone');
select pg_temp.act_as(:'intruder_id');
select throws_ok(
  $$insert into public.event_attendees (event_id, user_id, status) values ('33333333-3333-4333-8333-333333333333', auth.uid(), 'checked_in')$$,
  '42501', null, 'cannot RSVP as already checked in (attendance XP)'
);
select lives_ok(
  $$insert into public.event_attendees (event_id, user_id, status) values ('33333333-3333-4333-8333-333333333333', auth.uid(), 'going')$$,
  'a normal RSVP still works'
);

select * from finish();
rollback;
