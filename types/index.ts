import { Project, User, Worker, Expense, GeneralExpense, WorkerAssignment, Document, ActivityLog, Notification } from "@prisma/client";

export type ProjectWithRelations = Project & {
  expenses: Expense[];
  workerAssignments: (WorkerAssignment & { worker: Worker })[];
  documents: Document[];
  activityLogs: (ActivityLog & { user: User })[];
  createdBy: User;
  _count?: {
    expenses: number;
    workerAssignments: number;
    documents: number;
  };
};

export type WorkerWithAssignments = Worker & {
  assignments: (WorkerAssignment & { project: Project })[];
};

export type DashboardStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  plannedProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  totalLaborCost: number;
  totalGeneralExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalWorkers: number;
  activeWorkers: number;
  monthlyData: MonthlyData[];
  recentProjects: ProjectWithRelations[];
};

export type MonthlyData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type ProjectFormData = {
  name: string;
  client: string;
  location: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  contractValue: number;
  notes?: string;
};

export type ExpenseFormData = {
  category: string;
  description: string;
  amount: number;
  date: string;
};

export type GeneralExpenseFormData = {
  category: string;
  description: string;
  amount: number;
  month: number;
  year: number;
  recurring: boolean;
};

export type WorkerFormData = {
  name: string;
  position: string;
  phone?: string;
  email?: string;
  dailyRate: number;
};

export type WorkerAssignmentFormData = {
  workerId: string;
  projectId: string;
  daysWorked: number;
  startDate: string;
  endDate?: string;
  notes?: string;
};

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "ADMIN" | "MANAGER" | "VIEWER";
}
