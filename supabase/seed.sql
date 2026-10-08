-- Development seed data only. Never run against a production database.
-- Fictional place names — not real businesses — standing in for real
-- venues until actual business accounts are onboarded.

insert into public.cities (slug, name, country, timezone, center_lat, center_lng, is_launched)
values
  ('accra', 'Accra', 'GH', 'Africa/Accra', 5.6037, -0.1870, true),
  ('kumasi', 'Kumasi', 'GH', 'Africa/Accra', 6.6885, -1.6244, false),
  ('tema', 'Tema', 'GH', 'Africa/Accra', 5.6698, -0.0166, false),
  ('takoradi', 'Takoradi', 'GH', 'Africa/Accra', 4.8845, -1.7554, false),
  ('cape-coast', 'Cape Coast', 'GH', 'Africa/Accra', 5.1053, -1.2466, false),
  ('tamale', 'Tamale', 'GH', 'Africa/Accra', 9.4035, -0.8393, false)
on conflict (slug) do nothing;

-- Badges are seeded by the 20261008000100_gamification_engine.sql migration
-- instead of here: they're real production config evaluate_badges() looks
-- up by slug, not dev-only sample data, so they need to exist in every
-- environment, not just one that happens to run this file.

do $$
declare
  accra_id uuid;
begin
  select id into accra_id from public.cities where slug = 'accra';

  insert into public.places (name, slug, description, category, address, city_id, lat, lng, popularity_score)
  values
    ('Labone Garden Cafe', 'labone-garden-cafe', 'Relaxed outdoor cafe popular for brunch.', 'cafes', 'Labone, Accra', accra_id, 5.5680, -0.1735, 42),
    ('Osu Beachfront Grill', 'osu-beachfront-grill', 'Grilled seafood and live music by the water.', 'restaurants', 'Oxford Street, Osu', accra_id, 5.5560, -0.1830, 88),
    ('Circle Night Market', 'circle-night-market', 'Street food and late-night hangout spot.', 'entertainment', 'Kwame Nkrumah Circle', accra_id, 5.5600, -0.2080, 76),
    ('East Legon Fitness Club', 'east-legon-fitness-club', '24-hour gym with group classes.', 'gyms', 'East Legon', accra_id, 5.6480, -0.1500, 30),
    ('Labadi Pulse Beach', 'labadi-pulse-beach', 'Popular beach for weekend gatherings.', 'beaches', 'Labadi', accra_id, 5.5560, -0.1420, 95),
    ('Accra Central Mall', 'accra-central-mall', 'Shopping and entertainment complex.', 'malls', 'Accra Central', accra_id, 5.5480, -0.2050, 55),
    ('Independence Park', 'independence-park', 'Open park popular for evening walks.', 'parks', 'Ridge, Accra', accra_id, 5.5560, -0.1970, 40),
    ('Cantonments Event Hall', 'cantonments-event-hall', 'Indoor venue for parties and functions.', 'event_spaces', 'Cantonments', accra_id, 5.5760, -0.1690, 25),
    ('Jamestown Lighthouse Lounge', 'jamestown-lighthouse-lounge', 'Rooftop lounge near the historic lighthouse.', 'clubs', 'Jamestown', accra_id, 5.5330, -0.2140, 70),
    ('Legon Campus Grounds', 'legon-campus-grounds', 'University of Ghana sports and social grounds.', 'campus', 'Legon', accra_id, 5.6500, -0.1870, 38),
    ('Airport Residential Courts', 'airport-residential-courts', 'Tennis and padel courts.', 'sports', 'Airport Residential Area', accra_id, 5.6050, -0.1720, 20),
    ('Osu Oxford Street Shops', 'osu-oxford-street-shops', 'Boutique shopping strip.', 'shopping', 'Oxford Street, Osu', accra_id, 5.5550, -0.1810, 48)
  on conflict (slug) do nothing;

  -- requirements keys match the progress-tracking engine in
  -- 20261008000500_home_and_crews_hub.sql: visit_places -> distinct_places,
  -- attend_event/join_crew -> count.
  insert into public.challenges (title, description, type, requirements, xp_reward, city_id, start_at, end_at, status)
  values
    ('Explore Accra', 'Check in at 2 new places this week.', 'visit_places', '{"distinct_places": 2}', 20, accra_id, now(), now() + interval '7 days', 'active'),
    ('Show Up', 'Attend one event this week.', 'attend_event', '{"count": 1}', 25, accra_id, now(), now() + interval '7 days', 'active'),
    ('Find Your People', 'Join a crew.', 'join_crew', '{"count": 1}', 15, accra_id, now(), now() + interval '14 days', 'active'),
    ('48-Hour Accra Explorer Challenge', 'Visit 3 new places in Accra within 48 hours.', 'visit_places', '{"distinct_places": 3}', 500, accra_id, now(), now() + interval '48 hours', 'active')
  on conflict do nothing;
end $$;
