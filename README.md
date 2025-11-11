# Lawn Mowing Manager

A TypeScript + React app (Vite) to manage clients, Saturday schedules (with a daily job limit), payments, and earnings for a lawn mowing business.

## Features
- Dashboard with totals and next Saturday summary
- Clients CRUD with per-client price
- Schedule planner (Saturday-only, daily limit)
- Job actions: complete/cancel, mark paid, edit amount, delete
- Reports: totals by date range and per-day breakdown
- Settings: jobs per Saturday, export/import JSON backup

## Getting started
1. Install Node.js 18+
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the URL shown in the terminal (usually http://localhost:5173)

## Tech
- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (persisted to localStorage)
- date-fns, lucide-react
