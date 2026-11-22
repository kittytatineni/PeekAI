# Architecture

`React/TypeScript/Vite UI` → `localStorage` for courses/tasks/calendar availability/blocks.

`React UI` → `FastAPI` HTTP endpoints (`/api/syllabus/analyse`, `/api/study/quiz`, `/api/study/mark`, `/api/chat`, `/api/study-plan`) → configured OpenAI-compatible GLM provider.

Syllabus PDF text extraction: `pypdf` in FastAPI. Calendar: local deterministic scheduling and conflict checks; Google OAuth read-only import and ICS import/export. The date-window policy lives in `src/utils/schedulingPolicy.ts`, imported by Calendar and tested by `evals/run-scheduling.mjs`.

No server database, user account system, or encrypted local persistence is implemented.
