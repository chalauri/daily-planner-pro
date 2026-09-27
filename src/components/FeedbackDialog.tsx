import { useState } from "react";
import { Loader2, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/lib/i18n";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "19ab454e-f429-4997-8a40-78bb40cb7b35";

type Category = "bug" | "feature" | "general";

export function FeedbackDialog({ triggerClassName }: { triggerClassName?: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: "New Feedback from Plan & Prosper App",
          email,
          category: t(`feedback.cat.${category}`),
          message,
        }),
      });
      const result = (await response.json()) as { success?: boolean };
      if (!response.ok || !result.success) throw new Error("send failed");
      toast.success(t("feedback.sent"));
      setEmail("");
      setMessage("");
      setCategory("general");
      setOpen(false);
    } catch {
      toast.error(t("feedback.error"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={triggerClassName}>
          <MessageSquareHeart className="h-4 w-4" />
          {t("feedback.menu")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("feedback.title")}</DialogTitle>
          <DialogDescription>{t("feedback.sub")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="feedback-email">{t("feedback.email")}</Label>
            <Input
              id="feedback-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("feedback.category")}</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{t("feedback.cat.bug")}</SelectItem>
                <SelectItem value="feature">{t("feedback.cat.feature")}</SelectItem>
                <SelectItem value="general">{t("feedback.cat.general")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="feedback-message">{t("feedback.message")}</Label>
            <Textarea
              id="feedback-message"
              required
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending ? t("auth.pleaseWait") : t("feedback.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
