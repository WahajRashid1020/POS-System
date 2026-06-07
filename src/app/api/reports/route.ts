import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today";

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
        );
        break;
      case "week":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7,
        );
        break;
      case "month":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        break;
      case "all":
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const endDate =
      range === "yesterday"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : now;

    // Fetch orders in range (only completed and non-cancelled)
    const orders = await OrderModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $nin: ["cancelled"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    // ---- Aggregate stats ----

    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o: any) => o.status === "completed",
    ).length;
    const totalRevenue = orders.reduce(
      (sum: number, o: any) => sum + o.total,
      0,
    );
    const totalSubtotal = orders.reduce(
      (sum: number, o: any) => sum + o.subtotal,
      0,
    );
    const totalTax = orders.reduce((sum: number, o: any) => sum + o.tax, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Orders by hour
    const ordersByHour: { hour: string; orders: number; revenue: number }[] =
      [];
    for (let h = 0; h < 24; h++) {
      const hourOrders = orders.filter((o: any) => {
        const orderHour = new Date(o.createdAt).getHours();
        return orderHour === h;
      });
      ordersByHour.push({
        hour: `${h.toString().padStart(2, "0")}:00`,
        orders: hourOrders.length,
        revenue: hourOrders.reduce((sum: number, o: any) => sum + o.total, 0),
      });
    }

    // Orders by type
    const ordersByType = ["dine-in", "takeaway", "delivery"].map((type) => {
      const typeOrders = orders.filter((o: any) => o.type === type);
      return {
        type,
        count: typeOrders.length,
        revenue: typeOrders.reduce((sum: number, o: any) => sum + o.total, 0),
      };
    });

    // Orders by status
    const ordersByStatus = [
      "pending",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ].map((status) => ({
      status,
      count: orders.filter((o: any) => o.status === status).length,
    }));

    // Payment methods
    const paymentMethods = ["cash", "card"].map((method) => {
      const methodOrders = orders.filter(
        (o: any) => o.paymentMethod === method,
      );
      return {
        method,
        count: methodOrders.length,
        revenue: methodOrders.reduce((sum: number, o: any) => sum + o.total, 0),
      };
    });

    // Top selling items
    const itemMap: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const name = item.menuItem?.name || "Unknown";
        if (!itemMap[name]) {
          itemMap[name] = { name, quantity: 0, revenue: 0 };
        }
        itemMap[name].quantity += item.quantity;
        itemMap[name].revenue += item.price * item.quantity;
      });
    });
    const topItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Top categories
    const categoryMap: Record<
      string,
      { category: string; quantity: number; revenue: number }
    > = {};
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const cat = item.menuItem?.category || "unknown";
        if (!categoryMap[cat]) {
          categoryMap[cat] = { category: cat, quantity: 0, revenue: 0 };
        }
        categoryMap[cat].quantity += item.quantity;
        categoryMap[cat].revenue += item.price * item.quantity;
      });
    });
    const topCategories = Object.values(categoryMap).sort(
      (a, b) => b.revenue - a.revenue,
    );

    // Orders by day (for week/month view)
    const ordersByDay: { date: string; orders: number; revenue: number }[] = [];
    if (range === "week" || range === "month" || range === "all") {
      const dayMap: Record<string, { orders: number; revenue: number }> = {};
      orders.forEach((o: any) => {
        const day = new Date(o.createdAt).toISOString().split("T")[0];
        if (!dayMap[day]) dayMap[day] = { orders: 0, revenue: 0 };
        dayMap[day].orders += 1;
        dayMap[day].revenue += o.total;
      });
      Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, data]) => {
          ordersByDay.push({ date, ...data });
        });
    }

    // Average preparation time (for completed orders)
    const completedWithTimes = orders.filter(
      (o: any) => o.status === "completed" && o.completedAt,
    );
    const avgPrepTime =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((sum: number, o: any) => {
            const created = new Date(o.createdAt).getTime();
            const completed = new Date(o.completedAt).getTime();
            return sum + (completed - created) / 60000;
          }, 0) / completedWithTimes.length
        : 0;

    return NextResponse.json({
      summary: {
        totalOrders,
        completedOrders,
        totalRevenue,
        totalSubtotal,
        totalTax,
        averageOrderValue,
        avgPrepTime: Math.round(avgPrepTime * 10) / 10,
      },
      ordersByHour,
      ordersByType,
      ordersByStatus,
      paymentMethods,
      topItems,
      topCategories,
      ordersByDay,
      range,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
