import "server-only";
import { REPORT_STATUSES, type ReportCategory, type ReportStatus, type ReportTargetType } from "@vybe/shared";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const REPORTS_LIMIT = 100;

export interface ReportTarget {
  label: string | null;
  removed: boolean;
  suspended: boolean;
}

export interface AdminReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  reporterUsername: string | null;
  resolverUsername: string | null;
  target: ReportTarget;
}

type AdminClient = ReturnType<typeof createAdminClient>;
type ContentRow = { id: string; deleted_at: string | null; label: string | null };

export function parseStatusFilter(value: string | undefined): ReportStatus | "all" {
  if (value === "all") return "all";
  return REPORT_STATUSES.find((status) => status === value) ?? "pending";
}

function idsOf(reports: { target_type: string; target_id: string }[], type: ReportTargetType): string[] {
  return [...new Set(reports.filter((r) => r.target_type === type).map((r) => r.target_id))];
}

function toContentMap(rows: ContentRow[] | null): Map<string, ReportTarget> {
  return new Map(
    (rows ?? []).map((row) => [row.id, { label: row.label, removed: row.deleted_at !== null, suspended: false }]),
  );
}

// One query per content table. Each is a literal select string so the typed
// client can still check column names -- a dynamic table/column lookup
// would type everything as an error and lose that.
async function fetchContentTargets(admin: AdminClient, reports: { target_type: string; target_id: string }[]) {
  const [posts, comments, places, events, crews] = await Promise.all([
    admin.from("posts").select("id, deleted_at, label:body").in("id", idsOf(reports, "post")),
    admin.from("comments").select("id, deleted_at, label:body").in("id", idsOf(reports, "comment")),
    admin.from("places").select("id, deleted_at, label:name").in("id", idsOf(reports, "place")),
    admin.from("events").select("id, deleted_at, label:title").in("id", idsOf(reports, "event")),
    admin.from("crews").select("id, deleted_at, label:name").in("id", idsOf(reports, "crew")),
  ]);

  for (const result of [posts, comments, places, events, crews]) {
    if (result.error) throw result.error;
  }

  return {
    post: toContentMap(posts.data),
    comment: toContentMap(comments.data),
    place: toContentMap(places.data),
    event: toContentMap(events.data),
    crew: toContentMap(crews.data),
  } as const;
}

// Layouts and pages render in parallel in the App Router, so the dashboard
// layout's gate alone doesn't stop this from running -- every privileged
// read checks for itself before touching the service-role client.
export async function getReports(statusFilter: ReportStatus | "all"): Promise<AdminReport[]> {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("reports")
    .select("id, reporter_id, target_type, target_id, category, details, status, resolved_by, resolved_at, created_at")
    .order("created_at", { ascending: false })
    .limit(REPORTS_LIMIT);
  if (statusFilter !== "all") query = query.eq("status", statusFilter);

  const { data: reports, error } = await query;
  if (error) throw error;
  if (!reports.length) return [];

  const profileIds = [
    ...new Set([
      ...reports.map((r) => r.reporter_id),
      ...reports.flatMap((r) => (r.resolved_by ? [r.resolved_by] : [])),
      ...idsOf(reports, "user"),
    ]),
  ];

  const [{ data: profiles, error: profilesError }, content] = await Promise.all([
    admin.from("profiles").select("id, username, suspended_at").in("id", profileIds),
    fetchContentTargets(admin, reports),
  ]);
  if (profilesError) throw profilesError;

  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return reports.map((report) => {
    const targetType = report.target_type as ReportTargetType;
    let target: ReportTarget = { label: null, removed: false, suspended: false };

    if (targetType === "user") {
      const profile = profilesById.get(report.target_id);
      target = profile
        ? { label: `@${profile.username}`, removed: false, suspended: profile.suspended_at !== null }
        : { label: null, removed: true, suspended: false };
    } else if (targetType !== "business") {
      target = content[targetType].get(report.target_id) ?? { label: null, removed: true, suspended: false };
    }

    return {
      id: report.id,
      targetType,
      targetId: report.target_id,
      category: report.category as ReportCategory,
      details: report.details,
      status: report.status as ReportStatus,
      createdAt: report.created_at,
      resolvedAt: report.resolved_at,
      reporterUsername: profilesById.get(report.reporter_id)?.username ?? null,
      resolverUsername: report.resolved_by ? (profilesById.get(report.resolved_by)?.username ?? null) : null,
      target,
    };
  });
}
