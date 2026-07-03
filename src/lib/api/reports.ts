import type { ReportData, ReportRange } from "@/types";
import { apiFetch } from "./client";

/** Fetch the aggregated sales report for the given time range. */
export function getReport(range: ReportRange): Promise<ReportData> {
  return apiFetch<ReportData>(`/api/reports?range=${range}`, {
    fallbackMessage: "Failed to fetch report",
  });
}
