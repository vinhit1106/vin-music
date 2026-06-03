import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  alt = "",
  src,
  ...props
}: Omit<React.ComponentProps<typeof Image>, "alt"> & { alt?: string }) {
  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      data-slot="avatar-image"
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
