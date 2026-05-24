import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.stockItem.findMany({
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          project: { select: { id: true, name: true } },
          production: { select: { id: true, itemName: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, quantity, unit, description, minQuantity } = body;

  if (!name) return NextResponse.json({ error: "Emri mungon" }, { status: 400 });

  const item = await prisma.stockItem.create({
    data: {
      name,
      quantity: parseFloat(quantity) || 0,
      unit: unit || "copë",
      description: description || null,
      minQuantity: minQuantity !== undefined && minQuantity !== "" ? parseFloat(minQuantity) : null,
    },
  });

  // Initial movement record
  if (item.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        stockItemId: item.id,
        type: "ADDED",
        quantity: item.quantity,
        reason: "Sasia fillestare",
      },
    });
  }

  return NextResponse.json(item, { status: 201 });
}
