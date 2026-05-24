import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/stock/use - use material from stock for project or production
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { stockItemId, quantity, projectId, productionId, reason } = body;

  if (!stockItemId || !quantity) {
    return NextResponse.json({ error: "stockItemId dhe quantity te detyrueshme" }, { status: 400 });
  }

  const qty = parseFloat(quantity);
  if (qty <= 0) {
    return NextResponse.json({ error: "Sasia duhet te jete > 0" }, { status: 400 });
  }

  const item = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
  if (!item) return NextResponse.json({ error: "Materiali nuk u gjet" }, { status: 404 });

  if (item.quantity < qty) {
    return NextResponse.json(
      { error: `Stoku i pamjaftueshëm. Aktual: ${item.quantity} ${item.unit}` },
      { status: 400 }
    );
  }

  // Decrement stock + create movement
  const [updated, movement] = await prisma.$transaction([
    prisma.stockItem.update({
      where: { id: stockItemId },
      data: { quantity: item.quantity - qty },
    }),
    prisma.stockMovement.create({
      data: {
        stockItemId,
        type: projectId ? "USED_IN_PROJECT" : productionId ? "USED_IN_PRODUCTION" : "ADJUSTED",
        quantity: -qty,
        reason: reason || null,
        projectId: projectId || null,
        productionId: productionId || null,
      },
    }),
  ]);

  return NextResponse.json({ item: updated, movement }, { status: 201 });
}
