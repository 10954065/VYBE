import { formatDateTime, formatLabel } from "@/lib/format";
import { removeReportedContent, suspendUser, updateReportStatus } from "../actions";
import { ConfirmSubmitButton } from "../confirm-submit-button";
import type { AdminReport } from "./queries";

const STATUS_STYLES: Record<AdminReport["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300",
  reviewing: "bg-sky-500/15 text-sky-300",
  resolved: "bg-emerald-500/15 text-emerald-300",
  dismissed: "bg-neutral-500/15 text-neutral-400",
};

const BUTTON = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
const SECONDARY_BUTTON = `${BUTTON} border border-neutral-700 text-neutral-200 hover:bg-neutral-800`;
const DANGER_BUTTON = `${BUTTON} bg-red-600 text-white hover:bg-red-500`;

function StatusButton({ reportId, status, label }: { reportId: string; status: string; label: string }) {
  return (
    <form action={updateReportStatus}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={SECONDARY_BUTTON}>
        {label}
      </button>
    </form>
  );
}

function TargetDescription({ report }: { report: AdminReport }) {
  const { target } = report;
  if (target.removed) {
    return <span className="text-neutral-500">Already removed or deleted</span>;
  }
  return (
    <span className="text-neutral-200">
      {target.label ? <span className="line-clamp-2">{target.label}</span> : <code className="text-xs">{report.targetId}</code>}
      {target.suspended && <span className="ml-2 rounded bg-red-500/15 px-1.5 py-0.5 text-xs text-red-300">Suspended</span>}
    </span>
  );
}

function OpenReportActions({ report }: { report: AdminReport }) {
  const canSuspend = report.targetType === "user" && !report.target.removed && !report.target.suspended;
  const canRemove = !["user", "business"].includes(report.targetType) && !report.target.removed;

  return (
    <div className="flex flex-wrap items-end gap-2">
      {report.status === "pending" && <StatusButton reportId={report.id} status="reviewing" label="Start review" />}

      {canRemove && (
        <form action={removeReportedContent}>
          <input type="hidden" name="reportId" value={report.id} />
          <ConfirmSubmitButton
            className={DANGER_BUTTON}
            confirmMessage={`Remove this ${report.targetType}? It will disappear from the app for everyone.`}>
            Remove {report.targetType}
          </ConfirmSubmitButton>
        </form>
      )}

      {canSuspend && (
        <form action={suspendUser} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={report.targetId} />
          <input type="hidden" name="reportId" value={report.id} />
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            Suspension reason (shown to the user)
            <input
              name="reason"
              required
              maxLength={500}
              defaultValue={`Reported for ${formatLabel(report.category).toLowerCase()}`}
              className="w-72 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-100"
            />
          </label>
          <ConfirmSubmitButton className={DANGER_BUTTON} confirmMessage={`Suspend ${report.target.label ?? "this user"}?`}>
            Suspend user
          </ConfirmSubmitButton>
        </form>
      )}

      <StatusButton reportId={report.id} status="resolved" label="Resolve, no action" />
      <StatusButton reportId={report.id} status="dismissed" label="Dismiss" />
    </div>
  );
}

export function ReportCard({ report }: { report: AdminReport }) {
  const isOpen = report.status === "pending" || report.status === "reviewing";

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[report.status]}`}>
              {formatLabel(report.status)}
            </span>
            <span className="text-sm font-semibold">{formatLabel(report.category)}</span>
            <span className="text-sm text-neutral-500">· {formatLabel(report.targetType)}</span>
          </div>
          <p className="text-sm text-neutral-400">
            Reported by @{report.reporterUsername ?? "deleted user"} · {formatDateTime(report.createdAt)}
          </p>
        </div>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="text-neutral-500">Reported {report.targetType}</dt>
        <dd>
          <TargetDescription report={report} />
        </dd>
        {report.details && (
          <>
            <dt className="text-neutral-500">Reporter&apos;s note</dt>
            <dd className="whitespace-pre-wrap text-neutral-200">{report.details}</dd>
          </>
        )}
      </dl>

      {isOpen ? (
        <OpenReportActions report={report} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-500">
          <span>
            {formatLabel(report.status)} by @{report.resolverUsername ?? "unknown"}
            {report.resolvedAt && ` · ${formatDateTime(report.resolvedAt)}`}
          </span>
          <StatusButton reportId={report.id} status="reviewing" label="Reopen" />
        </div>
      )}
    </article>
  );
}
