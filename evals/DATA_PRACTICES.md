# Data practices — COMP3110 Final 1

## Sources and provenance

**Real data:** Five UNSW 2026 Term 2 course outlines provided for this project: COMP6841 (Extended Security Engineering and Cyber Security), ACTL2111 (Financial Mathematics for Actuaries), DDES1160 (Textiles 1: Concepts and Context), BIOC3111 (Molecular Biology of Proteins), and LAWS1022 (Criminal Laws). The PDFs are saved in `datasets/real_syllabus/`. The `ACTS2111.pdf` filename is a typo for ACTL2111; the course content is ACTL2111. Original publisher: UNSW. Individual source download URLs, permission to redistribute, and licensing terms **have not been documented** and should not be invented.

**Synthetic data:** `datasets/held_out/response_validation.json`, `datasets/scheduling_holdout.json`, and `datasets/{development,held_out}/live_ai_cases.json` are hand-authored tests, not real student records. Cases target schema validity, scheduling boundaries, syllabus interpretation, study plans, question generation and marking. The synthetic holdout's expected scores are author-specified, not an independent multi-rater gold standard.

**Generated data:** `results/real-*.json` contains saved model outputs for the five PDFs. `results/live-*.json` contains model outputs, latency and checks. `results/*-human-review.csv` contains manual reviewer ratings and notes. Model output is not itself ground truth.

## Preparation and repeatability

1. Retain each original PDF unchanged. Store a stable file identifier and SHA-256 hash (see `dataset_manifest.csv`).
2. Submit PDFs to the FastAPI syllabus-analysis endpoint and save JSON responses under `results/real-*.json`. These outputs are **saved snapshots**; the scoring script does not rerun the model.
3. Manually transcribe assessment names, weights and deadline descriptions into the `EXPECTED` dictionary in `evaluate_real_syllabus.py`, referring to the assessment tables and course descriptions. Normalise names by lowercasing, dropping parenthetical qualifiers and non-alphanumeric characters. Parse the first percentage from each weight field.
4. Run `python evals/evaluate_real_syllabus.py` from the full project root. Its output is repeatable against the saved JSON, although rerunning the live model may produce different answers.
5. Review dates, topic grounding and unsupported claims against the PDFs. The current date heuristic is **not** a fully automated date exact-match metric; the manual review and its limits are described in the evaluation report.
6. For live AI runs, use `run_live_ai.py` with `--split development` during debugging and `--split held_out` for designated held-out cases. Preserve timestamped output and human-review CSVs.

No OCR or substantive text-cleaning transformation is documented in this package. The backend's PDF extraction implementation is outside this ZIP, so its exact preprocessing cannot be independently reproduced from this folder alone. Do not claim a fixed OCR/cleaning pipeline without inspecting and documenting backend code.

## Development vs held-out separation

- `datasets/development/` is for iterative debugging and prompt tuning.
- `datasets/held_out/` is the designated synthetic evaluation split; its cases should not be used to select prompts after scoring. The stored run history shows repeated held-out evaluations, so these are **not guaranteed blind/untouched** by the final submission date.
- `datasets/scheduling_holdout.json` is called a holdout, but its cases reflect previously observed scheduling failures and were used to assess the fix. It is best described as a **regression set**, not proof of generalisation.
- The five real syllabuses were used during prompt/response troubleshooting. They are **development-influenced real-world evaluation cases**, not an untouched external test set.
- Do not copy a held-out case into development to tune the system and still call it unseen. For stronger future evidence, obtain fresh unseen course outlines and a second reviewer.

## Privacy and security

- The provided evaluation materials are course outlines and synthetic prompts; no identifiable student submissions are intentionally included.
- Do not commit student records, emails, API keys, provider credentials or `backend/.env`.
- If collecting future student work or calendars, obtain appropriate consent, minimise collection, remove identifiers, restrict access and set retention/deletion rules.
- Saved AI outputs can contain unsupported claims; do not silently treat them as authoritative academic advice.

## Licensing and data quality

- UNSW course outlines are third-party material. Being publicly viewable does **not** automatically grant redistribution rights. Check UNSW's applicable copyright/licence and course access conditions before publishing PDF copies; if uncertain, restrict access or document lawful retrieval rather than publishing the PDFs publicly.
- Course outlines can be updated and may omit exact assessment deadlines. Preserve the document's term/year and distinguish an issue/start date from a due date.
- Small sample: five outlines across different disciplines, selected for breadth rather than random sampling. Results cannot establish population-wide reliability.
- Human review is qualitative, and the recorded topic review is not an independently double-annotated dataset.
- Known errors include repeated BIOC3111 course prerequisites at topic level, insufficient explicit lab-activity coverage in its topic list, and a reported LAWS1022 course-code typo in a generated description. Record these rather than reporting 'zero hallucinations'.

## Reproducibility limitations

The ZIP contains `evals/` only. Full model and scheduling reproduction requires the PeekAI backend/frontend, dependency versions, configured API endpoint, valid credentials, and ideally a pinned prompt/model version. Saved offline reports can be checked without model access; live output and latency may vary. The current scripts do not establish student learning gains, actual planner conflict rates, or production uptime.
