"use client";

import { useState, useEffect } from "react";
import HalfYearReport from "./HalfYearReport";

export default function HalfYearReportClient({ initialYear, initialHalf }: { initialYear: number; initialHalf: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/half-year?year=${initialYear}&half=${initialHalf}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [initialYear, initialHalf]);

  if (loading) return <p className="text-sm text-muted-foreground text-center py-12">Po ngarkohet raporti...</p>;
  if (!data) return <p className="text-sm text-red-400 text-center py-12">Gabim gjate ngarkimit te raportit</p>;

  return <HalfYearReport initialData={data} initialYear={initialYear} initialHalf={initialHalf} />;
}
