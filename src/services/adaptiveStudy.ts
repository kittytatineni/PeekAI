export type AdaptiveQuestion = { id: string; type: 'mcq' | 'written'; prompt: string; options: string[]; answer_index: number | null; ideal_answer: string; explanation: string; skill: string }
export type WrittenFeedback = { score: number; feedback: string; strengths: string[]; improvements: string[]; next_step: string }
export type QuizAttempt = { course: string; topic: string; timestamp: string; questions: number; score: number; skills: { skill: string; score: number }[] }
const BASE = 'http://localhost:8000'
async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.detail || `AI request failed (${response.status})`) }
  return response.json() as Promise<T>
}
export async function createAdaptiveQuiz(course: string, topic: string, context: string, difficulty: string) {
  return (await post<{questions: AdaptiveQuestion[]}>('/api/study/quiz', { course, topic, context, difficulty, count: 4 })).questions
}
export function markWritten(question: AdaptiveQuestion, answer: string) {
  return post<WrittenFeedback>('/api/study/mark', { question: question.prompt, ideal_answer: question.ideal_answer, answer })
}
