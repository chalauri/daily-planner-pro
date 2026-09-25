# Roadmap

- [x] Auth with mandatory email confirmation
- [x] Plans table + RLS (title, description, date, status OPEN/DONE/NOT_DONE)
- [x] Planner page: today default, filters (date range, status, text), stats on filtered data, add plan, mark done/not done
- [x] Recurring plans (daily/weekly/monthly series, max 366)
- [ ] Evening reminder email at 21:30 CET — BLOCKED: needs a sending domain (user action: email setup dialog)
- [ ] Google Calendar integration — deferred by user, add later

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
