"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used within Sheet");
  }
  return context;
}

function Sheet({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const activeOpen = open ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <SheetContext.Provider value={{ open: activeOpen, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const sheet = useSheetContext();

  return (
    <button
      type="button"
      data-slot="sheet-trigger"
      className={cn(className)}
      onClick={() => sheet.setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetClose({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const sheet = useSheetContext();

  return (
    <button
      type="button"
      data-slot="sheet-close"
      className={cn(className)}
      onClick={() => sheet.setOpen(false)}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const sheet = useSheetContext();

  if (!sheet.open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => sheet.setOpen(false)}
        aria-hidden="true"
      />
      <div
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border bg-background p-4 shadow-xl",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("mb-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="sheet-title"
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="sheet-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
