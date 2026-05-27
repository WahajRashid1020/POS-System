import mongoose, { Schema, models } from "mongoose";

const CategorySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export const CategoryModel =
  models.Category || mongoose.model("Category", CategorySchema);
