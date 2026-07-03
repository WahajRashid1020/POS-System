import type {
  CreateOrderInput,
  GetOrdersResponse,
  Order,
  OrderResponse,
  OrderStatus,
} from "@/types";
import { apiFetch, apiMutate } from "./client";

/** List the most recent orders (newest first), capped at `limit`. */
export async function getOrders(limit: number): Promise<Order[]> {
  const data = await apiFetch<GetOrdersResponse>(`/api/orders?limit=${limit}`, {
    fallbackMessage: "Failed to fetch orders",
  });
  return data.orders;
}

/** Create a new order. Returns the persisted order. */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const data = await apiMutate<OrderResponse>(
    "/api/orders",
    "POST",
    input,
    "Failed to place order",
  );
  return data.order;
}

/** Update an order's status. */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const data = await apiMutate<OrderResponse>(
    `/api/orders/${orderId}`,
    "PATCH",
    { status },
    "Failed to update order",
  );
  return data.order;
}
