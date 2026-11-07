<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use `AppHeader` for every signed-in section so navigation, language, requests, help, account, and sign-out controls remain consistent.
- Expense tables share the browser-safe expense-sort utility and ExpenseSortHeader so month and range views compare numeric values and expose consistent accessible sorting.
- PlanStatistics queries the entire selected year with pagination independently of table filters, and uses the browser-safe monthly plan statistics utility so charts and calculation tests share one source of truth.
- When one section asks another section to change what it shows (for example the header bell asking Plans to filter), go through the small request/subscribe module in `src/lib/plan-filter.ts` instead of props or URL params, so it works whether or not the target page is already mounted.
