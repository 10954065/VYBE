import { Suspense } from "react";

import { formatDateTime } from "@/lib/format";
import { suspendUser, unsuspendUser } from "../actions";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import { normalizeUsernameQuery, searchUsers, type AdminUser } from "./queries";

const BUTTON = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

function UserRow({ user }: { user: AdminUser }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">
          {user.displayName ?? user.username} <span className="text-neutral-500">@{user.username}</span>
        </span>
        {user.suspendedAt ? (
          <span className="text-sm text-red-300">
            Suspended {formatDateTime(user.suspendedAt)}
            {user.suspendedReason && <span className="text-neutral-400"> — {user.suspendedReason}</span>}
          </span>
        ) : (
          <span className="text-sm text-neutral-500">Joined {formatDateTime(user.createdAt)}</span>
        )}
      </div>

      {user.suspendedAt ? (
        <form action={unsuspendUser}>
          <input type="hidden" name="userId" value={user.id} />
          <button type="submit" className={`${BUTTON} border border-neutral-700 text-neutral-200 hover:bg-neutral-800`}>
            Lift suspension
          </button>
        </form>
      ) : (
        <form action={suspendUser} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <input
            name="reason"
            required
            maxLength={500}
            placeholder="Reason (shown to the user)"
            aria-label={`Suspension reason for @${user.username}`}
            className="w-64 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
          />
          <ConfirmSubmitButton
            className={`${BUTTON} bg-red-600 text-white hover:bg-red-500`}
            confirmMessage={`Suspend @${user.username}?`}>
            Suspend
          </ConfirmSubmitButton>
        </form>
      )}
    </li>
  );
}

type SearchParams = Promise<{ q?: string }>;

// The search query and results depend on the request, so they stream in
// behind Suspense; the heading prerenders.
async function UserResults({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const query = normalizeUsernameQuery(q);
  const users = await searchUsers(query);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-neutral-400">
          {query ? `Usernames matching “${query}”.` : "Currently suspended accounts. Search to find anyone else."}
        </p>
        <form className="flex gap-2" role="search">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by username"
            aria-label="Search by username"
            className="w-64 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100"
          />
          <button type="submit" className={`${BUTTON} bg-neutral-100 text-neutral-900 hover:bg-white`}>
            Search
          </button>
        </form>
      </div>

      {users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center text-neutral-500">
          {query ? "No users match that username." : "Nobody is suspended."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </ul>
      )}
    </>
  );
}

export default function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-6">
      <h1 id="users-heading" className="text-2xl font-semibold">
        Users
      </h1>
      <Suspense fallback={<p className="text-neutral-500">Loading users…</p>}>
        <UserResults searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
