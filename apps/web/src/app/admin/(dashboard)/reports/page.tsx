import type { Metadata } from "next";
import { REPORT_STATUSES } from "@vybe/shared";
import Link from "next/link";
import { Suspense } from "react";

import { formatLabel } from "@/lib/format";
import { getReports, parseStatusFilter } from "./queries";
import { ReportCard } from "./report-card";

export const metadata: Metadata = { title: "Reports" };

const FILTERS = [...REPORT_STATUSES, "all"] as const;

type SearchParams = Promise<{ status?: string }>;

// Everything that depends on the request (the status filter, the reports
// themselves) streams in behind Suspense; the heading prerenders.
async function ReportsQueue({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams;
  const statusFilter = parseStatusFilter(status);
  const reports = await getReports(statusFilter);

  return (
    <>
      <nav aria-label="Filter by status" className="flex w-fit gap-1 rounded-lg border border-neutral-800 p-1">
        {FILTERS.map((filter) => {
          const isActive = filter === statusFilter;
          return (
            <Link
              key={filter}
              href={`/admin/reports?status=${filter}`}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm ${
                isActive ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-400 hover:text-neutral-100"
              }`}>
              {formatLabel(filter)}
            </Link>
          );
        })}
      </nav>

      {reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center text-neutral-500">
          No {statusFilter === "all" ? "" : `${statusFilter} `}reports.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </>
  );
}

export default function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section aria-labelledby="reports-heading" className="flex flex-col gap-6">
      <div>
        <h1 id="reports-heading" className="text-2xl font-semibold">
          Reports
        </h1>
        <p className="text-sm text-neutral-400">What people in the app have flagged, newest first.</p>
      </div>
      <Suspense fallback={<p className="text-neutral-500">Loading reports…</p>}>
        <ReportsQueue searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
