import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const extras = await prisma.projectExtraWork.findMany({
    where: projectId ? { projectId } : {},
    include: { project: { select: { id: true, name: true, client: true } } },
    orderBy: { agreedDate: "desc" },
  });
  return NextResponse.json(extras);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { projectId, title, description, amount, agreedDate, approvedBy, status, notes } = body;

  if (!projectId || !title || amount === undefined) {
    return NextResponse.json({ error: "projectId, title dhe amount janë të detyrueshme" }, { status: 400 });
  }

  const amt = parseFloat(amount);
  if (isNaN(amt)) {
    return NextResponse.json({ error: "Vlera e pavlefshme" }, { status: 400 });
  }

  const extra = await prisma.projectExtraWork.create({
    data: {
      projectId,
      title,
      description: description || null,
      amount: amt,
      agreedDate: agreedDate ? new Date(agreedDate) : new Date(),
      approvedBy: approvedBy || null,
      status: status || "APPROVED",
      notes: notes || null,
    },
    include: { project: { select: { id: true, name: true, client: true } } },
  });

  return NextResponse.json(extra, { status: 201 });
}
