-- Photo posts (Phase 15): who can upload, attach and see a photo.
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

-- Stands in for an upload through the Storage API (which writes this row).
create function pg_temp.upload(p_owner uuid, p_name text) returns void language sql as $$
  insert into storage.objects (bucket_id, name, owner, owner_id)
  values ('post-media', p_name, p_owner, p_owner::text)
$$;

create function pg_temp.can_read(p_name text) returns boolean language sql as $$
  select exists (select 1 from storage.objects where bucket_id = 'post-media' and name = p_name)
$$;

select pg_temp.make_user('p_author@test.vybe') as author_id \gset
select pg_temp.make_user('p_follower@test.vybe') as follower_id \gset
select pg_temp.make_user('p_stranger@test.vybe') as stranger_id \gset

insert into public.follows (follower_id, following_id) values (:'follower_id', :'author_id');

select :'author_id' || '/public-photo-1.jpg' as public_photo \gset
select :'author_id' || '/followers-photo.jpg' as followers_photo \gset
select :'author_id' || '/never-uploaded.jpg' as missing_photo \gset
select :'stranger_id' || '/strangers-own.jpg' as strangers_photo \gset

select pg_temp.upload(:'author_id', :'public_photo');
select pg_temp.upload(:'author_id', :'followers_photo');
select pg_temp.upload(:'stranger_id', :'strangers_photo');

-- ------------------------------------------------------------- creating
select pg_temp.act_as(:'author_id');

select public.create_post('Golden hour', 'everyone', null,
  jsonb_build_array(jsonb_build_object('path', :'public_photo', 'width', 1600, 'height', 1200))) as public_post \gset
select is(
  (select kind from public.posts where id = :'public_post'), 'image',
  'a post with a photo is created as an image post'
);
select is(
  (select count(*)::int from public.post_media where post_id = :'public_post'), 1,
  '...with its photo attached'
);

select public.create_post(null, 'followers', null,
  jsonb_build_array(jsonb_build_object('path', :'followers_photo'))) as followers_post \gset
select ok(:'followers_post' is not null, 'a photo post needs no caption');

select public.create_post('Just words', 'everyone', null, '[]'::jsonb) as text_post \gset
select is(
  (select kind from public.posts where id = :'text_post'), 'text',
  'a post without photos is still a text post'
);

select throws_ok(
  format($$select public.create_post('Mine now', 'everyone', null, '[{"path": "%s"}]'::jsonb)$$, :'strangers_photo'),
  '42501', null, 'nobody can attach a photo someone else uploaded'
);
select throws_ok(
  format($$select public.create_post('Ghost', 'everyone', null, '[{"path": "%s"}]'::jsonb)$$, :'missing_photo'),
  '42501', null, 'a post cannot reference a photo that was never uploaded'
);
select throws_ok(
  format(
    $$select public.create_post('Too many', 'everyone', null, '[{"path": "%1$s"}, {"path": "%1$s"}, {"path": "%1$s"}, {"path": "%1$s"}, {"path": "%1$s"}]'::jsonb)$$,
    :'public_photo'
  ),
  '22023', 'too_many_photos', 'a post has at most 4 photos'
);
select throws_ok(
  $$select public.create_post('   ', 'everyone', null, '[]'::jsonb)$$,
  '22023', 'empty_post', 'a post needs a caption or a photo'
);
select throws_ok(
  format($$update public.post_media set storage_path = '%s' where post_id = '%s'$$, :'strangers_photo', :'public_post'),
  '42501', null, 'attached photos cannot be swapped afterwards'
);

-- ------------------------------------------------------------- uploading
select throws_ok(
  format($$insert into storage.objects (bucket_id, name, owner_id) values ('post-media', '%s/planted.jpg', '%s')$$, :'stranger_id', :'author_id'),
  '42501', null, 'nobody can upload into someone else''s folder'
);
select throws_ok(
  format($$insert into storage.objects (bucket_id, name, owner_id) values ('post-media', '%s/../escape.jpg', '%s')$$, :'author_id', :'author_id'),
  '42501', null, 'upload paths must be a plain file name in your own folder'
);

-- --------------------------------------------------------------- reading
select pg_temp.act_as(:'stranger_id');
select ok(pg_temp.can_read(:'public_photo'), 'anyone signed in can read a public post''s photo');
select ok(not pg_temp.can_read(:'followers_photo'), 'a stranger cannot read a followers-only post''s photo');

select pg_temp.act_as(:'follower_id');
select ok(pg_temp.can_read(:'followers_photo'), 'a follower can read a followers-only post''s photo');
select ok(not pg_temp.can_read(:'strangers_photo'), 'nobody can read someone''s unposted uploads');
select is(
  (select media -> 0 ->> 'path' from public.get_home_feed() where id = :'public_post'),
  :'public_photo', 'the home feed returns each post''s photos'
);

-- ----------------------------------------------------------- upload limit
reset role;
select pg_temp.make_user('post_media_uploader@test.vybe') as uploader \gset
select pg_temp.act_as(:'uploader');
select lives_ok(
  format($q$do $do$ begin for i in 1..40 loop
    insert into storage.objects (bucket_id, name, owner_id) values ('post-media', %1$L || '/burst' || lpad(i::text, 6, '0') || '.jpg', %1$L);
  end loop; end $do$$q$, :'uploader'),
  '40 uploads in a few minutes are fine'
);
select throws_ok(
  format($$insert into storage.objects (bucket_id, name, owner_id) values ('post-media', %1$L || '/burst999999.jpg', %1$L)$$, :'uploader'),
  'P0001', 'rate_limited', 'the next upload in the same window is refused'
);
reset role;
insert into public.blocks (blocker_id, blocked_id) values (:'author_id', :'stranger_id');
select pg_temp.act_as(:'stranger_id');
select ok(not pg_temp.can_read(:'public_photo'), 'a blocked user cannot read even a public post''s photo');

reset role;
update public.profiles set suspended_at = now() where id = :'author_id';
select pg_temp.act_as(:'author_id');
select throws_ok(
  format($$insert into storage.objects (bucket_id, name, owner_id) values ('post-media', '%s/while-suspended.jpg', '%s')$$, :'author_id', :'author_id'),
  '42501', null, 'a suspended user cannot upload'
);

select * from finish();
rollback;
