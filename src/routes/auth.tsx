import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle, useLang } from "@/lib/i18n";
import { HelpDialog } from "@/components/HelpDialog";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { mode?: Mode | undefined } => {
    const mode = search['mode'];
    return mode === "signin" || mode === "signup" ? { mode } : {};
  },
  head: () => ({
    meta: [
      { title: "Sign in — Personal planner" },
      { name: "description", content: "Sign in or create your Personal planner account." },
      { property: "og:title", content: "Sign in — Personal planner" },
      { property: "og:description", content: "Sign in or create your Personal planner account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>(initialMode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/planner", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/planner` },
        });
        if (error) throw error;
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          toast.error(t("auth.emailExists"));
          setMode("signin");
          return;
        }
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
        navigate({ to: "/planner", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/planner", replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.error"));
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="surface-card max-w-md p-8 text-center">
          <MailCheck className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-2xl">{t("auth.confirm.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("auth.confirm.body", { email })}
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => {
              setConfirmSent(false);
              setMode("signin");
            }}
          >
            {t("auth.confirm.back")}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold">{t("app.name")}</Link>
          <div className="flex items-center gap-1">
            <HelpDialog />
            <LanguageToggle />
          </div>
        </div>
        <h1 className="mt-8 text-3xl">
          {mode === "signup" ? t("auth.signup.title") : t("auth.signin.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? t("auth.signup.sub") : t("auth.signin.sub")}
        </p>

        <form onSubmit={onSubmit} className="surface-card mt-6 space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? t("auth.pleaseWait")
              : mode === "signup"
                ? t("auth.signup.title")
                : t("sign.in")}
          </Button>
          {mode === "signin" && (
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              disabled={loading}
              onClick={async () => {
                if (!email) {
                  toast.error(t("auth.email"));
                  return;
                }
                setLoading(true);
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) throw error;
                  toast.success(t("auth.resetSent", { email }));
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : t("auth.error"));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {t("auth.forgot")}
            </button>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === "signup" ? t("auth.alreadyAccount") : t("auth.newHere")}{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          >
            {mode === "signup" ? t("sign.in") : t("auth.createOne")}
          </button>
        </p>
      </div>
    </main>
  );
}
