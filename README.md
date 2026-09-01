# FinFlow
Mobile-first personal finance webapp, Thai default, Kanit, cream/earth tone.

## Included
- Dashboard: net worth, net cash flow, monthly allocation
- Income: multiple income sources
- Debt: original balance, current balance, annual interest, payment, payment day, payoff estimate, progress
- Assets: land / house / car with financing details
- Investments: sources + monthly actual entries, no return calculation
- Monthly expenses
- Savings goals with progress and forecast-friendly fields
- Insurance coverage records
- Financial calendar with paid checkbox flow and actual amount override
- Planned → Actual → recalculated balance flow
- CRUD with confirmation for destructive actions and edit review for debt
- Month closing snapshots
- Supabase Email/Password authentication
- Automatic Household creation and membership for a first-time authenticated user
- Account bar showing the signed-in email, Household name, role, and sign-out
- LocalStorage remains the finance-data store for this phase; Supabase data sync is the next phase

## Run
npm install
npm run dev

## Deploy
Push to GitHub and connect the repository to Vercel.
