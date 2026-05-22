// Skript per te fshire vetem te dhenat fiktive te seed-it
// RUAN: User accounts (admin/manager), strukturen e databazes
// FSHIN: Projekte, shpenzime, punetore, evidence, pajisje, pagesa, milestones, log-e

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Po fshihen te dhenat fiktive...");
  console.log("(Llogarite e perdoruesve do te ruhen)\n");

  // Renditja eshte e rendesishme per foreign keys
  // Fshi nga femijet drejt prinderve

  const milestones = await prisma.projectMilestone.deleteMany({});
  console.log(`  - Fazat: ${milestones.count} u fshine`);

  const payments = await prisma.projectPayment.deleteMany({});
  console.log(`  - Pagesat: ${payments.count} u fshine`);

  const equipmentAssignments = await prisma.equipmentAssignment.deleteMany({});
  console.log(`  - Caktimet e pajisjeve: ${equipmentAssignments.count} u fshine`);

  const equipment = await prisma.equipment.deleteMany({});
  console.log(`  - Pajisjet: ${equipment.count} u fshine`);

  const attendance = await prisma.attendance.deleteMany({});
  console.log(`  - Evidenca: ${attendance.count} u fshine`);

  const documents = await prisma.document.deleteMany({});
  console.log(`  - Dokumentet: ${documents.count} u fshine`);

  const workerAssignments = await prisma.workerAssignment.deleteMany({});
  console.log(`  - Caktimet e punetoreve: ${workerAssignments.count} u fshine`);

  const expenses = await prisma.expense.deleteMany({});
  console.log(`  - Shpenzimet e projektit: ${expenses.count} u fshine`);

  const generalExpenses = await prisma.generalExpense.deleteMany({});
  console.log(`  - Shpenzimet e kompanise: ${generalExpenses.count} u fshine`);

  const activityLogs = await prisma.activityLog.deleteMany({});
  console.log(`  - Log-et e aktivitetit: ${activityLogs.count} u fshine`);

  const notifications = await prisma.notification.deleteMany({});
  console.log(`  - Njoftimet: ${notifications.count} u fshine`);

  const projects = await prisma.project.deleteMany({});
  console.log(`  - Projektet: ${projects.count} u fshine`);

  const workers = await prisma.worker.deleteMany({});
  console.log(`  - Punetoret: ${workers.count} u fshine`);

  const users = await prisma.user.count();
  console.log(`\n  Llogarite e ruajtura: ${users} perdorues`);

  console.log("\nGati! Databaza eshte e paster. Mund t'i fusesh te dhenat e tua.");
}

main()
  .catch((e) => {
    console.error("Gabim gjate fshirjes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
