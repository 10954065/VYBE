import type { Metadata } from "next";
import { ANALYTICS_RANGES_DAYS, type AnalyticsOverview } from "@vybe/shared";
import Link from "next/link";
import { Suspense } from "react";

import { formatLabel } from "@/lib/format";
import { getAnalyticsOverview, parseRange } from "./queries";

export const metadata: Metadata = { title: "Analytics" };

type SearchParams = Promise<{ days?: string }>;

const TOTALS: { key: keyof AnalyticsOverview["totals"]; label: string }[] = [
  { key: "active_users", label: "Active users" },
  { key: "sessions", label: "Sessions" },
  { key: "signups", label: "Sign-ups" },
  { key: "onboarded", label: "Finished onboarding" },
  { key: "posts", label: "Posts" },
  { key: "check_ins", label: "Check-ins" },
  { key: "reactions", label: "Reactions" },
  { key: "comments", label: "Comments" },
  { key: "events_created", label: "Events created" },
  { key: "crews_created", label: "Crews created" },
];

function percent(part: number, whole: number): string {
  return whole === 0 ? "—" : `${Math.round((part / whole) * 100)}%`;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <dt className="text-sm text-neutral-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value.toLocaleString("en-GB")}</dd>
    </div>
  );
}

function DailyActivity({ daily }: { daily: AnalyticsOverview["daily"] }) {
  const peak = Math.max(1, ...daily.map((day) => day.active_users));
  return (
    <section aria-labelledby="daily-heading" className="flex flex-col gap-3">
      <h2 id="daily-heading" className="text-lg font-semibold">
        Daily activity
      </h2>
      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2 font-medium">Day</th>
              <th className="px-4 py-2 font-medium">Active users</th>
              <th className="px-4 py-2 text-right font-medium">Sign-ups</th>
              <th className="px-4 py-2 text-right font-medium">Posts</th>
              <th className="px-4 py-2 text-right font-medium">Check-ins</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((day) => (
              <tr key={day.day} className="border-t border-neutral-800">
                <td className="whitespace-nowrap px-4 py-2 text-neutral-300">{day.day}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      aria-hidden
                      className="h-2 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${(day.active_users / peak) * 160}px` }}
                    />
                    <span className="tabular-nums">{day.active_users}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{day.signups}</td>
                <td className="px-4 py-2 text-right tabular-nums">{day.posts}</td>
                <td className="px-4 py-2 text-right tabular-nums">{day.check_ins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Funnel({ funnel }: { funnel: AnalyticsOverview["funnel"] }) {
  const steps = [
    { label: "Signed up", value: funnel.signed_up },
    { label: "Finished onboarding", value: funnel.onboarded },
    { label: "Posted, checked in, or commented", value: funnel.first_action },
    { label: "Came back on a later day", value: funnel.returned },
  ];
  return (
    <section aria-labelledby="funnel-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="funnel-heading" className="text-lg font-semibold">
          New-user activation
        </h2>
        <p className="text-sm text-neutral-400">People who signed up in this period, and how far they got.</p>
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.label} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>{step.label}</span>
              <span className="tabular-nums text-neutral-400">
                {step.value} · {percent(step.value, funnel.signed_up)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800">
              <div
                className="h-2 rounded-full bg-linear-to-r from-violet-500 to-orange-400"
                style={{ width: funnel.signed_up === 0 ? "0%" : `${(step.value / funnel.signed_up) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RankedList({
  id,
  title,
  rows,
  empty,
}: {
  id: string;
  title: string;
  rows: { name: string; count: number; users: number }[];
  empty: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 px-4 py-6 text-center text-sm text-neutral-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
          {rows.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
              <span className="truncate">{row.name}</span>
              <span className="shrink-0 tabular-nums text-neutral-400">
                {row.count.toLocaleString("en-GB")}{" "}
                <span className="text-neutral-600">
                  · {row.users} {row.users === 1 ? "user" : "users"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// The range comes from the request, so everything below the heading streams
// in behind Suspense; the heading prerenders.
async function AnalyticsOverviewSection({ searchParams }: { searchParams: SearchParams }) {
  const { days } = await searchParams;
  const range = parseRange(days);
  const overview = await getAnalyticsOverview(range);

  return (
    <>
      <nav aria-label="Date range" className="flex w-fit gap-1 rounded-lg border border-neutral-800 p-1">
        {ANALYTICS_RANGES_DAYS.map((option) => (
          <Link
            key={option}
            href={`/admin/analytics?days=${option}`}
            aria-current={option === range ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 text-sm ${
              option === range ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-400 hover:text-neutral-100"
            }`}>
            Last {option} days
          </Link>
        ))}
      </nav>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TOTALS.map((total) => (
          <StatCard key={total.key} label={total.label} value={overview.totals[total.key]} />
        ))}
      </dl>

      <DailyActivity daily={overview.daily} />

      <div className="grid gap-8 lg:grid-cols-3">
        <Funnel funnel={overview.funnel} />
        <RankedList
          id="screens-heading"
          title="Top screens"
          empty="No screen views yet."
          rows={overview.top_screens.map((s) => ({ name: s.screen, count: s.views, users: s.users }))}
        />
        <RankedList
          id="events-heading"
          title="Top actions"
          empty="No tracked actions yet."
          rows={overview.top_events.map((e) => ({ name: formatLabel(e.event_name), count: e.count, users: e.users }))}
        />
      </div>
    </>
  );
}

export default function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-labelledby="analytics-heading" className="flex flex-col gap-6">
      <div>
        <h1 id="analytics-heading" className="text-2xl font-semibold">
          Analytics
        </h1>
        <p className="text-sm text-neutral-400">
          Content counts come from the database itself; active users, sessions, and screens come from in-app events.
        </p>
      </div>
      <Suspense fallback={<p className="text-neutral-500">Loading analytics…</p>}>
        <AnalyticsOverviewSection searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
