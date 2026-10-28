import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  connectDB: vi.fn(),
  updateOne: vi.fn(),
  claimStripeEvent: vi.fn(),
  releaseStripeEvent: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));
vi.mock("@/lib/db", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/lib/models/Order", () => ({
  OrderModel: { updateOne: mocks.updateOne },
}));
vi.mock("@/lib/stripe-events", () => ({
  claimStripeEvent: mocks.claimStripeEvent,
  releaseStripeEvent: mocks.releaseStripeEvent,
}));

import { POST } from "./route";

function webhookRequest(headers: Record<string, string> = { "stripe-signature": "t=1,v1=abc" }) {
  return new NextRequest("http://localhost/api/payments/webhook", {
    method: "POST",
    headers,
    body: '{"id":"evt_1"}',
  });
}

const succeeded = (eventId = "evt_1", intentId = "pi_123") => ({
  id: eventId,
  type: "payment_intent.succeeded",
  data: { object: { id: intentId } },
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.claimStripeEvent.mockResolvedValue(true);
  mocks.releaseStripeEvent.mockResolvedValue(undefined);
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
    expect(mocks.claimStripeEvent).not.toHaveBeenCalled();
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("verifies the raw body against the configured secret", async () => {
    mocks.constructEvent.mockReturnValue({ id: "evt_x", type: "ignored.event", data: { object: {} } });
    await POST(webhookRequest());

    expect(mocks.constructEvent).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      "t=1,v1=abc",
      "whsec_test_secret",
    );
  });
});

describe("POST /api/payments/webhook — verified events", () => {
  it("claims the event, then marks the matching order paid", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_1", "pi_123"));
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.claimStripeEvent).toHaveBeenCalledWith("evt_1");
    expect(mocks.updateOne).toHaveBeenCalledWith(
      { paymentIntentId: "pi_123" },
      { $set: { paymentStatus: "paid" } },
    );
    expect(mocks.claimStripeEvent.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.updateOne.mock.invocationCallOrder[0],
    );
  });

  it("ignores other event types without recording them", async () => {
    mocks.constructEvent.mockReturnValue({
      id: "evt_2",
      type: "charge.refunded",
      data: { object: { id: "ch_1" } },
    });
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(mocks.claimStripeEvent).not.toHaveBeenCalled();
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });
});

describe("POST /api/payments/webhook — duplicate deliveries (idempotency)", () => {
  it("acknowledges a repeated event without processing it again", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_1"));
    mocks.claimStripeEvent.mockResolvedValue(false);
    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: true });
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("processes an event only once when Stripe delivers it twice", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_7"));
    mocks.claimStripeEvent.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    await POST(webhookRequest());
    await POST(webhookRequest());

    expect(mocks.claimStripeEvent).toHaveBeenCalledTimes(2);
    expect(mocks.updateOne).toHaveBeenCalledTimes(1);
  });

  it("treats different event ids as separate events", async () => {
    mocks.constructEvent
      .mockReturnValueOnce(succeeded("evt_a", "pi_a"))
      .mockReturnValueOnce(succeeded("evt_b", "pi_b"));

    await POST(webhookRequest());
    await POST(webhookRequest());

    expect(mocks.updateOne).toHaveBeenCalledTimes(2);
  });
});

describe("POST /api/payments/webhook — failures are retried, not lost", () => {
  it("releases the claim and returns 500 so Stripe retries if the update fails", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_1"));
    mocks.updateOne.mockRejectedValue(new Error("db down"));
    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    expect(mocks.releaseStripeEvent).toHaveBeenCalledWith("evt_1");
  });

  it("returns 500 without processing if the event cannot be recorded", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_1"));
    mocks.claimStripeEvent.mockRejectedValue(new Error("db down"));
    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("returns 500 if the database connection fails", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_1"));
    mocks.connectDB.mockRejectedValue(new Error("no connection"));
    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    expect(mocks.claimStripeEvent).not.toHaveBeenCalled();
  });

  it("does not leak internal details in the error response", async () => {
    mocks.constructEvent.mockReturnValue(succeeded("evt_1"));
    mocks.updateOne.mockRejectedValue(new Error("mongodb://user:secret@host"));
    const res = await POST(webhookRequest());

    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});
