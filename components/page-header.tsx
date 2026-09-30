import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-h1 text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-body text-muted">{description}</p> : null}
      </div>
      {actions ? <div className={cn("flex shrink-0 items-center gap-2")}>{actions}</div> : null}
    </div>
  );
}

export { PageHeader };
