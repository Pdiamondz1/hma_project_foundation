import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { brand } from "@/config/brand";
import { features, type FeatureKey } from "@/config/features";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  /** When set, the item shows only if this feature flag is enabled. */
  feature?: FeatureKey;
}

const NAV: NavItem[] = [
  { to: "/", label: "Overview", end: true },
  { to: "/wiki", label: "Wiki", feature: "wiki" },
  { to: "/raw", label: "Raw", feature: "raw" },
  { to: "/review", label: "Review", feature: "review" },
  { to: "/needs-context", label: "Needs Context", feature: "needsContext" },
  { to: "/change-log", label: "Change Log", feature: "changeLog" },
  { to: "/assistant", label: brand.assistantName, feature: "assistant" },
];

/**
 * App shell, ported from harbormill-aios. Single-user / no auth: the
 * `useAuth`/`useAccess`/sign-out/AriaProvider pieces are intentionally removed.
 * Keeps the ops-deck aesthetic — atmosphere glow + blueprint grid — and the
 * feature-flag-filtered nav.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = NAV.filter((item) => !item.feature || features[item.feature]);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Atmosphere: primary glow top-left, secondary ember bottom-right, blueprint grid */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-secondary/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <header className="relative z-10 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-x-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2">
            <img src={brand.logoSrc} alt={brand.productName} className="h-8 w-auto" />
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden flex-wrap items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {brand.company.name}
            </span>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg p-2 text-foreground hover:bg-accent lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="mt-3 flex flex-col gap-1 lg:hidden" aria-label="Primary mobile">
            {navItems.map((item) => (
              <NavItemLink key={item.to} item={item} onNavigate={() => setMobileOpen(false)} />
            ))}
          </nav>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItemLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      {item.label}
    </NavLink>
  );
}
