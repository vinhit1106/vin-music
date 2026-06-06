"use client";

import Link from "next/link";
import { Loader2, LogOut, Menu, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ThemeToggle } from "@/components/vin-music/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/src/lib/auth/hooks";
import { cn } from "@/lib/utils";

export function TopBar({ onMobileNavOpen }: { onMobileNavOpen?: () => void }) {
  const searchParams = useSearchParams();
  const initialQuery = useMemo(() => searchParams.get("q") || "", [searchParams]);

  // Keyed inner component avoids setState-in-effect lint when params change.
  return <TopBarInner key={initialQuery} initialQuery={initialQuery} onMobileNavOpen={onMobileNavOpen} />;
}

function TopBarInner({
  initialQuery,
  onMobileNavOpen,
}: {
  initialQuery: string;
  onMobileNavOpen?: () => void;
}) {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuthContext();
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Ctrl+K / Cmd+K hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/app/search?q=${encodeURIComponent(localQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-35 flex h-12 items-center border-b border-border bg-card/85 px-3 backdrop-blur-sm md:px-5">
      <div className="flex min-w-0 w-full items-center justify-between gap-2 sm:gap-4">

        {/* Left: Mobile hamburger — only visible below xl where desktop sidebar is hidden */}
        <div className="flex items-center gap-2 xl:hidden">
          <button
            type="button"
            onClick={onMobileNavOpen}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="size-4" />
          </button>
        </div>

        {/* Center: Global Search Input */}
        <form onSubmit={handleSearchSubmit} className="mx-auto min-w-0 flex-1 max-w-[480px]">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search songs, artists, sounds, or paste a TikTok URL"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-muted/30 pl-9 pr-14 text-[12px] text-foreground placeholder-muted-foreground focus:outline-none focus:border-ring focus:bg-background transition-all font-heading"
            />
            <div className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border/70 bg-muted px-1.5 py-0.5 text-[8.5px] font-bold text-muted-foreground sm:flex">
              <span>⌘</span><span>K</span>
            </div>
          </div>
        </form>

        {/* Right: Theme Toggle & Avatar */}
        <div className="flex items-center gap-2 select-none shrink-0">
          <ThemeToggle />
          {isLoading ? (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="size-3.5 animate-spin" />
              Session...
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border/40 px-2 py-1 hover:bg-muted transition-colors cursor-pointer">
                <Avatar className="size-7.5 border border-border/40">
                  <AvatarImage src={user.user_metadata.avatar_url} alt={user.email ?? "User avatar"} />
                  <AvatarFallback className="text-[10px] font-bold bg-muted text-muted-foreground">
                    {(user.user_metadata.full_name ?? user.email ?? "U")
                      .split(" ")
                      .map((part: string) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-semibold text-muted-foreground md:inline">
                  {user.user_metadata.full_name ?? user.email ?? "User"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5">
                  <div className="text-xs font-semibold text-foreground">
                    {user.user_metadata.full_name ?? "Vin Music user"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setIsLoggingOut(true);
                    void signOut().finally(() => setIsLoggingOut(false));
                  }}
                  disabled={isLoggingOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 size-3.5" />
                  {isLoggingOut ? "Signing out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer font-semibold"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
