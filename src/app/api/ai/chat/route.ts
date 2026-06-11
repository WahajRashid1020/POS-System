import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";
import { askGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Fetch recent order data for context
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 7,
    );
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate(),
    );

    // Today's orders
    const todayOrders = await OrderModel.find({
      createdAt: { $gte: todayStart },
      status: { $nin: ["cancelled"] },
    }).lean();

    // This week's orders
    const weekOrders = await OrderModel.find({
      createdAt: { $gte: weekStart },
      status: { $nin: ["cancelled"] },
    }).lean();

    // This month's orders
    const monthOrders = await OrderModel.find({
      createdAt: { $gte: monthStart },
      status: { $nin: ["cancelled"] },
    }).lean();

    // Build stats
    const buildStats = (orders: any[]) => {
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const itemMap: Record<string, { qty: number; revenue: number }> = {};
      const categoryMap: Record<string, { qty: number; revenue: number }> = {};
      const typeMap: Record<string, number> = {};
      const paymentMap: Record<string, { count: number; revenue: number }> = {};
      const hourMap: Record<number, number> = {};

      orders.forEach((order: any) => {
        // Order type
        typeMap[order.type] = (typeMap[order.type] || 0) + 1;

        // Payment method
        if (order.paymentMethod) {
          if (!paymentMap[order.paymentMethod]) {
            paymentMap[order.paymentMethod] = { count: 0, revenue: 0 };
          }
          paymentMap[order.paymentMethod].count += 1;
          paymentMap[order.paymentMethod].revenue += order.total;
        }

        // Hour distribution
        const hour = new Date(order.createdAt).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;

        // Items
        order.items.forEach((item: any) => {
          const name = item.menuItem?.name || "Unknown";
          const cat = item.menuItem?.category || "unknown";

          if (!itemMap[name]) itemMap[name] = { qty: 0, revenue: 0 };
          itemMap[name].qty += item.quantity;
          itemMap[name].revenue += item.price * item.quantity;

          if (!categoryMap[cat]) categoryMap[cat] = { qty: 0, revenue: 0 };
          categoryMap[cat].qty += item.quantity;
          categoryMap[cat].revenue += item.price * item.quantity;
        });
      });

      const topItems = Object.entries(itemMap)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));

      const categories = Object.entries(categoryMap)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([cat, data]) => ({ category: cat, ...data }));

      // Busiest hour
      const busiestHour = Object.entries(hourMap).sort(
        (a, b) => b[1] - a[1],
      )[0];

      return {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        avgOrderValue: avgOrderValue.toFixed(2),
        topItems,
        categories,
        orderTypes: typeMap,
        paymentMethods: paymentMap,
        busiestHour: busiestHour
          ? { hour: `${busiestHour[0]}:00`, orders: busiestHour[1] }
          : null,
      };
    };

    const todayStats = buildStats(todayOrders);
    const weekStats = buildStats(weekOrders);
    const monthStats = buildStats(monthOrders);

    // Build prompt with real data
    const prompt = `You are a smart restaurant analytics assistant for "QuickServe", a quick-service restaurant (chipper) in Dublin, Ireland. You help managers understand their sales data and make better decisions.

Here is the current real data from the POS system:

=== TODAY'S DATA ===
Total Orders: ${todayStats.totalOrders}
Total Revenue: €${todayStats.totalRevenue}
Average Order Value: €${todayStats.avgOrderValue}
Top Selling Items: ${JSON.stringify(todayStats.topItems)}
Categories: ${JSON.stringify(todayStats.categories)}
Order Types: ${JSON.stringify(todayStats.orderTypes)}
Payment Methods: ${JSON.stringify(todayStats.paymentMethods)}
Busiest Hour: ${JSON.stringify(todayStats.busiestHour)}

=== THIS WEEK'S DATA ===
Total Orders: ${weekStats.totalOrders}
Total Revenue: €${weekStats.totalRevenue}
Average Order Value: €${weekStats.avgOrderValue}
Top Selling Items: ${JSON.stringify(weekStats.topItems.slice(0, 5))}

=== THIS MONTH'S DATA ===
Total Orders: ${monthStats.totalOrders}
Total Revenue: €${monthStats.totalRevenue}
Average Order Value: €${monthStats.avgOrderValue}

Currency is Euro (€). The restaurant serves burgers, chips, fish, chicken, kebabs, meals, drinks, and extras.

Rules:
- Be concise, friendly, and data-driven
- Use actual numbers from the data above
- If there's no data, say so honestly — don't make up numbers
- Give actionable insights when relevant
- Format currency as €X.XX
- Use short paragraphs, not long walls of text
- You can use simple emoji for readability

Manager's question: ${message}`;

    const response = await askGemini(prompt);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: error.message || "AI chat failed" },
      { status: 500 },
    );
  }
}
