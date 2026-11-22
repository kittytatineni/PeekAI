"""GLM-backed AI helpers for PeekAI.

Credentials are read lazily so the API can start and expose its health route
even when the model has not been configured yet.
"""
import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

load_dotenv()

MODEL_NAME = os.getenv("PEEKAI_MODEL_NAME", "scx-GLM-5.3")
SYSTEM_PROMPT = """You are PeekAI, a careful university learning and academic planning assistant.
Use only the academic information supplied by the student when describing their course.
Never invent syllabus topics, learning outcomes, assessment dates, or course requirements.
Clearly label your own suggested activities as recommendations.
Be supportive, specific, realistic, and educational. Prefer helping students understand
rather than simply giving them answers."""


def _client() -> OpenAI:
    api_key = os.getenv("COMP3110_API_KEY")
    base_url = os.getenv("COMP3110_MODEL_BASE_URL")
    if not api_key or not base_url:
        raise RuntimeError(
            "AI is not configured. Set COMP3110_API_KEY and "
            "COMP3110_MODEL_BASE_URL in backend/.env."
        )
    return OpenAI(api_key=api_key, base_url=base_url)


def _completion(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 3000
) -> str:

    response = _client().chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
    )

    choice = response.choices[0]
    content = (choice.message.content or "").strip()

    # Debugging information
    logger.warning("AI model: %s", MODEL_NAME)
    logger.warning("AI finish reason: %s", choice.finish_reason)
    logger.warning("AI response length: %s", len(content))
    # Avoid logging syllabus content, student answers, or other private model output.
    logger.debug("AI output received (characters=%s)", len(content))

    if choice.finish_reason == "length":
        raise ValueError(
            "The AI response was truncated because it reached "
            "the maximum output token limit."
        )

    if not content:
        raise ValueError("The AI returned an empty response.")

    return content


def _extract_json(text: str) -> dict[str, Any]:
    """Extract and parse a JSON object from an AI response."""

    cleaned = text.strip()

    # Remove Markdown code fences
    cleaned = re.sub(
        r"^\s*```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(r"\s*```\s*$", "", cleaned)

    # Extract the JSON object
    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end <= start:
        raise ValueError(
            "The AI did not return a valid JSON object."
        )

    json_text = cleaned[start:end + 1]

    try:
        value = json.loads(json_text)

    except json.JSONDecodeError as error:

        lines = json_text.splitlines()

        start_line = max(0, error.lineno - 3)
        end_line = min(len(lines), error.lineno + 2)

        context = "\n".join(
            f"{i + 1}: {lines[i]}"
            for i in range(start_line, end_line)
        )

        logger.error(
            "JSON parsing failed: %s",
            error
        )

        logger.error(
            "Problematic JSON section:\n%s",
            context
        )

        raise ValueError(
            f"AI returned malformed JSON: {error.msg}. "
            f"Line {error.lineno}, column {error.colno}."
        ) from error

    if not isinstance(value, dict):
        raise ValueError("The AI response must be a JSON object.")

    return value


def ask_peekai(prompt: str) -> str:
    """Answer a student's general academic question."""
    return _completion(prompt, temperature=0.4, max_tokens=1200)



def analyse_syllabus(syllabus_text: str, filename: str) -> dict[str, Any]:
    """Extract syllabus information with bounded retries and concise output."""

    base_prompt = """
Analyse this university syllabus. Return ONLY one valid, compact JSON object.
Use only facts explicitly supported by the supplied document.
Do not invent assessment dates, weights, prerequisites or course requirements.

Required JSON structure:
{
  "course_code": "",
  "course_name": "",
  "overview": "",
  "topics": [
    {
      "title": "",
      "subtopics": [],
      "learning_outcomes": [],
      "prerequisites": [],
      "source_evidence": ""
    }
  ],
  "assessments": [
    {
      "name": "",
      "date": "",
      "weight": ""
    }
  ],
  "study_notes": []
}

IMPORTANT OUTPUT RULES:
- Preserve ALL distinct assessments, weights and stated deadlines.
- Create 4 to 8 meaningful topic groups where supported.
- Maximum 3 short subtopics per topic.
- Maximum 2 concise learning outcomes per topic.
- Maximum 5 study notes.
- Keep overview under 80 words.
- Keep source_evidence under 15 words.
- Use empty strings or arrays for unavailable information.
- Never invent exact dates from week numbers or exam periods.
- No markdown, commentary or additional JSON keys.
"""

    # These are output budgets, not input-document length limits.
    token_limits = (6000, 8000, 10000)
    last_error: Exception | None = None

    for attempt, token_limit in enumerate(token_limits, start=1):
        prompt = (
            base_prompt
            + f"\nFilename: {filename[:200]}\n"
            + "\nSYLLABUS TEXT:\n"
            + syllabus_text[:50000]
        )

        try:
            logger.info(
                "Syllabus analysis attempt %s/%s, max_tokens=%s",
                attempt, len(token_limits), token_limit
            )

            raw = _completion(
                prompt,
                temperature=0.1,
                max_tokens=token_limit
            )

            result = _extract_json(raw)

            for key, default in (
                ("course_code", ""),
                ("course_name", ""),
                ("overview", ""),
                ("topics", []),
                ("assessments", []),
                ("study_notes", []),
            ):
                result.setdefault(key, default)

            if not isinstance(result["topics"], list) or not result["topics"]:
                raise ValueError("No valid syllabus topics returned")

            if not isinstance(result["assessments"], list):
                raise ValueError("Invalid assessments list")

            logger.info(
                "Syllabus analysis succeeded on attempt %s",
                attempt
            )
            return result

        except ValueError as exc:
            last_error = exc
            logger.warning(
                "Syllabus analysis attempt %s/%s failed: %s",
                attempt, len(token_limits), exc
            )

            # Retry only truncation or malformed model output.
            retryable = (
                "maximum output token limit" in str(exc)
                or "malformed JSON" in str(exc)
                or "valid JSON object" in str(exc)
                or "No valid syllabus topics" in str(exc)
            )

            if not retryable:
                break

    raise ValueError(
        f"Could not analyse this syllabus after retries: {last_error}"
    )



def _validate_study_plan(result: dict[str, Any], hours_per_week: float) -> dict[str, Any]:
    """Reject incomplete or over-budget plans; never silently modify AI output."""
    days = result.get("days")
    if not isinstance(days, list) or not 3 <= len(days) <= 7:
        raise ValueError("Plan must contain 3–7 study days")
    total = 0
    seen = set()
    for item in days:
        if not isinstance(item, dict):
            raise ValueError("Study day must be an object")
        day = item.get("day")
        minutes = item.get("estimated_minutes")
        if type(day) is not int or not 1 <= day <= 7 or day in seen:
            raise ValueError("Study day numbers must be distinct integers from 1 to 7")
        seen.add(day)
        if type(minutes) not in (int, float) or not 0 < minutes <= 24 * 60:
            raise ValueError("Each study day needs a positive duration")
        total += minutes
        if not isinstance(item.get("focus"), str) or not item["focus"].strip():
            raise ValueError("Each study day needs a focus")
        if not isinstance(item.get("activities"), list) or not item["activities"]:
            raise ValueError("Each study day needs activities")
    if total > hours_per_week * 60:
        raise ValueError("Plan exceeds the student's weekly time budget")
    return result


def generate_study_plan(
    analysis: dict[str, Any],
    assessment_date: str = "",
    hours_per_week: float = 5,
    student_goal: str = "Build a solid understanding of the course",
) -> dict[str, Any]:
    """Generate a validated plan, retrying bounded generation failures.

    Retries cost additional model calls. A failed initial attempt is not
    equivalent to first-attempt success and should be recorded in evaluations.
    """
    if not 1 <= hours_per_week <= 60:
        raise ValueError("hours_per_week must be between 1 and 60")
    topics = analysis.get("topics", [])
    if not isinstance(topics, list) or not topics:
        raise ValueError("Syllabus analysis must include topics")
    compact_topics = [
        {"title": t.get("title", ""), "prerequisites": t.get("prerequisites", [])}
        for t in topics[:12] if isinstance(t, dict)
    ]
    prompt = f"""Make a concise study plan using ONLY the supplied course topics.
Return one compact JSON object, no markdown. Schema:
{{"title":"Plan","rationale":"short reason","days":[{{"day":1,"focus":"topic","objective":"goal","activities":["practice","review"],"estimated_minutes":45,"priority":"High"}}],"next_steps":["review progress"]}}
Create 3 to 7 distinct days numbered 1..7. Sum of estimated_minutes MUST NOT exceed {hours_per_week * 60:g}.
Include practice and review. Activities are recommendations, not official requirements.
Use prerequisites where supplied; never invent course requirements or mastery.
Assessment date: {assessment_date[:80] or 'not supplied'}
Student goal: {student_goal[:300]}
Course topics: {json.dumps(compact_topics, ensure_ascii=False)[:5000]}
"""
    last_error = None
    for attempt, token_limit in enumerate((3000, 6000), start=1):
        try:
            raw = _completion(prompt, temperature=0.2, max_tokens=token_limit)
            result = _validate_study_plan(_extract_json(raw), hours_per_week)
            logger.info("Study plan succeeded on attempt %s", attempt)
            return result
        except (ValueError, RuntimeError) as exc:
            last_error = exc
            logger.warning("Study plan attempt %s/2 failed: %s", attempt, type(exc).__name__)
    raise ValueError(f"Study plan unavailable after 2 attempts: {last_error}")
