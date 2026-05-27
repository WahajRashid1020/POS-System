/**
 * Run this script to seed your MongoDB with initial menu data:
 * npx tsx src/scripts/seed.ts
 *
 * Make sure MONGODB_URI is set in .env.local
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

// Define schemas inline for script
const CategorySchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  icon: String,
  sortOrder: Number,
  isActive: { type: Boolean, default: true },
});

const MenuItemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    category: String,
    description: String,
    image: String,
    isAvailable: { type: Boolean, default: true },
    preparationTime: Number,
    tags: [String],
  },
  { timestamps: true }
);

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);
const MenuItem =
  mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);

// Seed data
const categories = [
  { name: "Burgers", slug: "burgers", icon: "🍔", sortOrder: 0, isActive: true },
  { name: "Chips & Sides", slug: "chips-sides", icon: "🍟", sortOrder: 1, isActive: true },
  { name: "Fish", slug: "fish", icon: "🐟", sortOrder: 2, isActive: true },
  { name: "Chicken", slug: "chicken", icon: "🍗", sortOrder: 3, isActive: true },
  { name: "Kebabs", slug: "kebabs", icon: "🥙", sortOrder: 4, isActive: true },
  { name: "Meals", slug: "meals", icon: "🍽️", sortOrder: 5, isActive: true },
  { name: "Drinks", slug: "drinks", icon: "🥤", sortOrder: 6, isActive: true },
  { name: "Extras", slug: "extras", icon: "➕", sortOrder: 7, isActive: true },
];

const menuItems = [
  { name: "Classic Burger", price: 5.5, category: "burgers", isAvailable: true, preparationTime: 8, tags: ["popular"] },
  { name: "Cheese Burger", price: 6.0, category: "burgers", isAvailable: true, preparationTime: 8, tags: ["popular"] },
  { name: "Chicken Burger", price: 6.5, category: "burgers", isAvailable: true, preparationTime: 8 },
  { name: "Double Burger", price: 8.0, category: "burgers", isAvailable: true, preparationTime: 10 },
  { name: "Veggie Burger", price: 6.0, category: "burgers", isAvailable: true, preparationTime: 8 },
  { name: "Quarter Pounder", price: 7.0, category: "burgers", isAvailable: true, preparationTime: 10, tags: ["popular"] },
  { name: "Small Chips", price: 2.5, category: "chips-sides", isAvailable: true, preparationTime: 5, tags: ["popular"] },
  { name: "Large Chips", price: 3.5, category: "chips-sides", isAvailable: true, preparationTime: 5, tags: ["popular"] },
  { name: "Garlic Chips", price: 4.0, category: "chips-sides", isAvailable: true, preparationTime: 6 },
  { name: "Taco Chips", price: 5.0, category: "chips-sides", isAvailable: true, preparationTime: 6 },
  { name: "Curry Chips", price: 4.5, category: "chips-sides", isAvailable: true, preparationTime: 6, tags: ["popular"] },
  { name: "Onion Rings", price: 3.0, category: "chips-sides", isAvailable: true, preparationTime: 5 },
  { name: "Coleslaw", price: 1.5, category: "chips-sides", isAvailable: true, preparationTime: 1 },
  { name: "Gravy", price: 1.0, category: "chips-sides", isAvailable: true, preparationTime: 1 },
  { name: "Cod & Chips", price: 9.5, category: "fish", isAvailable: true, preparationTime: 12, tags: ["popular"] },
  { name: "Smoked Cod & Chips", price: 10.5, category: "fish", isAvailable: true, preparationTime: 12 },
  { name: "Battered Sausage", price: 3.0, category: "fish", isAvailable: true, preparationTime: 8 },
  { name: "Fish Cake", price: 2.5, category: "fish", isAvailable: true, preparationTime: 8 },
  { name: "3pc Chicken Tenders", price: 5.0, category: "chicken", isAvailable: true, preparationTime: 8, tags: ["popular"] },
  { name: "5pc Chicken Tenders", price: 7.5, category: "chicken", isAvailable: true, preparationTime: 8 },
  { name: "Chicken Wings (6)", price: 6.0, category: "chicken", isAvailable: true, preparationTime: 10 },
  { name: "Chicken Wings (12)", price: 10.0, category: "chicken", isAvailable: true, preparationTime: 10 },
  { name: "Chicken Fillet", price: 5.5, category: "chicken", isAvailable: true, preparationTime: 10 },
  { name: "Spice Bag", price: 8.5, category: "chicken", isAvailable: true, preparationTime: 12, tags: ["popular"] },
  { name: "Doner Kebab", price: 7.0, category: "kebabs", isAvailable: true, preparationTime: 8 },
  { name: "Chicken Kebab", price: 7.5, category: "kebabs", isAvailable: true, preparationTime: 8 },
  { name: "Mixed Kebab", price: 9.0, category: "kebabs", isAvailable: true, preparationTime: 10 },
  { name: "Kebab Tray", price: 8.0, category: "kebabs", isAvailable: true, preparationTime: 8 },
  { name: "Burger & Chips Meal", price: 8.5, category: "meals", isAvailable: true, preparationTime: 12, tags: ["popular"] },
  { name: "Chicken Tender Meal", price: 9.0, category: "meals", isAvailable: true, preparationTime: 12 },
  { name: "Fish & Chips Meal", price: 11.0, category: "meals", isAvailable: true, preparationTime: 15 },
  { name: "Spice Bag Meal", price: 11.5, category: "meals", isAvailable: true, preparationTime: 15 },
  { name: "Kids Meal", price: 5.5, category: "meals", isAvailable: true, preparationTime: 10 },
  { name: "Coke", price: 1.8, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Fanta", price: 1.8, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Sprite", price: 1.8, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Water", price: 1.5, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Capri Sun", price: 1.5, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Extra Cheese", price: 0.5, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Extra Sauce", price: 0.3, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Garlic Dip", price: 0.5, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Curry Sauce", price: 1.0, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Bag", price: 0.1, category: "extras", isAvailable: true, preparationTime: 0 },
];

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);

  console.log("🗑️  Clearing existing data...");
  await Category.deleteMany({});
  await MenuItem.deleteMany({});

  console.log("📦 Seeding categories...");
  await Category.insertMany(categories);
  console.log(`   ✅ ${categories.length} categories created`);

  console.log("📦 Seeding menu items...");
  await MenuItem.insertMany(menuItems);
  console.log(`   ✅ ${menuItems.length} menu items created`);

  console.log("🎉 Seed complete!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
