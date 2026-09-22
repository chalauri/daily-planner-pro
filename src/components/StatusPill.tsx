import { cn } from "@/lib/utils";
import { STATUS_LABEL, type PlanStatus } from "@/lib/plan-types";

const styles: Record<PlanStatus, string> = {
  OPEN: "bg-warning-soft text-warning-foreground",
  DONE: "bg-success-soft text-success",
  NOT_DONE: "bg-danger-soft text-destructive",
};

export function StatusPill({ status }: { status: PlanStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
