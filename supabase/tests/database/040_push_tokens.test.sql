-- Push tokens follow whoever is signed in on the phone (Phase 8's intent,
-- fixed in 20261014020000), and can't be read or reassigned any other way.
begin;
select plan(7);

create function pg_temp.make_user(p_email text) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}');
  return v_id;
end $$;

create function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end $$;

select pg_temp.make_user('t_first@test.vybe') as first_id \gset
select pg_temp.make_user('t_second@test.vybe') as second_id \gset

select pg_temp.act_as(:'first_id');
select lives_ok(
  $$select public.register_push_token('ExponentPushToken[shared-phone]', 'ios')$$,
  'the first account registers the phone'
);

select pg_temp.act_as(:'second_id');
select is((select count(*)::int from public.push_tokens), 0, 'another user cannot see that token');
-- No UPDATE policy at all now: the update matches no rows rather than erroring.
update public.push_tokens set user_id = auth.uid();
reset role;
select is(
  (select user_id from public.push_tokens where token = 'ExponentPushToken[shared-phone]'),
  :'first_id'::uuid, 'tokens cannot be reassigned by a plain update'
);
select pg_temp.act_as(:'second_id');
select lives_ok(
  $$select public.register_push_token('ExponentPushToken[shared-phone]', 'ios')$$,
  'signing in as a second account on the same phone claims the token'
);
reset role;
select is(
  (select user_id from public.push_tokens where token = 'ExponentPushToken[shared-phone]'),
  :'second_id'::uuid, 'the phone now gets the second account''s notifications'
);

select pg_temp.act_as(:'second_id');
select throws_ok(
  $$select public.register_push_token('not-a-push-token', 'ios')$$,
  '22023', null, 'malformed tokens are rejected'
);

reset role;
update public.profiles set suspended_at = now() where id = :'second_id';
select pg_temp.act_as(:'second_id');
select throws_ok(
  $$select public.register_push_token('ExponentPushToken[another-phone]', 'ios')$$,
  '42501', null, 'a suspended account cannot register a device'
);

select * from finish();
rollback;
