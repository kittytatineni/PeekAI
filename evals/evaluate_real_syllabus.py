
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "results"

# Ground truth transcribed from the five course outlines.

EXPECTED = {
    "COMP6841": {
        "file": "real-comp6841.json",
        "assessments": {
            "Project": 30,
            "Portfolio": 30,
            "Exam": 40,
        },
        "dates": {
            "Project": {
                "type": "exact",
                "expected": "24/07/2026 04:00 PM",
            },
            "Portfolio": {
                "type": "recurring",
                "expected": "Monday 4pm in relevant weeks",
            },
            "Exam": {
                "type": "unspecified",
                "expected": "See Examination Timetable",
            },
        },
    },
    "ACTL2111": {
        "file": "real-acts2111.json",
        "assessments": {
            "Final Examination": 60,
            "Assignment": 30,
            "Formative Assessment": 10,
        },
        "dates": {
            "Final Examination": {
                "type": "exam_period",
                "expected": "University examination period",
            },
            "Assignment": {
                "type": "unspecified",
                "expected": "",
            },
            "Formative Assessment": {
                "type": "unspecified",
                "expected": "",
            },
        },
    },
    "DDES1160": {
        "file": "real-ddes1160.json",
        "assessments": {
            "Fibre to Fabric": 50,
            "Fibre Fundamentals": 50,
        },
        "dates": {
            "Fibre to Fabric": {
                "type": "range",
                "expected": "Week 5: 29 June - 05 July",
            },
            "Fibre Fundamentals": {
                "type": "range",
                "expected": "Week 12: 17 August - 23 August",
            },
        },
    },
    "BIOC3111": {
        "file": "real-bioc3111.json",
        "assessments": {
            "Early Bird Test": 20,
            "Laboratory Notebook": 15,
            "Scientific Data Analysis and Reporting": 30,
            "Final Examination": 35,
        },
        "dates": {
            "Early Bird Test": {
                "type": "exact",
                "expected": "Tuesday 23 June 2026, 2pm",
            },
            "Laboratory Notebook": {
                "type": "recurring",
                "expected": "Weekly, end of lab or next lab",
            },
            "Scientific Data Analysis and Reporting": {
                "type": "recurring",
                "expected": "Tuesday lab sessions, Weeks 7, 9, 10",
            },
            "Final Examination": {
                "type": "exam_period",
                "expected": "Term 2 examination period, timetable TBA",
            },
        },
    },
    "LAWS1022": {
        "file": "real-laws1022.json",
        "assessments": {
            "Assignment": 30,
            "Class Participation": 10,
            "Final Invigilated Examination": 60,
        },
        "dates": {
            "Assignment": {
                "type": "unspecified",
                "expected": "",
                "note": "Issued Week 3 is not a submission deadline",
            },
            "Class Participation": {
                "type": "unspecified",
                "expected": "",
            },
            "Final Invigilated Examination": {
                "type": "exam_period",
                "expected": "University examination period",
            },
        },
    },
}



def normalize(text):
    """Normalize names for comparison."""
    text = str(text).lower()
    text = re.sub(r"\([^)]*\)", "", text)
    return re.sub(r"[^a-z0-9]", "", text)


def parse_weight(value):
    """Extract the overall percentage, e.g. '30% (three tests)'."""
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", str(value))
    return float(match.group(1)) if match else None


def check_deadline(actual, expected):
    """
    Compare an extracted deadline against ground truth.

    Returns:
        True: automatically verified
        False: clear mismatch
        None: needs manual review
    """
    actual = str(actual or "").strip().lower()
    expected_type = expected["type"]

    # Exact dates require calendar-date and time verification.
    if expected_type == "exact":
        return None

    # Date ranges require checking both endpoints.
    if expected_type == "range":
        return None

    # Recurring schedules require checking recurrence details.
    if expected_type == "recurring":
        return None

    # Exam-period references must not invent an exact date.
    if expected_type == "exam_period":
        if not actual:
            return False

        has_period = (
            "exam" in actual
            and (
                "period" in actual
                or "timetable" in actual
            )
        )

        # Detect an unsupported calendar date.
        has_exact_date = bool(
            re.search(
                r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
                actual
            )
            or re.search(
                r"\b\d{1,2}\s+"
                r"(?:january|february|march|april|may|june|"
                r"july|august|september|october|november|december)"
                r"\s+\d{4}\b",
                actual
            )
        )

        if has_exact_date:
            return False

        return True if has_period else None

    # No official submission deadline is specified.
    if expected_type == "unspecified":
        if not actual:
            return True

        # An issue date is not a submission deadline.
        if "issued" in actual or "released" in actual:
            return None

        # An explicit due date would need source verification.
        if "due" in actual or "deadline" in actual:
            return None

        return None

    return None

def evaluate_course(code, expected):
    path = RESULTS / expected["file"]

    result = {
        "course": code,
        "valid_response": False,
        "course_code_correct": False,
        "assessment_names_correct": 0,
        "assessment_weights_correct": 0,
        "expected_assessments": len(expected["assessments"]),
        "dates_correct": 0,
        "dates_incorrect": 0,
        "dates_review": 0,
        "error": "",
    }

    if not path.exists():
        result["error"] = "Result file missing"
        return result

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        analysis = data["analysis"]

        if not isinstance(analysis, dict):
            raise ValueError("Invalid analysis object")

        assessments = analysis.get("assessments", [])

        if not isinstance(assessments, list):
            raise ValueError("Invalid assessments list")

        extracted = {
            normalize(a.get("name", "")): a
            for a in assessments
            if isinstance(a, dict)
        }

        result["valid_response"] = True
        result["course_code_correct"] = (
            analysis.get("course_code") == code
        )

        for name, weight in expected["assessments"].items():
            match = extracted.get(normalize(name))

            if match is None:
                continue

            # Assessment name
            result["assessment_names_correct"] += 1

            # Assessment weight
            if parse_weight(match.get("weight")) == weight:
                result["assessment_weights_correct"] += 1

            # Assessment deadline
            date_reference = expected.get("dates", {}).get(name)

            if date_reference:
                outcome = check_deadline(
                    match.get("date", ""),
                    date_reference
                )

                if outcome is True:
                    result["dates_correct"] += 1
                elif outcome is False:
                    result["dates_incorrect"] += 1
                else:
                    result["dates_review"] += 1

        return result

    except (ValueError, KeyError, TypeError, OSError) as exc:
        result["valid_response"] = False
        result["error"] = str(exc)
        return result

def main():
    rows = [
        evaluate_course(code, expected)
        for code, expected in EXPECTED.items()
    ]

    output = RESULTS / "real_syllabus_evaluation.csv"

    with output.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    total = sum(r["expected_assessments"] for r in rows)
    correct_names = sum(r["assessment_names_correct"] for r in rows)
    correct_weights = sum(r["assessment_weights_correct"] for r in rows)
    successful = sum(r["valid_response"] for r in rows)

    print("\nPEEKAI REAL SYLLABUS EVALUATION")
    print("=" * 48)

    for row in rows:
        print(
            f"{row['course']}: "
            f"names {row['assessment_names_correct']}/"
            f"{row['expected_assessments']}, "
            f"weights {row['assessment_weights_correct']}/"
            f"{row['expected_assessments']}"
        )
        if row["error"]:
            print(f"  Error: {row['error']}")

    print("\nDEADLINE EVALUATION")

    for row in rows:
        print(
            f"{row['course']}: "
            f"correct={row['dates_correct']}, "
            f"incorrect={row['dates_incorrect']}, "
            f"manual_review={row['dates_review']}"
        )

    print("\nSUMMARY")
    print(f"Valid structured responses: {successful}/{len(rows)}")
    print(f"Assessment name recall: {correct_names}/{total} "
          f"({correct_names / total * 100:.1f}%)")
    print(f"Assessment weight accuracy: {correct_weights}/{total} "
          f"({correct_weights / total * 100:.1f}%)")
    print(f"\nSaved report: {output}")


if __name__ == "__main__":
    main()
