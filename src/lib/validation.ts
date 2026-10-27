import { z } from "zod";

/** 24-hex-character Mongo ObjectId. */
export const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const orderStatusSchema = z.enum([
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
]);

/** Only `status` may be changed; any extra key (total, $set, ...) is rejected. */
export const updateOrderSchema = z.object({ status: orderStatusSchema }).strict();

/** Stripe PaymentIntent ids look like `pi_3Abc...`. */
export const PAYMENT_INTENT_ID_PATTERN = /^pi_[A-Za-z0-9_]{1,200}$/;

/** Order fields other than the cart lines (those go through lib/catalog). */
export const createOrderMetaSchema = z.object({
  type: z.enum(["dine-in", "takeaway", "delivery"]).optional(),
  paymentMethod: z.enum(["cash", "card", "online"]).optional(),
  paymentIntentId: z.string().regex(PAYMENT_INTENT_ID_PATTERN).optional(),
  customerName: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const MAX_CHAT_MESSAGE_LENGTH = 500;

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
});
