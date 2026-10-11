-- Sign-up failed for anyone whose email address has more than 21 characters
-- before the @ (e.g. firstname.lastname.work@gmail.com): the starting
-- username is that part plus `_` and 8 characters of the user id, and
-- nothing kept it within username_format's 30-character limit, so the
-- profile insert failed and the whole sign-up returned "Database error
-- creating new user". Found in Phase 15 while creating a test account.
--
-- The email part is now cut to 21 characters, so with the 9-character
-- suffix the username is at most 30. Users pick their real username during
-- onboarding; this is only the placeholder.

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
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    default_city_id
  );
  return new;
end;
$$;
