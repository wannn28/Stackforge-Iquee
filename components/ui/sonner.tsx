"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "rounded-md border border-border bg-surface text-foreground shadow-card text-body",
          title: "text-body font-medium",
          description: "text-caption text-muted",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
