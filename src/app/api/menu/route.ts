import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { MenuItemModel } from "@/lib/models/MenuItem";

// GET /api/menu - list all menu items
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

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

// POST /api/menu - create menu item (admin only)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const item = await MenuItemModel.create(body);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/menu error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
