# Environment Variables

Copy [`.env.example`](../.env.example) and fill in real values locally. Never commit `.env` or `.env.local`.

## Separation of concerns

- `EXPO_PUBLIC_*` / `NEXT_PUBLIC_*` prefixed values are bundled into client code and are **not secret**.
- Everything else (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`) is server-only and must only be read inside `apps/web`'s server-side code (API routes, server actions). It must never be imported into, or shipped inside, the mobile bundle.

## Environments

| Environment | Purpose |
|---|---|
| `development` | Local development against a Supabase dev project. |
| `staging` | Pre-production, used for QA before release. |
| `production` | Live app. |

Each environment gets its own Supabase project and its own set of secrets configured in Vercel (web) and EAS (mobile build profiles) — never shared across environments.

## Required variables

See [`.env.example`](../.env.example) for the full list and inline documentation of each variable's purpose.
