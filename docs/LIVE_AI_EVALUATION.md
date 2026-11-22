# Live GLM evaluation — executed 20 November 2026

## Purpose and scope

The opt-in `evals/run_live_ai.py` exercises PeekAI's actual backend AI functions: `analyse_syllabus`, `generate_study_plan`, `create_quiz`, and `mark_written`, using synthetic, hand-authored examples. No real student records were used. Live calls require credentials and may incur charges. The model used in the recorded held-out run was `scx-GLM-5.3`.

The results are **preliminary**. Small synthetic datasets and one reference-marked response do not establish general reliability, educational effectiveness, or production readiness.

## Metrics and baselines

- **Syllabus:** exact-match course code and name; assessment-name recall. The no-extraction baseline has assessment recall 0. Topic coverage, dates, weights, and grounding are reviewed manually.
- **Study plan:** 3–7 study days and total recommended minutes no greater than the stated weekly budget. No comparative plan baseline is implemented.
- **Quiz:** requested question count and nonempty prompts. These are structural checks, not measures of factual or pedagogical quality.
- **Written marking:** absolute error against a hand-authored reference score and agreement within 0.1. A keyword-only baseline is stored in the fixture; one case cannot support general accuracy claims.
- **All tasks:** success/error status and wall-clock latency. Provider token usage and cost are not recorded by this harness.

## Dataset and evaluation protocol

`evals/datasets/development/live_ai_cases.json` contains three synthetic development cases. `evals/datasets/held_out/live_ai_cases.json` contains four distinct synthetic cases: one each for syllabus extraction, study planning, quiz generation, and written-answer marking. The held-out examples were authored within the same project, so this is **not an independently sealed benchmark**. The reported human reference mark was authored, not established by inter-rater consensus.

From the project root with the Python environment active:

```powershell
python evals/run_live_ai.py                         # dry run, no live calls
python evals/run_live_ai.py --run --split development
python evals/run_live_ai.py --run --split held_out
python -m unittest discover -s evals -p "test_*.py"
```

Credentials are configured through `COMP3110_API_KEY`, `COMP3110_MODEL_BASE_URL`, and optionally `PEEKAI_MODEL_NAME` in `backend/.env`. Do not commit `.env` or credentials. The runner writes timestamped JSON reports and human-review CSV files to `evals/results/`.

## Development evaluation and reliability change

An initial development run completed 2 of 3 cases; `syn-plan-01` failed after the model returned `finish_reason=length` and empty content at a 3000-token output limit. Preserve the original report (`live-development-20261120T155207Z.json`) as evidence of the failure.

The study-plan implementation was subsequently changed to use a more compact prompt, bounded retries (up to two attempts, with 3000 then 6000 output tokens), and validation of day numbers, required activities, and the weekly time budget. The runner records `model_attempts`, `max_token_limits`, and `first_attempt_success` where applicable.

The updated development run (`live-development-20261120T163807Z.json`) completed all three cases. The plan succeeded on its first attempt. This does **not** demonstrate that retries caused the improvement; the updated prompt and ordinary model variability may also have contributed. Do not combine the original and updated runs into a single unqualified success percentage.

## Held-out evaluation results

Recorded report: `evals/results/live-held_out-20261120T165211Z.json`.

| Metric | Held-out result |
|---|---|
| Successful responses | 4/4 (100% completion) |
| Mean wall-clock latency | 5.22 seconds per case |
| Course code and name | Both matched the expected values |
| Assessment-name recall | 3/3 (100%) vs. 0% no-extraction baseline |
| Extracted topics | 4 |
| Study-plan length | 4 days (within required 3–7) |
| Study-plan total | 120 minutes, equal to the two-hour weekly budget |
| Quiz | 2/2 questions with nonempty prompts |
| Written-marking model score | 1.0 |
| Written-marking reference score | 1.0 |
| Written-marking absolute error | 0.00 |
| Keyword baseline absolute error | 0.50 |

Per-case latencies: syllabus 8.946 s; plan 6.045 s; quiz 4.197 s; marking 1.688 s. The study-plan case succeeded on the first model attempt with a 3000-token limit.

## Human review

The four held-out outputs were compared against the supplied synthetic input fixtures. Scores use 0 = poor/incorrect, 1 = partial, and 2 = correct/good; non-applicable dimensions are left blank. See `evals/results/live-held_out-20261120T165211Z-human-review.csv` for case-level notes.

| Case | Factual correctness | Syllabus relevance | Difficulty fit | Feedback quality | Unsupported claims |
|---|---:|---:|---:|---:|---:|
| `hold-syllabus-01` | 2 | 2 | N/A | N/A | 0 |
| `hold-plan-01` | 2 | 2 | N/A | N/A | 0 |
| `hold-quiz-01` | 2 | 2 | 2 | N/A | 0 |
| `hold-mark-01` | 2 | N/A | N/A | 2 | 0 |

**Syllabus:** the course identity, four topics, three assessment names, dates, weights, and learning outcomes correspond to the original synthetic outline.

**Plan:** the plan respects the two-hour budget and orders relational models before SQL and normalisation, consistent with the supplied prerequisites. Its practice activities address the student's stated goal. Suggested exercises are labelled as recommendations rather than official requirements.

**Quiz:** both SQL JOIN questions have correct answers given the implied one-row-per-listed-ID example. They cover INNER JOIN matching and LEFT JOIN preservation of unmatched left rows. The requested intermediate difficulty and two-question count are met.

**Marking:** the supplied answer satisfies both parts of the marking guide (0.5 + 0.5), supporting the model's 1.0 score. Feedback identifies the correct elements and gives an actionable practice suggestion.

These are case-specific judgments, not a blinded or independently replicated study. If the human-review CSV is revised, keep this table synchronized with it.

## Other software tests

The previously reported 16/16 offline validation and 8/8 scheduling checks are deterministic software tests. They are not evidence of AI answer quality. The retry regression suite was also reported to pass 4/4 tests. Keep software correctness results separate from live model evaluation.

## Limitations and next steps

- Only three development cases and four held-out cases were evaluated; all were synthetic and project-authored.
- Completion rate measures usable responses, **not** factual accuracy or learning gains.
- The marking comparison contains one straightforward full-credit response; additional zero-credit, partial-credit, ambiguous, and adversarial answers are needed.
- The held-out split is separate from development but not independently sealed or externally labelled.
- No second independent reviewer, inter-rater agreement measurement, or blinded comparison was performed.
- No comparative baseline is implemented for plans or quizzes. The syllabus baseline is intentionally weak.
- Provider token usage and monetary cost were not measured.
- Results do not establish security, accessibility, production reliability, or improved student exam performance.

Future evaluation should freeze a larger independently labelled benchmark, include varied courses and student abilities, assess source-grounded hallucinations, compare against stronger baselines, and obtain independent reviewer ratings. For recurring evaluation, report first-attempt and eventual success separately, alongside latency and API calls.

## Conclusion

On this limited synthetic held-out set, GLM-5.3 completed all four PeekAI AI workflows and produced outputs judged correct and relevant against the supplied fixtures. This supports a narrow claim of functional feasibility, not a general claim of educational or marking accuracy.
