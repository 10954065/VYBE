-- Display-only price text for events (Stitch's "Tickets GH₵ 150"). No
-- payment processing, currency handling, or ticketing exists — this is
-- free-text copy an organizer can set, shown as-is. RSVP stays the real
-- (free) event_attendees flow it already was; this never gates it.
alter table public.events add column price_label text check (price_label is null or length(price_label) <= 40);

comment on column public.events.price_label is
  'Free-text display-only price (e.g. "Free", "GH₵150") shown on the event card. Not wired to any real payment or ticketing — RSVP via event_attendees stays free regardless of this label.';
