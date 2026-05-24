import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { supabaseAdmin, RECEIPTS_BUCKET, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const projectId = searchParams.get("projectId");

  const expenses = await prisma.generalExpense.findMany({
    where: {
      ...(month ? { month: parseInt(month) } : {}),
      ...(year ? { year: parseInt(year) } : {}),
      ...(projectId ? { projectId } : {}),
    },
    include: { project: { select: { id: true, name: true } } },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  let data: any = {};
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    data = {
      category: fd.get("category"),
      description: fd.get("description"),
      amount: fd.get("amount"),
      month: fd.get("month"),
      year: fd.get("year"),
      recurring: fd.get("recurring") === "true",
      projectId: fd.get("projectId") || null,
      date: fd.get("date") || null,
    };
    file = fd.get("file") as File | null;
  } else {
    data = await req.json();
  }

  const { category, description, amount, month, year, recurring, projectId, date } = data;

  if (!category || !description || !amount || !month || !year) {
    return NextResponse.json({ error: "Fushat e detyrueshme mungojnë" }, { status: 400 });
  }

  let receiptUrl: string | null = null;
  let receiptName: string | null = null;

  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const folder = projectId || "general";

    if (isSupabaseConfigured() && supabaseAdmin) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const objectPath = `expenses/${folder}/${fileName}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(RECEIPTS_BUCKET)
        .upload(objectPath, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) {
        return NextResponse.json({ error: "Upload error: " + upErr.message }, { status: 500 });
      }
      const { data: pub } = supabaseAdmin.storage.from(RECEIPTS_BUCKET).getPublicUrl(objectPath);
      receiptUrl = pub.publicUrl;
      receiptName = file.name;
    } else {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = path.join(process.cwd(), "public", "uploads", "expenses", folder);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      receiptUrl = `/uploads/expenses/${folder}/${fileName}`;
      receiptName = file.name;
    }
  }

  const expense = await prisma.generalExpense.create({
    data: {
      category,
      description,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      recurring: recurring || false,
      projectId: projectId || null,
      receiptUrl,
      receiptName,
      date: date ? new Date(date) : new Date(),
    },
    include: { project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expense, { status: 201 });
}
