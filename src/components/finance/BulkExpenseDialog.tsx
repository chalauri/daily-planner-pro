import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFT } from "@/lib/finance-i18n";
import { currentUserId, money, type Category } from "@/lib/finance";

const T = {
  en: {
    title: "Bulk add expenses",
    desc: "One category per line, then the amounts separated by spaces. Saved with today's date and note \"BULK UPLOAD\".",
    lines: "{n} categories, {m} amounts",
    save: "Save",
    saved: "{n} expenses saved",
    notFound: "Not saved — category not planned for {mo}:",
    noAmounts: "Line without amounts:",
  },
  ka: {
    title: "ხარჯების მასობრივი დამატება",
    desc: "თითო ხაზზე ერთი კატეგორია, შემდეგ თანხები ჰარით გამოყოფილი. შეინახება დღევანდელი თარიღით და შენიშვნით \"BULK UPLOAD\".",
    lines: "{n} კატეგორია, {m} თანხა",
    save: "შენახვა",
    saved: "შენახულია {n} ხარჯი",
    notFound: "არ შეინახა — კატეგორია არ არის დაგეგმილი ({mo}):",
    noAmounts: "ხაზი თანხების გარეშე:",
  },
  pl: {
    title: "Dodaj wydatki zbiorczo",
    desc: "Jedna kategoria w wierszu, potem kwoty oddzielone spacjami. Zapisane z dzisiejszą datą i notatką \"BULK UPLOAD\".",
    lines: "Kategorie: {n}, kwoty: {m}",
    save: "Zapisz",
    saved: "Zapisano wydatków: {n}",
    notFound: "Nie zapisano — kategoria nie jest zaplanowana na {mo}:",
    noAmounts: "Wiersz bez kwot:",
  },
};

interface Line {
  name: string;
  amounts: number[];
}

export function parseBulk(text: string): Line[] {
  const out: Line[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const amounts: number[] = [];
    while (tokens.length) {
      const t = (tokens[tokens.length - 1] ?? "").replace(",", ".");
      if (!/^\d+(\.\d+)?$/.test(t)) break;
      amounts.unshift(Number(t));
      tokens.pop();
    }
    const name = tokens.join(" ");
    if (name) out.push({ name, amounts: amounts.filter((a) => a > 0) });
  }
  return out;
}

const norm = (s: string) => s.trim().toLocaleLowerCase().replace(/\s+/g, " ");

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: Category[];
  currency: string;
  onSaved: () => void;
}

export function BulkExpenseDialog({ open, onOpenChange, categories, currency, onSaved }: Props) {
  const { lang } = useFT();
  const s = T[(lang as keyof typeof T) in T ? (lang as keyof typeof T) : "en"];
  const fill = (str: string, p: Record<string, string | number>) => str.replace(/\{(\w+)\}/g, (_, k) => String(p[k] ?? ""));
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [empty, setEmpty] = useState<string[]>([]);

  const lines = useMemo(() => parseBulk(text), [text]);
  const count = lines.reduce((n, l) => n + l.amounts.length, 0);
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const moLabel = new Intl.DateTimeFormat(lang === "ka" ? "ka-GE" : lang === "pl" ? "pl-PL" : "en-US", { month: "long", year: "numeric" }).format(now);

  async function save() {
    setSaving(true);
    try {
      const userId = await currentUserId();
      const { data: budgets, error: bErr } = await supabase
        .from("budgets")
        .select("category_id, amount")
        .eq("year", now.getFullYear())
        .eq("month", now.getMonth() + 1);
      if (bErr) throw bErr;
      const planned = new Set((budgets ?? []).map((b) => b.category_id));
      const byName = new Map(
        categories.filter((c) => c.kind === "EXPENSE" && planned.has(c.id)).map((c) => [norm(c.name), c]),
      );
      const rows: { user_id: string; kind: "EXPENSE"; category_id: string; amount: number; tx_date: string; note: string; recurrence: string }[] = [];
      const miss: string[] = [];
      const noAmt: string[] = [];
      for (const l of lines) {
        const cat = byName.get(norm(l.name));
        if (!cat) {
          miss.push(l.amounts.length ? `${l.name} (${l.amounts.join(" ")})` : l.name);
          continue;
        }
        if (!l.amounts.length) {
          noAmt.push(l.name);
          continue;
        }
        for (const a of l.amounts)
          rows.push({ user_id: userId, kind: "EXPENSE", category_id: cat.id, amount: a, tx_date: today, note: "BULK UPLOAD", recurrence: "NONE" });
      }
      if (rows.length) {
        const { error } = await supabase.from("transactions").insert(rows);
        if (error) throw error;
        const total = rows.reduce((t, r) => t + r.amount, 0);
        toast.success(`${fill(s.saved, { n: rows.length })} · ${money(total, currency, lang)}`);
        onSaved();
      }
      setSkipped(miss);
      setEmpty(noAmt);
      if (!miss.length && !noAmt.length) {
        setText("");
        onOpenChange(false);
      } else {
        // keep only the lines that were not saved so the user can fix them
        setText(lines.filter((l) => !byName.get(norm(l.name)) || !l.amounts.length).map((l) => [l.name, ...l.amounts].join(" ")).join("\n"));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSkipped([]);
          setEmpty([]);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{s.title}</DialogTitle>
          <DialogDescription>{s.desc}</DialogDescription>
        </DialogHeader>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"საჭმელი 152 108 33\nბავშვი 39 57"}
          aria-label={s.title}
        />
        <p className="text-xs text-muted-foreground">{fill(s.lines, { n: lines.length, m: count })}</p>
        {skipped.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">{fill(s.notFound, { mo: moLabel })}</p>
            <ul className="mt-1 list-disc pl-5">
              {skipped.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        {empty.length > 0 && (
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            <p className="font-medium">{s.noAmounts}</p>
            <ul className="mt-1 list-disc pl-5">
              {empty.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        )}
        <DialogFooter>
          <Button onClick={save} disabled={saving || count === 0}>
            {s.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
