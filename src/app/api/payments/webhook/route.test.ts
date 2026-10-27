import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  connectDB: vi.fn(),
  updateOne: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));
vi.mock("@/lib/db", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/lib/models/Order", () => ({
  OrderModel: { updateOne: mocks.updateOne },
}));

import { POST } from "./route";

function webhookRequest(headers: Record<string, string> = { "stripe-signature": "t=1,v1=abc" }) {
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    headers,
    body: '{"id":"evt_1"}',
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/payments/webhook — forged or malformed calls", () => {
  it("rejects a request with no signature header", async () => {
    const res = await POST(webhookRequest({}));

    expect(res.status).toBe(400);
    expect(mocks.constructEvent).not.toHaveBeenCalled();
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("rejects everything when the webhook secret is not configured", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const res = await POST(webhookRequest());

    expect(res.status).toBe(400);
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("rejects a forged signature and never touches the database", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });
    const res = await POST(webhookRequest());

    expect(res.status).toBe(400);
    expect(mocks.connectDB).not.toHaveBeenCalled();
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("verifies the raw body against the configured secret", async () => {
    mocks.constructEvent.mockReturnValue({ type: "ignored.event", data: { object: {} } });
    await POST(webhookRequest());

    expect(mocks.constructEvent).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      "t=1,v1=abc",
      "whsec_test_secret",
    );
  });
});

describe("POST /api/payments/webhook — verified events", () => {
  it("marks the matching order paid on payment_intent.succeeded", async () => {
    mocks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.updateOne).toHaveBeenCalledWith(
      { paymentIntentId: "pi_123" },
      { $set: { paymentStatus: "paid" } },
    );
  });

  it("ignores other event types", async () => {
    mocks.constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: { object: { id: "ch_1" } },
    });
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("still acknowledges Stripe if the database update fails", async () => {
    mocks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });
    mocks.updateOne.mockRejectedValue(new Error("db down"));
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
