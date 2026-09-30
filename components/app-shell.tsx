"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { navItems } from "@/lib/navigation";
import type { SessionUser } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

function UserMenu({ user, preview }: { user: SessionUser; preview: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();

  async function signOut() {
    const accepted = await confirm({
      title: "Sign out?",
      description: "You will need to sign in again to open the workspace.",
      confirmLabel: "Sign out",
      tone: "danger",
    });
    if (!accepted) return;

    if (preview || !isSupabaseConfigured()) {
      toast.message("Preview mode has no session to end.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-md px-1.5 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-caption font-semibold text-primary">
            {initials(user.name)}
          </span>
          <span className="hidden max-w-[180px] truncate text-body text-foreground sm:inline">
            {user.email || user.name}
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[60] min-w-[220px] rounded-md border border-border bg-surface p-1 shadow-card"
        >
          <div className="px-3 py-2">
            <p className="truncate text-body font-medium text-foreground">{user.name}</p>
            <p className="truncate text-caption text-muted">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item asChild>
            <Link
              href="/settings"
              className="flex h-9 cursor-pointer items-center rounded-sm px-3 text-body text-foreground outline-none data-[highlighted]:bg-foreground/5"
            >
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex h-9 cursor-pointer items-center rounded-sm px-3 text-body text-danger outline-none data-[highlighted]:bg-danger/10"
            onSelect={(event) => {
              event.preventDefault();
              void signOut();
            }}
          >
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Sidebar({
  collapsed,
  mobileOpen,
  onNavigate,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-border bg-sidebar transition-transform duration-200 md:translate-x-0 md:transition-[width]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-16" : "md:w-[240px]",
      )}
    >
      <div className={cn("flex h-14 items-center px-4", collapsed && "md:justify-center md:px-0")}>
        <Logo compact={false} className={cn(collapsed && "md:hidden")} />
        <Logo compact className={cn("hidden", collapsed && "md:flex")} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Workspace">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-body font-medium",
                active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/[0.04]",
                collapsed && "md:justify-center md:px-0",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className={cn(collapsed && "md:sr-only")}>{item.label}</span>
            </Link>
          );

          if (!collapsed) return <div key={item.href}>{link}</div>;

          return (
            <Tooltip.Root key={item.href}>
              <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="z-50 hidden rounded-md border border-border bg-surface px-2 py-1 text-caption text-foreground shadow-card md:block"
                >
                  {item.label}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </nav>
      <div className="hidden p-3 md:block">
        <Button
          type="button"
          variant="ghost"
          className={cn("w-full justify-start", collapsed && "justify-center px-0")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className={cn(collapsed && "sr-only")}>{collapsed ? "Expand" : "Collapse"}</span>
        </Button>
      </div>
    </aside>
  );
}

function AppShell({
  user,
  preview,
  children,
}: {
  user: SessionUser;
  preview: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("stackforge-sidebar") === "collapsed") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("stackforge-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="min-h-screen bg-background">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-[#09090B]/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
          onToggleCollapsed={toggleCollapsed}
        />
        <div className={cn("flex min-h-screen flex-col md:pl-[240px]", collapsed && "md:pl-16")}>
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu />
              </Button>
              <span className="text-h2 font-semibold text-foreground md:hidden">Stackforge</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <UserMenu user={user} preview={preview} />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  );
}

export { AppShell };
