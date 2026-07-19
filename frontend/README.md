# StudLyf HR — Frontend

A fresh HR SaaS dashboard frontend for the StudLyf HR platform, built against the
`STUDLYF-HR-Platform` Node/Express + Prisma backend (`backend-node`, port 3001).

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4
- React Router v6
- Zustand (auth state)
- Axios (cookie-based auth, auto refresh-on-401)
- Recharts, date-fns, lucide-react

## Features implemented
- **Auth** — signup/login/logout, httpOnly cookie sessions, silent token refresh
- **Dashboard** — document/export/template metrics, recent candidates
- **Talent Search** — multi-keyword search (`/students/search`), match-scored results,
  GitHub language "fingerprint" bar, skill tags
- **Leaderboard** — ranked student list (jury rating + GitHub activity + profile completeness)
- **Student profile** — GitHub stats, hackathon projects with jury ratings, invite-to-pipeline, GitHub re-sync
- **Hiring Pipeline** — drag-and-drop Kanban across Invited -> Reviewing -> Questions Sent -> Offered/Rejected,
  with a detail drawer for screening questions, meeting scheduling (Calendly), and direct messaging
- **Offer/Joining Letters** — list + editor with live preview and print/export
- **Meetings** — Calendly-backed meeting list with cancel
- **Messages** — per-candidate conversation threads
- **Settings** — profile, company info, and letter branding colors

## Setup

```bash
cd studlyf-hr-frontend
cp .env.example .env      # point VITE_API_BASE_URL at your backend-node instance
npm install
npm run dev               # runs on http://localhost:3000
```

The backend's CORS config already allows `http://localhost:3000` — this is why the
dev server is pinned to port 3000 in `vite.config.ts`. If you run the backend on a
different port than 3001, update `VITE_API_BASE_URL` in `.env` accordingly.

### Running the backend alongside it
From the `STUDLYF-HR-Platform` repo:
```bash
cd backend-node
npm install
npx prisma generate
npm run dev   # http://localhost:3001
```
You'll need a `.env` in `backend-node` with `DATABASE_URL`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `FRONTEND_URL=http://localhost:3000`, etc. — see the backend's
own README/Prisma schema for the full list.

Heads up: the `.env` screenshot shared earlier in this conversation contains a
real Supabase DB password and JWT secret — since it's already been forwarded/pasted
in multiple places, treat those as compromised and rotate them before relying on this
in anything beyond local testing.

## Design notes
The palette (deep indigo `#2D136F` / vivid violet `#5D22D8`) is pulled directly from
the backend's own `CompanyBranding` schema defaults, so the dashboard reads as an
extension of the product's own brand rather than a generic template. The signature
visual is the **language fingerprint** — a proportional stacked bar built from each
student's real `GitHubStats.topLanguages` — used on search results, the leaderboard,
and the student detail page.

## Known gaps / next steps
- Student-side flows (answering screening questions, GitHub OAuth connect) live in a
  separate student-facing app per the schema — not built here, since this covers the
  **HR** side only, per the brief.
- File uploads (profile photo, company logo/letterhead/signature/seal) aren't wired
  up yet — the backend has `/profile/upload-photo` (FastAPI) but the Node service's
  equivalent wasn't found in the routes reviewed; confirm with your backend dev.
- Calendly booking confirmation relies on the backend's webhook — meetings will show
  "scheduled" until that fires.
