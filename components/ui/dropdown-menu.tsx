"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext =
  React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }
  return context;
}

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({
  className,
  children,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  const menu = useDropdownMenuContext();

  return (
    <button
      type="button"
      data-slot="dropdown-menu-trigger"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          menu.setOpen(!menu.open);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  className,
  align = "end",
  children,
}: {
  className?: string;
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  const menu = useDropdownMenuContext();

  if (!menu.open) {
    return null;
  }

  return (
    <div
      data-slot="dropdown-menu-content"
      className={cn(
        "absolute top-full z-50 mt-2 min-w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  className,
  onSelect,
  children,
  ...props
}: React.ComponentProps<"button"> & { onSelect?: () => void }) {
  const menu = useDropdownMenuContext();

  return (
    <button
      type="button"
      data-slot="dropdown-menu-item"
      className={cn(
        "flex w-full items-center rounded-lg px-2 py-1.5 text-sm text-left text-foreground transition-colors hover:bg-muted",
        className,
      )}
      onClick={() => {
        onSelect?.();
        menu.setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("my-1 h-px bg-border", className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
