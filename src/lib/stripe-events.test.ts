import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), deleteOne: vi.fn() }));

vi.mock("@/lib/models/StripeEvent", () => ({
  StripeEventModel: { create: mocks.create, deleteOne: mocks.deleteOne },
}));

import { claimStripeEvent, releaseStripeEvent } from "./stripe-events";

const duplicate = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000 });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("claimStripeEvent", () => {
  it("records the event id and says it is new", async () => {
    mocks.create.mockResolvedValue({});

    await expect(claimStripeEvent("evt_1")).resolves.toBe(true);
    expect(mocks.create).toHaveBeenCalledWith({ _id: "evt_1" });
  });

  it("says the event was already seen when the id exists", async () => {
    mocks.create.mockRejectedValue(duplicate());

    await expect(claimStripeEvent("evt_1")).resolves.toBe(false);
  });

  it("does not hide real database failures", async () => {
    mocks.create.mockRejectedValue(new Error("connection lost"));

    await expect(claimStripeEvent("evt_1")).rejects.toThrow("connection lost");
  });
});

describe("releaseStripeEvent", () => {
  it("deletes the claim so a retry is processed", async () => {
    mocks.deleteOne.mockResolvedValue({});

    await releaseStripeEvent("evt_1");

    expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: "evt_1" });
  });

  it("never throws, even if the delete fails", async () => {
    mocks.deleteOne.mockRejectedValue(new Error("db down"));

    await expect(releaseStripeEvent("evt_1")).resolves.toBeUndefined();
  });
});
