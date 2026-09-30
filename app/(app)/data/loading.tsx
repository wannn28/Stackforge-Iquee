import { DataTableSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/page-header";

export default function DataLoading() {
  return (
    <>
      <PageHeader title="Data" description="Search, filter, and page through workspace records." />
      <DataTableSkeleton />
    </>
  );
}
