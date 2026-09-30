"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";

function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConfirmProvider>
        {children}
        <Toaster />
      </ConfirmProvider>
    </ThemeProvider>
  );
}

export { Providers };
