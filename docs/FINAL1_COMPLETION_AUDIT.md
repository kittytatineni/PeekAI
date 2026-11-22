# PeekAI Final 1 — updated completion audit (22 November 2026)

## Current artifact status

The earlier `PeekAI(5).zip` audit found the root frontend manifest and lockfile missing. **That issue was corrected in `PeekAI_Final1_With_Package_Files.zip`: genuine `package.json` and `package-lock.json` were added.** The sanitized source archive also contains frontend, backend, evaluation scripts, saved evidence and safe `.env.example` files. This fixes archive completeness, **not** runtime verification.

## Outstanding checks and risks

1. **Clean installation and integration not verified in this audit.** Run `npm ci`, frontend launch/compilation, backend dependency install, unit tests, and the complete syllabus-to-plan-to-quiz demo. Save actual outputs rather than assuming success.
2. **Credential exposure in the original upload.** `PeekAI(5).zip` contained `backend/.env` with an API-key setting. The sanitized archive omits it. If genuine, revoke/rotate the credential and inspect repository history; do not distribute the original archive.
3. **Windows installer packaging was not successful.** Previous frontend/Electron compilation succeeded, but `electron-builder` failed to extract signing tools because of Windows symlink privileges. See `SECURITY_AND_DEPENDENCIES.md`.
4. **Unresolved dependency advisories.** A previous npm audit recorded 20 findings; no remediation was performed. Do not claim the prototype is secure for public use.
5. **Documentation and rights.** Evaluation evidence is documented in `../evals/FINAL1_EVALUATION_REPORT.md`; confirm rights before publicly committing real university course-outline PDFs.
6. **Model and calendar limitations.** GLM requires valid credentials and may fail or retry. Scheduling is heuristic; Google Calendar import is read-only. Do not claim bidirectional sync or production reliability.

## Source-confirmed implementation

React frontend with course, planner, calendar and study UI; FastAPI endpoints for syllabus extraction, study-plan generation, quizzes and marking; local browser storage; deterministic scheduling/date-policy helper. This is code inspection, not evidence that all workflows were successfully run together.

## Evaluation evidence (separate from completion)

The saved evaluation report documents 16/16 offline contract checks, candidate scheduling 8/8 versus 4/8 baseline, four completed synthetic live held-out model calls, and five saved real-outline analyses with manually reviewed caveats. These are not independent educational-outcome results. See `EVALUATION.md`.

## Submission checklist

- Include the full sanitized source, root manifest/lockfile and documented environment variables, excluding real `.env` and generated dependency/build folders.
- Run and record the frontend/backend setup and evaluations from a clean environment; use a compatible Node version for the scheduling runner.
- Demonstrate upload → extraction → course/tasks → schedule → quiz → written feedback → deletion with test data, and note failures honestly.
- Verify privacy, licence and redistribution requirements for course-outline PDFs; retain genuine Git history.

**Status:** source package assembled; end-to-end reproducibility and desktop installer remain unverified.
