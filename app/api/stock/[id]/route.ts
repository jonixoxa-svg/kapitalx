import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, quantity, unit, description, minQuantity } = body;

  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Nuk u gjet" }, { status: 404 });

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (unit !== undefined) data.unit = unit;
  if (description !== undefined) data.description = description;
  if (minQuantity !== undefined) data.minQuantity = minQuantity === "" ? null : parseFloat(minQuantity);

  let movementToCreate: any = null;
  if (quantity !== undefined) {
    const newQty = parseFloat(quantity);
    const diff = newQty - existing.quantity;
    data.quantity = newQty;
    if (diff !== 0) {
      movementToCreate = {
        stockItemId: id,
        type: "ADJUSTED",
        quantity: diff,
        reason: "Rregullim manual",
      };
    }
  }

  const updated = await prisma.stockItem.update({ where: { id }, data });
  if (movementToCreate) {
    await prisma.stockMovement.create({ data: movementToCreate });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.stockItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
