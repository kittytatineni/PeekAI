export type SyllabusAnalysis = {
  course_code: string
  course_name: string
  overview: string
  topics: {
    title: string
    subtopics: string[]
    learning_outcomes: string[]
    prerequisites: string[]
    source_evidence: string
  }[]
  assessments: { name: string; date: string; weight: string }[]
  study_notes: string[]
}

export type StudyPlan = {
  title: string
  rationale: string
  days: {
    day: number
    focus: string
    objective: string
    activities: string[]
    estimated_minutes: number
    priority: string
  }[]
  next_steps: string[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as { detail?: string }
    return data.detail || fallback
  } catch {
    return fallback
  }
}

export async function sendMessageToPeekAI(message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) throw new Error(await readError(response, 'PeekAI could not generate a response.'))
  const data = await response.json() as { response: string }
  return data.response
}

export async function analyseSyllabus(file: File): Promise<SyllabusAnalysis> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE_URL}/api/syllabus/analyse`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error(await readError(response, 'PeekAI could not analyse this syllabus.'))
  const data = await response.json() as { analysis: SyllabusAnalysis }
  return data.analysis
}

export async function generateStudyPlan(
  analysis: SyllabusAnalysis,
  assessmentDate: string,
  hoursPerWeek: number,
): Promise<StudyPlan> {
  const response = await fetch(`${API_BASE_URL}/api/study-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysis,
      assessment_date: assessmentDate,
      hours_per_week: hoursPerWeek,
    }),
  })
  if (!response.ok) throw new Error(await readError(response, 'PeekAI could not generate your study plan.'))
  const data = await response.json() as { plan: StudyPlan }
  return data.plan
}
