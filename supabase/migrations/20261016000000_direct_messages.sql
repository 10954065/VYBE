-- Phase 16: private one-to-one messages. See docs/messages.md.
--
-- Who can message whom: you can message anyone who follows you (they chose
-- to hear from you), and once someone has messaged you, you can reply even
-- if you don't follow each other. Blocks always win, and a suspended user's
-- conversations disappear like the rest of their content.

-- ---------------------------------------------------------------------------
-- 1. Tables. One conversation per pair of people, stored with the pair in
--    a fixed order so there can only ever be one. Each side's read position
--    lives on the conversation (it's always exactly two people).
-- ---------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  user_a_read_at timestamptz,
  user_b_read_at timestamptz,
  constraint conversations_pair_ordered check (user_a < user_b),
  constraint conversations_pair_key unique (user_a, user_b)
);

create index conversations_user_b_idx on public.conversations (user_b);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'photo')),
  body text check (body is null or (char_length(body) <= 2000 and btrim(body) <> '')),
  media_path text check (
    media_path is null
    or media_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{8,64}\.(jpg|png|webp)$'
  ),
  media_width integer check (media_width is null or media_width between 1 and 10000),
  media_height integer check (media_height is null or media_height between 1 and 10000),
  created_at timestamptz not null default now(),
  constraint messages_content check (
    (kind = 'text' and body is not null and media_path is null)
    or (kind = 'photo' and media_path is not null)
  ),
  constraint messages_media_path_key unique (media_path)
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc, id desc);
create index messages_sender_created_idx on public.messages (sender_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Rules, as functions the policies and RPCs share.
-- ---------------------------------------------------------------------------

-- The other person in a conversation, or null if p_user isn't in it.
create or replace function public.conversation_partner(p_conversation uuid, p_user uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case when c.user_a = p_user then c.user_b when c.user_b = p_user then c.user_a end
  from public.conversations c
  where c.id = p_conversation;
$$;

create or replace function public.can_message(p_sender uuid, p_recipient uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_sender is not null and p_recipient is not null and p_sender <> p_recipient
    and not public.are_blocked(p_sender, p_recipient)
    and not public.is_suspended(p_sender)
    and exists (
      select 1 from public.profiles
      where id = p_recipient and deleted_at is null and suspended_at is null
    )
    and (
      exists (select 1 from public.follows where follower_id = p_recipient and following_id = p_sender)
      or exists (
        select 1
        from public.conversations c
        join public.messages m on m.conversation_id = c.id
        where c.user_a = least(p_sender, p_recipient)
          and c.user_b = greatest(p_sender, p_recipient)
          and m.sender_id = p_recipient
      )
    );
$$;

comment on function public.can_message is
  'Whether p_sender may message p_recipient: not blocked either way, neither suspended, and the recipient follows the sender or has already messaged them. Internal: callable on any two people, it would reveal who has blocked whom.';

-- What the messages insert policy asks: may the caller send in this
-- conversation? Answers only about the caller.
create or replace function public.can_send_in_conversation(p_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_message(auth.uid(), public.conversation_partner(p_conversation, auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS. Clients never write conversations directly (start_direct_
--    conversation and mark_conversation_read do), and can only insert
--    messages as themselves, into a conversation they're in, to someone
--    they're allowed to message.
-- ---------------------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.conversations from anon;
revoke insert, update, delete on public.conversations from authenticated;
grant select on public.conversations to authenticated;

revoke all on public.messages from anon;
revoke insert, update, delete on public.messages from authenticated;
grant select on public.messages to authenticated;
-- The app picks a new message's id so it can show the message instantly and
-- recognise the same row when Realtime echoes it back. A reused id just
-- fails the primary key.
grant insert (id, conversation_id, sender_id, kind, body, media_path, media_width, media_height)
  on public.messages to authenticated;

create policy "conversations_select_member" on public.conversations for select to authenticated
  using (
    (select auth.uid()) in (user_a, user_b)
    and not public.are_blocked(user_a, user_b)
    and not public.is_suspended(user_a)
    and not public.is_suspended(user_b)
  );

-- Runs under conversations' RLS: members only, nothing once blocked.
create policy "messages_select_member" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id));

create policy "messages_insert_sender" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_send_in_conversation(conversation_id)
    and (
      media_path is null
      or (
        split_part(media_path, '/', 1) = (select auth.uid())::text
        and public.is_own_upload('chat-media', media_path)
      )
    )
  );

create policy "messages_insert_not_suspended" on public.messages as restrictive for insert to authenticated
  with check (not public.is_suspended((select auth.uid())));

create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.enforce_insert_rate_limit('sender_id', '1 minute', '30');

-- ---------------------------------------------------------------------------
-- 4. Photos in chats: a private bucket readable only by the two people in
--    the conversation, through the same RLS chain as the messages.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "chat_media_objects_insert_own_folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{8,64}\.(jpg|png|webp)$'
    and not public.is_suspended((select auth.uid()))
    and public.check_upload_rate('chat-media', 20, '5 minutes')
  );

create policy "chat_media_objects_select_members" on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.messages m where m.media_path = storage.objects.name)
    )
  );

create policy "chat_media_objects_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 5. After a message: bump the conversation, and push to the other person
--    unless they've turned message notifications off. No in-app
--    notification row: unread chats have their own badge.
-- ---------------------------------------------------------------------------

alter table public.notification_preferences
  add column messages boolean not null default true;

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid := public.conversation_partner(new.conversation_id, new.sender_id);
  v_sender_name text;
  v_wants_push boolean;
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;

  select messages into v_wants_push from public.notification_preferences where user_id = v_recipient;
  if v_wants_push is false then
    return new;
  end if;

  -- One push per burst: a run of messages from the same person within 30
  -- seconds notifies once, so nobody can buzz someone's phone 30 times a
  -- minute (the message rate limit alone would allow it).
  if exists (
    select 1 from public.messages m
    where m.conversation_id = new.conversation_id
      and m.sender_id = new.sender_id
      and m.id <> new.id
      and m.created_at > new.created_at - interval '30 seconds'
  ) then
    return new;
  end if;

  -- The sender chooses their own name, and it becomes the push title:
  -- strip control characters and cap it so it can't pose as a system alert
  -- or push the message off screen.
  select left(regexp_replace(coalesce(display_name, username), '[[:cntrl:]]', '', 'g'), 40)
  into v_sender_name
  from public.profiles where id = new.sender_id;

  perform public.send_push_notification(
    v_recipient,
    coalesce(nullif(btrim(v_sender_name), ''), 'VYBE'),
    case new.kind
      when 'photo' then '📷 Photo'
      else coalesce(left(new.body, 100), 'New message')
    end,
    jsonb_build_object('url', '/messages/' || new.conversation_id)
  );
  return new;
end;
$$;

create trigger handle_new_message
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ---------------------------------------------------------------------------
-- 6. RPCs.
-- ---------------------------------------------------------------------------

-- Opens the conversation with p_user, creating it if this is the first
-- message. An existing conversation always opens (to read its history);
-- a new one only when the caller is allowed to message p_user.
create or replace function public.start_direct_conversation(p_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  -- The same rules that hide a conversation (conversations_select_member):
  -- this runs as definer, so it has to repeat them rather than rely on RLS.
  if p_user is null or p_user = v_me or public.are_blocked(v_me, p_user)
     or public.is_suspended(v_me) or public.is_suspended(p_user) then
    raise exception 'cannot_message' using errcode = '42501';
  end if;

  select id into v_id from public.conversations
  where user_a = least(v_me, p_user) and user_b = greatest(v_me, p_user);
  if v_id is not null then
    return v_id;
  end if;

  if not public.can_message(v_me, p_user) then
    raise exception 'cannot_message' using errcode = '42501';
  end if;

  insert into public.conversations (user_a, user_b)
  values (least(v_me, p_user), greatest(v_me, p_user))
  on conflict (user_a, user_b) do update set user_a = excluded.user_a
  returning id into v_id;
  return v_id;
end;
$$;

-- The caller has read everything in the conversation up to now.
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.conversations
  set
    user_a_read_at = case when user_a = auth.uid() then now() else user_a_read_at end,
    user_b_read_at = case when user_b = auth.uid() then now() else user_b_read_at end
  where id = p_conversation
    and auth.uid() in (user_a, user_b);
$$;

-- Whether the Message button should be offered on p_user's profile:
-- either a new conversation is allowed or one already exists.
create or replace function public.can_message_user(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_message(auth.uid(), p_user)
    or exists (
      select 1 from public.conversations
      where user_a = least(auth.uid(), p_user) and user_b = greatest(auth.uid(), p_user)
        and not public.are_blocked(user_a, user_b)
        and not public.is_suspended(user_a)
        and not public.is_suspended(user_b)
    );
$$;

-- The inbox: every conversation with at least one message, newest first,
-- with the last message, the caller's unread count, and when the other
-- person last read it (for "Seen"). Security invoker: conversations' RLS
-- already limits this to the caller's own, unblocked conversations.
create or replace function public.get_inbox()
returns table (
  conversation_id uuid,
  partner_id uuid,
  partner_username text,
  partner_display_name text,
  partner_avatar_url text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  last_message_kind text,
  last_message_body text,
  unread_count bigint,
  partner_read_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with mine as (
    select
      c.*,
      case when c.user_a = auth.uid() then c.user_b else c.user_a end as partner,
      case when c.user_a = auth.uid() then c.user_a_read_at else c.user_b_read_at end as my_read_at,
      case when c.user_a = auth.uid() then c.user_b_read_at else c.user_a_read_at end as their_read_at
    from conversations c
    where c.last_message_at is not null
  )
  select
    mine.id,
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    mine.last_message_at,
    last.sender_id,
    last.kind,
    last.body,
    (
      select count(*) from messages m
      where m.conversation_id = mine.id
        and m.sender_id <> auth.uid()
        and m.created_at > coalesce(mine.my_read_at, '-infinity')
    ),
    mine.their_read_at
  from mine
  join profiles p on p.id = mine.partner
  left join lateral (
    select m.sender_id, m.kind, m.body
    from messages m
    where m.conversation_id = mine.id
    order by m.created_at desc, m.id desc
    limit 1
  ) last on true
  order by mine.last_message_at desc
  limit 100;
$$;

-- How many conversations have something the caller hasn't read (the badge).
create or replace function public.get_unread_conversation_count()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::integer
  from conversations c
  where exists (
    select 1 from messages m
    where m.conversation_id = c.id
      and m.sender_id <> auth.uid()
      and m.created_at > coalesce(
        case when c.user_a = auth.uid() then c.user_a_read_at else c.user_b_read_at end,
        '-infinity'
      )
  );
$$;

-- A conversation's messages, newest first, keyset-paginated like the feed.
create or replace function public.get_messages(
  p_conversation uuid,
  page_size int default 50,
  before_created_at timestamptz default null,
  before_id uuid default null
)
returns setof public.messages
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from messages m
  where m.conversation_id = p_conversation
    and (
      before_created_at is null
      or (m.created_at, m.id) < (before_created_at, before_id)
    )
  order by m.created_at desc, m.id desc
  limit greatest(1, least(page_size, 100));
$$;

-- People the caller can start a chat with: everyone who follows them,
-- friends (mutual follows) first.
create or replace function public.get_message_contacts()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_friend boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    exists (select 1 from follows back where back.follower_id = auth.uid() and back.following_id = p.id)
  from follows f
  join profiles p on p.id = f.follower_id
  where f.following_id = auth.uid()
    and p.deleted_at is null
    and p.suspended_at is null
    and not public.are_blocked(auth.uid(), p.id)
  order by 5 desc, coalesce(p.display_name, p.username)
  limit 200;
$$;

-- Internal: they answer about any two people, so only other functions call them.
revoke execute on function public.conversation_partner(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.can_message(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_message() from public, anon, authenticated;
do $$
declare
  f text;
begin
  foreach f in array array[
    'start_direct_conversation(uuid)', 'mark_conversation_read(uuid)', 'can_message_user(uuid)',
    'can_send_in_conversation(uuid)',
    'get_inbox()', 'get_unread_conversation_count()', 'get_messages(uuid, int, timestamptz, uuid)',
    'get_message_contacts()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Live delivery. Realtime only sends a change to subscribers whose RLS
--    lets them read the row, so each person only hears about their own
--    conversations.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages, public.conversations;
