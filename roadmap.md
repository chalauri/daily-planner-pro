# Roadmap

- [x] Auth with mandatory email confirmation
- [x] Plans table + RLS (title, description, date, status OPEN/DONE/NOT_DONE)
- [x] Planner page: today default, filters (date range, status, text), stats on filtered data, add plan, mark done/not done
- [x] Recurring plans (daily/weekly/monthly series, max 366)
- [ ] Evening reminder email at 21:30 CET — BLOCKED: needs a sending domain (user action: email setup dialog)
- [ ] Google Calendar integration — deferred by user, add later
- [x] Yearly plans: Daily/Yearly sub-tabs under Plans (Daily default), year switcher, sub-plans checklist, per-plan % (sub-plan ratio or manual 0–100), year success-rate card, EN/KA/PL

## This batch — done and verified in preview
- [x] Day-of-week column in plans table (auto-calculated, not inputable)
- [x] Delete confirmation popup
- [x] Confirmation popup when changing status of a future-dated task
- [x] Bilingual UI: English + Georgian with language toggle
- [x] Hide element with ID `lovable-badge` via global CSS
- [ ] Reminder email time changed from 23:55 to 21:30 CET (job still to build — blocked on sending domain)

## Expenses
- [x] Expenses tab: categories, budgets per month, transactions (notes, receipts, monthly repeat), currency default + per-month override (GEL/USD/EUR/PLN)
- [x] In-app budget alerts (80% / over), month summary, charts, CSV + PDF (print) export, Details per category

## Landing screen (before login)
- [x] Copy now covers both Plans and Money: hero, two preview cards (today plans / monthly budgets), six feature cards, "also inside" chips, how-it-works, closing sign-up panel, footer
- [x] English + Georgian, month label localized, no page errors
- [x] Savings tab: cash/stocks/retirement, 4 currencies, company combobox, filters, entries/monthly/yearly tables with per-currency totals, CSV

## Signed-in interface
- [x] Shared header with left-aligned brand/navigation, language dropdown, and account menu for requests, help, password update, and sign out
- [x] Planner refinements: status-tinted statistics and rows, friendly dates, compact filters, aligned add action, and illustrated empty state

## Landing page refinements — verified in preview
- [x] Header language links replaced by a single globe dropdown (EN/ქარ/PL) matching the app header, with Sign in beside it (same in footer)
- [x] Secondary hero button "I already have one" given a subtle dark border, crisp dark hover fill, and the same size/structure as the primary button
- [x] Plans and Money section headers stack the descriptive sub-text under the title on the left
- [x] "ALSO INSIDE" pills: consistent padding, icon in a tinted circle, single row evenly spaced across the card (stacks on narrow screens)

## Branding — icon & page titles
- [x] Custom browser icon (pine tile, white check rising into a gold growth arrow) as SVG plus 32px and 180px PNGs; default Lovable icon removed
- [x] Browser tab titles on every page now read "Plan & Prosper"
- [ ] Landing footer line still says "Personal planner — plans and money, in one place." (pending owner's OK to rebrand)
