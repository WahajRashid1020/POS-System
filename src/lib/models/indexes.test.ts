import { describe, expect, it } from "vitest";
import { OrderModel } from "./Order";
import { StripeEventModel } from "./StripeEvent";

type IndexDefinition = [Record<string, number>, Record<string, unknown>];

describe("Order indexes", () => {
  const indexes = OrderModel.schema.indexes() as IndexDefinition[];

  it("allows a card payment id on only one order", () => {
    const paymentIndex = indexes.find(([fields]) => "paymentIntentId" in fields);

    expect(paymentIndex).toBeDefined();
    expect(paymentIndex?.[1].unique).toBe(true);
  });

  it("is partial, so cash orders with no payment id never collide", () => {
    const paymentIndex = indexes.find(([fields]) => "paymentIntentId" in fields);

    expect(paymentIndex?.[1].partialFilterExpression).toEqual({
      paymentIntentId: { $type: "string" },
    });
  });

  it("keeps the existing lookup indexes", () => {
    expect(indexes.some(([fields]) => fields.status === 1 && fields.createdAt === -1)).toBe(true);
    expect(indexes.some(([fields]) => Object.keys(fields).join() === "createdAt")).toBe(true);
  });
});

describe("Stripe event records", () => {
  const indexes = StripeEventModel.schema.indexes() as IndexDefinition[];

  it("expire on their own after 30 days", () => {
    const ttl = indexes.find(([fields]) => "createdAt" in fields);

    expect(ttl?.[1].expireAfterSeconds).toBe(60 * 60 * 24 * 30);
  });

  it("use the Stripe event id as the document id, so duplicates are impossible", () => {
    expect(StripeEventModel.schema.path("_id").instance).toBe("String");
  });
});
