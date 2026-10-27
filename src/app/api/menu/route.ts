import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MenuItemModel } from "@/lib/models/MenuItem";
import { requireRole } from "@/lib/api-auth";
import { rejectCrossOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createMenuItemSchema,
  menuCategoryQuerySchema,
} from "@/lib/validation";

const STAFF_ROLES = ["admin", "manager", "cashier", "kitchen"] as const;

// GET /api/menu - list all menu items
export async function GET(req: NextRequest) {
  const auth = await requireRole(STAFF_ROLES, "GET /api/menu");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const rawCategory = searchParams.get("category");

    let category: string | null = null;
    if (rawCategory !== null) {
      const parsed = menuCategoryQuerySchema.safeParse(rawCategory);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      category = parsed.data;
    }

    await connectDB();

    const filter = category ? { category, isAvailable: true } : { isAvailable: true };
    const items = await MenuItemModel.find(filter).sort({ name: 1 }).lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/menu error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

// POST /api/menu - create menu item (admin/manager only)
export async function POST(req: NextRequest) {
  const route = "POST /api/menu";

  const crossOrigin = rejectCrossOrigin(req, route);
  if (crossOrigin) return crossOrigin;

  const auth = await requireRole(["admin", "manager"], route);
  if (!auth.ok) return auth.response;

  const limited = enforceRateLimit(req, "menu-create", {
    limit: 20,
    windowMs: 60_000,
    userId: auth.userId,
  });
  if (limited) return limited;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Whitelist: only known menu fields, with types and limits enforced.
    const parsed = createMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid menu item" }, { status: 400 });
    }

    await connectDB();

    const item = await MenuItemModel.create(parsed.data);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/menu error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
