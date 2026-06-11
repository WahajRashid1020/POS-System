import { POSTerminal } from "@/components/pos/POSTerminal";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function POSPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
      <main className="h-screen overflow-hidden bg-surface dark:bg-dark-bg">
        <POSTerminal />
      </main>
    </ProtectedRoute>
  );
}
