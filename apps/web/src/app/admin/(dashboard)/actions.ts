"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const REVIEW_STATUSES = ["reviewing", "resolved", "dismissed"] as const;
const SUSPENSION_REASON_MAX = 500;

const updateStatusSchema = z.object({
  reportId: z.uuid(),
  status: z.enum(REVIEW_STATUSES),
});

const reportIdSchema = z.object({ reportId: z.uuid() });

const suspendSchema = z.object({
  userId: z.uuid(),
  reason: z.string().trim().min(1, "A reason is required.").max(SUSPENSION_REASON_MAX),
  reportId: z.uuid().optional(),
});

const userIdSchema = z.object({ userId: z.uuid() });

function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && value !== "") values[key] = value;
  });
  return values;
}

function revalidateAdmin() {
  revalidatePath("/admin/reports");
  revalidatePath("/admin/users");
}

async function closeReport(reportId: string, adminId: string, status: "resolved" | "dismissed") {
  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ status, resolved_by: adminId, resolved_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw error;
}

export async function updateReportStatus(formData: FormData) {
  const { userId: adminId } = await requireAdmin();
  const { reportId, status } = updateStatusSchema.parse(formValues(formData));

  if (status === "reviewing") {
    const { error } = await createAdminClient()
      .from("reports")
      .update({ status, resolved_by: null, resolved_at: null })
      .eq("id", reportId);
    if (error) throw error;
  } else {
    await closeReport(reportId, adminId, status);
  }

  revalidateAdmin();
}

// Soft-deletes the reported post/comment/place/event/crew by setting its
// deleted_at -- every one of those tables' select RLS already filters on
// deleted_at is null, so the content disappears app-wide immediately. The
// target is read back from the report row itself, never taken from the
// form, so a tampered request can't point this at an arbitrary table/row.
export async function removeReportedContent(formData: FormData) {
  const { userId: adminId } = await requireAdmin();
  const { reportId } = reportIdSchema.parse(formValues(formData));
  const admin = createAdminClient();

  const { data: report, error: reportError } = await admin
    .from("reports")
    .select("target_type, target_id")
    .eq("id", reportId)
    .single();
  if (reportError) throw reportError;

  const deletedAt = new Date().toISOString();
  const { target_type: targetType, target_id: targetId } = report;

  const { error } = await (() => {
    switch (targetType) {
      case "post":
        return admin.from("posts").update({ deleted_at: deletedAt }).eq("id", targetId);
      case "comment":
        return admin.from("comments").update({ deleted_at: deletedAt }).eq("id", targetId);
      case "place":
        return admin.from("places").update({ deleted_at: deletedAt }).eq("id", targetId);
      case "event":
        return admin.from("events").update({ deleted_at: deletedAt }).eq("id", targetId);
      case "crew":
        return admin.from("crews").update({ deleted_at: deletedAt }).eq("id", targetId);
      default:
        throw new Error(`Reports against a ${targetType} can't be removed this way.`);
    }
  })();
  if (error) throw error;

  await closeReport(reportId, adminId, "resolved");
  revalidateAdmin();
}

export async function suspendUser(formData: FormData) {
  const { userId: adminId } = await requireAdmin();
  const { userId, reason, reportId } = suspendSchema.parse(formValues(formData));
  if (userId === adminId) {
    throw new Error("You can't suspend your own account.");
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ suspended_at: new Date().toISOString(), suspended_reason: reason })
    .eq("id", userId);
  if (error) throw error;

  if (reportId) await closeReport(reportId, adminId, "resolved");
  revalidateAdmin();
}

export async function unsuspendUser(formData: FormData) {
  await requireAdmin();
  const { userId } = userIdSchema.parse(formValues(formData));

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ suspended_at: null, suspended_reason: null })
    .eq("id", userId);
  if (error) throw error;

  revalidateAdmin();
}
