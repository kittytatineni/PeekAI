# PeekAI — Final 1 evaluation report

**Project:** syllabus-grounded AI study assistant. **Evaluation date:** 22 November 2026. **System:** React/TypeScript scheduling frontend, FastAPI backend, OpenAI-compatible model API (`scx-GLM-5.3` in the recorded live run). The ZIP provided for this report contains only the `evals` folder, not the full app.

## Evaluation questions

1. Does PeekAI preserve valid quiz/marking response structures?
2. Does its scheduling policy handle practice-window boundaries more accurately than the prior policy?
3. Can the configured model perform a small set of held-out synthetic syllabus, study-plan, quiz and marking tasks?
4. Does it extract expected assessment names, weights, dates and broadly grounded topics from real course outlines?
5. What errors and limits remain?

## Quantitative results

| Evaluation | Dataset and metric | Result | What the result does *not* show |
|---|---|---|---|
| Offline contract checks | 16 hand-labelled synthetic valid/invalid quiz and marking responses; validator agreement | **16/16 (100%)** | Semantic correctness or model accuracy |
| Scheduling regression | 8 synthetic date-policy cases; exact match on practice-window end and shift classification | **Candidate 8/8 (100%)**, baseline **4/8 (50%)** | Full calendar task placement, conflicts, or real-user outcomes |
| Scheduling boundary tests | Two additional date-filter checks | **2/2 passed** | Broad scheduling reliability |
| Live held-out AI calls | 4 synthetic cases, one each for syllabus, plan, quiz, marking; completed requests | **4/4 completed** | Accuracy on large unseen datasets |
| Real syllabus parsing | Five saved UNSW T2 2026 PDF analyses; basic structural checks | **5/5 saved analyses passed** | First-attempt success or comprehensive schema validation |
| Assessment name recall | 15 expected assessments across five PDFs | **15/15 (100%)** | False-positive assessment precision (extra invented items not counted) |
| Assessment weight correctness | Correct weight on 15 matched expected assessments | **15/15 (100%)** | Other assessment metadata correctness |
| Deadline handling | Automated date checks followed by manual comparison of 15 assessment records against source descriptions | 6 automatically accepted; 9 flagged for manual review; 15/15 provisionally consistent after manual comparison | Independently verified exact-date accuracy; unspecified dates and issue dates require separate interpretation |
| Topic grouping | 34 generated top-level groups, manually checked for broad source support | **34/34 broadly grounded** | Exhaustive subtopic coverage, absence of all hallucinations, or learning quality |

**Interpretation:** Each row uses a different denominator and measures a different property. Do **not** aggregate into one overall percentage. These are prototype-level results, with small and development-influenced test sets.

### Live-model human review

The most recent saved held-out run is `results/live-held_out-20261122T015249Z.json`; its companion `*-human-review.csv` contains **completed** reviewer notes. The four calls succeeded. The recorded mean latency was approximately **4.37 seconds per call** (computed from saved case latencies; not a production SLA).

- **Syllabus case:** Course identity and expected assessment names matched; reviewer identified **one unsupported assertion** that the synthetic outline represented a four-week course.
- **Study-plan case:** Generated a four-day plan totalling 115 minutes under a 120-minute budget; reviewer found it relevant, with the caveat that the weekly budget interpretation assumes all four days are in the same week.
- **Quiz case:** Two relevant JOIN questions, but an MCQ implicitly assumed one-to-one matching. With one-to-many matches, a LEFT JOIN can return more rows than assumed. Reviewer also judged difficulty somewhat low for 'intermediate'.
- **Marking case:** Model score 1.0 matched the case's author-provided expected score of 1.0; keyword baseline was 0.5. This **single** example does not establish general marking agreement.

## Real syllabus methodology

Five original UNSW T2 2026 outlines were processed and the JSON results saved as `results/real-*.json`. The evaluator reads these snapshots; it does not call the model. The expected assessment names/weights are transcribed in `evaluate_real_syllabus.py`. The five subjects were selected for disciplinary variety: cybersecurity, actuarial mathematics, textile design, molecular biology and criminal law. This is a small purposive sample, not random sampling.

The evaluator matches names after normalisation and compares percentage weights. Missing expected items count against recall; the current script does not penalise extra extracted assessments, so the 100% name figure is **recall**, not precision. The script checks only that `analysis` is a dictionary and `assessments` is a list, so 'valid structured response' is a limited structural check.

The saved deadline CSV reports **6 auto-accepted and 9 manual-review** cases. The manual comparison of the displayed extracted dates found all 15 consistent with the transcribed source references, including blank dates where the outline did not specify them. This is a **provisional manual result**, not an automated score produced by the Python evaluator. For LAWS1022, 'issued in Week 3' is an issue date, **not** a submission deadline. The PDFs should be treated as the final authority if any transcribed reference differs.

## Topic grounding and identified problems

The saved `results/topic_review.txt` contains 34 topic groups with subtopics, learning outcomes and `source_evidence` strings. Manual comparison with the course outlines found broad source support for all 34 groups; notably, LAWS1022's seven groups correspond to its seven explicitly enumerated main topics. This **does not** imply 100% topic recall, since the outlines do not provide a single uniform set of atomic topics for all disciplines.

**Observed limitations and errors:**

1. **BIOC3111 coverage:** The extracted topic hierarchy represents lectures but does not explicitly allocate study topics to hands-on protein purification, assays and experimental laboratory work highlighted in the outline. This could make a downstream planner underweight practical preparation.
2. **BIOC3111 classification:** The model repeats `BIOC2101` and `BIOC2201` as prerequisites for each generated topic. The source identifies them as **course-level** prerequisites, not individually verified topic-level dependencies.
3. **LAWS1022 factual typo:** An earlier generated description reportedly referenced `LAWS1022/JURD7121` instead of the source's `LAWS1021/JURD7121`. The correct source wording is in the LAWS1022 course description. Retain this as a reported error unless the exact saved output is inspected again.
4. **Synthetic live cases:** One unsupported course-duration assertion and one SQL JOIN question with an implicit assumption were documented by the reviewer.
5. **Reliability:** Some real PDFs previously required retrying after output-token truncation. The saved five successes do not measure first-attempt success, retry frequency or worst-case latency.

## Baselines and controls

- Scheduling: prior policy is explicitly implemented as the baseline in `run-scheduling.mjs`, making the 4/8 vs 8/8 comparison reproducible from the full repo.
- Live syllabus: the runner records a zero-recall 'no extraction' baseline for expected assessment names. This is a trivial reference, not a competitive model baseline.
- Live marking: one synthetic case includes a keyword baseline score; it is not a general benchmark.
- No rigorous baseline comparison was run for real PDF extraction or overall tutoring quality. Do not claim otherwise.

## Reproduction

See `README.md` for exact commands and environment requirements. For an offline check from the **full PeekAI project root**:

```powershell
python evals/run_evals.py
python evals/evaluate_real_syllabus.py
node --experimental-strip-types evals/run-scheduling.mjs
python -m unittest discover -s evals -p "test_*.py"
```

The scheduling runner imports `src/utils/schedulingPolicy.ts` from outside this ZIP. Live runs need the full backend, dependencies, configured credentials and provider access. Saved JSON/CSV files are included for inspection even if a fresh live run is unavailable.

## Conclusions and next improvements

The prototype shows reliable contract checking and scheduling policy behaviour on its **small synthetic test sets**, and strong assessment extraction and broad topic grounding on **five selected real outlines**. The key improvements are: represent lab/practical requirements explicitly, distinguish course-level prerequisites from topic dependencies, require evidence-linked extraction and verify course codes, distinguish issue dates from deadlines, add extra-assessment precision checks, and evaluate on fresh untouched course outlines with independent human reviewers. No claim is made about improved student grades or real-world tutoring effectiveness.

## Data practices

See `DATA_PRACTICES.md` and `dataset_manifest.csv` for sources, file identifiers, preparation, split caveats, privacy, redistribution uncertainty and repeatability limitations.
