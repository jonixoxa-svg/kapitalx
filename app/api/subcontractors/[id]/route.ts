import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sub = await prisma.subcontractor.findUnique({
    where: { id },
    include: {
      assignments: {
        include: {
          project: { select: { id: true, name: true, client: true } },
          payments: { orderBy: { date: "desc" } },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });
  if (!sub) return NextResponse.json({ error: "Bashkëpuntori nuk u gjet" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  ["name", "specialty", "contactName", "phone", "email", "address", "taxId", "notes"].forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k] || null;
  });
  if (body.active !== undefined) data.active = !!body.active;

  const updated = await prisma.subcontractor.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.subcontractor.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
