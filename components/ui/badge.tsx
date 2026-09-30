import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  muted: "bg-foreground/5 text-muted",
  primary: "bg-primary/10 text-primary",
} as const;

function Badge({
  className,
  tone = "muted",
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-sm px-2 text-caption font-medium capitalize",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
