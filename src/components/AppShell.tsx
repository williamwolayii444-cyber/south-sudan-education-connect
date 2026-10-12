import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Handshake,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Map,
  Menu,
  Monitor,
  MonitorPlay,
  Moon,
  PieChart,
  School,
  ShieldCheck,
  Smartphone,
  Sun,
  TriangleAlert,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRoles, useSession } from "@/hooks/useSession";
import { useTheme, type Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import UserProfile from "@/components/UserProfile";

type NavItem = { to: string; label: string; icon: LucideIcon; adminOnly?: boolean };

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    items: [
      { to: "/dashboard", label: "National Dashboard", icon: LayoutDashboard },
      { to: "/modules", label: "Platform Modules", icon: LayoutGrid },
    ],
  },
  {
    heading: "Core registries",
    items: [
      { to: "/students", label: "Students (SIS)", icon: GraduationCap },
      { to: "/teachers", label: "Teachers (TMS)", icon: Users },
      { to: "/schools", label: "Schools (SMS)", icon: School },
    ],
  },
  {
    heading: "Service delivery",
    items: [
      { to: "/exams", label: "Examinations (EMS)", icon: ClipboardCheck },
      { to: "/inspections", label: "Quality Assurance (IQA)", icon: BadgeCheck },
      { to: "/curriculum", label: "Curriculum (CMS)", icon: BookOpen },
      { to: "/elearning", label: "E-Learning (ELP)", icon: MonitorPlay },
    ],
  },
  {
    heading: "Corporate services",
    items: [
      { to: "/hr", label: "Human Resources (HRMS)", icon: UserCog },
      { to: "/payroll", label: "Payroll", icon: Banknote },
      { to: "/finance", label: "Finance (FMS)", icon: Landmark },
      { to: "/documents", label: "Documents (DMS)", icon: FileText },
    ],
  },
  {
    heading: "Analytics",
    items: [
      { to: "/emis", label: "EMIS Statistics", icon: BarChart3 },
      { to: "/gis", label: "GIS & Mapping", icon: Map },
      { to: "/analytics", label: "Early Warning (AI)", icon: TriangleAlert },
      { to: "/intelligence", label: "Reporting (BI)", icon: PieChart },
    ],
  },
  {
    heading: "Citizen services",
    items: [
      { to: "/field-reports", label: "Field Reports (MOB)", icon: Smartphone },
      { to: "/directory", label: "School Directory (CIT)", icon: Building2 },
      { to: "/partners", label: "Partners of GEI", icon: Handshake },
    ],
  },
  {
    heading: "Security",
    items: [{ to: "/administration", label: "Administration", icon: ShieldCheck, adminOnly: true }],
  },
];

export function FlagMark({ className }: { className?: string }) {
  // Simplified South Sudan flag used as the ministry mark.
  return (
    <svg viewBox="0 0 30 20" aria-hidden className={cn("shrink-0 rounded-[2px]", className)}>
      <rect width="30" height="20" fill="#078930" />
      <rect width="30" height="7.2" fill="#000" />
      <rect y="6" width="30" height="1.2" fill="#fff" />
      <rect y="12.8" width="30" height="1.2" fill="#fff" />
      <rect y="7.2" width="30" height="5.6" fill="#da121a" />
      <path d="M0 0 L13 10 L0 20 Z" fill="#0f47af" />
      <path
        d="M4.6 7.4 L5.2 9.3 L7.2 9.3 L5.6 10.4 L6.2 12.3 L4.6 11.1 L3 12.3 L3.6 10.4 L2 9.3 L4 9.3 Z"
        fill="#fcdd09"
      />
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="Change colour theme">
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 size-4" /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 size-4" /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 size-4" /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user } = useSession();
  const { roles, isAdmin } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation and with the Escape key.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen bg-background">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-start gap-3 border-b border-sidebar-border px-5 py-5">
          <FlagMark className="mt-0.5 h-6 w-9" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xs uppercase tracking-wider text-sidebar-primary">
              Republic of South Sudan
            </p>
            <p className="mt-1 font-display text-[15px] leading-snug">
              Ministry of General Education &amp; Instruction
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => {
            const items = group.items.filter((item) => !item.adminOnly || isAdmin);
            if (!items.length) return null;
            return (
              <div key={group.heading} className="mb-4 last:mb-0">
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  {group.heading}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            active
                              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <Icon
                            className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4 text-xs">
          <p className="truncate text-sidebar-foreground/70" title={user?.email ?? undefined}>
            {user?.email}
          </p>
          <p className="mt-0.5 capitalize text-sidebar-primary">
            {roles.length ? roles.join(" · ") : "viewer"} access
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg sm:text-xl">{title}</h1>
              {subtitle && (
                <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {actions}
              <ThemeToggle />
              <UserProfile />
            </div>
          </div>
          <div className="flag-rule" />
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
        <footer className="border-t px-4 py-4 text-xs text-muted-foreground sm:px-6">
          Official system of the Ministry of General Education and Instruction, Juba. Access is
          logged and restricted to authorised officers.
        </footer>
      </div>
    </div>
  );
}
