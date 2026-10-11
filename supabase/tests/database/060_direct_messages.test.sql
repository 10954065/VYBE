-- Direct messages (Phase 16): who can start a chat, read it, reply, and
-- share photos in it.
begin;
select plan(36);

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
  insert into storage.objects (bucket_id, name, owner, owner_id) values ('chat-media', p_name, p_owner, p_owner::text)
$$;

select pg_temp.make_user('m_alice@test.vybe') as alice \gset
select pg_temp.make_user('m_bob@test.vybe') as bob \gset
select pg_temp.make_user('m_carol@test.vybe') as carol \gset

-- Bob follows Alice; nobody follows Carol, and Carol follows nobody.
insert into public.follows (follower_id, following_id) values (:'bob', :'alice');

-- ------------------------------------------------------- starting a chat
select pg_temp.act_as(:'alice');
select public.start_direct_conversation(:'bob') as convo \gset
select ok(:'convo' is not null, 'you can message someone who follows you');
select is(public.start_direct_conversation(:'bob'), :'convo'::uuid, 'there is only ever one conversation per pair');
select ok(public.can_message_user(:'bob'), 'the profile offers Message to someone who follows you');

select pg_temp.act_as(:'carol');
select throws_ok(
  format('select public.start_direct_conversation(%L)', :'alice'),
  '42501', 'cannot_message', 'a stranger cannot start a chat with someone who does not follow them'
);
select ok(not public.can_message_user(:'alice'), '...and is not offered the Message button');
select throws_ok(
  format('select public.can_message(%L, %L)', :'alice', :'bob'),
  '42501', null, 'nobody can ask whether two other people can message (it would reveal blocks)'
);
select throws_ok(
  format('insert into public.conversations (user_a, user_b) values (least(%1$L::uuid, %2$L::uuid), greatest(%1$L::uuid, %2$L::uuid))', :'carol', :'alice'),
  '42501', null, 'conversations cannot be created directly'
);

-- ----------------------------------------------------------------- texting
select pg_temp.act_as(:'bob');
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hey')$$, :'convo', :'bob'),
  '42501', null, 'you cannot message someone who does not follow you, even in an existing conversation'
);

select pg_temp.act_as(:'alice');
select lives_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'Outside tonight?')$$, :'convo', :'alice'),
  'a member sends a message'
);
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'forged')$$, :'convo', :'bob'),
  '42501', null, 'nobody can send as someone else'
);
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, body, created_at) values (%L, %L, 'backdated', now() - interval '1 day')$$, :'convo', :'alice'),
  '42501', null, 'message timestamps are set by the server'
);
select throws_ok(
  format($$update public.messages set body = 'edited' where conversation_id = %L$$, :'convo'),
  '42501', null, 'messages cannot be edited'
);

select pg_temp.act_as(:'bob');
select lives_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'Yes! Osu?')$$, :'convo', :'bob'),
  'once they have messaged you, you can reply'
);
select is((select count(*)::int from public.messages where conversation_id = :'convo'), 2, 'members read the conversation');

select pg_temp.act_as(:'carol');
select is((select count(*)::int from public.messages where conversation_id = :'convo'), 0, 'outsiders read nothing');
select is((select count(*)::int from public.conversations), 0, '...and do not see the conversation');
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'hi both')$$, :'convo', :'carol'),
  '42501', null, 'outsiders cannot post into a conversation'
);

-- ----------------------------------------------------------- read receipts
select pg_temp.act_as(:'bob');
select is((select unread_count::int from public.get_inbox() where conversation_id = :'convo'), 1, 'the inbox counts unread messages from the other person');
select is(public.get_unread_conversation_count(), 1, 'the badge counts conversations with something unread');
select public.mark_conversation_read(:'convo');
select is((select unread_count::int from public.get_inbox() where conversation_id = :'convo'), 0, 'reading the conversation clears its unread count');

select pg_temp.act_as(:'alice');
select ok(
  (select partner_read_at is not null from public.get_inbox() where conversation_id = :'convo'),
  'the sender can see that it was read'
);
reset role;
update public.conversations set user_a_read_at = '2000-01-01', user_b_read_at = '2000-01-01' where id = :'convo';
select pg_temp.act_as(:'alice');
select public.mark_conversation_read(:'convo');
reset role;
select is(
  (
    select case when user_a = :'alice'::uuid then user_b_read_at else user_a_read_at end
    from public.conversations where id = :'convo'
  ),
  '2000-01-01'::timestamptz,
  'reading a conversation moves only your own read position, never the other person''s'
);

-- ------------------------------------------------------------------ photos
select :'alice' || '/chatphoto123.jpg' as alice_photo \gset
select :'bob' || '/bobsphoto123.jpg' as bob_photo \gset
select pg_temp.upload(:'alice', :'alice_photo');
select pg_temp.upload(:'bob', :'bob_photo');

select pg_temp.act_as(:'alice');
select lives_ok(
  format($$insert into public.messages (conversation_id, sender_id, kind, media_path) values (%L, %L, 'photo', %L)$$, :'convo', :'alice', :'alice_photo'),
  'a member sends a photo they uploaded'
);
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, kind, media_path) values (%L, %L, 'photo', %L)$$, :'convo', :'alice', :'bob_photo'),
  '42501', null, 'nobody can send a photo someone else uploaded'
);

select pg_temp.act_as(:'bob');
select ok(exists (select 1 from storage.objects where name = :'alice_photo'), 'the other member can read a chat photo');
select pg_temp.act_as(:'carol');
select ok(not exists (select 1 from storage.objects where name = :'alice_photo'), 'outsiders cannot read a chat photo');

-- ----------------------------------------------------------- upload limit
reset role;
select pg_temp.make_user('chat_media_uploader@test.vybe') as uploader \gset
select pg_temp.act_as(:'uploader');
select lives_ok(
  format($q$do $do$ begin for i in 1..20 loop
    insert into storage.objects (bucket_id, name, owner_id) values ('chat-media', %1$L || '/burst' || lpad(i::text, 6, '0') || '.jpg', %1$L);
  end loop; end $do$$q$, :'uploader'),
  '20 uploads in a few minutes are fine'
);
select throws_ok(
  format($$insert into storage.objects (bucket_id, name, owner_id) values ('chat-media', %1$L || '/burst999999.jpg', %1$L)$$, :'uploader'),
  'P0001', 'rate_limited', 'the next upload in the same window is refused'
);
reset role;

-- ------------------------------------------------------------------- push
-- Pushes leave through pg_net's queue; counting it shows what would be sent.
insert into public.push_tokens (user_id, token, platform) values (:'bob', 'ExponentPushToken[m_bob_test]', 'ios');
update public.profiles set display_name = E'VYBE Security\nAlert: verify your account right now please' where id = :'alice';
-- The earlier messages were a while ago, so the next one starts a new burst.
update public.messages set created_at = now() - interval '1 hour' where conversation_id = :'convo';
select count(*) as pushes_before from net.http_request_queue \gset
select pg_temp.act_as(:'alice');
insert into public.messages (conversation_id, sender_id, body) values (:'convo', :'alice', 'one');
insert into public.messages (conversation_id, sender_id, body) values (:'convo', :'alice', 'two');
insert into public.messages (conversation_id, sender_id, body) values (:'convo', :'alice', 'three');
reset role;
select is(
  (select count(*) from net.http_request_queue) - :'pushes_before'::bigint, 1::bigint,
  'a burst of messages sends one push, not one per message'
);
select ok(
  (
    select convert_from(body, 'UTF8')::jsonb ->> 'title' !~ '[[:cntrl:]]'
       and char_length(convert_from(body, 'UTF8')::jsonb ->> 'title') <= 40
    from net.http_request_queue order by id desc limit 1
  ),
  'the sender''s name in a push title is stripped of line breaks and capped'
);

-- ---------------------------------------------------------------- blocking
insert into public.blocks (blocker_id, blocked_id) values (:'alice', :'bob');
select pg_temp.act_as(:'bob');
select is((select count(*)::int from public.conversations), 0, 'a blocked conversation disappears');
select ok(not exists (select 1 from storage.objects where name = :'alice_photo'), '...along with its photos');
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'why?')$$, :'convo', :'bob'),
  '42501', null, 'nobody can message across a block'
);

-- -------------------------------------------------------------- suspension
reset role;
delete from public.blocks where blocker_id = :'alice';
update public.profiles set suspended_at = now() where id = :'alice';
select pg_temp.act_as(:'alice');
select throws_ok(
  format($$insert into public.messages (conversation_id, sender_id, body) values (%L, %L, 'still here')$$, :'convo', :'alice'),
  '42501', null, 'a suspended user cannot send messages'
);
select pg_temp.act_as(:'bob');
select ok(not public.can_message_user(:'alice'), 'a suspended person''s profile does not offer Message');
select throws_ok(
  format('select public.start_direct_conversation(%L)', :'alice'),
  '42501', 'cannot_message', '...and their conversation cannot be reopened'
);

select * from finish();
rollback;
