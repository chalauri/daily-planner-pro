import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type Lang = "en" | "ka";

const en = {
  "sign.in": "Sign in",
  "sign.out": "Sign out",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirm.yes": "Yes, continue",

  "landing.badge": "Daily planner",
  "landing.title1": "Plan your day.",
  "landing.title2": "Finish your day.",
  "landing.sub":
    "A quiet place for the handful of things that actually matter today — with honest numbers on how it went.",
  "landing.cta": "Create your account",
  "landing.cta2": "I already have one",
  "landing.f1.title": "Today, front and center",
  "landing.f1.text": "You land on today's plans. One click marks a plan done or not done.",
  "landing.f2.title": "Statistics that follow your filters",
  "landing.f2.text": "Filter by date, status or text — the numbers recalculate on exactly what you see.",
  "landing.f3.title": "Evening reminder",
  "landing.f3.text":
    "Every evening at 21:30 we email you the plans you left open, so nothing stays unresolved.",

  "auth.signup.title": "Create account",
  "auth.signin.title": "Welcome back",
  "auth.signup.sub": "You'll confirm your email address before your first sign in.",
  "auth.signin.sub": "Sign in to see today's plans.",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.pleaseWait": "Please wait…",
  "auth.alreadyAccount": "Already have an account?",
  "auth.newHere": "New here?",
  "auth.createOne": "Create one",
  "auth.confirm.title": "Confirm your email",
  "auth.confirm.body":
    "We sent a confirmation link to {email}. Click it to activate your account, then come back and sign in.",
  "auth.confirm.back": "Back to sign in",
  "auth.error": "Something went wrong",

  "pl.title": "Your plans",
  "pl.showingOne": "Showing {date}",
  "pl.showingRange": "Showing {from} — {to}",
  "pl.from": "From",
  "pl.to": "To",
  "pl.status": "Status",
  "pl.allStatuses": "All statuses",
  "pl.search": "Search",
  "pl.searchPh": "Title or description",
  "pl.today": "Today",
  "pl.add": "Add plan",
  "pl.empty": "Nothing here yet. Add your first plan.",
  "pl.loading": "Loading…",
  "pl.col.plan": "Plan",
  "pl.col.date": "Date",
  "pl.col.day": "Day",
  "pl.col.status": "Status",
  "pl.col.actions": "Actions",
  "pl.deleteTitle": "Delete this plan?",
  "pl.deleteBody": "This action can't be undone.",
  "pl.futureTitle": "Changing a future task",
  "pl.futureBody": "You are changing the status of a future task. Are you sure you want this?",
  "pl.deleted": "Plan deleted",
  "pl.aria.done": "Mark {title} as done",
  "pl.aria.notDone": "Mark {title} as not done",
  "pl.aria.delete": "Delete {title}",

  "status.OPEN": "Open",
  "status.DONE": "Done",
  "status.NOT_DONE": "Not done",

  "stats.plans": "Plans",
  "stats.open": "Open",
  "stats.done": "Done",
  "stats.notDone": "Not done",
  "stats.completed": "Completed",

  "d.newTitle": "New plan",
  "d.newDesc": "It starts as open until you mark it later.",
  "d.title": "Title",
  "d.desc": "Description (optional)",
  "d.date": "Date",
  "d.repeat": "Repeat",
  "d.repeat.none": "Does not repeat",
  "d.repeat.daily": "Daily",
  "d.repeat.weekly": "Weekly",
  "d.repeat.monthly": "Monthly",
  "d.until": "Until",
  "d.creates": "Creates {n} plans (max 366).",
  "d.saving": "Saving…",
  "d.add": "Add plan",
  "d.titlePh": "Call the accountant",
  "d.errUntil": "Pick an end date after the start date.",
  "d.errSession": "Your session expired. Please sign in again.",
  "d.addedN": "{n} plans added",
  "d.addedOne": "Plan added",

  "day.0": "Sunday",
  "day.1": "Monday",
  "day.2": "Tuesday",
  "day.3": "Wednesday",
  "day.4": "Thursday",
  "day.5": "Friday",
  "day.6": "Saturday",
};

export type TKey = keyof typeof en;

const ka: Record<TKey, string> = {
  "sign.in": "შესვლა",
  "sign.out": "გასვლა",
  "cancel": "გაუქმება",
  "delete": "წაშლა",
  "confirm.yes": "დიახ, გავაგრძელო",

  "landing.badge": "ყოველდღიური დამგეგმავი",
  "landing.title1": "დაგეგმე შენი დღე.",
  "landing.title2": "დაასრულე შენი დღე.",
  "landing.sub":
    "მშვიდი ადგილი იმ რამდენიმე საქმისთვის, რაც დღეს მართლაც მნიშვნელოვანია — პატიოსანი რიცხვებით, თუ როგორ წარიმართა ყველაფერი.",
  "landing.cta": "შექმენი ანგარიში",
  "landing.cta2": "უკვე მაქვს ანგარიში",
  "landing.f1.title": "დღეს — წინა პლანზე",
  "landing.f1.text":
    "გახსნისას უშუალოდ დღევანდელ გეგმებზე აღმოჩნდებით. ერთი დაჭერით მოინიშნება გეგმა შესრულებულად ან შეუსრულებლად.",
  "landing.f2.title": "სტატისტიკა თქვენი ფილტრების მიხედვით",
  "landing.f2.text":
    "გაფილტრეთ თარიღით, სტატუსით ან ტექსტით — რიცხვები ზუსტად იმას გადაითვლის, რასაც ხედავთ.",
  "landing.f3.title": "საღამოს შეხსენება",
  "landing.f3.text":
    "ყოველ საღამოს, 21:30 საათზე, ელფოსტით გაგზავნით გეგმებს, რომლებიც ღიად დარჩა, რათა არაფერი დარჩეს მოუგვარებელი.",

  "auth.signup.title": "ანგარიშის შექმნა",
  "auth.signin.title": "კეთილი იყოს თქვენი დაბრუნება",
  "auth.signup.sub": "პირველ შესვლამდე უნდა დაადასტუროთ თქვენი ელფოსტა.",
  "auth.signin.sub": "შედით სისტემაში დღევანდელი გეგმების სანახავად.",
  "auth.email": "ელფოსტა",
  "auth.password": "პაროლი",
  "auth.pleaseWait": "გთხოვთ, დაიცადოთ…",
  "auth.alreadyAccount": "უკვე გაქვთ ანგარიში?",
  "auth.newHere": "ახალი ხართ?",
  "auth.createOne": "შექმენით",
  "auth.confirm.title": "დაადასტურეთ თქვენი ელფოსტა",
  "auth.confirm.body":
    "დაადასტურების ბმული გავაგზავნეთ მისამართზე {email}. დააჭირეთ მას ანგარიშის გასააქტიურებლად, შემდეგ დაბრუნდით და შედით.",
  "auth.confirm.back": "დაბრუნება შესვლაზე",
  "auth.error": "რაღაც შეცდომა მოხდა",

  "pl.title": "თქვენი გეგმები",
  "pl.showingOne": "ნაჩვენებია {date}",
  "pl.showingRange": "ნაჩვენებია {from} — {to}",
  "pl.from": "დან",
  "pl.to": "მდე",
  "pl.status": "სტატუსი",
  "pl.allStatuses": "ყველა სტატუსი",
  "pl.search": "ძებნა",
  "pl.searchPh": "სათაური ან აღწერა",
  "pl.today": "დღეს",
  "pl.add": "გეგმის დამატება",
  "pl.empty": "ჯერ არაფერია. დაამატეთ თქვენი პირველი გეგმა.",
  "pl.loading": "იტვირთება…",
  "pl.col.plan": "გეგმა",
  "pl.col.date": "თარიღი",
  "pl.col.day": "კვირის დღე",
  "pl.col.status": "სტატუსი",
  "pl.col.actions": "მოქმედებები",
  "pl.deleteTitle": "წავშალოთ ეს გეგმა?",
  "pl.deleteBody": "ეს ქმედება ვერ გაუქმდება.",
  "pl.futureTitle": "მომავალი დავალების შეცვლა",
  "pl.futureBody": "თქვენ ცვლით მომავალი დავალების სტატუსს. დარწმუნებული ხართ, რომ გინდათ ეს?",
  "pl.deleted": "გეგმა წაშლილია",
  "pl.aria.done": "მოინიშნე {title} შესრულებულად",
  "pl.aria.notDone": "მოინიშნე {title} შეუსრულებლად",
  "pl.aria.delete": "წაშალე {title}",

  "status.OPEN": "ღია",
  "status.DONE": "შესრულებული",
  "status.NOT_DONE": "ვერ შესრულდა",

  "stats.plans": "გეგმები",
  "stats.open": "ღია",
  "stats.done": "შესრულებული",
  "stats.notDone": "ვერ შესრულდა",
  "stats.completed": "შესრულებულია",

  "d.newTitle": "ახალი გეგმა",
  "d.newDesc": "დაემატება როგორც ღია, სანამ შემდეგ მოინიშნავთ.",
  "d.title": "სათაური",
  "d.desc": "აღწერა (არასავალდებულო)",
  "d.date": "თარიღი",
  "d.repeat": "გამეორება",
  "d.repeat.none": "არ მეორდება",
  "d.repeat.daily": "ყოველდღიურად",
  "d.repeat.weekly": "ყოველკვირეულად",
  "d.repeat.monthly": "ყოველთვიურად",
  "d.until": "მდე",
  "d.creates": "შეიქმნება {n} გეგმა (მაქსიმუმ 366).",
  "d.saving": "ინახება…",
  "d.add": "დამატება",
  "d.titlePh": "დარეკეთ ბუღალტერთან",
  "d.errUntil": "აირჩიეთ დასასრულის თარიღი საწყისი თარიღის შემდეგ.",
  "d.errSession": "თქვენი სესია ამოიწურა. გთხოვთ, ხელახლა შეხვიდეთ.",
  "d.addedN": "დაემატა {n} გეგმა",
  "d.addedOne": "გეგმა დაემატა",

  "day.0": "კვირა",
  "day.1": "ორშაბათი",
  "day.2": "სამშაბათი",
  "day.3": "ოთხშაბათი",
  "day.4": "ხუთშაბათი",
  "day.5": "პარასკევი",
  "day.6": "შაბათი",
};

const dictionaries: Record<Lang, Record<TKey, string>> = { en, ka };

const STORAGE_KEY = "dayplan-lang";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, params?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ka" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: TKey, params?: Record<string, string | number>) => {
    let text: string = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="font-medium"
      aria-label="Change language / ენის შეცვლა"
      onClick={() => setLang(lang === "en" ? "ka" : "en")}
    >
      {lang === "en" ? "ქარ" : "EN"}
    </Button>
  );
}

/** Weekday index (0 = Sunday) from a yyyy-MM-dd string, timezone-safe. */
export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getDay();
}
