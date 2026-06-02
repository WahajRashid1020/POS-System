import { KitchenDisplay } from "@/components/kitchen/KitchenDisplay";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function KitchenPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager", "kitchen"]}>
      <main className="h-screen overflow-hidden bg-stone-100">
        <KitchenDisplay />
      </main>
    </ProtectedRoute>
  );
}
