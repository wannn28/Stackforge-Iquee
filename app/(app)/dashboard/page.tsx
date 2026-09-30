import type { Metadata } from "next";
import { KpiGrid } from "@/components/kpi-cards";
import { PageHeader } from "@/components/page-header";
import { ErrorState, ForbiddenState, SampleNotice } from "@/components/resource-state";
import { getDashboardKpis } from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const result = await getDashboardKpis();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Workspace totals for the records you can read."
      />
      {result.status === "forbidden" ? <ForbiddenState message={result.message} /> : null}
      {result.status === "error" ? <ErrorState message={result.message} /> : null}
      {result.status === "ready" ? (
        <>
          {result.source === "sample" ? <SampleNotice table="records" /> : null}
          <KpiGrid items={result.data} />
        </>
      ) : null}
    </>
  );
}
