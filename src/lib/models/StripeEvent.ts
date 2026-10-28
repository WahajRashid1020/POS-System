import mongoose, { Schema, models } from "mongoose";

// Stripe event ids we have already acted on. The id is the document _id, so
// MongoDB itself guarantees an event can be recorded only once.
const EVENT_TTL_SECONDS = 60 * 60 * 24 * 30;

const StripeEventSchema = new Schema(
  {
    _id: { type: String, required: true },
    // Old records expire on their own; Stripe stops retrying long before this.
    createdAt: { type: Date, default: Date.now, expires: EVENT_TTL_SECONDS },
  },
  { versionKey: false },
);

export const StripeEventModel =
  models.StripeEvent || mongoose.model("StripeEvent", StripeEventSchema);
