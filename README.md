# StudLyf HR SaaS Platform

A modern, high-fidelity HR SaaS dashboard designed for talent discovery, screening, interview scheduling, and automated offer/joining letter generation for StudLyf candidates.

---

## 🚀 Key Features

### 1. Talent Search & Discovery
* **Keyword Matching**: Search and filter students by custom keywords (e.g. `AIML`, `Frontend`, `React`, `Python`) in real-time.
* **GitHub Analytics**: A proportional "language fingerprint" bar built from each student's real GitHub language mix, plus repo/star/fork counts.
* **Hackathon Records**: Details of jury-rated student prototypes, jury scores, and evaluator feedback comments.
* **Leaderboard**: Students ranked by jury ratings, GitHub activity, project count, and profile completeness.

### 2. Kanban Hiring Pipeline
* **Drag-and-drop stage board**: Track invited candidates through pipeline columns: **Invited**, **Reviewing**, **Questions Sent**, **Offered**, and **Rejected**.
* **Interview Scheduler**: Schedule meetings tied to an application; syncs with the backend's Calendly integration.
* **Questionnaire Builder**: Create, assign, and track screening questionnaires for individual applicants.
* **Direct Messaging**: Per-candidate conversation threads.

### 3. Automated Document Generation
* Offer/joining letter editor pre-filled with candidate name, email, designation, start date, and salary, with a live preview and print/export.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Vite, React, TypeScript, Tailwind CSS v4, React Router, Zustand, Axios, Recharts, lucide-react.
* **Backend Systems**:
  - **Node.js + Express + Prisma** (`backend-node`, port `3001`) — the current, active backend. Handles auth, student search/leaderboard, applications/pipeline, screening questions, meetings, messages, documents, and profile/branding.
  - **FastAPI** (`backend`) — an earlier implementation of documents/profile/dashboard/auth, superseded by the Node/Prisma service (see comments in `backend-node/prisma/schema.prisma`). Kept for reference; not used by the current frontend.
* The frontend talks directly to the live Node API — there is no mock/offline fallback mode.

---

## 💻 Local Setup & Running

### Prerequisites
Node.js (v18+), and a Postgres database for Prisma.

### Backend
```bash
cd backend-node
npm install
npx prisma generate
# configure .env: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, FRONTEND_URL=http://localhost:3000
npm run dev   # http://localhost:3001
```

### Frontend
```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3001/api
npm install
npm run dev   # http://localhost:3000
```

Then open [http://localhost:3000](http://localhost:3000) — you'll land on `/login`, and after signing up/in, be routed to:
* Dashboard: `/dashboard`
* Talent Search: `/students`
* Leaderboard: `/leaderboard`
* Hiring Pipeline: `/pipeline`
* Letters: `/documents`
* Meetings: `/meetings`
* Messages: `/messages`
* Settings: `/settings`

See `frontend/README.md` for full frontend-specific details and known gaps.
