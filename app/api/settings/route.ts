import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper: gjej ose krijo settings (singleton)
async function getOrCreateSettings() {
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { totalRevenue: 0 },
    });
  }
  return settings;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role === "VIEWER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { totalRevenue, totalRevenueNote, cashOnHand, bankOverdraft, monthlyExpensesAverage, targetMonthlyProfit } = body;

  const settings = await getOrCreateSettings();

  const data: any = {};
  if (totalRevenue !== undefined) {
    const val = parseFloat(totalRevenue);
    if (isNaN(val)) {
      return NextResponse.json({ error: "Vlere e pavlefshme" }, { status: 400 });
    }
    data.totalRevenue = val;
  }
  if (totalRevenueNote !== undefined) {
    data.totalRevenueNote = totalRevenueNote || null;
  }
  if (cashOnHand !== undefined) {
    const val = parseFloat(cashOnHand);
    if (!isNaN(val)) data.cashOnHand = val;
  }
  if (bankOverdraft !== undefined) {
    const val = parseFloat(bankOverdraft);
    if (!isNaN(val)) data.bankOverdraft = val;
  }
  if (monthlyExpensesAverage !== undefined) {
    const val = parseFloat(monthlyExpensesAverage);
    if (!isNaN(val) && val >= 0) data.monthlyExpensesAverage = val;
  }
  if (targetMonthlyProfit !== undefined) {
    const val = parseFloat(targetMonthlyProfit);
    if (!isNaN(val) && val >= 0) data.targetMonthlyProfit = val;
  }

  const updated = await prisma.companySettings.update({
    where: { id: settings.id },
    data,
  });

  return NextResponse.json(updated);
}
