import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ListChecks, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dayplan — plan your day, finish your day" },
      {
        name: "description",
        content:
          "A simple daily planner: add plans, mark them done or not done, filter by date, status or text, and see live statistics.",
      },
      { property: "og:title", content: "Dayplan — plan your day, finish your day" },
      {
        property: "og:description",
        content: "A simple daily planner with live statistics and an evening reminder email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useLang();
  const features = [
    { icon: ListChecks, title: t("landing.f1.title"), text: t("landing.f1.text") },
    { icon: BarChart3, title: t("landing.f2.title"), text: t("landing.f2.text") },
    { icon: CalendarCheck, title: t("landing.f3.title"), text: t("landing.f3.text") },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold">Dayplan</span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild variant="ghost">
            <Link to="/auth">{t("sign.in")}</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          {t("landing.badge")}
        </p>
        <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">
          {t("landing.title1")}
          <br />
          {t("landing.title2")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">{t("landing.sub")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">{t("landing.cta")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ mode: "signin" }}>
              {t("landing.cta2")}
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="surface-card p-6">
            <f.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-lg">{f.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
