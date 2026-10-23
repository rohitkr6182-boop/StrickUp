# StreakUp

StreakUp is a responsive habit, study-session, and coding-practice tracker built with React, Vite, Tailwind CSS, React Router, Supabase, Recharts, date-fns, and Lucide.

## Run locally

Requirements: Node.js 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Without Supabase credentials, you can select **Continue in local mode** from the login or signup page. Local mode stores records in this browser only; it does not create an account, sync to the cloud, or protect data from other people using the same browser profile. Configure Supabase before using real accounts or cloud storage.

## Configure Supabase

1. Create a Supabase project.
2. In the Supabase SQL editor, run [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql). The migration creates profiles, habits, habit completions, study sessions, coding entries, and achievements; adds constraints, indexes, foreign keys and per-user RLS policies; and creates profiles for new auth users.
3. In **Authentication → URL Configuration**, set the Site URL to your local or deployed origin. Add the same origin to Redirect URLs, including `http://localhost:5173/reset-password` for local password recovery.
4. Copy `.env.example` to `.env.local` and set the project URL and **anon/public** key:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Restart the Vite server after changing environment variables. The application uses Supabase Auth and only the anon key in the browser. **Never put a Supabase service-role key in a `VITE_` variable or frontend source.**
6. Test signup, email confirmation (if enabled in Supabase Auth), login, password recovery, logout, and create/read/update/delete operations. The RLS policies scope all user-owned rows to `auth.uid()`.

New signups may require email confirmation depending on the project's Supabase Auth settings. For deployed password recovery, ensure your deployed `/reset-password` route is in the Supabase redirect allowlist.

## Features

- Public landing page, signup/login, email-based password recovery, protected app pages, and logout.
- Habit creation, editing, category and frequency selection, archive/restore, deletion, completion toggles, and completion history.
- Local-calendar daily streaks, longest streaks, and weekly streak helpers. Date-only keys are stored as calendar dates (not UTC-midnight timestamps), avoiding daylight-saving and month-boundary drift.
- Focus timer with start, pause, resume, refresh persistence, and saved study sessions.
- Coding log with platform, problem name/link, difficulty, topic, language, and optional time spent; filter by platform.
- Monthly activity calendar / heatmap combining habit completions, study sessions, and coding entries.
- Weekly and current-month charts sourced from recorded data, plus completion and study summaries.
- Persisted achievements for real habit, coding, and study milestones.
- Light/dark themes, browser notification permission control, and activity/study CSV downloads.
- Responsive desktop, tablet, and mobile layouts; loading, empty, error, and success states.

Browser reminders only request and remember notification permission. This app does not run a background scheduler or send notifications while its tab is closed.

## Data and security notes

- Cloud mode uses Supabase Postgres and Row Level Security; the service-role key is not required by, or exposed to, the client.
- Local mode has no authentication. Its data lives in `localStorage` on the current browser and should be treated as non-sensitive.
- Streaks use the browser's local calendar. Changing the device timezone changes which local date is considered "today", but already stored date-only activity does not shift.
- RLS is a database safeguard, not a substitute for configuring Supabase Auth, redirect URLs, and project access appropriately.

## Validation

```bash
npm test
npm run build
```

The date and habit tests cover daily and weekly streak logic, leap/month/year boundaries, local calendar dates, completions, and timer duration calculations.

## Deploy to Vercel

Import the repository into Vercel, set the two `VITE_SUPABASE_*` environment variables for the relevant deployment environments, deploy, and allow the deployed origin in Supabase Auth URL Configuration. `vercel.json` rewrites application routes to the Vite entry point so protected routes and password recovery resolve on refresh.
