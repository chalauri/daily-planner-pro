import { Link } from "@tanstack/react-router";
import { CalendarCheck, Wallet } from "lucide-react";
import { useFT } from "@/lib/finance-i18n";

export function AppTabs() {
  const { ft } = useFT();
  const base = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1" aria-label="Sections">
      <Link
        to="/planner"
        className={base}
        activeProps={{ className: "bg-background text-foreground shadow-sm" }}
        inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
      >
        <CalendarCheck className="h-4 w-4" />
        {ft("tab.plans")}
      </Link>
      <Link
        to="/expenses"
        className={base}
        activeProps={{ className: "bg-background text-foreground shadow-sm" }}
        inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
      >
        <Wallet className="h-4 w-4" />
        {ft("tab.expenses")}
      </Link>
    </nav>
  );
}
