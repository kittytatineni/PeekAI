# Data practices — PeekAI Final 1

## Data inventory and provenance

| Source | Purpose | Provenance and caveat |
|---|---|---|
| User-provided syllabus PDFs | Course/topic/assessment extraction | Users must be authorised to process and share them; may contain identifying information |
| User-entered tasks and availability | Planning and calendar | Locally entered personal scheduling data |
| Google Calendar events | Read-only busy-time import | Requires user OAuth consent; may expose sensitive schedule metadata |
| Synthetic development and held-out fixtures | Contract, scheduling and live AI tests | Project-authored, not independent or representative student samples |
| Five UNSW T2 2026 course-outline PDFs | Real syllabus extraction review | COMP6841, ACTL2111, DDES1160, BIOC3111, LAWS1022; source redistribution rights must be verified |

The real-outline evaluation used saved JSON outputs and manually transcribed expected assessment names and weights. The file named `ACTS2111.pdf` in the evaluation dataset refers to **ACTL2111** (a filename typo). Consult `../evals/dataset_manifest.csv` for identifiers and dataset details. Do not publicly redistribute PDFs unless permission/licence permits it; if necessary keep them in a private evaluation environment and document lawful acquisition.

## Preparation, separation and measurement

- `../evals/datasets/development/` contains development fixtures; `../evals/datasets/held_out/` contains distinct synthetic evaluation fixtures. Prior inspection and project authorship mean these are **not independently sealed blind holdouts**.
- The scheduling boundary set was motivated by known failures and is a regression set, not independent evidence of generalisation.
- The five real outlines are a small purposive, development-influenced sample; their saved successful analyses do not measure first-attempt success.
- The real-syllabus script measures expected assessment-name **recall** and matched weight correctness, not false-positive precision. Its automatic date check flagged 9 of 15 for review; a separate manual check found 15/15 provisionally consistent, including unspecified dates. See the full evaluation report for caveats.
- Manual review found 34/34 generated top-level topic groups broadly grounded, but not exhaustive topic recall. BIOC3111 lab topics were underrepresented and course prerequisites were sometimes misclassified as topic dependencies.

## Privacy, retention and security

Course/task/calendar data is held in browser `localStorage`, not encrypted storage. Uploaded syllabus text and prompts may be sent to a third-party model API; confirm its terms and obtain appropriate consent before processing sensitive materials. The backend may log raw model responses; avoid private student data and remove or restrict raw-response logging before deployment. Do not commit `.env`, API keys, identifiable student responses or OAuth credentials; rotate any previously exposed keys.

## Quality and licensing limitations

PDF text extraction may omit scanned text or scramble tables, columns and dates. Inferred deadlines need source confirmation. Check official course outlines for authoritative wording (including issue dates versus submission deadlines). No independent human-rating study, educational-outcome dataset, or formal security/privacy audit has been completed. See `../evals/FINAL1_EVALUATION_REPORT.md`, `../evals/README.md`, and `SECURITY_AND_DEPENDENCIES.md`.
