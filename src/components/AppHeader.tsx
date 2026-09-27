import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Globe2, KeyRound, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppTabs } from "@/components/AppTabs";
import { CollabRequests } from "@/components/PlanSharing";
import { HelpDialog } from "@/components/HelpDialog";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { type Lang, useLang } from "@/lib/i18n";

const LANGUAGES: { code: Lang; short: string; name: string }[] = [
  { code: "en", short: "EN", name: "English" },
  { code: "ka", short: "ქა", name: "ქართული" },
  { code: "pl", short: "PL", name: "Polski" },
];

export function AppHeader({ onRequestsChanged }: { onRequestsChanged?: () => void }) {
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const activeLanguage = LANGUAGES.find((item) => item.code === lang) ?? { code: "en", short: "EN", name: "English" };

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      toast.error(t("reset.noMatch"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("account.passwordSaved"));
    setPassword("");
    setConfirm("");
    setPasswordOpen(false);
  }

  return (
    <>
      <header className="border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <span className="shrink-0 font-display text-lg font-semibold sm:text-xl">{t("app.name")}</span>
            <div className="min-w-0 overflow-x-auto">
              <AppTabs />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 px-2.5" aria-label="Language / ენა / Język">
                  <Globe2 className="h-4 w-4" />
                  <span>{activeLanguage.short}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {LANGUAGES.map((item) => (
                  <DropdownMenuItem key={item.code} onSelect={() => setLang(item.code)}>
                    <span className="w-6 font-medium">{item.short}</span>
                    <span>{item.name}</span>
                    {lang === item.code && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" aria-label={t("account.menu")}>
                  <UserRound className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{t("account.menu")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-0.5">
                  <CollabRequests
                    onChanged={onRequestsChanged ?? (() => queryClient.invalidateQueries({ queryKey: ["plans"] }))}
                    triggerClassName="h-8 w-full justify-start px-2 text-sm font-normal"
                  />
                  <HelpDialog triggerClassName="h-8 w-full justify-start px-2 text-sm font-normal" />
                  <FeedbackDialog triggerClassName="h-8 w-full justify-start px-2 text-sm font-normal" />
                </div>
                <DropdownMenuItem onSelect={() => setPasswordOpen(true)}>
                  <KeyRound />
                  {t("account.password")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut />
                  {t("sign.out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <form onSubmit={updatePassword}>
            <DialogHeader>
              <DialogTitle>{t("account.passwordTitle")}</DialogTitle>
              <DialogDescription>{t("account.passwordSub")}</DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="account-password">{t("reset.newPassword")}</Label>
                <Input id="account-password" type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account-password-confirm">{t("account.passwordConfirm")}</Label>
                <Input id="account-password-confirm" type="password" minLength={6} required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={saving || !password || !confirm}>
                {saving ? t("auth.pleaseWait") : t("reset.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}