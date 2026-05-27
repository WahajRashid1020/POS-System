import { Category, MenuItem } from "@/types";

// ==========================================
// CATEGORIES - typical chipper categories
// ==========================================
export const SEED_CATEGORIES: Omit<Category, "_id">[] = [
  { name: "Burgers", slug: "burgers", icon: "🍔", sortOrder: 0, isActive: true },
  { name: "Chips & Sides", slug: "chips-sides", icon: "🍟", sortOrder: 1, isActive: true },
  { name: "Fish", slug: "fish", icon: "🐟", sortOrder: 2, isActive: true },
  { name: "Chicken", slug: "chicken", icon: "🍗", sortOrder: 3, isActive: true },
  { name: "Kebabs", slug: "kebabs", icon: "🥙", sortOrder: 4, isActive: true },
  { name: "Meals", slug: "meals", icon: "🍽️", sortOrder: 5, isActive: true },
  { name: "Drinks", slug: "drinks", icon: "🥤", sortOrder: 6, isActive: true },
  { name: "Extras", slug: "extras", icon: "➕", sortOrder: 7, isActive: true },
];

// ==========================================
// MENU ITEMS - realistic Dublin chipper menu
// ==========================================
export const SEED_MENU_ITEMS: Omit<MenuItem, "_id" | "createdAt" | "updatedAt">[] = [
  // Burgers
  { name: "Classic Burger", price: 5.50, category: "burgers", isAvailable: true, preparationTime: 8, tags: ["popular"] },
  { name: "Cheese Burger", price: 6.00, category: "burgers", isAvailable: true, preparationTime: 8, tags: ["popular"] },
  { name: "Chicken Burger", price: 6.50, category: "burgers", isAvailable: true, preparationTime: 8 },
  { name: "Double Burger", price: 8.00, category: "burgers", isAvailable: true, preparationTime: 10 },
  { name: "Veggie Burger", price: 6.00, category: "burgers", isAvailable: true, preparationTime: 8 },
  { name: "Quarter Pounder", price: 7.00, category: "burgers", isAvailable: true, preparationTime: 10, tags: ["popular"] },

  // Chips & Sides
  { name: "Small Chips", price: 2.50, category: "chips-sides", isAvailable: true, preparationTime: 5, tags: ["popular"] },
  { name: "Large Chips", price: 3.50, category: "chips-sides", isAvailable: true, preparationTime: 5, tags: ["popular"] },
  { name: "Garlic Chips", price: 4.00, category: "chips-sides", isAvailable: true, preparationTime: 6 },
  { name: "Taco Chips", price: 5.00, category: "chips-sides", isAvailable: true, preparationTime: 6 },
  { name: "Curry Chips", price: 4.50, category: "chips-sides", isAvailable: true, preparationTime: 6, tags: ["popular"] },
  { name: "Onion Rings", price: 3.00, category: "chips-sides", isAvailable: true, preparationTime: 5 },
  { name: "Coleslaw", price: 1.50, category: "chips-sides", isAvailable: true, preparationTime: 1 },
  { name: "Gravy", price: 1.00, category: "chips-sides", isAvailable: true, preparationTime: 1 },

  // Fish
  { name: "Cod & Chips", price: 9.50, category: "fish", isAvailable: true, preparationTime: 12, tags: ["popular"] },
  { name: "Smoked Cod & Chips", price: 10.50, category: "fish", isAvailable: true, preparationTime: 12 },
  { name: "Battered Sausage", price: 3.00, category: "fish", isAvailable: true, preparationTime: 8 },
  { name: "Fish Cake", price: 2.50, category: "fish", isAvailable: true, preparationTime: 8 },

  // Chicken
  { name: "3pc Chicken Tenders", price: 5.00, category: "chicken", isAvailable: true, preparationTime: 8, tags: ["popular"] },
  { name: "5pc Chicken Tenders", price: 7.50, category: "chicken", isAvailable: true, preparationTime: 8 },
  { name: "Chicken Wings (6)", price: 6.00, category: "chicken", isAvailable: true, preparationTime: 10 },
  { name: "Chicken Wings (12)", price: 10.00, category: "chicken", isAvailable: true, preparationTime: 10 },
  { name: "Chicken Fillet", price: 5.50, category: "chicken", isAvailable: true, preparationTime: 10 },
  { name: "Spice Bag", price: 8.50, category: "chicken", isAvailable: true, preparationTime: 12, tags: ["popular"] },

  // Kebabs
  { name: "Doner Kebab", price: 7.00, category: "kebabs", isAvailable: true, preparationTime: 8 },
  { name: "Chicken Kebab", price: 7.50, category: "kebabs", isAvailable: true, preparationTime: 8 },
  { name: "Mixed Kebab", price: 9.00, category: "kebabs", isAvailable: true, preparationTime: 10 },
  { name: "Kebab Tray", price: 8.00, category: "kebabs", isAvailable: true, preparationTime: 8 },

  // Meals
  { name: "Burger & Chips Meal", price: 8.50, category: "meals", isAvailable: true, preparationTime: 12, tags: ["popular"] },
  { name: "Chicken Tender Meal", price: 9.00, category: "meals", isAvailable: true, preparationTime: 12 },
  { name: "Fish & Chips Meal", price: 11.00, category: "meals", isAvailable: true, preparationTime: 15 },
  { name: "Spice Bag Meal", price: 11.50, category: "meals", isAvailable: true, preparationTime: 15 },
  { name: "Kids Meal", price: 5.50, category: "meals", isAvailable: true, preparationTime: 10 },

  // Drinks
  { name: "Coke", price: 1.80, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Fanta", price: 1.80, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Sprite", price: 1.80, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Water", price: 1.50, category: "drinks", isAvailable: true, preparationTime: 0 },
  { name: "Capri Sun", price: 1.50, category: "drinks", isAvailable: true, preparationTime: 0 },

  // Extras
  { name: "Extra Cheese", price: 0.50, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Extra Sauce", price: 0.30, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Garlic Dip", price: 0.50, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Curry Sauce", price: 1.00, category: "extras", isAvailable: true, preparationTime: 0 },
  { name: "Bag", price: 0.10, category: "extras", isAvailable: true, preparationTime: 0 },
];
