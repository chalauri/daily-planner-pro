import { useState, type ReactNode } from "react";
import {
  CalendarCheck,
  CircleHelp,
  ListChecks,
  PlusCircle,
  Share2,
  Wallet,
  ChartColumn,
  PiggyBank,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLang, type TKey } from "@/lib/i18n";

function Step({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </li>
  );
}

export function HelpDialog() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const iconCls = "h-4 w-4";

  const planSteps: TKey[] = ["help.plans.s1", "help.plans.s2", "help.plans.s3", "help.plans.s4"];
  const planIcons = [
    <PlusCircle className={iconCls} />,
    <ListChecks className={iconCls} />,
    <CalendarCheck className={iconCls} />,
    <Share2 className={iconCls} />,
  ];
  const expSteps: TKey[] = ["help.exp.s1", "help.exp.s2", "help.exp.s3", "help.exp.s4"];
  const expIcons = [
    <PiggyBank className={iconCls} />,
    <ReceiptText className={iconCls} />,
    <Wallet className={iconCls} />,
    <ChartColumn className={iconCls} />,
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
          <CircleHelp className="h-4 w-4" />
          {t("help.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("help.title")}</DialogTitle>
          <DialogDescription>{t("help.intro")}</DialogDescription>
        </DialogHeader>

        <section className="mt-2">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <CalendarCheck className="h-4 w-4 text-primary" />
            {t("help.plans.title")}
          </h3>
          <ul className="mt-3 space-y-3">
            {planSteps.map((key, i) => (
              <Step key={key} icon={planIcons[i]} text={t(key)} />
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <Wallet className="h-4 w-4 text-primary" />
            {t("help.exp.title")}
          </h3>
          <ul className="mt-3 space-y-3">
            {expSteps.map((key, i) => (
              <Step key={key} icon={expIcons[i]} text={t(key)} />
            ))}
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
