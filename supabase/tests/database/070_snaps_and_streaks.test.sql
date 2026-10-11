-- Snaps and snap streaks (Phase 17): a snap can be opened once, only by
-- its recipient; streaks count days both people snapped each other.
begin;
select plan(35);

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

create function pg_temp.upload(p_owner uuid, p_name text) returns void language sql as $$
  insert into storage.objects (bucket_id, name, owner, owner_id) values ('snaps', p_name, p_owner, p_owner::text)
$$;

create function pg_temp.can_read(p_name text) returns boolean language sql as $$
  select exists (select 1 from storage.objects where bucket_id = 'snaps' and name = p_name)
$$;

create function pg_temp.snap(p_from uuid, p_to uuid, p_file text) returns void language plpgsql as $$
begin
  perform pg_temp.upload(p_from, p_from || '/' || p_file);
  perform pg_temp.act_as(p_from);
  perform public.send_snap(array[p_to], p_from || '/' || p_file, 'image');
  reset role;
end $$;

select pg_temp.make_user('s_alice@test.vybe') as alice \gset
select pg_temp.make_user('s_bob@test.vybe') as bob \gset
select pg_temp.make_user('s_carol@test.vybe') as carol \gset
insert into public.follows (follower_id, following_id) values (:'alice', :'bob'), (:'bob', :'alice');

select :'alice' || '/firstsnap01.jpg' as snap_path \gset
select pg_temp.upload(:'alice', :'snap_path');

-- ------------------------------------------------------------- sending
select pg_temp.act_as(:'alice');
select is(public.send_snap(array[:'bob'::uuid], :'snap_path', 'image', 1080, 1920), 1, 'a snap goes to a friend');
select ok(not pg_temp.can_read(:'snap_path'), 'the sender cannot view their own snap once sent');
select throws_ok(
  format($$select public.send_snap(array[%L::uuid, %L::uuid], %L, 'image')$$, :'bob', :'carol', :'snap_path'),
  '42501', 'cannot_message', 'a snap cannot go to someone who does not follow you'
);
select is(
  (select count(*)::int from public.messages where kind = 'snap' and sender_id = :'alice'), 1,
  '...and a refused recipient sends it to nobody (all or nothing)'
);
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, kind, media_path, media_type) values ((select id from public.conversations where %1$L::uuid in (user_a, user_b) limit 1), %1$L, 'snap', %2$L, 'image')$$, :'alice', :'bob' || '/notmine0001.jpg'),
  '42501', null, 'nobody can send a snap someone else uploaded'
);

select id as snap_id from public.messages where kind = 'snap' and sender_id = :'alice' \gset

-- ------------------------------------------------------------- opening
select pg_temp.act_as(:'bob');
select is((select opened_at from public.messages where id = :'snap_id'), null, 'the recipient sees an unopened snap');
select ok(not pg_temp.can_read(:'snap_path'), 'the file is unreadable until the snap is opened');
select ok(public.open_snap(:'snap_id') is not null, 'the recipient opens it');
select ok(pg_temp.can_read(:'snap_path'), '...and can then load the file');
select lives_ok(format('select public.open_snap(%L)', :'snap_id'), 'reopening within the viewing window works (e.g. after a reload)');

-- A chat-media file sharing the snap's name must not become readable
-- through the snap (it would outlive the snap's one viewing).
reset role;
insert into storage.objects (bucket_id, name, owner, owner_id) values ('chat-media', :'snap_path', :'alice', :'alice');
select pg_temp.act_as(:'bob');
select ok(
  not exists (select 1 from storage.objects where bucket_id = 'chat-media' and name = :'snap_path'),
  'a snap does not unlock a same-named file in the chat-photo bucket'
);

select pg_temp.act_as(:'carol');
select throws_ok(format('select public.open_snap(%L)', :'snap_id'), 'P0002', 'snap_not_found', 'outsiders cannot open it');
select ok(not pg_temp.can_read(:'snap_path'), '...or load the file');

select pg_temp.act_as(:'alice');
select throws_ok(format('select public.open_snap(%L)', :'snap_id'), 'P0002', 'snap_not_found', 'the sender cannot open their own snap');
select throws_ok(
  format($$update public.messages set opened_at = null where id = %L$$, :'snap_id'),
  '42501', null, 'nobody can mark a snap unopened again'
);

reset role;
update public.messages set opened_at = now() - interval '3 minutes' where id = :'snap_id';
select pg_temp.act_as(:'bob');
select ok(not pg_temp.can_read(:'snap_path'), 'two minutes after opening, the file is gone for good');
select throws_ok(format('select public.open_snap(%L)', :'snap_id'), '22023', 'snap_already_opened', '...and the snap cannot be reopened');

-- ------------------------------------------------------------- cleanup
select throws_ok('select * from public.get_purgeable_snaps()', '42501', null, 'the app cannot call the cleanup job''s functions');
reset role;
update public.messages set opened_at = now() - interval '11 minutes' where id = :'snap_id';
set local role service_role;
-- Only this test's snaps are looked at: the database may hold others.
select ok(
  :'snap_path' in (select media_path from public.get_purgeable_snaps(1000)),
  'the cleanup job finds snaps opened over ten minutes ago'
);
reset role;

-- ------------------------------------------------------------- streaks
select id as convo from public.conversations
where user_a = least(:'alice'::uuid, :'bob'::uuid) and user_b = greatest(:'alice'::uuid, :'bob'::uuid) \gset
select pg_temp.snap(:'bob', :'alice', 'bobsnap0001.jpg');
select is(
  (select streak_count from public.conversations where id = :'convo'), 1,
  'both snapping each other today starts a streak'
);
select pg_temp.snap(:'alice', :'bob', 'alicesnap02.jpg');
select is(
  (select streak_count from public.conversations where id = :'convo'), 1,
  'more snaps the same day do not count twice'
);

-- Yesterday they were on day 4.
update public.conversations set streak_count = 4, streak_day = public.accra_today() - 1,
  user_a_last_snap_on = public.accra_today() - 1, user_b_last_snap_on = public.accra_today() - 1
where id = :'convo';
select pg_temp.act_as(:'alice');
select is(
  (select streak_count from public.get_inbox() where conversation_id = :'convo'), 4,
  'yesterday''s streak is still alive today'
);
select ok(
  (select streak_expires_today from public.get_inbox() where conversation_id = :'convo'),
  '...and flagged as ending tonight'
);
reset role;
select pg_temp.snap(:'alice', :'bob', 'alicesnap03.jpg');
select is((select streak_count from public.conversations where id = :'convo'), 4, 'one side snapping is not enough');

-- The evening reminder goes to whoever hasn't snapped yet today. Alice's
-- name appears in Bob's reminder, so it's a long one, to check the cap.
update public.profiles set display_name = repeat('A', 60) where id = :'alice';
select public.send_snap_streak_reminders();
select public.send_snap_streak_reminders();
select is(
  (select count(*)::int from public.notifications where type = 'snap_streak' and user_id = :'bob'), 1,
  'the one who has not snapped today is reminded, once'
);
select is(
  (select count(*)::int from public.notifications where type = 'snap_streak' and user_id = :'alice'), 0,
  'the one who already snapped is not'
);
select ok(
  (
    select body like '%' || repeat('A', 40) || ' ends%' and body not like '%' || repeat('A', 41) || '%'
    from public.notifications where type = 'snap_streak' and user_id = :'bob'
  ),
  'the other person''s name in a reminder is capped at 40 characters'
);

select pg_temp.snap(:'bob', :'alice', 'bobsnap0002.jpg');
select is((select streak_count from public.conversations where id = :'convo'), 5, 'both snapping again grows the streak to 5');

-- A missed day ends it.
update public.conversations set streak_count = 9, streak_day = public.accra_today() - 2,
  user_a_last_snap_on = public.accra_today() - 2, user_b_last_snap_on = public.accra_today() - 2
where id = :'convo';
select pg_temp.act_as(:'bob');
select is(
  (select streak_count from public.get_inbox() where conversation_id = :'convo'), 0,
  'a streak with a missed day shows as gone'
);
reset role;
select pg_temp.snap(:'alice', :'bob', 'alicesnap04.jpg');
select pg_temp.snap(:'bob', :'alice', 'bobsnap0003.jpg');
select is((select streak_count from public.conversations where id = :'convo'), 1, '...and starts again from 1');

-- ---------------------------------------------------------------- video
select :'alice' || '/videosnap01.mp4' as video_path \gset
select pg_temp.upload(:'alice', :'video_path');
select pg_temp.act_as(:'alice');
select is(
  public.send_snap(array[:'bob'::uuid], :'video_path', 'video', 720, 1280, 9800), 1,
  'a video snap of up to 10 seconds sends'
);
select throws_ok(
  format($$select public.send_snap(array[%L::uuid], %L, 'video', 720, 1280, 30000)$$, :'bob', :'video_path'),
  '23514', null, 'a video snap longer than 10 seconds is refused'
);

-- ----------------------------------------------------------- suspension
select id as video_snap from public.messages where media_path = :'video_path' \gset
reset role;
update public.profiles set suspended_at = now() where id = :'alice';
select pg_temp.act_as(:'bob');
select throws_ok(
  format('select public.open_snap(%L)', :'video_snap'), 'P0002', 'snap_not_found',
  'a suspended person''s snaps cannot be opened (their conversations disappear)'
);
reset role;
update public.profiles set suspended_at = null where id = :'alice';

-- --------------------------------------------------------- display names
-- Names appear in other people's notifications, so they can't pose as a
-- system message.
select pg_temp.act_as(:'alice');
select throws_ok(
  $$update public.profiles set display_name = E'VYBE Security\nYour account is suspended' where id = auth.uid()$$,
  '23514', null, 'a display name cannot contain line breaks or other control characters'
);
select throws_ok(
  format($$update public.profiles set display_name = %L where id = auth.uid()$$, repeat('x', 61)),
  '23514', null, 'a display name is at most 60 characters'
);

select * from finish();
rollback;
