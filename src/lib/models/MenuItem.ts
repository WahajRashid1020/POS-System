import mongoose, { Schema, models } from "mongoose";

const MenuItemSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

export const MenuItemModel =
  models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);
