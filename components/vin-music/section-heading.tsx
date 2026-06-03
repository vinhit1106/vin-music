import type * as React from "react";

import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="space-y-1">
        <h2 className="font-(--font-heading) text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </div>
  );
}
