import { AIChat } from "@/components/chat/AIChat";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export default function ChatPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <main className="h-screen overflow-hidden bg-stone-50 dark:bg-dark-bg">
        <AIChat />
      </main>
    </ProtectedRoute>
  );
}
