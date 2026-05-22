import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const projectId = formData.get("projectId") as string;

  if (!file || !projectId) {
    return NextResponse.json({ error: "File dhe projectId janë të detyrueshme" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  const doc = await prisma.document.create({
    data: {
      projectId,
      name: file.name,
      type: file.type,
      url: `/uploads/${projectId}/${fileName}`,
      size: file.size,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
