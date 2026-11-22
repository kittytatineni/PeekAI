import { useEffect, useMemo, useState } from 'react'
import type { Course, Task } from '../types'
import { createAdaptiveQuiz, markWritten, type AdaptiveQuestion, type QuizAttempt, type WrittenFeedback } from '../services/adaptiveStudy'

type Answer = { question: AdaptiveQuestion; score: number; feedback: string }
const KEY = 'peekai-adaptive-attempts-v1'
function savedAttempts(): QuizAttempt[] { try { const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x : [] } catch { return [] } }
export default function AdaptiveQuiz({ courses, setTasks }: { courses: Course[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const [courseCode, setCourseCode] = useState(courses.find(c => c.syllabus?.topics?.length)?.code || courses[0]?.code || '')
  const course = courses.find(c => c.code === courseCode)
  const topicNames = useMemo(() => course?.syllabus?.topics.map(t => t.title) || [], [course])
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<number | null>(null)
  const [written, setWritten] = useState('')
  const [feedback, setFeedback] = useState<WrittenFeedback | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState<QuizAttempt[]>(savedAttempts)
  const [approved, setApproved] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [reviewMinutes, setReviewMinutes] = useState(45)
  useEffect(() => { if (!topicNames.includes(topic)) setTopic(topicNames[0] || '') }, [topicNames, topic])
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(attempts)) }, [attempts])
  const current = questions[index]
  const finished = questions.length > 0 && answers.length === questions.length
  const avg = answers.length ? Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length * 100) : 0
  const weak = answers.filter(a => a.score < .75)
  const recent = attempts.filter(a => a.course === courseCode)
  const overall = recent.length ? Math.round(recent.reduce((s,a) => s + (a.score <= 1 ? a.score * 100 : a.score), 0) / recent.length) : 0
  const suggested = Array.from(new Set(weak.map(a => a.question.skill || topic))).slice(0, 4)
  const topicHistory = attempts.filter(a => a.course === courseCode && a.topic === topic).slice(-3)
  const topicAverage = topicHistory.length ? Math.round(topicHistory.reduce((sum,a) => sum + a.score, 0) / topicHistory.length) : null
  const recommendedDifficulty = topicAverage === null ? 'Intermediate' : topicAverage < 55 ? 'Foundation' : topicAverage >= 80 ? 'Exam' : 'Intermediate'
  async function start() {
    if (!course || !topic) return
    setBusy(true); setError(''); setApproved(false); setSelectedSkills([])
    try {
      const t = course.syllabus?.topics.find(t => t.title === topic)
      const context = [course.syllabus?.overview, t?.subtopics.join(', '), t?.learning_outcomes.join(', '), t?.source_evidence].filter(Boolean).join('\n')
      const next = await createAdaptiveQuiz(courseCode, topic, context || topic, difficulty)
      setQuestions(next); setIndex(0); setAnswers([]); setChoice(null); setWritten(''); setFeedback(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not generate quiz') }
    finally { setBusy(false) }
  }
  async function submit() {
    if (!current || busy || feedback || answers.length > index) return
    if (current.type === 'written' && !written.trim()) return
    if (current.type === 'mcq' && choice === null) return
    setBusy(true); setError('')
    try {
      const result: WrittenFeedback = current.type === 'mcq'
        ? { score: choice === current.answer_index ? 1 : 0, feedback: current.explanation, strengths: [], improvements: [], next_step: '' }
        : await markWritten(current, written)
      setFeedback(result)
      const next = [...answers, { question: current, score: result.score, feedback: result.feedback }]
      setAnswers(next)
      if (next.length === questions.length) {
        const score = Math.round(next.reduce((s, a) => s + a.score, 0) / next.length * 100)
        setSelectedSkills(Array.from(new Set(next.filter(a => a.score < .75).map(a => a.question.skill || topic))).slice(0, 4))
        setAttempts(prev => [...prev, { course: courseCode, topic, timestamp: new Date().toISOString(), questions: next.length, score, skills: next.map(a => ({ skill: a.question.skill, score: a.score })) }])
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not mark answer') }
    finally { setBusy(false) }
  }
  function next() { setIndex(i => i + 1); setChoice(null); setWritten(''); setFeedback(null) }
  function approve() {
    const skills = selectedSkills.length ? selectedSkills : []
    if (!skills.length) return
    setTasks(previous => {
      const keys = new Set(previous.map(t => t.sourceKey))
      const newTasks = skills.map((skill, i) => ({ id: Date.now() + i, title: `Adaptive review: ${skill}`, course: courseCode, time: `${reviewMinutes} min`, priority: 'High' as const, completed: false, kind: 'Revision' as const, sourceKey: `adaptive:${courseCode}:${topic}:${skill}:${new Date().toISOString().slice(0,10)}` })).filter(t => !keys.has(t.sourceKey))
      return [...previous, ...newTasks]
    })
    setApproved(true)
  }
  const box: React.CSSProperties = { background: 'var(--surface, #fff)', border: '1px solid #dce2ea', borderRadius: 16, padding: 22, marginBottom: 18 }
  return <section style={{ marginTop: 10 }}>
    <div style={box}>
      <div className="eyebrow">ADAPTIVE ASSESSMENT</div>
      <h2>Practise a syllabus topic</h2>
      <p>Generate multiple-choice and written questions, get AI feedback, and review a suggested study plan before adding tasks.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <label>Course <select value={courseCode} onChange={e => { setCourseCode(e.target.value); setQuestions([]) }}>{courses.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}</select></label>
        <label>Topic <select value={topic} onChange={e => setTopic(e.target.value)}>{topicNames.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
        <label>Difficulty <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>{['Foundation', 'Intermediate', 'Exam'].map(d => <option key={d}>{d}</option>)}</select></label>
      </div>
      {topic && <p style={{ fontSize: 13, color: '#526779' }}>Suggested difficulty based on your last {topicHistory.length} quiz{topicHistory.length === 1 ? '' : 'zes'} in this topic: <strong>{recommendedDifficulty}</strong>{topicAverage !== null ? ` (${topicAverage}% recent average)` : ' (no quiz history yet)'}. <button type="button" onClick={() => setDifficulty(recommendedDifficulty)} style={{ border: 0, background: 'none', color: '#078e82', cursor: 'pointer', textDecoration: 'underline' }}>Use suggestion</button></p>}
      {!topicNames.length && <p>Import a course syllabus first to unlock AI-generated quizzes.</p>}
      <button className="primary-button" onClick={start} disabled={!topic || busy}>{busy ? 'Working…' : questions.length ? 'Generate a fresh quiz' : 'Generate AI quiz'}</button>
      {error && <p role="alert" style={{ color: '#b42332' }}>{error}</p>}
    </div>
    {current && !finished && <div style={box}>
      <div className="eyebrow">QUESTION {index + 1} / {questions.length} · {current.type === 'mcq' ? 'MULTIPLE CHOICE' : 'WRITTEN ANSWER'}</div>
      <h3>{current.prompt}</h3>
      {current.type === 'mcq' ? <div style={{ display: 'grid', gap: 9 }}>{current.options.map((o,i) => <label key={i} style={{ padding: 10, border: '1px solid #dce2ea', borderRadius: 8 }}><input type="radio" checked={choice === i} disabled={!!feedback} onChange={() => setChoice(i)}/> {o}</label>)}</div>
        : <textarea rows={5} style={{ width: '100%', padding: 12, borderRadius: 8 }} value={written} disabled={!!feedback} onChange={e => setWritten(e.target.value)} placeholder="Explain your reasoning in your own words…"/>}
      {feedback && <div style={{ marginTop: 14, padding: 14, background: '#edf5f6', color: '#123b43', borderRadius: 10 }}><strong>Score: {Math.round(feedback.score * 100)}%</strong><p>{feedback.feedback}</p>{feedback.improvements.length > 0 && <p><strong>Improve:</strong> {feedback.improvements.join('; ')}</p>}{feedback.next_step && <p><strong>Next:</strong> {feedback.next_step}</p>}</div>}
      <div style={{ marginTop: 14 }}>{!feedback ? <button className="primary-button" disabled={busy || (current.type === 'mcq' ? choice === null : !written.trim())} onClick={submit}>{busy ? 'AI marking…' : 'Submit answer'}</button> : <button className="primary-button" onClick={next}>{index === questions.length - 1 ? 'View diagnostics' : 'Next question'}</button>}</div>
    </div>}
    {finished && <div style={box}>
      <div className="eyebrow">SESSION DIAGNOSTICS</div><h2>{avg}% · {answers.length} questions</h2>
      <p>{avg >= 80 ? 'Strong result. Increase difficulty or test another topic.' : 'Review the areas below, then retest to measure improvement.'}</p>
      {answers.map((a,i) => <p key={i}><strong>{a.question.skill}: {Math.round(a.score*100)}%</strong> — {a.feedback}</p>)}
      <h3>Review your suggested study tasks</h3>
      <p>{suggested.length ? 'PeekAI recommends focused 45-minute review sessions for these weaker skills:' : 'No major gaps detected. An optional consolidation session is available:'}</p>
      <div style={{ display: 'grid', gap: 9, marginBottom: 12 }}>{(suggested.length ? suggested : [topic]).map(s => <label key={s} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="checkbox" checked={selectedSkills.includes(s)} onChange={e => setSelectedSkills(previous => e.target.checked ? [...previous, s] : previous.filter(x => x !== s))}/>{s}</label>)}</div>
      <label style={{ display: 'block', marginBottom: 12 }}>Minutes per revision task <select value={reviewMinutes} onChange={e => setReviewMinutes(Number(e.target.value))}>{[20,30,45,60].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></label>
      <button className="primary-button" onClick={approve} disabled={approved || !selectedSkills.length}>{approved ? 'Added to Planner ✓' : 'Approve and add to Planner'}</button>
      <p style={{ fontSize: 13 }}>Open Calendar and use its scheduling controls to allocate the approved tasks. Calendar updates are not automatic in this first phase.</p>
    </div>}
    <div style={box}><div className="eyebrow">LEARNING PROGRESS</div><div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}><div><strong style={{ fontSize: 24 }}>{recent.length}</strong><p>Quizzes completed</p></div><div><strong style={{ fontSize: 24 }}>{recent.length ? `${overall}%` : '—'}</strong><p>Average score</p></div><div><strong style={{ fontSize: 24 }}>{recent.reduce((s,a) => s + a.questions, 0)}</strong><p>Questions answered</p></div></div><p style={{ fontSize: 12, color: '#64748b' }}>Based on saved AI quiz attempts. Written scores are model estimates, not validated learning gains.</p></div>
  </section>
}
