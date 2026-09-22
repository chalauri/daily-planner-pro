import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ListChecks, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        content:
          "A simple daily planner with live statistics, evening reminders and Google Calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ListChecks,
    title: "Today, front and center",
    text: "You land on today's plans. One click marks a plan done or not done.",
  },
  {
    icon: BarChart3,
    title: "Statistics that follow your filters",
    text: "Filter by date, status or text — the numbers recalculate on exactly what you see.",
  },
  {
    icon: CalendarCheck,
    title: "Evening nudge",
    text: "At 23:55 we email you the plans you left open, so nothing stays unresolved.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold">Dayplan</span>
        <Button asChild variant="ghost">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Daily planner
        </p>
        <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">
          Plan your day.
          <br />
          Finish your day.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground">
          A quiet place for the handful of things that actually matter today — with honest numbers
          on how it went.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Create your account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ mode: "signin" }}>
              I already have one
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
