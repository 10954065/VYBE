-- Phase 17: snaps and snap streaks. See docs/snaps.md.
--
-- A snap is a photo or a short video sent to friends that can be opened
-- once. It lives in the conversation like any message (so the chat shows
-- "New snap" / "Opened"), but its file sits in its own private bucket and
-- can only be read by the recipient, for two minutes after they open it.
-- Nobody else can read it at any point, the sender included.
--
-- A streak is the Snapchat one: every day both people send each other at
-- least one snap, the streak grows by one; miss a day and it's gone.

-- ---------------------------------------------------------------------------
-- 0. Display names are shown to other people in notifications and pushes,
--    so they can't carry control characters (line breaks that make a name
--    look like a system alert) and are capped at the 60 characters the app
--    already allows. Found by the Phase 17 security review: the streak
--    reminder put a crafted name into every reminder verbatim, and the
--    follow/like/comment pushes (Phase 8) did the same.
-- ---------------------------------------------------------------------------

alter table public.profiles add constraint profiles_display_name_clean check (
  display_name is null
  or (char_length(display_name) between 1 and 60 and btrim(display_name) <> '' and display_name !~ '[[:cntrl:]]')
);

-- New accounts get the same treatment (the sign-up form's name, or the
-- email's local part, which can be up to 64 characters).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_city_id uuid;
  candidate_username text;
begin
  select id into default_city_id from public.cities where slug = 'accra' limit 1;

  candidate_username := left(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_.]', '', 'g'), 21);
  if candidate_username is null or length(candidate_username) < 3 then
    candidate_username := 'vyber';
  end if;
  candidate_username := candidate_username || '_' || substr(new.id::text, 1, 8);

  insert into public.profiles (id, username, display_name, city_id)
  values (
    new.id,
    candidate_username,
    left(nullif(btrim(regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
      '[[:cntrl:]]', '', 'g'
    )), ''), 60),
    default_city_id
  );
  return new;
end;
$$;

-- A person's name as it may appear in someone else's notification: no
-- control characters, at most 40 characters. Every push and notification
-- that names another person goes through this.
create or replace function public.notification_name(p_user uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(btrim(left(regexp_replace(coalesce(p.display_name, p.username), '[[:cntrl:]]', '', 'g'), 40)), '')
  from public.profiles p
  where p.id = p_user;
$$;

revoke execute on function public.notification_name(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Snaps are messages with a few more columns.
-- ---------------------------------------------------------------------------

alter table public.messages drop constraint messages_kind_check;
alter table public.messages add constraint messages_kind_check check (kind in ('text', 'photo', 'snap'));

alter table public.messages
  add column media_type text check (media_type in ('image', 'video')),
  add column media_duration_ms integer check (media_duration_ms is null or media_duration_ms between 1 and 10500),
  -- When the recipient opened it. Snaps only.
  add column opened_at timestamptz,
  -- When the cleanup job deleted the file (it can't be read after opening
  -- either way; this records that the bytes are gone too).
  add column media_purged_at timestamptz;

alter table public.messages drop constraint messages_content;
alter table public.messages add constraint messages_content check (
  (kind = 'text' and body is not null and media_path is null)
  or (kind = 'photo' and media_path is not null)
  or (kind = 'snap' and media_path is not null and media_type is not null and body is null)
);

-- A snap goes to several friends as one file, so the same path can now
-- appear on several messages (one per recipient). Only ever the sender's
-- own upload, which the insert policy already guarantees.
alter table public.messages drop constraint messages_media_path_key;
create index messages_media_path_idx on public.messages (media_path) where media_path is not null;

alter table public.messages drop constraint messages_media_path_check;
alter table public.messages add constraint messages_media_path_check check (
  media_path is null
  or media_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{8,64}\.(jpg|png|webp|mp4|mov)$'
);

grant insert (media_type, media_duration_ms) on public.messages to authenticated;

-- The insert policy learns that a snap's file lives in the snaps bucket.
drop policy "messages_insert_sender" on public.messages;
create policy "messages_insert_sender" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_send_in_conversation(conversation_id)
    and (
      media_path is null
      or (
        split_part(media_path, '/', 1) = (select auth.uid())::text
        and public.is_own_upload(case when kind = 'snap' then 'snaps' else 'chat-media' end, media_path)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 2. The snaps bucket. Photos are re-encoded JPEGs; videos come straight
--    from the camera (10 seconds at 720p), hence the larger limit.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('snaps', 'snaps', false, 26214400, array['image/jpeg', 'video/mp4', 'video/quicktime'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "snaps_objects_insert_own_folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'snaps'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{8,64}\.(jpg|mp4|mov)$'
    and not public.is_suspended((select auth.uid()))
    and public.check_upload_rate('snaps', 30, '5 minutes')
  );

-- The only way to read a snap: be its recipient, and have opened it in the
-- last two minutes (long enough to load and watch a 10-second video). The
-- messages subquery runs under messages' RLS, so it's also limited to the
-- caller's own unblocked conversations. Unopened snaps expire after 30 days.
create policy "snaps_objects_select_recipient_once" on storage.objects for select to authenticated
  using (
    bucket_id = 'snaps'
    and exists (
      select 1 from public.messages m
      where m.media_path = storage.objects.name
        and m.kind = 'snap'
        and m.sender_id <> (select auth.uid())
        and m.opened_at > now() - interval '2 minutes'
    )
  );

-- Senders can take back a snap upload that never got sent.
create policy "snaps_objects_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'snaps'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- 3. Opening a snap: records it (once) and starts the two-minute window.
-- ---------------------------------------------------------------------------

create or replace function public.open_snap(p_message uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_snap public.messages;
begin
  select m.* into v_snap
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where m.id = p_message
    and m.kind = 'snap'
    and m.sender_id <> auth.uid()
    and auth.uid() in (c.user_a, c.user_b)
    -- Definer, so it repeats the rules that hide a conversation
    -- (conversations_select_member) rather than relying on RLS.
    and not public.are_blocked(c.user_a, c.user_b)
    and not public.is_suspended(c.user_a)
    and not public.is_suspended(c.user_b);

  if v_snap.id is null then
    raise exception 'snap_not_found' using errcode = 'P0002';
  end if;
  if v_snap.opened_at is null and v_snap.created_at < now() - interval '30 days' then
    raise exception 'snap_expired' using errcode = '22023';
  end if;
  if v_snap.opened_at is not null and v_snap.opened_at < now() - interval '2 minutes' then
    raise exception 'snap_already_opened' using errcode = '22023';
  end if;

  update public.messages set opened_at = coalesce(opened_at, now())
  where id = p_message
  returning opened_at into v_snap.opened_at;
  return v_snap.opened_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Sending one snap to several friends: one message per recipient, all
--    or nothing. Security invoker, so every message goes through the same
--    RLS, rate limit and suspension checks as a single message would.
-- ---------------------------------------------------------------------------

create or replace function public.send_snap(
  p_recipients uuid[],
  p_media_path text,
  p_media_type text,
  p_width integer default null,
  p_height integer default null,
  p_duration_ms integer default null
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_recipient uuid;
  v_conversation uuid;
  v_count integer := 0;
begin
  if p_recipients is null or cardinality(p_recipients) = 0 then
    raise exception 'no_recipients' using errcode = '22023';
  end if;
  if cardinality(p_recipients) > 15 then
    raise exception 'too_many_recipients' using errcode = '22023';
  end if;

  foreach v_recipient in array (select array_agg(distinct r) from unnest(p_recipients) r) loop
    -- Its own statement, not inside the insert: the insert policy's checks
    -- read a snapshot from the start of their statement, which wouldn't
    -- include a conversation created during it (a first snap would fail).
    v_conversation := public.start_direct_conversation(v_recipient);
    insert into messages (conversation_id, sender_id, kind, media_path, media_type, media_width, media_height, media_duration_ms)
    values (
      v_conversation,
      auth.uid(),
      'snap',
      p_media_path,
      p_media_type,
      p_width,
      p_height,
      p_duration_ms
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Streaks. Days are Accra days (UTC+0, no daylight saving).
-- ---------------------------------------------------------------------------

alter table public.conversations
  add column user_a_last_snap_on date,
  add column user_b_last_snap_on date,
  -- The last day both people snapped each other, and how many days in a row
  -- that's been true up to then.
  add column streak_day date,
  add column streak_count integer not null default 0;

create or replace function public.accra_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Accra')::date;
$$;

create or replace function public.handle_snap_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.accra_today();
  v_conversation public.conversations;
  v_partner_last date;
begin
  if new.kind <> 'snap' then
    return new;
  end if;

  update public.conversations set
    user_a_last_snap_on = case when user_a = new.sender_id then v_today else user_a_last_snap_on end,
    user_b_last_snap_on = case when user_b = new.sender_id then v_today else user_b_last_snap_on end
  where id = new.conversation_id
  returning * into v_conversation;

  v_partner_last := case
    when v_conversation.user_a = new.sender_id then v_conversation.user_b_last_snap_on
    else v_conversation.user_a_last_snap_on
  end;

  -- Both have snapped today, and today hasn't been counted yet.
  if v_partner_last = v_today and v_conversation.streak_day is distinct from v_today then
    update public.conversations set
      streak_count = case when streak_day = v_today - 1 then streak_count + 1 else 1 end,
      streak_day = v_today
    where id = new.conversation_id;
  end if;
  return new;
end;
$$;

create trigger handle_snap_streak
  after insert on public.messages
  for each row execute function public.handle_snap_streak();

-- ---------------------------------------------------------------------------
-- 6. The inbox and the conversation, with snaps and streaks.
-- ---------------------------------------------------------------------------

drop function public.get_inbox();
create function public.get_inbox()
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
  last_message_opened_at timestamptz,
  unread_count bigint,
  unopened_snap_count bigint,
  partner_read_at timestamptz,
  streak_count integer,
  streak_expires_today boolean
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
    last.opened_at,
    (
      select count(*) from messages m
      where m.conversation_id = mine.id
        and m.sender_id <> auth.uid()
        and m.created_at > coalesce(mine.my_read_at, '-infinity')
    ),
    (
      select count(*) from messages m
      where m.conversation_id = mine.id
        and m.sender_id <> auth.uid()
        and m.kind = 'snap'
        and m.opened_at is null
        and m.created_at > now() - interval '30 days'
    ),
    mine.their_read_at,
    case when mine.streak_day >= public.accra_today() - 1 then mine.streak_count else 0 end,
    mine.streak_day = public.accra_today() - 1
  from mine
  join profiles p on p.id = mine.partner
  left join lateral (
    select m.sender_id, m.kind, m.body, m.opened_at
    from messages m
    where m.conversation_id = mine.id
    order by m.created_at desc, m.id desc
    limit 1
  ) last on true
  order by mine.last_message_at desc
  limit 100;
$$;

-- Friends to send a snap to, with each one's streak. Same people as
-- get_message_contacts (everyone who follows you, friends first).
create or replace function public.get_snap_recipients()
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_friend boolean,
  streak_count integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    contact.id,
    contact.username,
    contact.display_name,
    contact.avatar_url,
    contact.is_friend,
    coalesce((
      select case when c.streak_day >= public.accra_today() - 1 then c.streak_count else 0 end
      from conversations c
      where c.user_a = least(auth.uid(), contact.id) and c.user_b = greatest(auth.uid(), contact.id)
    ), 0)
  from public.get_message_contacts() contact
  order by 6 desc, 5 desc, coalesce(contact.display_name, contact.username);
$$;

-- ---------------------------------------------------------------------------
-- 7. "Your streak ends tonight": once a day, in the evening, for streaks
--    that were alive yesterday but haven't been kept up today, remind
--    whoever hasn't snapped yet. Uses the existing streaks preference.
-- ---------------------------------------------------------------------------

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (
    type in (
      'like', 'comment', 'follow', 'crew_activity', 'event_reminder',
      'challenge_completed', 'streak_milestone', 'xp_milestone', 'recommendation',
      'badge_earned', 'snap_streak'
    )
  );

create or replace function public.create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_target_type text,
  p_target_id uuid,
  p_body text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefs public.notification_preferences;
  v_enabled boolean;
  v_actor_name text;
  v_push_body text;
begin
  if p_actor_id is not null and p_actor_id = p_user_id then
    return;
  end if;

  select * into v_prefs from public.notification_preferences where user_id = p_user_id;

  v_enabled := case p_type
    when 'follow' then v_prefs.follows
    when 'like' then v_prefs.likes
    when 'comment' then v_prefs.comments
    when 'crew_activity' then v_prefs.crew_activity
    when 'event_reminder' then v_prefs.event_reminders
    when 'challenge_completed' then v_prefs.challenges
    when 'streak_milestone' then v_prefs.streaks
    when 'snap_streak' then v_prefs.streaks
    when 'xp_milestone' then v_prefs.xp_milestones
    when 'badge_earned' then v_prefs.badges
    when 'recommendation' then v_prefs.recommendations
    else true
  end;

  if v_prefs is not null and v_enabled is false then
    return;
  end if;

  insert into public.notifications (user_id, actor_id, type, target_type, target_id, body)
  values (p_user_id, p_actor_id, p_type, p_target_type, p_target_id, p_body);

  if p_actor_id is not null then
    v_actor_name := public.notification_name(p_actor_id);
  end if;
  v_actor_name := coalesce(v_actor_name, 'Someone');

  v_push_body := coalesce(p_body, case p_type
    when 'follow' then v_actor_name || ' started following you'
    when 'like' then v_actor_name || ' reacted to your ' || coalesce(p_target_type, 'post')
    when 'comment' then v_actor_name || ' commented on your post'
    when 'crew_activity' then 'Crew activity update'
    when 'event_reminder' then 'An event you''re going to starts soon'
    when 'challenge_completed' then 'You completed a challenge!'
    when 'streak_milestone' then 'Streak milestone reached!'
    when 'snap_streak' then 'Your snap streak ends tonight'
    when 'xp_milestone' then 'You leveled up!'
    when 'badge_earned' then 'You earned a new badge!'
    else 'You have a new notification'
  end);

  perform public.send_push_notification(p_user_id, 'VYBE', v_push_body);
end;
$$;

create or replace function public.send_snap_streak_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.accra_today();
  v_row record;
begin
  for v_row in
    select c.id, member.user_id, member.partner_id, member.last_snap_on, c.streak_count
    from public.conversations c
    cross join lateral (
      values (c.user_a, c.user_b, c.user_a_last_snap_on), (c.user_b, c.user_a, c.user_b_last_snap_on)
    ) as member(user_id, partner_id, last_snap_on)
    where c.streak_day = v_today - 1
      and member.last_snap_on is distinct from v_today
      and not public.are_blocked(c.user_a, c.user_b)
      and not exists (
        select 1 from public.notifications n
        where n.user_id = member.user_id
          and n.type = 'snap_streak'
          and n.target_id = c.id
          and n.created_at >= v_today
      )
  loop
    perform public.create_notification(
      v_row.user_id,
      v_row.partner_id,
      'snap_streak',
      'conversation',
      v_row.id,
      format(
        '⏳ Your %s-day streak with %s ends at midnight. Send a snap!',
        v_row.streak_count,
        coalesce(public.notification_name(v_row.partner_id), 'your friend')
      )
    );
  end loop;
end;
$$;

-- 18:00 Accra (= UTC), with six hours left to keep the streak going.
select cron.schedule('send-snap-streak-reminders', '0 18 * * *', $$select public.send_snap_streak_reminders();$$);

-- ---------------------------------------------------------------------------
-- 8. Cleanup. Deleting a file needs the Storage API, not SQL, so the job
--    lives in the web app (/api/cron/purge-media, service role). These two
--    functions tell it what to delete; only the service role can call them.
-- ---------------------------------------------------------------------------

-- Snap files nobody can read any more: opened over 10 minutes ago by every
-- recipient, or unopened for 30 days.
create or replace function public.get_purgeable_snaps(p_limit integer default 500)
returns table (media_path text)
language sql
stable
security definer
set search_path = public
as $$
  select m.media_path
  from public.messages m
  where m.kind = 'snap' and m.media_purged_at is null
  group by m.media_path
  having bool_and(
    m.opened_at < now() - interval '10 minutes'
    or (m.opened_at is null and m.created_at < now() - interval '30 days')
  )
  limit greatest(1, least(p_limit, 1000));
$$;

create or replace function public.mark_snaps_purged(p_paths text[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages set media_purged_at = now()
  where kind = 'snap' and media_path = any (p_paths) and media_purged_at is null;
$$;

-- Uploads never attached to anything after a day: a post or message that
-- failed after uploading, or uploads made straight through the API.
create or replace function public.get_orphaned_uploads(p_limit integer default 500)
returns table (bucket_id text, name text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.bucket_id, o.name
  from storage.objects o
  where o.created_at < now() - interval '1 day'
    and (
      (o.bucket_id = 'post-media' and not exists (select 1 from public.post_media pm where pm.storage_path = o.name))
      or (o.bucket_id = 'chat-media' and not exists (select 1 from public.messages m where m.media_path = o.name))
      or (o.bucket_id = 'snaps' and not exists (select 1 from public.messages m where m.media_path = o.name))
    )
  limit greatest(1, least(p_limit, 1000));
$$;

-- ---------------------------------------------------------------------------
-- 9. Permissions.
-- ---------------------------------------------------------------------------

do $$
declare
  f text;
begin
  -- Internal only.
  foreach f in array array[
    'handle_snap_streak()', 'send_snap_streak_reminders()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;

  -- The cleanup job (service role) only.
  foreach f in array array[
    'get_purgeable_snaps(integer)', 'mark_snaps_purged(text[])', 'get_orphaned_uploads(integer)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;

  -- The app.
  foreach f in array array[
    'open_snap(uuid)', 'send_snap(uuid[], text, text, integer, integer, integer)', 'get_inbox()',
    'get_snap_recipients()', 'accra_today()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. A snap's push says it's a snap (it has no text to preview).
-- ---------------------------------------------------------------------------

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
  v_sender_name := public.notification_name(new.sender_id);

  perform public.send_push_notification(
    v_recipient,
    coalesce(nullif(btrim(v_sender_name), ''), 'VYBE'),
    case new.kind
      when 'photo' then '📷 Photo'
      when 'snap' then case new.media_type when 'video' then '🎥 Sent you a video snap' else '📸 Sent you a snap' end
      else coalesce(left(new.body, 100), 'New message')
    end,
    jsonb_build_object('url', '/messages/' || new.conversation_id)
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. Now that a message's file can live in either of two buckets, a chat
--     photo is only readable through a *photo* message. Otherwise a sender
--     could upload the same file name to both buckets and send it as a snap,
--     and the recipient could read the chat-media copy forever, defeating
--     "opens once".
-- ---------------------------------------------------------------------------

drop policy "chat_media_objects_select_members" on storage.objects;
create policy "chat_media_objects_select_members" on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.messages m
        where m.media_path = storage.objects.name and m.kind = 'photo'
      )
    )
  );
