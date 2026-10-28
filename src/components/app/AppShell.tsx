import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bot,
  FileText,
  Gauge,
  LayoutDashboard,
  PieChart,
  SlidersHorizontal,
  Target,
  UserCog,
  LogOut,
  Menu,
  ShieldAlert,
  User,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useProfile } from "@/lib/finance/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Financial Profile", icon: UserCog },
  { to: "/risk", label: "Risk Assessment", icon: Gauge },
  { to: "/recommendations", label: "Investment Plan", icon: PieChart },
  { to: "/goals", label: "Goal Planner", icon: Target },
  { to: "/simulator", label: "What-If Simulator", icon: SlidersHorizontal },
  { to: "/explainability", label: "Explainable AI", icon: BarChart3 },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/reports", label: "Reports & Export", icon: FileText },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { session, signOut, profile, hydrated } = useProfile();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protect all app pages: redirect unauthenticated users to /auth
  useEffect(() => {
    if (hydrated && !session) {
      navigate({ to: "/auth" });
    }
  }, [hydrated, session, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
              <Activity className="size-5" />
            </div>
            <div>
              <span className="font-display text-sm font-bold tracking-tight text-white">FinAdvisor XAI</span>
              <span className="block text-[10px] text-sidebar-foreground/60">Explainable Wealth AI</span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-semibold ring-1 ring-sidebar-border shadow-xs",
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer with Disclaimers */}
        <div className="border-t border-sidebar-border/60 p-4">
          <div className="rounded-lg bg-sidebar-accent/50 p-2.5 text-[11px] leading-relaxed text-sidebar-foreground/70">
            <div className="flex items-center gap-1.5 font-semibold text-sidebar-foreground/90">
              <ShieldAlert className="size-3.5 text-amber-400" />
              <span>Educational Tool</span>
            </div>
            <p className="mt-1">
              Not SEBI regulated advice. For investment decisions, consult a certified financial advisor.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="size-9 lg:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold md:text-lg">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>

          {/* User Session & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="flex items-center justify-end gap-1.5">
                <p className="text-sm font-medium">{session?.name ?? profile.name}</p>
                {session?.isDemo && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    Demo
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{session?.email ?? "Offline Session"}</p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Main Page Body */}
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
