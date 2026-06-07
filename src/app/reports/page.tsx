import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ReportsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <main className="min-h-screen bg-stone-50">
        <ReportsDashboard />
      </main>
    </ProtectedRoute>
  );
}
