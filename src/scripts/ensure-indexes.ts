/**
 * Creates the database indexes the app relies on (see the models).
 *
 * Look first, change nothing:  npx tsx src/scripts/ensure-indexes.ts --check
 * Create the indexes:          npx tsx src/scripts/ensure-indexes.ts
 *
 * Make sure MONGODB_URI is set in .env.local
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { OrderModel } from "../lib/models/Order";
import { StripeEventModel } from "../lib/models/StripeEvent";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function listIndexes(label: string, model: typeof OrderModel) {
  const indexes = await model.collection.indexes();
  console.log(`${label}:`);
  for (const index of indexes) {
    console.log(`  - ${index.name}${index.unique ? " (unique)" : ""}`);
  }
}

async function run(uri: string) {
  const checkOnly = process.argv.includes("--check");

  // autoIndex off: Mongoose would otherwise build every index the models define
  // the moment it connects, which would make --check change the database.
  await mongoose.connect(uri, { autoIndex: false });
  console.log(`Connected. Mode: ${checkOnly ? "check only" : "create indexes"}`);

  // A unique index cannot be built over data that already breaks the rule, so
  // look for payment ids shared by several orders first.
  const duplicates = await OrderModel.aggregate([
    { $match: { paymentIntentId: { $type: "string" } } },
    { $group: { _id: "$paymentIntentId", orders: { $sum: 1 } } },
    { $match: { orders: { $gt: 1 } } },
    { $limit: 50 },
  ]);

  const withPayment = await OrderModel.countDocuments({
    paymentIntentId: { $type: "string" },
  });
  console.log(`Orders with a card payment id: ${withPayment}`);

  if (duplicates.length > 0) {
    console.error(
      `${duplicates.length} payment id(s) are used by more than one order. ` +
        "Resolve those orders before creating the unique index. Nothing was changed.",
    );
    process.exitCode = 1;
    return;
  }
  console.log("No payment id is used by more than one order.");

  if (checkOnly) {
    await listIndexes("Current order indexes", OrderModel);
    console.log("Check only: no indexes were changed.");
    return;
  }

  await OrderModel.createIndexes();
  await StripeEventModel.createIndexes();
  await listIndexes("Order indexes", OrderModel);
  await listIndexes("Stripe event indexes", StripeEventModel);
  console.log("Done.");
}

run(MONGODB_URI)
  .catch((error) => {
    console.error("ensure-indexes failed:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
