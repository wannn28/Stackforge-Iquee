import { UsersSkeleton } from "@/components/skeletons";
import { PageHeader } from "@/components/page-header";

export default function UsersLoading() {
  return (
    <>
      <PageHeader title="Users" description="Roles and people in this workspace." />
      <UsersSkeleton />
    </>
  );
}
