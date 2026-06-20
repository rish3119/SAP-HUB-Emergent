All tests pass with 100% success on both backend and frontend, including the Claude AI evaluation working end-to-end. Let me write the PRD and finish.
Action: file_editor create /app/memory/PRD.md --file-text "# TCS SAP Hub — Product Requirements (Living Doc)

## Original Problem Statement
Build a web app that helps teams at TCS manage SAP-related projects more efficiently. Provide a dashboard to track tasks, deadlines, and progress, integrate with GitHub for version control, include a learning portal where associates practice C, C++ and Linux scripting challenges, and serve as a central hub for project management, technical learning, and team communication.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB async), JWT auth via httpOnly cookies + Bearer fallback, bcrypt password hashing, Emergent LLM key wiring Claude Sonnet 4.5 for AI code evaluation.
- **Frontend**: React 19 (CRA + Craco), React Router 7, Tailwind + shadcn/ui, recharts for analytics, sonner for toasts, Outfit / IBM Plex Sans / IBM Plex Mono fonts.
- **DB**: MongoDB, UUID string ids on every document.

## User Personas
- **Project Lead (admin)** — owns engagements, defines tasks, monitors team velocity, links GitHub repos.
- **Associate** — picks up tasks, comments, practices coding challenges, climbs leaderboard.

## Core Requirements (static)
1. JWT email/password auth (cookie + Bearer)
2. Dashboard with KPIs, task distribution chart, projects list, skills leaderboard
3. Tasks kanban (To Do / In Progress / Review / Done) with CRUD + comments
4. GitHub repo panel with commit feed (light integration)
5. Learning portal with C, C++, Linux Shell challenges, AI-graded submissions (Claude Sonnet 4.5)
6. Profile page with stats and submission history

## Implemented (2026-02-12)
- Backend `/app/backend/server.py`: auth, users, projects, tasks (+comments), repos, challenges, submissions, dashboard stats, leaderboard.
- Seed: admin + associate user, 3 SAP projects, 8 tasks, 3 repos, 6 challenges.
- Frontend pages: Login, Register, Dashboard, Tasks (kanban + dialog), GitHub, Learning, Challenge (code editor + AI feedback), Profile.
- Test credentials written to `/app/memory/test_credentials.md`.
- Tests: 100% passing (backend + frontend) on iteration 1.

## Backlog
### P0
- Real GitHub OAuth (currently light/stored repos)
- Drag-and-drop on kanban (currently dropdown menu)
- Real code execution (Judge0) alongside AI eval

### P1
- Project detail page with task burndown
- Team chat (channels + DMs) — current: per-task comments only
- Admin challenge authoring UI

### P2
- Notifications + mentions
- Cohort/leaderboard filters
- Badges and achievements for learning streaks
"
Observation: Create successful: /app/memory/PRD.md