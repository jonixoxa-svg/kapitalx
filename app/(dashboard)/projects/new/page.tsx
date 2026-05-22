import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import ProjectForm from "@/components/projects/ProjectForm";

export default async function NewProjectPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (role === "VIEWER") redirect("/projects");

  return (
    <div className="min-h-screen">
      <Header title="Projekt i Ri" subtitle="Krijo projekt të ri" />
      <div className="p-6 max-w-3xl animate-fade-in">
        <ProjectForm />
      </div>
    </div>
  );
}
