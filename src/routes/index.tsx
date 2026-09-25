import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import {
  BarChart3,
  CalendarCheck,
  FileDown,
  Gauge,
  ListChecks,
  Repeat,
  Share2,
  Table2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle, formatMonthYear, useLang } from "@/lib/i18n";

type Icon = ComponentType<{ className?: string }>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Personal planner — daily plans and monthly budgets" },
      {
        name: "description",
        content:
          "A calm personal planner: today's plans with live statistics, plus income, monthly category budgets, spending against plan and CSV or PDF export.",
      },
      { property: "og:title", content: "Personal planner — daily plans and monthly budgets" },
      {
        property: "og:description",
        content:
          "Plan the day, budget the month. Daily plans with honest statistics, income by source, budgets per category and an evening reminder email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, lang } = useLang();
  const [monthLabel, setMonthLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setMonthLabel(formatMonthYear(next.getFullYear(), next.getMonth() + 1, lang));
  }, [lang]);

  const mockPlans: { title: string; status: "open" | "done" | "notdone" }[] = [
    { title: t("landing.mock.p1"), status: "done" },
    { title: t("landing.mock.p2"), status: "open" },
    { title: t("landing.mock.p3"), status: "notdone" },
  ];

  const mockBudgets = [
    { name: t("landing.mock.c1"), pct: 62, over: false },
    { name: t("landing.mock.c2"), pct: 34, over: false },
    { name: t("landing.mock.c3"), pct: 100, over: true },
  ];

  const planFeatures: { icon: Icon; title: string; text: string }[] = [
    { icon: ListChecks, title: t("landing.f1.title"), text: t("landing.f1.text") },
    { icon: BarChart3, title: t("landing.f2.title"), text: t("landing.f2.text") },
    { icon: CalendarCheck, title: t("landing.f3.title"), text: t("landing.f3.text") },
  ];

  const moneyFeatures: { icon: Icon; title: string; text: string }[] = [
    { icon: Wallet, title: t("landing.m1.title"), text: t("landing.m1.text") },
    { icon: Gauge, title: t("landing.m2.title"), text: t("landing.m2.text") },
    { icon: FileDown, title: t("landing.m3.title"), text: t("landing.m3.text") },
  ];

  const alsoInside: { icon: Icon; label: string }[] = [
    { icon: Repeat, label: t("landing.also.1") },
    { icon: Share2, label: t("landing.also.2") },
    { icon: Table2, label: t("landing.also.3") },
    { icon: Gauge, label: t("landing.also.4") },
  ];

  const steps = [
    { title: t("landing.how.s1.title"), text: t("landing.how.s1.text") },
    { title: t("landing.how.s2.title"), text: t("landing.how.s2.text") },
    { title: t("landing.how.s3.title"), text: t("landing.how.s3.text") },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-sm text-primary-foreground">
            {lang === "ka" ? "პ" : "P"}
          </span>
          <span className="font-display text-xl font-semibold">{t("app.name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild variant="ghost">
            <Link to="/auth">{t("sign.in")}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-14 pb-10 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-secondary-foreground uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {t("landing.badge")}
        </p>
        <h1 className="mt-6 text-5xl leading-[1.05] sm:text-6xl">
          {t("landing.title1")}
          <br />
          <span className="text-primary italic">{t("landing.title2")}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">{t("landing.sub")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">{t("landing.cta")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ mode: "signin" }}>
              {t("landing.cta2")}
            </Link>
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">{t("landing.note")}</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {t("landing.mock.today")}
              </p>
              <span className="text-[11px] text-muted-foreground">{monthLabel}</span>
            </div>
            <div className="mt-4">
              {mockPlans.map((p) => (
                <div
                  key={p.title}
                  className="flex items-center justify-between gap-3 border-b border-border/70 py-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        p.status === "done"
                          ? "h-2 w-2 rounded-full bg-success"
                          : p.status === "notdone"
                            ? "h-2 w-2 rounded-full bg-destructive"
                            : "h-2 w-2 rounded-full bg-muted-foreground/40"
                      }
                    />
                    <span
                      className={
                        p.status === "done"
                          ? "text-sm text-success"
                          : p.status === "notdone"
                            ? "text-sm text-destructive"
                            : "text-sm text-foreground"
                      }
                    >
                      {p.title}
                    </span>
                  </div>
                  <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    {p.status === "done"
                      ? t("landing.mock.done")
                      : p.status === "notdone"
                        ? t("landing.mock.notdone")
                        : t("landing.mock.open")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {t("landing.section.money")}
              </p>
              <span className="text-[11px] text-muted-foreground">{monthLabel}</span>
            </div>
            <div className="mt-4">
              {mockBudgets.map((b) => (
                <div
                  key={b.name}
                  className="border-b border-border/70 py-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">{b.name}</span>
                    <span
                      className={
                        b.over
                          ? "text-[11px] text-destructive"
                          : "text-[11px] text-muted-foreground"
                      }
                    >
                      {b.over ? t("landing.mock.over") : `${b.pct}%`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className={
                        b.over
                          ? "h-2 rounded-full bg-destructive"
                          : "h-2 rounded-full bg-primary"
                      }
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/70 pt-3">
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-2 w-4 rounded-full bg-primary" />
                {t("landing.mock.spent")}
              </span>
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-2 w-4 rounded-full bg-destructive" />
                {t("landing.mock.over")}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("landing.mock.note")}</p>
      </section>

      <FeatureSection
        label={t("landing.section.plans")}
        sub={t("landing.section.plans.sub")}
        features={planFeatures}
      />

      <FeatureSection
        label={t("landing.section.money")}
        sub={t("landing.section.money.sub")}
        features={moneyFeatures}
      />

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="surface-card flex flex-wrap items-center justify-center gap-2 p-5">
          <span className="mr-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {t("landing.also.title")}
          </span>
          {alsoInside.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-secondary-foreground"
            >
              <item.icon className="h-3.5 w-3.5 text-primary" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <p className="text-center text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {t("landing.how.title")}
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title}>
              <span className="font-display text-4xl text-primary/25">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-base">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="text-3xl">{t("landing.cta3.title")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-90">{t("landing.cta3.sub")}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">{t("landing.cta")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/auth" search={{ mode: "signin" }}>
                {t("landing.cta2")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <span>{t("landing.footer")}</span>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">{t("sign.in")}</Link>
            </Button>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureSection({
  label,
  sub,
  features,
}: {
  label: string;
  sub: string;
  features: { icon: Icon; title: string; text: string }[];
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-border pb-4">
        <h2 className="font-display text-2xl">{label}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{sub}</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="surface-card p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
