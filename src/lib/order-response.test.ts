import { describe, expect, it } from "vitest";
import { toPublicOrder } from "./order-response";

describe("toPublicOrder", () => {
  it("removes internal fields but keeps everything the screens use", () => {
    const result = toPublicOrder({
      _id: "o1",
      orderNumber: 7,
      total: 5.45,
      paymentIntentId: "pi_secret",
      __v: 0,
    });

    expect(result).toEqual({ _id: "o1", orderNumber: 7, total: 5.45 });
  });

  it("serialises a document through toJSON first", () => {
    const doc = {
      toJSON: () => ({ _id: "o2", orderNumber: 1, paymentIntentId: "pi_x", __v: 3 }),
    };

    expect(toPublicOrder(doc)).toEqual({ _id: "o2", orderNumber: 1 });
  });

  it("does not mutate the original", () => {
    const original = { _id: "o3", paymentIntentId: "pi_keep" };
    toPublicOrder(original);

    expect(original.paymentIntentId).toBe("pi_keep");
  });
});
