import "server-only";

import { ANALYTICS_RANGES_DAYS, analyticsOverviewSchema, type AnalyticsOverview, type AnalyticsRangeDays } from "@vybe/shared";

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_RANGE: AnalyticsRangeDays = 7;

export function parseRange(value: string | undefined): AnalyticsRangeDays {
  const days = Number(value);
  return ANALYTICS_RANGES_DAYS.find((range) => range === days) ?? DEFAULT_RANGE;
}

// get_analytics_overview is executable only by service_role, so this runs
// through the admin client -- after the same allowlist gate as every other
// privileged read in this dashboard.
export async function getAnalyticsOverview(days: AnalyticsRangeDays): Promise<AnalyticsOverview> {
  await requireAdmin();

  const { data, error } = await createAdminClient().rpc("get_analytics_overview", { p_days: days });
  if (error) throw error;
  return analyticsOverviewSchema.parse(data);
}
