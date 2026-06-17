import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subcontractors = await prisma.subcontractor.findMany({
    include: {
      assignments: {
        include: {
          project: { select: { id: true, name: true } },
          payments: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(subcontractors);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, specialty, contactName, phone, email, address, taxId, notes } = body;

  if (!name || name.trim() === "") {
    return NextResponse.json({ error: "Emri është i detyrueshëm" }, { status: 400 });
  }

  const sub = await prisma.subcontractor.create({
    data: {
      name: name.trim(),
      specialty: specialty || null,
      contactName: contactName || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      taxId: taxId || null,
      notes: notes || null,
    },
  });
  return NextResponse.json(sub, { status: 201 });
}
