from io import BytesIO
from typing import Any
import os
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai.llm import analyse_syllabus, ask_peekai, generate_study_plan

app = FastAPI(title="PeekAI API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        *(
            [os.environ["FRONTEND_ORIGIN"].rstrip("/")]
            if os.getenv("FRONTEND_ORIGIN")
            else []
        ),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)


class ChatResponse(BaseModel):
    response: str


class StudyPlanRequest(BaseModel):
    analysis: dict[str, Any]
    assessment_date: str = ""
    hours_per_week: float = Field(default=5, ge=1, le=60)
    student_goal: str = Field(default="Build a solid understanding of the course", max_length=500)


@app.get("/")
def health_check():
    import os
    configured = bool(os.getenv("COMP3110_API_KEY") and os.getenv("COMP3110_MODEL_BASE_URL"))
    return {"status": "PeekAI backend is running", "ai_configured": configured}


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        return ChatResponse(response=ask_peekai(request.message))
    except Exception as error:
        print(f"LLM error: {error}")
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/api/syllabus/analyse")
async def syllabus_analyse(file: UploadFile = File(...)):
    filename = file.filename or "syllabus.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Please upload a PDF syllabus.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Please upload a PDF smaller than 10 MB.")

    try:
        from pypdf import PdfReader
        reader = PdfReader(BytesIO(content))
        if reader.is_encrypted:
            raise HTTPException(status_code=400, detail="This PDF is password-protected. Please upload an unlocked copy.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail="PeekAI couldn't read this PDF. Please try another text-based PDF.") from error

    if len(text.strip()) < 100:
        raise HTTPException(
            status_code=422,
            detail="There isn't enough selectable text in this PDF. Scanned/image-only PDFs aren't supported yet.",
        )

    try:
        analysis = analyse_syllabus(text, filename)
        return {"filename": filename, "page_count": len(reader.pages), "analysis": analysis}
    except Exception as error:
        print(f"Syllabus analysis error: {error}")
        raise HTTPException(status_code=503, detail=f"Could not analyse this syllabus: {error}") from error


@app.post("/api/study-plan")
def study_plan(request: StudyPlanRequest):
    try:
        plan = generate_study_plan(
            request.analysis,
            request.assessment_date,
            request.hours_per_week,
            request.student_goal,
        )
        return {"plan": plan}
    except Exception as error:
        print(f"Study plan error: {error}")
        raise HTTPException(status_code=503, detail=f"Could not generate a study plan: {error}") from error


class AdaptiveQuizRequest(BaseModel):
    course: str = Field(min_length=1, max_length=120)
    topic: str = Field(min_length=1, max_length=160)
    context: str = Field(default='', max_length=5000)
    difficulty: str = Field(default='Intermediate', pattern='^(Foundation|Intermediate|Exam)$')
    count: int = Field(default=4, ge=2, le=8)


class WrittenMarkRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1200)
    ideal_answer: str = Field(min_length=1, max_length=1600)
    answer: str = Field(min_length=1, max_length=3000)


@app.post('/api/study/quiz')
def adaptive_quiz(request: AdaptiveQuizRequest):
    from ai.adaptive import create_quiz
    try:
        return create_quiz(request.course, request.topic, request.context, request.difficulty, request.count)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f'Quiz generation failed: {error}') from error


@app.post('/api/study/mark')
def adaptive_mark(request: WrittenMarkRequest):
    from ai.adaptive import mark_written
    try:
        return mark_written(request.question, request.ideal_answer, request.answer)
    except Exception as error:
        raise HTTPException(status_code=503, detail=f'Written feedback failed: {error}') from error
