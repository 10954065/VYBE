-- Star ratings for places (Stitch's "4.8 (320)" chips). A rating requires
-- a real check-in at that place first — same spirit as a verified-visit
-- review, and it keeps this from being review-bombable by someone who's
-- never been.
create table public.place_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  review text check (review is null or length(review) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create index place_ratings_place_id_idx on public.place_ratings (place_id);

create trigger set_updated_at
  before update on public.place_ratings
  for each row execute function public.set_updated_at();

alter table public.place_ratings enable row level security;

create policy "place_ratings_select_all"
  on public.place_ratings for select
  using (true);

create policy "place_ratings_insert_self_with_visit"
  on public.place_ratings for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.check_ins ci where ci.user_id = auth.uid() and ci.place_id = place_ratings.place_id)
  );

create policy "place_ratings_update_self"
  on public.place_ratings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "place_ratings_delete_self"
  on public.place_ratings for delete
  using (user_id = auth.uid());

-- Derived, not stored — same pattern as user_xp_totals.
create view public.place_rating_aggregates as
  select place_id, round(avg(rating), 1) as avg_rating, count(*) as rating_count
  from public.place_ratings
  group by place_id;

comment on view public.place_rating_aggregates is
  'Average rating and count per place, computed live from place_ratings.';
