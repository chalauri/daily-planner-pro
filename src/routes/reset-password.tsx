import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Dayplan" },
      { name: "description", content: "Set a new password for your Dayplan account." },
      { property: "og:title", content: "Reset password — Dayplan" },
      { property: "og:description", content: "Set a new password for your Dayplan account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Recovery links arrive with type=recovery in the URL hash; the supabase
    // client exchanges it for a session automatically on load.
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValid(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setValid(!!data.session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("reset.noMatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("reset.success"));
      navigate({ to: "/planner", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-semibold">
            Dayplan
          </Link>
          <LanguageToggle />
        </div>
        <h1 className="mt-8 text-3xl">{t("reset.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("reset.sub")}</p>

        {valid === false ? (
          <div className="surface-card mt-6 p-6 text-center">
            <p className="text-sm text-muted-foreground">{t("reset.invalid")}</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
            >
              {t("auth.confirm.back")}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="surface-card mt-6 space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("reset.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("reset.confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || valid !== true}>
              {loading ? t("auth.pleaseWait") : t("reset.submit")}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
