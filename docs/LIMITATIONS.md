# PeekAI — Final 1 limitations and demonstration scope

## Implemented in source, but requires runtime verification

The repository contains course creation, syllabus PDF upload, task planning, scheduling, quiz generation, written feedback and course deletion functionality. A clean end-to-end run of the assembled submission has **not** been independently verified in this documentation pass. Use disposable course data and record observed outcomes.

## Evaluation limits

- Offline contract tests (16/16) validate response structure; scheduling regression tests (8/8 candidate versus 4/8 baseline) validate a date policy, not tutoring accuracy or complete calendar scheduling.
- **Live GLM evaluations have been run:** four project-authored synthetic held-out tasks completed in the latest saved run. They are a small, non-blinded feasibility test, not a measure of general educational effectiveness. One unsupported duration assertion and a JOIN-question assumption were noted in human review.
- Five real course outlines were evaluated from saved model responses; expected assessment names and weights matched 15/15, but extra false positives were not scored. Deadline consistency was manually reviewed; 34 topic groups were broadly grounded without proving topic recall.
- BIOC3111 practical/lab topics were underrepresented, and course-level prerequisites could be misclassified as topic dependencies. Some real outlines needed retries after token truncation; saved success does not measure first-attempt reliability.
- No real-student learning gains, independent blinded ratings, large-scale marking agreement or production reliability have been established.

## Product and data limitations

- PDF extraction needs selectable text; scanned or poorly formatted PDFs may fail or lose details. Confirm inferred dates and assessment requirements against the original outline.
- Scheduling is heuristic; no guarantee of optimal balancing or zero conflicts after manual edits. Google Calendar integration is read-only and requires OAuth; ICS recurrence support is limited.
- Courses, tasks and blocks use browser `localStorage` without encryption, accounts or cross-device sync. Third-party AI calls require internet and credentials; latency, costs, token limits and HTTP failures vary.
- No production security review has been completed. A previous `npm audit` found 20 unresolved advisories. Windows installer packaging failed because of symlink permissions, despite successful frontend/Electron compilation in that earlier environment.

## Evidence and further work

See `../evals/FINAL1_EVALUATION_REPORT.md`, `EVALUATION.md`, `DATA_PRACTICES.md`, `LIVE_AI_EVALUATION.md`, and `SECURITY_AND_DEPENDENCIES.md`. Avoid presenting test completion percentages as a single AI-accuracy figure.
