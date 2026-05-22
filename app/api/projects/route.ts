import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const projects = await prisma.project.findMany({
    where: {
      ...(status && status !== "ALL" ? { status: status as any } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { client: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      expenses: true,
      workerAssignments: { include: { worker: true } },
      documents: true,
      createdBy: { select: { name: true, email: true } },
      _count: { select: { expenses: true, workerAssignments: true, documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, client, location, description, startDate, endDate, status, contractValue, notes } = body;

  if (!name || !client || !location || !startDate) {
    return NextResponse.json({ error: "Fushat e detyrueshme mungojnë" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      client,
      location,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status: status || "PLANNED",
      contractValue: parseFloat(contractValue) || 0,
      notes,
      createdById: (session.user as any).id,
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: (session.user as any).id,
      action: "PROJECT_CREATED",
      description: `Projekti '${project.name}' u krijua`,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
