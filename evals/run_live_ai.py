"""Opt-in live model evaluation. No calls happen without --run and credentials.

Run from project root: python evals/run_live_ai.py --run --split held_out
Outputs contain generated text; review before sharing. Never store credentials.
"""
import argparse
import csv
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
DATA = ROOT / 'evals' / 'datasets'
RESULTS = ROOT / 'evals' / 'results'


def norm(x):
    return ' '.join(str(x).casefold().split())


def metric(actual, expected):
    return norm(actual) == norm(expected)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--run', action='store_true', help='Explicitly authorise paid model calls')
    p.add_argument('--split', choices=['development', 'held_out'], default='development')
    p.add_argument('--limit', type=int, default=0, help='Maximum cases; 0 means all')
    args = p.parse_args()
    dataset = DATA / args.split / 'live_ai_cases.json'
    cases = json.loads(dataset.read_text(encoding='utf-8'))
    if args.limit > 0:
        cases = cases[:args.limit]
    print(f'Cases: {len(cases)} ({args.split}); no student records; calls are chargeable.')
    if not args.run:
        print('Dry run only. Add --run to call the configured GLM provider.')
        return
    from dotenv import load_dotenv
    load_dotenv(ROOT / 'backend' / '.env')
    if not (os.getenv('COMP3110_API_KEY') and os.getenv('COMP3110_MODEL_BASE_URL')):
        raise SystemExit('Missing backend/.env credentials; no API calls made.')
    from ai.llm import MODEL_NAME, analyse_syllabus, generate_study_plan
    import ai.llm as llm
    from ai.adaptive import create_quiz, mark_written
    RESULTS.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    report = {'created_utc': stamp, 'split': args.split, 'model': MODEL_NAME,
              'cases': [], 'note': 'Synthetic cases; semantic judgments require human review.'}
    reviews = []
    for case in cases:
        started = time.perf_counter()
        entry = {'id': case['id'], 'task': case['task'], 'status': 'error'}
        try:
            task = case['task']
            if task == 'syllabus':
                result = analyse_syllabus(case['input']['text'], case['id'] + '.txt')
                expected = case['expected']
                entry['course_code_match'] = metric(result.get('course_code', ''), expected['course_code'])
                entry['course_name_match'] = metric(result.get('course_name', ''), expected['course_name'])
                found = [norm(x.get('name', '')) for x in result.get('assessments', []) if isinstance(x, dict)]
                entry['assessment_name_recall'] = sum(norm(x) in found for x in expected['assessment_names']) / max(1, len(expected['assessment_names']))
                entry['assessment_name_baseline_recall'] = 0.0  # Explicit no-extraction baseline
                entry['topic_count'] = len(result.get('topics', []))
            elif task == 'study_plan':
                original_completion = llm._completion
                attempt_limits = []
                def counted_completion(*a, **kw):
                    attempt_limits.append(kw.get('max_tokens'))
                    return original_completion(*a, **kw)
                llm._completion = counted_completion
                try:
                    result = generate_study_plan(**case['input'])
                finally:
                    llm._completion = original_completion
                    entry['model_attempts'] = len(attempt_limits)
                    entry['max_token_limits'] = attempt_limits
                    entry['first_attempt_success'] = len(attempt_limits) == 1 and 'result' in locals()
                days = result.get('days', [])
                minutes = sum(x.get('estimated_minutes', 0) for x in days if isinstance(x, dict) and isinstance(x.get('estimated_minutes'), (int, float)))
                entry['days_in_range'] = 3 <= len(days) <= 7
                entry['within_weekly_budget'] = minutes <= case['input']['hours_per_week'] * 60
                entry['total_minutes'] = minutes
            elif task == 'quiz':
                result = create_quiz(**case['input'])
                questions = result.get('questions', [])
                entry['count_match'] = len(questions) == case['input']['count']
                entry['all_have_prompts'] = all(bool(q.get('prompt', '').strip()) for q in questions)
            elif task == 'mark':
                result = mark_written(**{k: case['input'][k] for k in ('question', 'ideal_answer', 'answer')})
                entry['absolute_error'] = round(abs(result['score'] - case['expected']['human_score']), 4)
                entry['within_0_1'] = entry['absolute_error'] <= 0.1
                entry['keyword_baseline_error'] = round(abs(case['expected']['keyword_baseline'] - case['expected']['human_score']), 4)
            else:
                raise ValueError('Unknown task: ' + task)
            entry['status'] = 'ok'
            entry['output'] = result
            reviews.append({'case_id': case['id'], 'task': task, 'factual_correctness_0_to_2': '',
                            'syllabus_relevance_0_to_2': '', 'difficulty_fit_0_to_2': '',
                            'feedback_quality_0_to_2': '', 'unsupported_claims_count': '', 'reviewer_notes': ''})
        except Exception as exc:
            entry['error_type'] = type(exc).__name__
            entry['error'] = str(exc)[:500]
        entry['latency_seconds'] = round(time.perf_counter() - started, 3)
        report['cases'].append(entry)
        print(f"{entry['id']}: {entry['status']} ({entry['latency_seconds']}s)")
    report['success_rate'] = sum(c['status'] == 'ok' for c in report['cases']) / max(1, len(report['cases']))
    output = RESULTS / f'live-{args.split}-{stamp}.json'
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    review_path = RESULTS / f'live-{args.split}-{stamp}-human-review.csv'
    with review_path.open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['case_id', 'task', 'factual_correctness_0_to_2', 'syllabus_relevance_0_to_2', 'difficulty_fit_0_to_2', 'feedback_quality_0_to_2', 'unsupported_claims_count', 'reviewer_notes'])
        w.writeheader()
        w.writerows(reviews)
    print('Report:', output)
    print('Human review:', review_path)
    print('Model outputs are NOT independently verified; human ratings are blank intentionally.')


if __name__ == '__main__':
    main()
