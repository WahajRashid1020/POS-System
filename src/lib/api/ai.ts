import type { ChatResponse } from "@/types";
import { apiMutate } from "./client";

/** Send a manager question to the AI assistant and return its reply. */
export async function sendChatMessage(message: string): Promise<string> {
  const data = await apiMutate<ChatResponse>(
    "/api/ai/chat",
    "POST",
    { message },
    "Failed to get response",
  );
  return data.response;
}
