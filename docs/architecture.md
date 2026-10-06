# Architecture Overview

## Product shape

VYBE connects online activity to real-world activity: discover → participate → share → connect → return. Every major feature maps to one of: what's happening, where people are going, what I can do, who I can do it with, what's trending, what I can discover.

## Monorepo

npm workspaces (no Turborepo/Nx yet — one build tool is enough at this scale; revisit if build times become a problem).

- `apps/mobile` — Expo Router app, the primary consumer surface.
- `apps/web` — Next.js app serving the typed API layer today, and the admin dashboard later (same deployable, same auth boundary).
- `packages/shared` — code shared between mobile and web: zod schemas/types for domain entities, constants (XP values, categories, cities, challenge/badge config), and the map-provider abstraction. Single source of truth so mobile and API never drift.
- `supabase/` — SQL migrations, RLS policies, seed scripts. Schema lives in version control, not clicked together in a dashboard.

## Domain boundaries (API)

Code is organized by domain, not by technical layer: `auth`, `users`, `profiles`, `feed`, `posts`, `events`, `places`, `checkins`, `vibes`, `crews`, `challenges`, `xp`, `streaks`, `notifications`, `moderation`, `businesses`. Each domain owns its validation, authorization and data access. Identity for ownership operations is always derived from the authenticated session — a client-supplied user ID is never trusted.

## Data & security

- PostgreSQL via Supabase, Row Level Security enabled on every table from the first migration — never disabled for developer convenience.
- `SUPABASE_SERVICE_ROLE_KEY` and other secrets exist only in `apps/web` server-side environment, never in the Expo bundle.
- Location is never exposed precisely by default; vibes/check-ins carry explicit visibility (everyone/followers/friends/crew/only me).

## Cities, not hardcoded Accra

A `cities` table backs every city-scoped entity (events, places, crews, discovery feed). Launch city is Accra; the schema does not special-case it.

## Configurability

XP values, challenge durations, streak rules, feed ranking weights, categories, badges and level thresholds live in backend configuration/constants (`packages/shared`), not hardcoded inside UI components.

## Feed & trending

`FeedRankingService` is a deterministic, modular ranking function (recency, engagement, following, interests, city, crew membership) — not a black-box recommender. It is designed to be swapped for a more advanced engine later without touching call sites. Trending uses time-decayed engagement signals.

## Map abstraction

All map rendering/geocoding goes through one interface in `packages/shared`, so the concrete provider (MapLibre first, for cost; Mapbox/Google later) is a swap-in, not a rewrite.

## Design

Visual design (Stitch) is a separate track from this architecture and will be integrated into `apps/mobile` once assets are available. Component structure is being built to receive a design system (tokens → primitives → screens) without rework.

## What's deliberately deferred

Per product scope: no payments/ticketing infra, no DMs, no complex recommendation engine, no advertising marketplace, no multi-country i18n beyond what the `cities` model naturally supports. Schemas are shaped so these can be added later without a rewrite (see `docs/roadmap.md`).
