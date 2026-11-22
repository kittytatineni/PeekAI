# PeekAI — Final 1 evaluation suite

This folder contains the evaluation datasets, scripts, saved model responses, and review evidence for the COMP3110 Final 1 prototype. **Read `FINAL1_EVALUATION_REPORT.md` for results and interpretation, and `DATA_PRACTICES.md` for provenance, preparation, separation, and risks.**

## Quick reproduction

Run from the **PeekAI project root**, not from inside `evals/`:

```powershell
python evals/run_evals.py
python evals/evaluate_real_syllabus.py
python -m unittest discover -s evals -p "test_*.py"
node --experimental-strip-types evals/run-scheduling.mjs
```

- Python validation and real-syllabus scoring use the standard library and saved files; no API key is needed.
- The scheduling runner imports `src/utils/schedulingPolicy.ts` from the **full PeekAI repository**. It **cannot run from this `evals` folder alone**. Requires a compatible Node.js installation supporting `--experimental-strip-types` (project used Node 20.17; verify compatibility in your environment).
- The unittest suite imports backend code and may need the project's Python dependencies installed. If imports fail, install the backend requirements and run from the full project.
- `run_evals.py` writes `results/validation-latest.json`.
- `run-scheduling.mjs` writes `results/scheduling-latest.json`.
- `evaluate_real_syllabus.py` reads five saved `results/real-*.json` responses and writes `results/real_syllabus_evaluation.csv`.
- The real-syllabus script's `dates_correct` field is an **incomplete heuristic**, not a final deadline-accuracy score: 9/15 were flagged for review in the saved CSV. See the separately documented manual review.

## Optional live-model reproduction

```powershell
python evals/run_live_ai.py                  # dry run, no API calls
python evals/run_live_ai.py --run --split development
python evals/run_live_ai.py --run --split held_out
```

Live runs require the **full project**, its Python backend dependencies, `backend/.env` with `COMP3110_API_KEY` and `COMP3110_MODEL_BASE_URL`, and access to the configured model. **Calls may incur costs.** Never commit credentials. Live output may vary with model/provider/prompt version; saved JSON files preserve the runs actually reported. Review generated content manually before making semantic-quality claims.

## Test sets and what each measures

| Test | Data | Metric | Baseline | Output |
|---|---|---|---|---|
| Response contract | `datasets/held_out/response_validation.json` | Correct acceptance/rejection of hand-labelled synthetic quiz and mark responses | Hand-labelled expected validity | `results/validation-latest.json` |
| Scheduling policy | `datasets/scheduling_holdout.json` | Exact match on practice-window end and shifted status | Old policy returning `weekEndExclusive` without shift | `results/scheduling-latest.json` |
| Live model | `datasets/{development,held_out}/live_ai_cases.json` | Task-specific checks, latency, success rate, human review | For selected tasks, no-extraction or keyword baseline | `results/live-*.json` and `*-human-review.csv` |
| Real syllabus | Five public-facing UNSW T2 2026 course-outline PDFs in `datasets/real_syllabus/` | Course code, expected assessment-name recall and weight correctness; preliminary deadline checks | Manually transcribed expected assessment labels/weights | `results/real-*.json`, `results/real_syllabus_evaluation.csv` |
| Topic/source review | `results/topic_review.txt` plus original PDFs | Manual source grounding and identification of omissions/classification issues | Original outline descriptions, outcomes and schedules | `FINAL1_EVALUATION_REPORT.md` |

**Do not combine these percentages into a single 'AI accuracy' score.** Contract and scheduling tests are unit-level tests, not end-to-end model-quality evidence. The five real outlines are a small development-influenced sample, not an independently untouched held-out sample.

## File map

- `datasets/development/`: prompt-development cases.
- `datasets/held_out/`: designated synthetic holdout cases. Prior evaluation runs may have exposed these to the developer; do not claim blind evaluation after inspection.
- `datasets/real_syllabus/`: five supplied PDFs. `ACTS2111.pdf` is a **filename typo**; its actual course is `ACTL2111`.
- `results/real-acts2111.json`: saved ACTL2111 output, named to match the existing filename typo.
- `templates/`: annotation templates, not completed results.
- `results/`: recorded outputs, including manually scored human-review CSVs.

## Submission checklist

1. Include the full PeekAI repository, not only this folder, so the scheduling import and backend work.
2. Commit the evaluation scripts, small synthetic datasets, result CSV/JSON files and this documentation.
3. **Check university source redistribution rights before committing course-outline PDFs to a public repository.** If not permitted, keep them private and provide a legitimate acquisition procedure or permitted access route. Keep source hashes/identifiers for verification.
4. Add exact project setup and demo steps to the **root** README; this evaluation package alone cannot establish full app completion.
5. Document any changes to prompts/model, and rerun the relevant evaluations if changing the submitted implementation.
