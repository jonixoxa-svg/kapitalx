import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./utils";

interface Summary {
  totalRevenue: number;
  totalProjectExpenses: number;
  totalLaborCost: number;
  totalGeneralExpenses: number;
  grossProfit: number;
  netProfit: number;
}

interface ProjectFinancial {
  name: string;
  client: string;
  status: string;
  contractValue: number;
  totalCost: number;
  profit: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export function exportToPDF(
  summary: Summary,
  projects: ProjectFinancial[],
  monthly: MonthlyData[]
) {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("sq-AL");

  // Header
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("KapitalX", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Raporti Financiar", 14, 21);
  doc.text(`Data: ${date}`, 196, 21, { align: "right" });

  // Summary section
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Permbledhje Financiare", 14, 42);

  autoTable(doc, {
    startY: 47,
    head: [["Treguesi", "Vlera"]],
    body: [
      ["Te Ardhura Totale", formatCurrency(summary.totalRevenue)],
      ["Shpenzime Projekti", formatCurrency(summary.totalProjectExpenses)],
      ["Kosto Punetoresh", formatCurrency(summary.totalLaborCost)],
      ["Shpenzime Kompanie", formatCurrency(summary.totalGeneralExpenses)],
      ["Fitimi Bruto", formatCurrency(summary.grossProfit)],
      ["Fitimi Neto", formatCurrency(summary.netProfit)],
    ],
    theme: "striped",
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 10 },
  });

  // Projects section
  const afterSummary = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Profitabiliteti sipas Projektit", 14, afterSummary);

  autoTable(doc, {
    startY: afterSummary + 5,
    head: [["Projekti", "Klienti", "Kontrata", "Kosto", "Fitimi"]],
    body: projects.map((p) => [
      p.name,
      p.client,
      formatCurrency(p.contractValue),
      formatCurrency(p.totalCost),
      formatCurrency(p.profit),
    ]),
    theme: "striped",
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 9 },
  });

  // Monthly section
  const afterProjects = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Te dhena Mujore", 14, afterProjects);

  autoTable(doc, {
    startY: afterProjects + 5,
    head: [["Muaji", "Te Ardhura", "Shpenzime", "Fitim"]],
    body: monthly.map((m) => [
      m.month,
      formatCurrency(m.revenue),
      formatCurrency(m.expenses),
      formatCurrency(m.profit),
    ]),
    theme: "striped",
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 9 },
  });

  doc.save(`kapitalx-raport-${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportToExcel(
  summary: Summary,
  projects: ProjectFinancial[],
  monthly: MonthlyData[]
) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KapitalX";
  workbook.created = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet("Përmbledhje");
  summarySheet.columns = [
    { header: "Treguesi", key: "metric", width: 30 },
    { header: "Vlera (ALL)", key: "value", width: 20 },
  ];
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF97316" },
  };
  [
    ["Të Ardhura Totale", summary.totalRevenue],
    ["Shpenzime Projekti", summary.totalProjectExpenses],
    ["Kosto Punëtorësh", summary.totalLaborCost],
    ["Shpenzime Kompanie", summary.totalGeneralExpenses],
    ["Fitimi Bruto", summary.grossProfit],
    ["Fitimi Neto", summary.netProfit],
  ].forEach(([metric, value]) => {
    summarySheet.addRow({ metric, value });
  });

  // Projects sheet
  const projectsSheet = workbook.addWorksheet("Projektet");
  projectsSheet.columns = [
    { header: "Projekti", key: "name", width: 30 },
    { header: "Klienti", key: "client", width: 25 },
    { header: "Statusi", key: "status", width: 15 },
    { header: "Kontrata", key: "contract", width: 18 },
    { header: "Kosto Totale", key: "cost", width: 18 },
    { header: "Fitimi", key: "profit", width: 18 },
  ];
  projectsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  projectsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF97316" },
  };
  projects.forEach((p) => {
    projectsSheet.addRow({
      name: p.name,
      client: p.client,
      status: p.status,
      contract: p.contractValue,
      cost: p.totalCost,
      profit: p.profit,
    });
  });

  // Monthly sheet
  const monthlySheet = workbook.addWorksheet("Mujore");
  monthlySheet.columns = [
    { header: "Muaji", key: "month", width: 15 },
    { header: "Të Ardhura", key: "revenue", width: 18 },
    { header: "Shpenzime", key: "expenses", width: 18 },
    { header: "Fitim", key: "profit", width: 18 },
  ];
  monthlySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  monthlySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF97316" },
  };
  monthly.forEach((m) => {
    monthlySheet.addRow(m);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kapitalx-raport-${new Date().toISOString().split("T")[0]}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
