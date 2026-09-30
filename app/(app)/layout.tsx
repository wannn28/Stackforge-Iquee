import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/data";
import { isPreviewMode } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  return (
    <AppShell user={user} preview={isPreviewMode()}>
      {children}
    </AppShell>
  );
}
