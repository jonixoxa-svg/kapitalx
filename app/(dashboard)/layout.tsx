import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import MobileNav from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileNav
        userName={session.user?.name || ""}
        userRole={(session.user as any)?.role || "VIEWER"}
      />
      {/* pt-14 ne mobile per top bar-in, md:pt-0 ne PC */}
      {/* md:ml-60 vetem ne desktop - ne PC ngelet identike */}
      <main className="md:ml-60 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
