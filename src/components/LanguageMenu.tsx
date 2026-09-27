import { Check, ChevronDown, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Lang, useLang } from "@/lib/i18n";

const LANGUAGES: { code: Lang; short: string; name: string }[] = [
  { code: "en", short: "EN", name: "English" },
  { code: "ka", short: "ქარ", name: "ქართული" },
  { code: "pl", short: "PL", name: "Polski" },
];

/** Public-page language selector, styled like the signed-in app header. */
export function LanguageMenu({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  const active = LANGUAGES.find((item) => item.code === lang) ?? LANGUAGES[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-1.5 px-2.5", className)}
          aria-label="Language / ენა / Język"
        >
          <Globe2 className="h-4 w-4" />
          <span>{active.short}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGES.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLang(item.code)}>
            <span className="w-7 font-medium">{item.short}</span>
            <span>{item.name}</span>
            {lang === item.code && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
