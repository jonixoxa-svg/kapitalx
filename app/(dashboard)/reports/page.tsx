import Header from "@/components/layout/Header";
import HalfYearReportClient from "@/components/reports/HalfYearReportClient";

export default async function ReportsPage() {
  const now = new Date();
  const year = now.getFullYear();
  const half = now.getMonth() < 6 ? 1 : 2;

  return (
    <div className="min-h-screen">
      <Header title="Raporte 6-mujore" subtitle="Permbledhje automatike per 6 muajt e zgjedhur" />
      <div className="p-6 animate-fade-in">
        <HalfYearReportClient initialYear={year} initialHalf={half} />
      </div>
    </div>
  );
}
