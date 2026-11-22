# PeekAI — context-aware university study assistant

PeekAI is a prototype combining syllabus analysis, a course-aware task planner, adaptive study scheduling, question generation, marking feedback, and Study Buddy. **It is not a validated learning intervention.**

## Requirements

- Node.js 20+ and npm
- Python 3.11+ (project developed with 3.11)
- A valid OpenAI-compatible provider account/key for AI features

## Install and run

From project root, in one terminal:

```bash
npm ci
npm run dev
```

In another terminal:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Copy .env.example to .env and fill in your own API credentials
python -m uvicorn main:app --reload
```

Copy `.env.example` to `.env.local` at project root to enable Google OAuth, then configure your own Google client ID and authorised localhost origin. **Do not commit `.env`, `.env.local`, or secrets.** Frontend runs on the Vite URL shown in the terminal (usually `http://localhost:5173`); backend defaults to `http://localhost:8000`.

## Demo verification walkthrough

1. Open Courses, create a course and optionally upload a text-based syllabus PDF; review generated topics and assessment dates.
2. Open Planner and inspect linked tasks, priorities and unscheduled work.
3. Open Calendar, configure availability, choose Adaptive, schedule the next 9 weeks; inspect catch-up work and missed sessions.
4. Open Study Centre, generate a quiz and request written feedback with model credentials configured. If provider fails, show the error rather than an invented mark.
5. Delete a disposable test course and verify its Planner tasks and linked Calendar blocks disappear.

Use a clean browser profile or clear PeekAI localStorage for a reproducible demonstration. **Deleting a course removes its linked work.**

## Evaluation commands

```bash
python evals/run_evals.py
node --experimental-strip-types evals/run-scheduling.mjs
```

These are deterministic synthetic tests; they **do not** evaluate real syllabus extraction accuracy or live GLM answer quality. See `evals/README.md` for metrics, baseline, dataset separation and future real-case evaluation protocol.

## Submission documentation

- [Evaluation methodology](evals/README.md)
- [Data provenance and privacy](docs/DATA_PRACTICES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Known limitations and feature verification](docs/LIMITATIONS.md)
- [Final 1 rubric evidence checklist](docs/RUBRIC_MAPPING.md)

The solo-project contribution criterion is addressed by course policy; preserve your own git commit history as provenance. Report measured outcomes only, and disclose untested features.

### Final 1 evaluation and security documentation

- `docs/SECURITY_AND_DEPENDENCIES.md` — unresolved npm audit findings, risk decision and Windows packaging limitation.
- `docs/LIVE_AI_EVALUATION.md` — opt-in real GLM evaluation protocol and human review instructions.
- `python evals/run_live_ai.py` — dry-run preview (does **not** call the model).
- `python evals/run_live_ai.py --run --split development` — calls configured model and saves local results; review before sharing.
