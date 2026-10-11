-- Every email address must be able to sign up: the profile created for a
-- new auth user must satisfy username_format whatever the email looks like.
begin;
select plan(4);

create function pg_temp.username_for(p_email text) returns text language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data)
  values (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '{}');
  return (select username from public.profiles where id = v_id);
end $$;

select matches(
  pg_temp.username_for('firstname.middlename.lastname.work@gmail.com'),
  '^firstname\.middlename\._[0-9a-f]{8}$',
  'a long email name is shortened so sign-up succeeds'
);
select ok(
  char_length(pg_temp.username_for(repeat('a', 64) || '@example.com')) <= 30,
  'the longest possible email name still fits the username limit'
);
select matches(
  pg_temp.username_for('ab@example.com'), '^vyber_[0-9a-f]{8}$',
  'a too-short email name falls back to a placeholder'
);
select matches(
  pg_temp.username_for('Kofi-Boateng+vybe@example.com'), '^kofiboatengvybe_[0-9a-f]{8}$',
  'characters a username cannot hold are dropped'
);

select * from finish();
rollback;
