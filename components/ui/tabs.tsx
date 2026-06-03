"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

function Tabs({
  className,
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
}) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const activeValue = value ?? uncontrolledValue;

  const setValue = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, setValue }}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 items-center rounded-xl border border-border/70 bg-muted/50 p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<"button"> & { value: string }) {
  const tabs = useTabsContext();
  const isActive = tabs.value === value;

  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        isActive
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={() => tabs.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value: string }) {
  const tabs = useTabsContext();
  if (tabs.value !== value) {
    return null;
  }

  return (
    <div
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
