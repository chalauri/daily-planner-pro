import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMyUserId } from "@/components/PlanSharing";
import { buildOverdueFilter, requestPlanFilter } from "@/lib/plan-filter";
import { useLang } from "@/lib/i18n";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function OverdueBell() {
  const { t } = useLang();
  const me = useMyUserId();
  const today = todayISO();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: overdue = [] } = useQuery({
    queryKey: ["plans", "overdue", me, today],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id,title,plan_date")
        .eq("user_id", me!)
        .eq("status", "OPEN")
        .lt("plan_date", today)
        .order("plan_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const count = overdue.length;

  function openOverduePlans() {
    requestPlanFilter(buildOverdueFilter(overdue.map((p) => p.plan_date), today));
    setOpen(false);
    void navigate({ to: "/planner" });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`${t("od.title")}${count ? ` (${count})` : ""}`}>
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border p-3">
          <p className="text-sm font-semibold">{t("od.title")}</p>
          {count > 0 && <p className="text-xs text-muted-foreground">{t("od.sub")}</p>}
        </div>
        {count === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">{t("od.none")}</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto py-1">
            {overdue.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                <span className="truncate">{p.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{p.plan_date}</span>
              </li>
            ))}
          </ul>
        )}
        {count > 0 && (
          <div className="border-t border-border p-2">
            <Button size="sm" variant="outline" className="w-full" onClick={openOverduePlans}>
              {t("od.open")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
