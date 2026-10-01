# BUILD STATE — WSW 2026 Quiz Learning Platform

**Last Updated:** 2026-10-01

## Current Phase
Phase 13 — Bug fix: imported questions now visible in frontend

## Completed Phases
- Phase 1: Project inspection, Git setup, baseline commit
- Phase 2: Data model + importer (50 topics, 530 questions parsed from 13 markdown files)
- Phase 3: SQLite (sql.js) + Express backend API (18 endpoints)
- Phase 4: React + Vite frontend (7 pages, responsive design system)
- Phase 5: Learning system (ReactMarkdown, tabs: Learn/Key Facts/Terms/Confusions)
- Phase 6: Question practice (difficulty sorting, no timer, progress tracking)
- Phase 7: Progress tracking (per-question, per-topic, review mistakes)
- Phase 8: Master/Admin dashboard (overview, questions, validation, inline editing)
- Phase 9: Validation + duplicate detection (Jaccard similarity, 17 duplicates found)
- Phase 10: Testing + responsive polish (mobile/tablet breakpoints, scroll-to-top)
- Phase 11: Final GitHub checkpoint
- Phase 12: Generated 1,145 questions for 40 topics, imported 1,125 (20 cross-topic duplicates removed), answer option positions randomised
- Phase 13: Fixed imported questions not appearing in frontend (root cause: concurrent sql.js process overwrote database; added port-check safety guard to import script)

## Architecture
```
server/          Express + sql.js backend
  src/db.js      Database layer (sql.js, async init, file persistence)
  src/importer.js Markdown parser (13 research files → 50 topics, 530 original questions)
  src/import_generated_questions.js  Imports generated question bank (40 files → 1,125 new questions)
  src/index.js   REST API server (port 3001)

client/          React + Vite frontend
  src/App.jsx    Router with 8 routes
  src/lib/api.js API client
  src/pages/     7 page components
  src/index.css  Design system with responsive breakpoints
```

## Database Stats
- **Topics:** 50 (all with questions)
- **Questions:** 1,655
  - Original (from research files): 530 (topics 1-2, 11-16, 19-20)
  - Generated + imported: 1,125 (topics 3-10, 17-18, 21-50)
  - Skipped as cross-topic duplicates: 20
- **Difficulty breakdown:** Easy 609, Medium 794, Hard 252
- **Answer distribution (full DB):** A 16.3%, B 33.2%, C 31.3%, D 19.2%
- **Answer distribution (new imports only):** A 22.7%, B 24.6%, C 26.4%, D 26.3%
- **Validation:** 0 missing explanations, 0 missing sources, 0 invalid answers

## Generated Question Files
- Location: `research/generated_questions/`
- 40 markdown files, 1,145 questions total (before dedup)
- Format: structured markdown with ### Question N headers
- Backup: `data/quiz.db.backup_before_import`

## API Endpoints
- GET /api/topics, /api/topics/:id, /api/topics/:id/questions
- GET /api/questions (filterable), /api/questions/:id, /api/questions/random/:count
- PUT /api/questions/:id (edit any field)
- GET/POST /api/progress, /api/progress/topics, /api/progress/incorrect
- POST/DELETE /api/questions/:id/flag, GET /api/flagged
- GET /api/validation, /api/stats, /api/duplicates

## Frontend Pages
1. **Home** — Dashboard with stats, progress bar, quick actions, recently practiced
2. **Topics** — Grid browser with category tabs (All/Astronomy/Physics/ISRO/International)
3. **TopicDetail** — Learn content tabs, prerequisite links, difficulty-filtered practice
4. **Practice** — Question cards, Easy→Hard ordering, NO TIMER, explanations, session stats
5. **ReviewMistakes** — Incorrect questions not yet corrected, show/hide answers
6. **Admin** — Overview/Questions/Validation/Duplicates tabs, full filtering
7. **AdminQuestion** — Inline editing, verify/flag/unflag, validation checks, prev/next nav

## Git History
- f9c4af4 feat: project foundation with research data and backend API
- 2210aa0 feat: add React frontend with learning platform and admin dashboard
- f7e9077 feat: add duplicate detection, validation enhancements, and responsive polish
- 96ffcc7 docs: update BUILD_STATE.md with final project status

## How to Run
```bash
# Terminal 1: Backend
cd server && npm install && node src/index.js

# Terminal 2: Frontend
cd client && npm install && npm run dev
```
Backend: http://localhost:3001 | Frontend: http://localhost:5173

## How to Re-import (if needed)
```bash
# Full re-import from scratch (destructive — replaces all data):
cd server && node src/importer.js

# Then add generated questions (server must NOT be running):
cd server && node src/import_generated_questions.js
```

## Known Issues
- Original 530 questions have some B-answer bias (not randomised); new 1,125 are balanced
- 17 potential duplicate questions from original import detected (≥70% word similarity)

## How to Continue if Interrupted
1. Read BUILD_STATE.md for current state
2. Check `git log --oneline` for last commit
3. Run both servers and open http://localhost:5173
4. Use Admin dashboard to review questions and validation issues
