import { isDuplicateKeyError } from "@/lib/db-errors";
import { StripeEventModel } from "@/lib/models/StripeEvent";

/**
 * Records a Stripe event id before it is processed. Returns false when the id
 * was already recorded, meaning Stripe delivered this event before and it must
 * not be processed again.
 */
export async function claimStripeEvent(eventId: string): Promise<boolean> {
  try {
    await StripeEventModel.create({ _id: eventId });
    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) return false;
    throw error;
  }
}

/**
 * Frees a claim after processing failed, so Stripe's retry is processed rather
 * than skipped as a duplicate. Never throws: the caller is already handling
 * the original failure.
 */
export async function releaseStripeEvent(eventId: string): Promise<void> {
  try {
    await StripeEventModel.deleteOne({ _id: eventId });
  } catch (error) {
    console.error("Could not release Stripe event claim:", error);
  }
}
