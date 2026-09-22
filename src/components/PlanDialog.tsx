import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/lib/plan-types";

export function PlanDialog({ defaultDate, onCreated }: { defaultDate: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || todayISO());
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaving(false);
      toast.error("Your session expired. Please sign in again.");
      return;
    }
    const { error } = await supabase.from("plans").insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      plan_date: date,
      status: "OPEN",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plan added");
    setTitle("");
    setDescription("");
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDate(defaultDate || todayISO());
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New plan</DialogTitle>
            <DialogDescription>It starts as open until you mark it later.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-title">Title</Label>
              <Input
                id="plan-title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Call the accountant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">Description (optional)</Label>
              <Textarea
                id="plan-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-date">Date</Label>
              <Input
                id="plan-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Add plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
