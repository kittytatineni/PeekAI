"""Offline regression tests: python -m unittest discover -s evals -p "test_*.py"""
import sys
import unittest
from pathlib import Path
from unittest.mock import patch
from types import ModuleType
# Mock optional provider imports; these tests never make network calls.
try:
    import openai, dotenv
except ImportError:
    openai_stub = ModuleType("openai")
    openai_stub.OpenAI = object
    dotenv_stub = ModuleType("dotenv")
    dotenv_stub.load_dotenv = lambda *args, **kwargs: None
    sys.modules.setdefault("openai", openai_stub)
    sys.modules.setdefault("dotenv", dotenv_stub)
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from ai import llm

VALID = '{"title":"Test","days":[{"day":1,"focus":"Lists","activities":["practice"],"estimated_minutes":30},{"day":2,"focus":"Stacks","activities":["review"],"estimated_minutes":30},{"day":3,"focus":"Trees","activities":["practice"],"estimated_minutes":30}]}'
INPUT = {"analysis":{"topics":[{"title":"Lists"},{"title":"Stacks"}]},"hours_per_week":2}

class PlanTests(unittest.TestCase):
    def test_first_attempt(self):
        with patch.object(llm, "_completion", return_value=VALID) as mock:
            self.assertEqual(len(llm.generate_study_plan(**INPUT)["days"]), 3)
            self.assertEqual(mock.call_count, 1)

    def test_retry_after_length(self):
        with patch.object(llm, "_completion", side_effect=[ValueError("length"), VALID]) as mock:
            self.assertEqual(len(llm.generate_study_plan(**INPUT)["days"]), 3)
            self.assertEqual(mock.call_count, 2)
            self.assertEqual([x.kwargs["max_tokens"] for x in mock.call_args_list], [3000, 6000])

    def test_reject_over_budget(self):
        with self.assertRaises(ValueError):
            llm._validate_study_plan({"days":[{"day":i,"focus":"x","activities":["x"],"estimated_minutes":60} for i in (1,2,3)]}, 2)

    def test_no_fabricated_fallback(self):
        with patch.object(llm, "_completion", side_effect=ValueError("length")) as mock:
            with self.assertRaisesRegex(ValueError, "after 2 attempts"):
                llm.generate_study_plan(**INPUT)
            self.assertEqual(mock.call_count, 2)

if __name__ == "__main__":
    unittest.main()
