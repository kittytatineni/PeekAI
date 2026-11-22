"""Syllabus-grounded practice quiz and feedback helpers."""
from typing import Any
from .llm import _completion, _extract_json


def _quiz_batch(course: str, topic: str, context: str, difficulty: str, kinds: list[str], offset: int) -> list[dict[str, Any]]:
    """Generate a small batch; large GLM JSON responses often exhaust output tokens."""
    import logging
    logger = logging.getLogger(__name__)
    prompt = f"""Create {len(kinds)} concise university practice questions. Return a SINGLE compact JSON object, no markdown.
Course: {course[:80]}; Topic: {topic[:120]}; Difficulty: {difficulty}.
Syllabus context: {context[:1200]}
Question types IN ORDER: {', '.join(kinds)}.
JSON schema: {{"questions":[{{"type":"mcq","prompt":"short question","options":["A","B","C","D"],"answer_index":0,"ideal_answer":"brief answer","explanation":"brief reasoning","skill":"skill name"}}]}}
For written questions use type "written", options [], answer_index null, and a short marking guide in ideal_answer.
Exactly {len(kinds)} questions. Four plausible options for each MCQ. Keep each question and answer brief (under 45 words). Do not include any additional keys or commentary."""
    last_error: Exception | None = None
    for attempt, token_limit in enumerate((1800, 3200, 4800), start=1):
        try:
            data = _extract_json(_completion(prompt, max_tokens=token_limit))
            questions = data.get('questions')
            if not isinstance(questions, list) or len(questions) != len(kinds):
                raise ValueError('AI returned an incomplete question batch')
            cleaned = []
            for i, (q, kind) in enumerate(zip(questions, kinds)):
                if not isinstance(q, dict) or q.get('type') != kind or not str(q.get('prompt','')).strip():
                    raise ValueError('Invalid question in AI response')
                options = q.get('options', []) if kind == 'mcq' else []
                answer = q.get('answer_index') if kind == 'mcq' else None
                if kind == 'mcq' and (not isinstance(options, list) or len(options) != 4 or type(answer) is not int or answer not in range(4)):
                    raise ValueError('Invalid multiple choice options')
                cleaned.append({'id': f'q{offset+i+1}', 'type': kind,
                    'prompt': str(q['prompt'])[:1200],
                    'options': [str(o)[:350] for o in options], 'answer_index': answer,
                    'ideal_answer': str(q.get('ideal_answer',''))[:1500],
                    'explanation': str(q.get('explanation',''))[:1500],
                    'skill': str(q.get('skill',topic))[:120]})
            return cleaned
        except (ValueError, RuntimeError) as error:
            last_error = error
            logger.warning('Quiz batch attempt %s failed: %s', attempt, error)
    raise ValueError(f'AI could not generate a valid quiz batch after 3 attempts: {last_error}')


def create_quiz(course: str, topic: str, context: str, difficulty: str, count: int) -> dict[str, Any]:
    questions: list[dict[str, Any]] = []
    for offset in range(0, count, 2):
        kinds = ['mcq' if i % 2 == 0 else 'written' for i in range(offset, min(offset+2, count))]
        questions.extend(_quiz_batch(course, topic, context, difficulty, kinds, offset))
    return {'questions': questions}


def mark_written(question: str, ideal_answer: str, answer: str) -> dict[str, Any]:
    """Mark a response with bounded output and retries for GLM token exhaustion.

    Do not invent a mark when the provider fails: an ungraded response must not
    contaminate mastery scores, quiz history, or study recommendations.
    """
    import logging
    import math
    logger = logging.getLogger(__name__)

    # Keep the required JSON tiny. GLM reasoning tokens can consume the entire
    # max_tokens budget before any visible content is emitted.
    base = (
        'You are grading one university short answer. Return ONLY one compact JSON '
        'object with keys score, feedback, strengths, improvements, next_step. '
        'score is a number between 0 and 1. strengths and improvements are '
        'arrays of at most 2 short strings. feedback and next_step are each '
        'one sentence. Give fair partial credit and do not assume facts not '
        'present in the student response. No markdown or extra text.\n'
        f'Question: {question[:900]}\n'
        f'Marking guide: {ideal_answer[:1100]}\n'
        f'Student response: {answer[:2200]}\n'
    )
    last_error: Exception | None = None
    for attempt, token_limit in enumerate((1600, 3200, 6000), start=1):
        prompt = base if attempt < 3 else (
            'Grade this answer. Return ONLY compact JSON: '
            '{"score":0.5,"feedback":"One sentence.",'
            '"strengths":[],"improvements":[],"next_step":"One sentence."} '
            'Replace example values with your assessment. Score 0..1, partial credit allowed.\n'
            f'Question: {question[:600]}\nGuide: {ideal_answer[:700]}\n'
            f'Answer: {answer[:1200]}'
        )
        try:
            data = _extract_json(_completion(prompt, temperature=0.0, max_tokens=token_limit))
            score = data.get('score')
            if isinstance(score, bool) or not isinstance(score, (int, float)) or not math.isfinite(score) or not 0 <= score <= 1:
                raise ValueError('AI returned an invalid score (expected 0..1)')
            feedback = data.get('feedback')
            if not isinstance(feedback, str) or not feedback.strip():
                raise ValueError('AI returned no grading feedback')
            strengths = data.get('strengths', [])
            improvements = data.get('improvements', [])
            if not isinstance(strengths, list) or not isinstance(improvements, list):
                raise ValueError('AI returned invalid feedback lists')
            return {
                'score': round(float(score), 2),
                'feedback': feedback.strip()[:1200],
                'strengths': [x[:200] for x in strengths if isinstance(x, str)][:2],
                'improvements': [x[:200] for x in improvements if isinstance(x, str)][:2],
                'next_step': str(data.get('next_step') or '')[:400],
            }
        except (ValueError, RuntimeError) as error:
            last_error = error
            logger.warning('Written marking attempt %s/3 failed (max_tokens=%s): %s', attempt, token_limit, error)
    raise ValueError(
        'AI marking was unavailable after 3 attempts. Your answer has not been '
        'graded or added to progress. Please retry. '
        f'Last error: {last_error}'
    )
