import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type Lang = "en" | "ka";

const en = {
  "app.name": "Personal planner",
  "sign.in": "Sign in",
  "sign.out": "Sign out",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirm.yes": "Yes, continue",

  "landing.badge": "Plans & money, in one place",
  "landing.title1": "Plan your day.",
  "landing.title2": "See where the month went.",
  "landing.sub":
    "Daily plans on one side — income, budgets and what you actually spent on the other. Finish each day knowing exactly how both went.",
  "landing.cta": "Create your account",
  "landing.cta2": "I already have one",
  "landing.note": "English & Georgian · email confirmation · your plans stay private by default",
  "landing.mock.today": "Today",
  "landing.mock.p1": "Morning run",
  "landing.mock.p2": "Read 20 pages",
  "landing.mock.p3": "Call the dentist",
  "landing.mock.open": "open",
  "landing.mock.done": "done",
  "landing.mock.notdone": "not done",
  "landing.mock.c1": "Groceries",
  "landing.mock.c2": "Rent",
  "landing.mock.c3": "Transport",
  "landing.mock.spent": "Spent against plan",
  "landing.mock.over": "Over budget",
  "landing.mock.note":
    "Illustration only — your own categories, amounts and currency sit here.",
  "landing.section.plans": "Plans",
  "landing.section.plans.sub":
    "The handful of things that actually matter today, and honest numbers on how they went.",
  "landing.section.money": "Money",
  "landing.section.money.sub":
    "A plan for the month before it starts, and a clear view of what it really costs.",
  "landing.f1.title": "Today, front and center",
  "landing.f1.text": "You land on today's plans. One click marks a plan done or not done.",
  "landing.f2.title": "Statistics that follow your filters",
  "landing.f2.text": "Filter by date, status or text — the numbers recalculate on exactly what you see.",
  "landing.f3.title": "Evening reminder",
  "landing.f3.text":
    "Every evening at 21:30 we email you the plans you left open, so nothing stays unresolved.",
  "landing.m1.title": "Budgets per category",
  "landing.m1.text":
    "Set a planned amount for each income source and expense category, month by month. Next month is the default, and last month's plan copies over in one click.",
  "landing.m2.title": "Spending against plan, live",
  "landing.m2.text":
    "Record what you actually spent and watch each budget fill up. Close to the limit or past it, the app flags it.",
  "landing.m3.title": "Reports, receipts and exports",
  "landing.m3.text":
    "Charts over time, planned vs actual per category, notes and receipts on entries, plus CSV or PDF export for any month.",
  "landing.also.title": "Also inside",
  "landing.also.1": "Recurring plans",
  "landing.also.2": "Share a plan with family",
  "landing.also.3": "Table and calendar views",
  "landing.also.4": "GEL · USD · EUR · PLN",
  "landing.how.title": "How it works",
  "landing.how.s1.title": "Create an account",
  "landing.how.s1.text": "Confirm your email, then pick English or Georgian — the whole app follows.",
  "landing.how.s2.title": "Set the month up",
  "landing.how.s2.text":
    "Add income by source and a planned amount per expense category. You're always one month ahead.",
  "landing.how.s3.title": "Run the day",
  "landing.how.s3.text":
    "Tick plans off as you go, record spending, and get an evening email with whatever is still open.",
  "landing.cta3.title": "Start with today",
  "landing.cta3.sub":
    "Confirm your email and you're in — plans and money, in one quiet place.",
  "landing.footer": "Personal planner — plans and money, in one place.",

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
  "auth.emailExists": "An account with this email already exists. Try signing in instead.",
  "auth.forgot": "Forgot password?",
  "auth.resetSent": "We sent a password reset link to {email}. Check your inbox.",
  "reset.title": "Set a new password",
  "reset.sub": "Choose a new password for your account.",
  "reset.newPassword": "New password",
  "reset.confirmPassword": "Repeat new password",
  "reset.submit": "Update password",
  "reset.noMatch": "Passwords don't match.",
  "reset.success": "Password updated. You're signed in now.",
  "reset.invalid": "This reset link is invalid or has expired. Request a new one.",

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
  "view.table": "Table",
  "view.calendar": "Calendar",
  "cal.more": "+{n} more",
  "cal.hint": "Click a day to add a plan on that date.",
  "cal.planTitle": "Change status",
  "cal.planBody": "Pick a new status for this plan.",
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
  "sh.share": "Share",
  "sh.edit": "Edit",
  "sh.title": "Share plan",
  "sh.body": "Invite someone by their account email. They can change the status and edit the plan after accepting.",
  "sh.email": "Email",
  "sh.invite": "Invite",
  "sh.sent": "Invitation sent",
  "sh.noAccount": "No account found with this email",
  "sh.self": "You can't invite yourself",
  "sh.notOwner": "Only the owner can share this plan",
  "sh.people": "People",
  "sh.remove": "Remove",
  "sh.PENDING": "Waiting",
  "sh.ACCEPTED": "Accepted",
  "sh.DECLINED": "Declined",
  "sh.shared": "Shared",
  "sh.from": "from {email}",
  "sh.requests": "Requests",
  "sh.reqTitle": "Collaboration requests",
  "sh.reqBody": "Someone wants to do these plans together with you.",
  "sh.reqNone": "No pending requests.",
  "sh.accept": "Accept",
  "sh.decline": "Decline",
  "sh.accepted": "Plan added to your list",
  "sh.declined": "Request declined",
  "ed.title": "Edit plan",
  "ed.save": "Save",
  "ed.saved": "Plan updated",
  "ed.name": "Title",
  "ed.desc": "Description",
  "ed.date": "Date",
  "pl.onlyOpenEdit": "Only open plans can be edited",
  "pl.onlyOpenShare": "Only open plans can be shared",

  "help.button": "How to use",
  "help.title": "How to use the planner",
  "help.intro": "A quick tour of the two sections: Plans and Expenses.",
  "help.plans.title": "Plans",
  "help.plans.s1":
    "Click \"Add plan\" and enter a title and date. You can also make it repeat daily, weekly or monthly.",
  "help.plans.s2":
    "Mark a plan done or not done with the buttons in the table — or click the plan itself in Calendar view.",
  "help.plans.s3":
    "Done plans show in green, not done in red. Filter by date, status or text — the statistics always follow what you see.",
  "help.plans.s4":
    "Share a plan via the Share button: enter the other person's email and they accept it under Requests.",
  "help.exp.title": "Expenses",
  "help.exp.s1":
    "Use \"Add income\" and \"Add expense\" to plan amounts per category for a month — it defaults to next month, but you can change it.",
  "help.exp.s2":
    "Open \"Details\" on an expense category to record what you actually spent, with notes and receipts.",
  "help.exp.s3":
    "The cards on top always show your income, actual expenses, savings (income minus planned) and the planned total.",
  "help.exp.s4":
    "The Reports section shows charts over time, planned vs actual per category, and CSV/PDF export.",
};

export type TKey = keyof typeof en;

const ka: Record<TKey, string> = {
  "app.name": "პირადი დამგეგმავი",
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
  "auth.emailExists": "ამ ელფოსტით ანგარიში უკვე არსებობს. სცადეთ შესვლა.",
  "auth.forgot": "დაგავიწყდათ პაროლი?",
  "auth.resetSent": "პაროლის აღსადგენი ბმული გავაგზავნეთ მისამართზე {email}. შეამოწმეთ შემომავალი წერილები.",
  "reset.title": "დააყენეთ ახალი პაროლი",
  "reset.sub": "აირჩიეთ ახალი პაროლი თქვენი ანგარიშისთვის.",
  "reset.newPassword": "ახალი პაროლი",
  "reset.confirmPassword": "გაიმეორეთ ახალი პაროლი",
  "reset.submit": "პაროლის განახლება",
  "reset.noMatch": "პაროლები არ ემთხვევა.",
  "reset.success": "პაროლი განახლდა. თქვენ შესული ხართ სისტემაში.",
  "reset.invalid": "ეს ბმული არასწორია ან ვადაგასულია. მოითხოვეთ ახალი.",

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
  "view.table": "ცხრილი",
  "view.calendar": "კალენდარი",
  "cal.more": "+{n} სხვა",
  "cal.hint": "დააჭირეთ დღეს, რომ ამ თარიღზე გეგმა დაამატოთ.",
  "cal.planTitle": "სტატუსის შეცვლა",
  "cal.planBody": "აირჩიეთ ახალი სტატუსი ამ გეგმისთვის.",
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
  "sh.share": "გაზიარება",
  "sh.edit": "რედაქტირება",
  "sh.title": "გეგმის გაზიარება",
  "sh.body": "მოიწვიე ადამიანი მისი ანგარიშის ელფოსტით. თანხმობის შემდეგ შეძლებს სტატუსის შეცვლას და გეგმის რედაქტირებას.",
  "sh.email": "ელფოსტა",
  "sh.invite": "მოწვევა",
  "sh.sent": "მოწვევა გაიგზავნა",
  "sh.noAccount": "ამ ელფოსტით ანგარიში ვერ მოიძებნა",
  "sh.self": "საკუთარი თავის მოწვევა შეუძლებელია",
  "sh.notOwner": "გაზიარება მხოლოდ მფლობელს შეუძლია",
  "sh.people": "მონაწილეები",
  "sh.remove": "წაშლა",
  "sh.PENDING": "მოლოდინში",
  "sh.ACCEPTED": "დათანხმდა",
  "sh.DECLINED": "უარი თქვა",
  "sh.shared": "გაზიარებული",
  "sh.from": "{email}-სგან",
  "sh.requests": "მოთხოვნები",
  "sh.reqTitle": "თანამშრომლობის მოთხოვნები",
  "sh.reqBody": "ვიღაცას სურს ეს გეგმები შენთან ერთად შეასრულოს.",
  "sh.reqNone": "მოთხოვნები არ არის.",
  "sh.accept": "თანხმობა",
  "sh.decline": "უარი",
  "sh.accepted": "გეგმა დაემატა შენს სიას",
  "sh.declined": "მოთხოვნა უარყოფილია",
  "ed.title": "გეგმის რედაქტირება",
  "ed.save": "შენახვა",
  "ed.saved": "გეგმა განახლდა",
  "ed.name": "სათაური",
  "ed.desc": "აღწერა",
  "ed.date": "თარიღი",
  "pl.onlyOpenEdit": "მხოლოდ ღია გეგმების რედაქტირებაა შესაძლებელი",
  "pl.onlyOpenShare": "მხოლოდ ღია გეგმების გაზიარებაა შესაძლებელი",

  "help.button": "როგორ გამოვიყენო",
  "help.title": "როგორ გამოვიყენოთ დამგეგმავი",
  "help.intro": "მოკლე მიმოხილვა ორი განყოფილებისა: გეგმები და ხარჯები.",
  "help.plans.title": "გეგმები",
  "help.plans.s1":
    "დააჭირეთ „გეგმის დამატება\" და შეიყვანეთ სათაური და თარიღი. სურვილისამებრ გაიმეორეთ ყოველდღიურად, ყოველკვირეულად ან ყოველთვიურად.",
  "help.plans.s2":
    "მონიშნეთ გეგმა შესრულებულად ან შეუსრულებლად ცხრილის ღილაკებით — ან დააჭირეთ თავად გეგმას კალენდარის ხედში.",
  "help.plans.s3":
    "შესრულებული გეგმები მწვანედაა, შეუსრულებელი — წითლად. გაფილტრეთ თარიღით, სტატუსით ან ტექსტით — სტატისტიკა ყოველთვის ემთხვევა იმას, რასაც ხედავთ.",
  "help.plans.s4":
    "გააზიარეთ გეგმა „გაზიარება\" ღილაკით: შეიყვანეთ მეორე ადამიანის ელფოსტა და ის დაადასტურებს „მოთხოვნები\" განყოფილებაში.",
  "help.exp.title": "ხარჯები",
  "help.exp.s1":
    "გამოიყენეთ „შემოსავლის დამატება\" და „ხარჯის დამატება\" თვის კატეგორიების დასაგეგმად — ნაგულისხმევია შემდეგი თვე, მაგრამ შეგიძლიათ შეცვალოთ.",
  "help.exp.s2":
    "გახსენით „დეტალები\" ხარჯის კატეგორიაზე, რომ ჩაიწეროთ რეალურად დახარჯული თანხები შენიშვნებითა და ქვითრებით.",
  "help.exp.s3":
    "ზედა ბარათები ყოველთვის გვიჩვენებს შემოსავალს, რეალურ ხარჯებს, დაზოგვას (შემოსავალი მინუს დაგეგმილი) და დაგეგმილ ჯამს.",
  "help.exp.s4":
    "„ანგარიშები\" განყოფილება გვიჩვენებს გრაფიკებს დროში, დაგეგმილსა და რეალურს კატეგორიებით, აგრეთვე CSV/PDF ექსპორტს.",
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
  const parts = iso.split("-");
  const y = Number(parts[0] ?? "1970");
  const m = Number(parts[1] ?? "1");
  const d = Number(parts[2] ?? "1");
  return new Date(y, m - 1, d).getDay();
}

const KA_MONTHS = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
/** "October 2026" / "ოქტომბერი 2026" — Georgian names hardcoded since browsers often lack ka locale data. */
export function formatMonthYear(year: number, month1: number, lang: string): string {
  if (lang === "ka") return `${KA_MONTHS[month1 - 1]} ${year}`;
  return new Date(year, month1 - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
