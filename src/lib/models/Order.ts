import mongoose, { Schema, models } from "mongoose";

const OrderItemSchema = new Schema({
  menuItem: { type: Schema.Types.Mixed, required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String },
  price: { type: Number, required: true },
});

const OrderSchema = new Schema(
  {
    orderNumber: { type: Number, required: true },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["dine-in", "takeaway", "delivery"],
      default: "dine-in",
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash", "card", "online"] },
    customerName: { type: String },
    notes: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Index for quick lookups
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

export const OrderModel =
  models.Order || mongoose.model("Order", OrderSchema);
