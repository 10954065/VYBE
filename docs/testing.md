# Testing

Phase 14 added the project's first automated tests. Three layers, each covering what the others can't:

| Layer | Tool | Command | What it covers |
|---|---|---|---|
| Database | pgTAP | `npm run test:db` (needs the local stack: `npx supabase start`) | RLS, column grants, triggers, RPCs, Storage rules — who can see and do what. 114 tests. |
| Unit | Vitest | `npm test` | Plain TypeScript logic in `packages/shared`, `apps/mobile/src/lib`, `apps/mobile/src/features`, and `apps/web`. 79 tests. |
| Static | tsc + ESLint | `npm run typecheck`, `npm run lint` | All workspaces. |

## Database tests

`supabase/tests/database/*.test.sql`. Each file runs in a transaction that's rolled back, creates its own users with `pg_temp.make_user`, and switches into them with `pg_temp.act_as` — `role = authenticated` plus JWT claims — so every query goes through exactly the RLS the app's requests do. See `docs/security.md` for what each file covers. Most security rules in this project live in the database, so most of the security tests do too.

To check that migrations replay from scratch without touching your local data, copy `supabase/` somewhere else, change `project_id` and the ports in its `config.toml` (on Windows, avoid the ranges in `netsh int ipv4 show excludedportrange protocol=tcp`), and run `supabase db start --workdir <copy>` then `supabase test db --workdir <copy>`. Stop it with `supabase stop --workdir <copy> --no-backup`.

## Unit tests

`vitest.config.mts` defines three projects (`shared`, `mobile`, `web`), all in Node. Only modules that don't import React Native are unit-tested; screens and hooks need a device or `jest-expo`. Highlights:

- `levelForXp` is pinned to the database's `level_for_xp` at every level boundary, so the profile and the level-up notifications can't drift apart.
- The analytics catalog rejects any property it doesn't declare — the privacy boundary for what reaches PostHog.
- `slugify` always satisfies each table's `slug_format` constraint. Writing this test found a real bug: crew slugs could be 47 characters against a 40-character limit, so long crew names failed to save.
- The admin allowlist and every admin URL parser, with hostile input.

## CI

`.github/workflows/ci.yml` runs typecheck, lint and unit tests on every push and pull request, and a second job that builds a fresh database from every migration and the seed, then runs the pgTAP suite.

**Not yet active:** pushing a workflow file needs a GitHub credential with the `workflow` scope, which this machine's login doesn't have, so GitHub rejected it. The file is ready locally; run `gh auth refresh -h github.com -s workflow`, then commit and push it.

## Not covered yet

- **Component and end-to-end tests on a device.** That needs a development build (EAS) to run Maestro or Detox against; verification so far has been live in a browser (Playwright on Expo web) and on a real iPhone in Expo Go.
- **Coverage targets.** The unit tests cover the logic that can run in Node; most of the app's behaviour is screens and data hooks, which the layer above would cover.
