# COMP3110 Final 1 — rubric evidence mapping

| Criterion | Evidence included | Remaining caveats / next checks |
|---|---|---|
| **Evals (70)** | `evals/run_evals.py` (16/16 synthetic response checks); `evals/run-scheduling.mjs` (8/8 candidate vs 4/8 baseline); four saved live held-out GLM cases and human review; five real-outline analyses with 15/15 expected assessment-name recall and weight matches; `evals/FINAL1_EVALUATION_REPORT.md` | Small purposive/project-authored samples; no independent blind benchmark, comprehensive false-positive precision, or end-to-end scheduler placement benchmark |
| **Data practices (50)** | `docs/DATA_PRACTICES.md`, `evals/dataset_manifest.csv`, development/held-out separation, synthetic provenance, five real syllabus sources and quality notes, safe env examples | Verify permission/licensing for public PDF redistribution; held-out fixtures are not independently sealed; avoid sensitive student data |
| **Completion (50)** | React/TypeScript/Electron frontend and FastAPI backend source, restored `package.json` and lockfile, README setup guidance, architecture and limitation docs | Clean install, frontend/backend integration, full demo and Windows installer not verified for this assembled archive; dependency advisories remain |
| **Equal contribution (30)** | Solo project; rubric provides full marks for solo contribution | Preserve genuine Git history and ownership evidence |

**No marks are guaranteed.** Offline software checks, model completion, source-grounding review and educational effectiveness are different measurements; do not merge them into one percentage. See `docs/FINAL1_COMPLETION_AUDIT.md` and `evals/FINAL1_EVALUATION_REPORT.md`.
