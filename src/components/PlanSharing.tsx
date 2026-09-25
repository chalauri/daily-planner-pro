import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox, Pencil, Share2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n";
import type { Plan } from "@/lib/plan-types";

type ShareStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export interface Share {
  id: string;
  plan_id: string;
  owner_id: string;
  invitee_id: string;
  invitee_email: string;
  owner_email: string;
  status: ShareStatus;
}

/** All shares visible to me (as owner or invitee). */
export function useShares() {
  return useQuery({
    queryKey: ["shares"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_shares").select("*");
      if (error) throw error;
      return (data ?? []) as Share[];
    },
  });
}

export function useMyUserId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setId(data.user?.id ?? null));
  }, []);
  return id;
}

export function ShareButton({ plan }: { plan: Plan }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data: shares = [] } = useShares();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = shares.filter((s) => s.plan_id === plan.id);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("invite_to_plan", {
      _plan_id: plan.id,
      _email: email.trim(),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const map: Record<string, string> = {
      no_account: t("sh.noAccount"),
      self: t("sh.self"),
      not_owner: t("sh.notOwner"),
    };
    if (data !== "ok") { toast.error(map[data as string] ?? String(data)); return; }
    toast.success(t("sh.sent"));
    setEmail("");
    void qc.invalidateQueries({ queryKey: ["shares"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("plan_shares").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["shares"] });
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label={`${t("sh.share")} ${plan.title}`}
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sh.title")}</DialogTitle>
            <DialogDescription>{t("sh.body")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={invite} className="flex gap-2">
            <Input
              type="email"
              placeholder={t("sh.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label={t("sh.email")}
            />
            <Button type="submit" disabled={busy}>
              {t("sh.invite")}
            </Button>
          </form>
          {mine.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("sh.people")}</p>
              {mine.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{s.invitee_email}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {t(`sh.${s.status}`)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(s.id)}
                      aria-label={`${t("sh.remove")} ${s.invitee_email}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditPlanButton({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(plan.title);
  const [desc, setDesc] = useState(plan.description ?? "");
  const [date, setDate] = useState(plan.plan_date);

  function openIt() {
    setTitle(plan.title);
    setDesc(plan.description ?? "");
    setDate(plan.plan_date);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const { error } = await supabase
      .from("plans")
      .update({ title: title.trim(), description: desc.trim() || null, plan_date: date })
      .eq("id", plan.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("ed.saved"));
    setOpen(false);
    onSaved();
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={openIt} aria-label={`${t("sh.edit")} ${plan.title}`}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ed.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="ed-title">{t("ed.name")}</Label>
              <Input id="ed-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ed-desc">{t("ed.desc")}</Label>
              <Textarea id="ed-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ed-date">{t("ed.date")}</Label>
              <Input id="ed-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit">{t("ed.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Header button + auto popup on login when there are pending requests. */
export function CollabRequests({ onChanged }: { onChanged: () => void }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const me = useMyUserId();
  const { data: shares = [] } = useShares();
  const pending = shares.filter((s) => s.invitee_id === me && s.status === "PENDING");
  const [open, setOpen] = useState(false);
  const [autoShown, setAutoShown] = useState(false);

  const { data: titles = {} } = useQuery({
    queryKey: ["share-titles", pending.map((p) => p.plan_id).join(",")],
    enabled: pending.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("plans")
        .select("id,title,plan_date")
        .in("id", pending.map((p) => p.plan_id));
      return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    },
  });

  useEffect(() => {
    if (autoShown || !me || pending.length === 0) return;
    const key = `dayplan-requests-shown-${me}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    setAutoShown(true);
    setOpen(true);
  }, [me, pending.length, autoShown]);

  async function respond(s: Share, status: ShareStatus) {
    const { error } = await supabase.from("plan_shares").update({ status }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "ACCEPTED" ? t("sh.accepted") : t("sh.declined"));
    await qc.invalidateQueries({ queryKey: ["shares"] });
    onChanged();
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Inbox className="h-4 w-4" />
        {t("sh.requests")}
        {pending.length > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
            {pending.length}
          </span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sh.reqTitle")}</DialogTitle>
            <DialogDescription>{t("sh.reqBody")}</DialogDescription>
          </DialogHeader>
          {pending.length === 0 && <p className="text-sm text-muted-foreground">{t("sh.reqNone")}</p>}
          <div className="space-y-3">
            {pending.map((s) => {
              const p = titles[s.plan_id];
              return (
                <div key={s.id} className="surface-card flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="font-medium">{p?.title ?? "…"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p?.plan_date} · {t("sh.from", { email: s.owner_email })}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => respond(s, "ACCEPTED")}>
                      {t("sh.accept")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => respond(s, "DECLINED")}>
                      {t("sh.decline")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
