# PeekAI Final 1 — evaluation methodology and evidence

**Authoritative results:** `../evals/FINAL1_EVALUATION_REPORT.md`. **Reproduction:** `../evals/README.md`. This document summarises the methodology without treating software checks as AI-quality evidence.

| Test | Metric and sample | Recorded result | Interpretation |
|---|---|---|---|
| Response-contract validation | Agreement with 16 hand-labelled synthetic valid/invalid cases | 16/16 | Validates acceptance/rejection logic, not factual answers |
| Practice-window scheduling | Exact-match end/shift on 8 regression cases | Candidate 8/8; old baseline 4/8 | Date policy only, not full calendar placement |
| Extra scheduling boundaries | Two assertions | 2/2 | Narrow boundary coverage |
| Live GLM held-out | Four synthetic tasks (syllabus, plan, quiz, marking) | 4/4 completed; mean saved latency ~4.37 s | Small, project-authored sample; not a general accuracy rate |
| Five real syllabus outputs | Structural check, expected assessment-name recall and matched weights | 5/5 saved outputs; 15/15 names and 15/15 weights | No false-positive precision score; saved successes don't measure retries |
| Deadline verification | Automated checks and separate manual comparison of 15 assessment records | 6 automatically accepted; 9 flagged for manual review; 15/15 provisionally consistent after manual comparison | Review flags are not confirmed errors. Includes unspecified dates; not a 100% exact-date accuracy claim |
| Topic grounding | 34 top-level groups manually checked | 34/34 broadly supported | Does not measure topic recall or complete lab coverage |

## Notable qualitative errors

The latest synthetic held-out review recorded an unsupported four-week course assertion and a JOIN quiz question that assumed one-to-one matching. BIOC3111 practical/laboratory coverage was incomplete and course prerequisites appeared as topic-level dependencies. These findings are retained rather than obscured by completion rates.

## Reproduce from full project root

```powershell
python evals/run_evals.py
python evals/evaluate_real_syllabus.py
python -m unittest discover -s evals -p "test_*.py"
node --experimental-strip-types evals/run-scheduling.mjs
```

The scheduling command needs a Node version supporting TypeScript stripping (tested with Node 22; Node 20.17 is not sufficient for this flag). Backend unit tests may need dependencies from `backend/requirements.txt`. Live-model reproduction additionally requires authorised credentials, internet/provider access and may incur costs; see `LIVE_AI_EVALUATION.md` and the evaluation README. **These commands have not been rerun as part of this documentation revision.**

## Scope

Keep development and held-out outputs separate; prior inspection means the held-out fixtures are not independently sealed. Do not aggregate these different percentages into an 'AI accuracy' figure or claim improved grades. Next priorities: fresh independently labelled course outlines, assessment false-positive precision, blinded human ratings, stronger baselines and end-to-end scheduler placement/conflict metrics.
