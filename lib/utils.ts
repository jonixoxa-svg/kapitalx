import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "COMPLETED":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "PLANNED":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "ON_HOLD":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE": return "Aktiv";
    case "COMPLETED": return "Kompletuar";
    case "PLANNED": return "Planifikuar";
    case "ON_HOLD": return "Pezulluar";
    default: return status;
  }
}

export function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    MATERIALS: "Materiale",
    TRANSPORT: "Transport",
    FUEL: "Karburant",
    EQUIPMENT: "Pajisje",
    FOOD: "Ushqim",
    ACCOMMODATION: "Akomodim",
    OTHER: "Të tjera",
  };
  return labels[category] || category;
}

export function getGeneralExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    RENT: "Qiraja",
    ELECTRICITY: "Rryma",
    INTERNET: "Internet",
    ADMIN_SALARIES: "Pagat Administrative",
    MAINTENANCE: "Mirëmbajtja",
    VEHICLES: "Automjetet",
    MARKETING: "Marketingu",
    INSURANCE: "Sigurimi",
    OTHER: "Të tjera",
  };
  return labels[category] || category;
}

export function calculateTotalExpenses(expenses: { amount: number }[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function calculateLaborCost(
  assignments: { daysWorked: number; worker: { dailyRate: number } }[]
): number {
  return assignments.reduce(
    (sum, a) => sum + a.daysWorked * a.worker.dailyRate,
    0
  );
}

export function getMonthName(month: number): string {
  const months = [
    "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
    "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor",
  ];
  return months[month - 1] || "";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getAttendanceStatusLabel(status: string): string {
  switch (status) {
    case "PRESENT": return "Prezent";
    case "SICK": return "Sëmurë";
    case "PAID_LEAVE": return "Leje me pagesë";
    case "UNEXCUSED": return "Mungesë";
    default: return status;
  }
}

export function getAttendanceStatusColor(status: string): string {
  switch (status) {
    case "PRESENT":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "SICK":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    case "PAID_LEAVE":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "UNEXCUSED":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

// Day is paid only when worker was Present or on paid leave
export function isAttendanceDayPaid(status: string): boolean {
  return status === "PRESENT" || status === "PAID_LEAVE";
}

export function getEquipmentTypeLabel(type: string): string {
  switch (type) {
    case "TRUCK": return "Kamion";
    case "CRANE": return "Vinç";
    case "EXCAVATOR": return "Eskavator";
    case "WELDER": return "Saldues";
    case "GENERATOR": return "Gjenerator";
    case "SCAFFOLDING": return "Skela";
    case "OTHER": return "Tjetër";
    default: return type;
  }
}

