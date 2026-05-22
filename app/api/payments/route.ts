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
  const projectId = searchParams.get("projectId");

  const payments = await prisma.projectPayment.findMany({
    where: projectId ? { projectId } : {},
    include: { project: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(payments);
}

// POST accepts multipart/form-data: amount, date, description, projectId, file?
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const projectId = formData.get("projectId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const date = formData.get("date") as string;
  const description = (formData.get("description") as string) || null;
  const file = formData.get("file") as File | null;

  if (!projectId || !amount || !date) {
    return NextResponse.json({ error: "projectId, amount, date janë të detyrueshme" }, { status: 400 });
  }

  let receiptUrl: string | null = null;
  let receiptName: string | null = null;

  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;

    if (isSupabaseConfigured() && supabaseAdmin) {
      // Production: ngarko ne Supabase Storage
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const objectPath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(RECEIPTS_BUCKET)
        .upload(objectPath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("[supabase upload]", uploadError);
        return NextResponse.json(
          { error: "Gabim gjate ngarkimit te fotos: " + uploadError.message },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(RECEIPTS_BUCKET)
        .getPublicUrl(objectPath);

      receiptUrl = publicUrlData.publicUrl;
      receiptName = file.name;
    } else {
      // Lokal: ruaje ne filesystem (per zhvillim ne kompjuter)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts", projectId);
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      receiptUrl = `/uploads/receipts/${projectId}/${fileName}`;
      receiptName = file.name;
    }
  }

  const payment = await prisma.projectPayment.create({
    data: {
      projectId,
      amount,
      date: new Date(date),
      description,
      receiptUrl,
      receiptName,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
