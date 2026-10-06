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

insert into public.badges (slug, name, description, criteria)
values
  ('first_check_in', 'First Check-In', 'Checked in somewhere for the first time.', '{"check_ins": 1}'),
  ('explorer', 'Explorer', 'Checked in at 10 different places.', '{"distinct_places": 10}'),
  ('social_starter', 'Social Starter', 'Followed 10 other VYBErs.', '{"follows": 10}'),
  ('weekend_warrior', 'Weekend Warrior', 'Checked in on 4 consecutive weekends.', '{"consecutive_weekends": 4}'),
  ('crew_builder', 'Crew Builder', 'Created a crew with 10+ members.', '{"crew_member_count": 10}'),
  ('event_regular', 'Event Regular', 'Attended 5 events.', '{"events_attended": 5}'),
  ('early_vyber', 'Early VYBEr', 'Joined during the Accra launch.', '{"launch_city": "accra"}')
on conflict (slug) do nothing;

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

  insert into public.challenges (title, description, type, requirements, xp_reward, city_id, start_at, end_at, status)
  values
    ('Explore Accra', 'Check in at 2 new places this week.', 'visit_places', '{"count": 2}', 20, accra_id, now(), now() + interval '7 days', 'active'),
    ('Show Up', 'Attend one event this week.', 'attend_event', '{"count": 1}', 25, accra_id, now(), now() + interval '7 days', 'active'),
    ('Find Your People', 'Join a crew.', 'join_crew', '{"count": 1}', 15, accra_id, now(), now() + interval '14 days', 'active')
  on conflict do nothing;
end $$;
