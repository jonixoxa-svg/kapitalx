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
  const { itemName, quantity, estimatedHours, startDate, endDate, status, notes, workerIds } = body;

  const data: any = {};
  if (itemName !== undefined) data.itemName = itemName;
  if (quantity !== undefined) data.quantity = parseInt(quantity);
  if (estimatedHours !== undefined) data.estimatedHours = parseFloat(estimatedHours);
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;

  if (workerIds && Array.isArray(workerIds)) {
    // Replace workers
    await prisma.productionWorker.deleteMany({ where: { productionId: id } });
    data.workers = {
      create: workerIds.map((wid: string) => ({
        worker: { connect: { id: wid } },
        hoursAssigned: 0,
      })),
    };
  }

  const updated = await prisma.production.update({
    where: { id },
    data,
    include: { workers: { include: { worker: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.production.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
