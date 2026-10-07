# Crews

## Architecture

- **Reuses Phase 2's schema and triggers entirely** — `crews`, `crew_members`, `set_crew_member_status` (server-authoritative: a client can't insert `status = 'approved'` into a private crew by just claiming it), `sync_crew_member_count`, `add_crew_creator_as_owner`. This phase added zero migrations; it's purely the mobile UI and one bug fix (below). See `docs/database-schema.md` for the RLS/trigger design.
- **Mobile**: `apps/mobile/src/features/crews/` — `use-crews` (city-scoped browse), `use-crew`, `use-my-membership` (the caller's own `crew_members` row, or `null`), `use-crew-members`/`use-crew-pending-members`, `use-join-crew`/`use-leave-crew`, `use-approve-member`/`use-remove-member` (the latter doubles as "reject a request" and "kick a member" — same RLS-gated delete either way), `use-create-crew`, `use-crew-posts`. Screens: a third "Crews" segment on the Explore tab (alongside Places/Events, same pattern), `app/(app)/crew/[id].tsx`, `app/(app)/crew/create.tsx`.
- **Crew feed is not a separate feature.** A crew post is a `posts` row with `crew_id` set and `visibility: 'crew'` — exactly the design `docs/database-schema.md` already committed to ("no separate `crew_posts` table"). This phase just taught `createPostInputSchema` an optional `crew_id` (with a `.refine()` mirroring the DB's own `crew_visibility_requires_crew` check constraint) and `useCreatePost` to pass it through, then added a small crew-scoped read (`useCrewPosts`) — no new mutation logic, no new RLS.
- **Admin UI is membership-driven, not role-gated by a separate permission system**: the crew detail screen computes `isAdmin` from the caller's own `useMyMembership` result (`status === 'approved' && role !== 'member'`) and only renders the "Pending requests" section when true. The server doesn't trust this either way — `crew_members_update_admins`/`crew_members_delete_self_or_admin`'s RLS policies independently re-check `is_crew_admin(auth.uid(), crew_id)` on every approve/reject call, so a client bug here would just hide a button, never grant unauthorized access.

## A real PostgREST bug, not a RLS bug

`useCrewPosts` initially selected `author:profiles(username, display_name)` straight off the `posts` table — the same bare-embed shorthand already working fine for `comments`, `vibes`, and `check_ins`. It failed, live, with `PGRST201` / `300 Multiple Choices`:

```json
{
  "message": "Could not embed because more than one relationship was found for 'posts' and 'profiles'",
  "details": [
    { "relationship": "posts_author_id_fkey using posts(author_id) and profiles(id)" },
    { "relationship": "saved_posts using saved_posts_post_id_fkey(post_id) and saved_posts_user_id_fkey(user_id)" }
  ]
}
```

`posts` reaches `profiles` two ways: directly via `author_id`, and implicitly many-to-many through `saved_posts` (a Phase 2 table — the save/bookmark feature — that has no UI yet and so had never been hit by an embed query before). PostgREST auto-detects any two-FK junction table as a many-to-many path and includes it as a candidate, so an unqualified `profiles(...)` embed on `posts` specifically is ambiguous in a way it isn't on tables `saved_posts` doesn't reference. Fixed with the FK-qualified form PostgREST's own error suggests: `profiles!posts_author_id_fkey(...)`. Checked every other bare `profiles(...)` embed in the codebase for the same risk — none of the others (`comments`, `check_ins`, `vibes`, `crew_members`) have an analogous junction table, and all were already confirmed working live in earlier phases.

## Verified end-to-end (local stack, real browser)

As one user: joined a seeded public crew (instant approval, member count incremented, "Join" button became "Leave"), posted to its crew feed. Requested to join a seeded private crew owned by someone else — correctly left `pending`, and confirmed the member list stays RLS-hidden to a non-approved viewer even though the crew itself (and its member count) is visible. Created a new private crew (auto-added as owner via the DB trigger), simulated two other users requesting to join it, then approved one (member count incremented on the status transition, not just on insert) and rejected the other (member count unaffected, request removed) — both through the real UI, not SQL. Left the crew afterward and confirmed the view correctly reverted to a non-member's.
