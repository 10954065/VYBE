# VYBE

**What's happening around me, where are people going, what can I do, and who can I do it with?**

VYBE is a mobile-first social discovery platform for real life — combining social networking with real-world discovery, communities, events, check-ins, challenges and streaks. Launch market: Accra, Ghana, with architecture that scales to other Ghanaian cities and beyond.

VYBE is an original product. It is not a clone of any existing virtual-life or events-directory app.

## Monorepo Structure

```
vybe/
├── apps/
│   ├── mobile/        # Expo (React Native + TypeScript) consumer app
│   └── web/            # Next.js (TypeScript) — API layer + future admin dashboard
├── packages/
│   └── shared/         # Shared types, zod schemas, constants, map-provider abstraction
├── supabase/            # Database migrations, RLS policies, seed data
└── docs/                 # Architecture, database schema, roadmap
```

## Tech Stack

| Layer | Choice |
|---|---|
| Mobile | React Native, Expo, TypeScript, Expo Router |
| Mobile state/data | Zustand, TanStack Query, React Hook Form, Zod |
| Backend | Next.js (TypeScript) API routes |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| Storage | Supabase Storage (abstracted for future S3 migration) |
| Realtime | Supabase Realtime |
| Maps | Provider-abstracted (MapLibre/Mapbox/Google) |
| Analytics | PostHog |
| Push | Expo Notifications |
| Deployment | Vercel (web/API), EAS (mobile), Supabase (data) |

## Getting Started

```bash
npm install

# Mobile app
npm run mobile

# Web/API app
npm run web
```

Copy `.env.example` to `.env.local` (web) and fill in Supabase/PostHog credentials. See [docs/environment.md](docs/environment.md).

## Documentation

- [Architecture overview](docs/architecture.md)
- [Implementation roadmap](docs/roadmap.md)

## Status

🚧 Foundation phase — monorepo scaffolding and architecture. Visual design is pending Stitch design integration; UI will follow once design assets land. See [docs/roadmap.md](docs/roadmap.md) for phase-by-phase progress.
