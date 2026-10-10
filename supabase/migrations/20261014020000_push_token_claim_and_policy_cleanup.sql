-- Phase 14: two leftovers from `supabase db advisors`.
--
-- 1. push_tokens_claim (UPDATE ... USING (true)) was meant to let a phone's
--    push token move to whoever signs in next on that device (Phase 8). It
--    never worked: an upsert that hits an existing row must also pass that
--    row's SELECT policy, which only shows a user their own tokens — so the
--    second account on a phone got an RLS error and never received pushes
--    (reproduced through the API). A SECURITY DEFINER function does the
--    reassignment instead, always to the caller, and the always-true policy
--    goes away. Same trade-off as before: a push token isn't a credential.

create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if public.is_suspended(v_user_id) then
    raise exception 'account_suspended' using errcode = '42501';
  end if;
  if p_token is null or length(p_token) > 512 or p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'invalid_push_token' using errcode = '22023';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (v_user_id, p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform;
end;
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

drop policy "push_tokens_claim" on public.push_tokens;

-- 2. multiple_permissive_policies: business_staff and post_media each had a
--    FOR ALL "manage" policy alongside their SELECT policy, so every SELECT
--    evaluated both. The manage policies now cover only the writes; the
--    SELECT policies already include what the manage ones allowed (owners
--    see their staff; a post's media is visible wherever the post is).

drop policy "business_staff_manage_owner" on public.business_staff;
create policy "business_staff_insert_owner" on public.business_staff for insert
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_staff_update_owner" on public.business_staff for update
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_staff_delete_owner" on public.business_staff for delete
  using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

drop policy "post_media_manage_own_post" on public.post_media;
create policy "post_media_insert_own_post" on public.post_media for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "post_media_update_own_post" on public.post_media for update
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())))
  with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
create policy "post_media_delete_own_post" on public.post_media for delete
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = (select auth.uid())));
