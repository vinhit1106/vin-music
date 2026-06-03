import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  note,
}: {
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <Card className="border-dashed border-border/80 bg-card/50">
      <CardHeader>
        <div className="mb-2 inline-flex size-10 items-center justify-center rounded-md border border-border/70 bg-muted/50">
          <Sparkles className="size-4 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {note ? (
        <CardContent className="pt-0 text-sm text-muted-foreground">
          {note}
        </CardContent>
      ) : null}
    </Card>
  );
}
