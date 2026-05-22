import { PrismaClient, Role, ProjectStatus, ExpenseCategory, GeneralExpenseCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@kapitalx.com" },
    update: {},
    create: {
      name: "Admin KapitalX",
      email: "admin@kapitalx.com",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const managerPassword = await bcrypt.hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@kapitalx.com" },
    update: {},
    create: {
      name: "Menaxheri Kryesor",
      email: "manager@kapitalx.com",
      password: managerPassword,
      role: Role.MANAGER,
    },
  });

  // Create workers
  const workers = await Promise.all([
    prisma.worker.upsert({
      where: { id: "worker-1" },
      update: {},
      create: {
        id: "worker-1",
        name: "Arben Hoxha",
        position: "Elektricist",
        phone: "+355 69 111 2233",
        dailyRate: 4500,
        active: true,
      },
    }),
    prisma.worker.upsert({
      where: { id: "worker-2" },
      update: {},
      create: {
        id: "worker-2",
        name: "Driton Berisha",
        position: "Saldator",
        phone: "+355 69 222 3344",
        dailyRate: 5000,
        active: true,
      },
    }),
    prisma.worker.upsert({
      where: { id: "worker-3" },
      update: {},
      create: {
        id: "worker-3",
        name: "Fatos Gjoni",
        position: "Inxhinier Konstruksionesh",
        phone: "+355 69 333 4455",
        dailyRate: 6500,
        active: true,
      },
    }),
    prisma.worker.upsert({
      where: { id: "worker-4" },
      update: {},
      create: {
        id: "worker-4",
        name: "Ilir Krasniqi",
        position: "Teknik Solar",
        phone: "+355 69 444 5566",
        dailyRate: 5500,
        active: true,
      },
    }),
    prisma.worker.upsert({
      where: { id: "worker-5" },
      update: {},
      create: {
        id: "worker-5",
        name: "Besnik Rama",
        position: "Punëtor",
        phone: "+355 69 555 6677",
        dailyRate: 3500,
        active: true,
      },
    }),
  ]);

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { id: "project-1" },
    update: {},
    create: {
      id: "project-1",
      name: "Struktura Metalike - Tiranë",
      client: "Artan Mehmetaj",
      location: "Tiranë, Shqipëri",
      description: "Ndërtim strukture metalike për magazinë industriale",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-04-30"),
      status: ProjectStatus.COMPLETED,
      progress: 100,
      contractValue: 2800000,
      createdById: admin.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "project-2" },
    update: {},
    create: {
      id: "project-2",
      name: "Sistemi Solar 50kW - Durrës",
      client: "Besa Konstruksion SH.A.",
      location: "Durrës, Shqipëri",
      description: "Instalim sistem solar fotovoltaik 50kW për ndërtesë komerciale",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-06-15"),
      status: ProjectStatus.ACTIVE,
      progress: 65,
      contractValue: 4500000,
      createdById: admin.id,
    },
  });

  const project3 = await prisma.project.upsert({
    where: { id: "project-3" },
    update: {},
    create: {
      id: "project-3",
      name: "Hangar Metalik - Vlorë",
      client: "Agro Vlorë SHPK",
      location: "Vlorë, Shqipëri",
      description: "Konstruksion hangar metalik 800m² për ruajtje bujqësore",
      startDate: new Date("2024-05-01"),
      status: ProjectStatus.ACTIVE,
      progress: 30,
      contractValue: 3200000,
      createdById: manager.id,
    },
  });

  const project4 = await prisma.project.upsert({
    where: { id: "project-4" },
    update: {},
    create: {
      id: "project-4",
      name: "Solar Farm 200kW - Fier",
      client: "Enerji Shqip SH.A.",
      location: "Fier, Shqipëri",
      description: "Instalim fermë solare 200kW në tokë bujqësore",
      startDate: new Date("2024-07-01"),
      status: ProjectStatus.PLANNED,
      progress: 0,
      contractValue: 12000000,
      createdById: admin.id,
    },
  });

  // Add expenses to projects
  await prisma.expense.createMany({
    skipDuplicates: true,
    data: [
      {
        projectId: "project-1",
        category: ExpenseCategory.MATERIALS,
        description: "Profila çeliku 200x200",
        amount: 450000,
        date: new Date("2024-01-20"),
      },
      {
        projectId: "project-1",
        category: ExpenseCategory.MATERIALS,
        description: "Bullona dhe aksesorë",
        amount: 85000,
        date: new Date("2024-02-01"),
      },
      {
        projectId: "project-1",
        category: ExpenseCategory.TRANSPORT,
        description: "Transport materialesh nga Tirana",
        amount: 45000,
        date: new Date("2024-01-18"),
      },
      {
        projectId: "project-1",
        category: ExpenseCategory.FUEL,
        description: "Karburant për makineri",
        amount: 32000,
        date: new Date("2024-02-15"),
      },
      {
        projectId: "project-1",
        category: ExpenseCategory.EQUIPMENT,
        description: "Qira gru 15 ditë",
        amount: 120000,
        date: new Date("2024-02-10"),
      },
      {
        projectId: "project-2",
        category: ExpenseCategory.MATERIALS,
        description: "Panele solare 450W x 112 copë",
        amount: 980000,
        date: new Date("2024-03-10"),
      },
      {
        projectId: "project-2",
        category: ExpenseCategory.MATERIALS,
        description: "Inverter 50kW",
        amount: 350000,
        date: new Date("2024-03-10"),
      },
      {
        projectId: "project-2",
        category: ExpenseCategory.MATERIALS,
        description: "Kabllo DC dhe AC",
        amount: 125000,
        date: new Date("2024-03-15"),
      },
      {
        projectId: "project-2",
        category: ExpenseCategory.TRANSPORT,
        description: "Transport nga depot",
        amount: 35000,
        date: new Date("2024-03-08"),
      },
      {
        projectId: "project-2",
        category: ExpenseCategory.ACCOMMODATION,
        description: "Akomodim ekip 2 javë",
        amount: 48000,
        date: new Date("2024-03-01"),
      },
      {
        projectId: "project-3",
        category: ExpenseCategory.MATERIALS,
        description: "Profila dhe traret kryesorë",
        amount: 380000,
        date: new Date("2024-05-05"),
      },
      {
        projectId: "project-3",
        category: ExpenseCategory.EQUIPMENT,
        description: "Qira makineri ndërtimi",
        amount: 95000,
        date: new Date("2024-05-10"),
      },
    ],
  });

  // Add worker assignments
  await prisma.workerAssignment.createMany({
    skipDuplicates: true,
    data: [
      {
        workerId: "worker-1",
        projectId: "project-1",
        daysWorked: 45,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-04-30"),
      },
      {
        workerId: "worker-2",
        projectId: "project-1",
        daysWorked: 50,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-04-30"),
      },
      {
        workerId: "worker-3",
        projectId: "project-1",
        daysWorked: 40,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-04-30"),
      },
      {
        workerId: "worker-2",
        projectId: "project-2",
        daysWorked: 30,
        startDate: new Date("2024-03-01"),
      },
      {
        workerId: "worker-4",
        projectId: "project-2",
        daysWorked: 35,
        startDate: new Date("2024-03-01"),
      },
      {
        workerId: "worker-5",
        projectId: "project-2",
        daysWorked: 28,
        startDate: new Date("2024-03-01"),
      },
      {
        workerId: "worker-1",
        projectId: "project-3",
        daysWorked: 18,
        startDate: new Date("2024-05-01"),
      },
      {
        workerId: "worker-3",
        projectId: "project-3",
        daysWorked: 20,
        startDate: new Date("2024-05-01"),
      },
    ],
  });

  // Add general expenses
  const months = [1, 2, 3, 4, 5, 6];
  for (const month of months) {
    await prisma.generalExpense.createMany({
      skipDuplicates: false,
      data: [
        {
          category: GeneralExpenseCategory.RENT,
          description: "Qiraja e zyrës",
          amount: 80000,
          month,
          year: 2024,
          recurring: true,
        },
        {
          category: GeneralExpenseCategory.ELECTRICITY,
          description: "Fatura e rrymës",
          amount: 25000,
          month,
          year: 2024,
          recurring: true,
        },
        {
          category: GeneralExpenseCategory.INTERNET,
          description: "Internet & telefoni",
          amount: 8000,
          month,
          year: 2024,
          recurring: true,
        },
        {
          category: GeneralExpenseCategory.ADMIN_SALARIES,
          description: "Pagat administrative",
          amount: 220000,
          month,
          year: 2024,
          recurring: true,
        },
        {
          category: GeneralExpenseCategory.VEHICLES,
          description: "Mirëmbajtja automjeteve",
          amount: 35000,
          month,
          year: 2024,
          recurring: false,
        },
      ],
    });
  }

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        projectId: "project-1",
        userId: admin.id,
        action: "PROJECT_CREATED",
        description: "Projekti 'Struktura Metalike - Tiranë' u krijua",
        createdAt: new Date("2024-01-14"),
      },
      {
        projectId: "project-2",
        userId: admin.id,
        action: "PROJECT_CREATED",
        description: "Projekti 'Sistemi Solar 50kW - Durrës' u krijua",
        createdAt: new Date("2024-02-28"),
      },
      {
        projectId: "project-1",
        userId: admin.id,
        action: "PROJECT_COMPLETED",
        description: "Projekti 'Struktura Metalike - Tiranë' u kompletua",
        createdAt: new Date("2024-04-30"),
      },
    ],
  });

  console.log("Database seeded successfully!");
  console.log("\nAdmin credentials:");
  console.log("Email: admin@kapitalx.com");
  console.log("Password: admin123");
  console.log("\nManager credentials:");
  console.log("Email: manager@kapitalx.com");
  console.log("Password: manager123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
