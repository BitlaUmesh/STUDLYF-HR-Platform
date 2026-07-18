# StudLyf HR SaaS Platform

A modern, high-fidelity HR SaaS dashboard designed for talent discovery, screening, interview scheduling, and automated offer/joining letter generation for StudLyf candidates.

---

## 🚀 Key Features

### 1. Talent Search & Discovery
* **Keyword Matching**: Search and filter students by custom keywords (e.g. `AIML`, `Frontend`, `React`, `Python`) in real-time.
* **GitHub Analytics**: Visual language-focus share charts, commit counts, and repository metrics.
* **Hackathon Records**: Details of jury-rated student prototypes, jury scores, and evaluator feedback comments.

### 2. Kanban Hiring Pipeline
* **Trello-style Stage Board**: Track invited candidates dynamically through pipeline columns: **Invited**, **Reviewing**, **Questions Sent**, **Offered**, and **Rejected**.
* **Interview Scheduler**: Built-in calendar scheduler form with date/time pickers and meeting mode configuration (Google Meet, Zoom).
* **Questionnaire Builder**: Create, assign, and track screening questionnaires for individual applicants.
* **Chat Logs**: Real-time communication logs to send direct messages to candidates.

### 3. Automated Document Generation
* **Direct Pre-fill integration**: Automatically generate candidate offer or joining letters pre-filled with name, email, phone, designation, and custom interview answers directly inside the document builder workspace.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js (App Router), React, TailwindCSS, Lucide Icons, Framer Motion, Zustand.
* **Backend Systems**:
  - FastAPI: Handles core document template builders and editor drafts.
  - Node.js & Prisma (Separate service): Manages student searches and hiring pipeline structures.
* **Resilient API Design**: Supported with automatic offline mock fallbacks. If the Node database server on port `3001` is offline, the frontend falls back seamlessly to rendering cached/mock student details so evaluation remains fully functional.

---

## 💻 Local Setup & Running

### Prerequisites
Make sure you have **Node.js (v18+)** installed.

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   * Main Search Dashboard: [http://localhost:3000/dashboard/students](http://localhost:3000/dashboard/students)
   * Kanban Hiring Pipeline: [http://localhost:3000/dashboard/pipeline](http://localhost:3000/dashboard/pipeline)

---

## 📂 Git Repository Sync
This repository contains the complete feature suite built, tested, and pushed to:
`https://github.com/Sainitesh10/studlyf-hr`