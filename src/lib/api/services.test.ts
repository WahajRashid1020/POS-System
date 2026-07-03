import { afterEach, describe, expect, it, vi } from "vitest";
import { createOrder, getOrders, updateOrderStatus } from "./orders";
import { getReport } from "./reports";
import { sendChatMessage } from "./ai";
import type { CreateOrderInput } from "@/types";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("orders service", () => {
  it("getOrders requests the limit and unwraps `orders`", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ orders: [{ _id: "1" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const orders = await getOrders(20);

    // `fallbackMessage` is consumed internally and not forwarded to fetch.
    expect(fetchMock).toHaveBeenCalledWith("/api/orders?limit=20", {});
    expect(orders).toEqual([{ _id: "1" }]);
  });

  it("createOrder POSTs the input and unwraps `order`", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ order: { orderNumber: 7 } }, true, 201));
    vi.stubGlobal("fetch", fetchMock);

    const input: CreateOrderInput = {
      items: [
        {
          menuItem: { name: "Fries", price: 3, category: "chips" },
          quantity: 2,
          price: 3,
        },
      ],
      type: "dine-in",
      paymentMethod: "cash",
    };

    const order = await createOrder(input);

    expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(order).toEqual({ orderNumber: 7 });
  });

  it("createOrder surfaces the server error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Order must have at least one item" }, false, 400),
      ),
    );

    await expect(
      createOrder({ items: [], type: "dine-in", paymentMethod: "cash" }),
    ).rejects.toThrow("Order must have at least one item");
  });

  it("updateOrderStatus PATCHes the status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ order: { _id: "1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await updateOrderStatus("1", "preparing");

    expect(fetchMock).toHaveBeenCalledWith("/api/orders/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "preparing" }),
    });
  });
});

describe("reports service", () => {
  it("getReport requests the range", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ range: "week" }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await getReport("week");

    expect(fetchMock).toHaveBeenCalledWith("/api/reports?range=week", {});
    expect(data).toEqual({ range: "week" });
  });
});

describe("ai service", () => {
  it("sendChatMessage POSTs the message and unwraps `response`", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ response: "Hello!" }));
    vi.stubGlobal("fetch", fetchMock);

    const reply = await sendChatMessage("how are sales?");

    expect(fetchMock).toHaveBeenCalledWith("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "how are sales?" }),
    });
    expect(reply).toBe("Hello!");
  });
});
