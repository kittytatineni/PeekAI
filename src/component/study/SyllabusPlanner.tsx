import { useRef, useState } from 'react'
import { CalendarDays, CheckCircle2, FileUp, LoaderCircle, Sparkles, Upload, X } from 'lucide-react'
import {
  analyseSyllabus,
  generateStudyPlan,
  type StudyPlan,
  type SyllabusAnalysis,
} from '../../services/aiServices'
import '../../styles/syllabus-planner.css'

export default function SyllabusPlanner() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [assessmentDate, setAssessmentDate] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState(5)
  const [analysis, setAnalysis] = useState<SyllabusAnalysis | null>(null)
  const [plan, setPlan] = useState<StudyPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [completedActivities, setCompletedActivities] = useState<string[]>([])

  function chooseFile(nextFile?: File) {
    if (!nextFile) return
    if (nextFile.type !== 'application/pdf' && !nextFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setError('Please choose a PDF smaller than 10 MB.')
      return
    }
    setFile(nextFile)
    setAnalysis(null)
    setPlan(null)
    setError('')
    setCompletedActivities([])
  }

  async function buildPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file || loading) return
    setLoading(true)
    setError('')
    setPlan(null)
    try {
      setStage('Reading your syllabus and identifying course topics…')
      const extracted = await analyseSyllabus(file)
      setAnalysis(extracted)
      setStage('Building a study plan around your available time…')
      const generated = await generateStudyPlan(extracted, assessmentDate, hoursPerWeek)
      setPlan(generated)
      setStage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStage('')
    } finally {
      setLoading(false)
    }
  }

  function toggleActivity(key: string) {
    setCompletedActivities(previous =>
      previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]
    )
  }

  return (
    <section className="panel syllabus-ai-panel">
      <div className="syllabus-ai-heading">
        <div>
          <div className="eyebrow"><Sparkles size={13} /> PEEKAI INTELLIGENCE</div>
          <h2>Turn your syllabus into a study plan</h2>
          <p>Upload a course outline and let PeekAI identify its topics, learning outcomes and a practical study sequence.</p>
        </div>
        <div className="syllabus-ai-icon"><FileUp size={23} /></div>
      </div>

      <form className="syllabus-ai-form" onSubmit={buildPlan}>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={event => chooseFile(event.target.files?.[0])}
        />
        <button type="button" className={`syllabus-dropzone ${file ? 'has-file' : ''}`} onClick={() => fileInput.current?.click()}>
          {file ? <CheckCircle2 size={21} /> : <Upload size={21} />}
          <span>
            <strong>{file ? file.name : 'Choose your course syllabus (PDF)'}</strong>
            <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Click to replace` : 'Text-based PDFs up to 10 MB'}</small>
          </span>
          {file && <X size={16} onClick={event => { event.stopPropagation(); setFile(null); setAnalysis(null); setPlan(null); if (fileInput.current) fileInput.current.value = '' }} />}
        </button>
        <div className="syllabus-ai-options">
          <label>
            <span><CalendarDays size={13} /> Assessment date <small>(optional)</small></span>
            <input type="date" value={assessmentDate} onChange={event => setAssessmentDate(event.target.value)} />
          </label>
          <label>
            <span>Study time per week</span>
            <select value={hoursPerWeek} onChange={event => setHoursPerWeek(Number(event.target.value))}>
              <option value={2}>2 hours</option>
              <option value={5}>5 hours</option>
              <option value={7}>7 hours</option>
              <option value={10}>10 hours</option>
              <option value={14}>14 hours</option>
              <option value={20}>20 hours</option>
            </select>
          </label>
        </div>
        <button className="syllabus-generate-button" type="submit" disabled={!file || loading}>
          {loading ? <><LoaderCircle size={16} className="syllabus-spinner" /> Analysing…</> : <><Sparkles size={16} /> Analyse syllabus & create my plan</>}
        </button>
      </form>

      {loading && <div className="syllabus-ai-status" role="status">{stage}</div>}
      {error && <div className="syllabus-ai-error" role="alert">{error}<small>Check that the FastAPI backend is running and its GLM credentials are configured.</small></div>}

      {analysis && <div className="syllabus-analysis-result">
        <div className="syllabus-result-title">
          <div><span className="eyebrow">SYLLABUS ANALYSIS</span><h3>{analysis.course_code ? `${analysis.course_code}${analysis.course_name ? ` · ${analysis.course_name}` : ''}` : analysis.course_name || 'Your course outline'}</h3></div>
          <span className="syllabus-result-count">{analysis.topics.length} topics identified</span>
        </div>
        {analysis.overview && <p className="syllabus-overview-text">{analysis.overview}</p>}
        <div className="syllabus-extracted-topics">
          {analysis.topics.map((topic, index) => <div className="syllabus-extracted-topic" key={`${topic.title}-${index}`}>
            <strong>{index + 1}. {topic.title}</strong>
            {topic.subtopics?.length > 0 && <small>{topic.subtopics.join(' · ')}</small>}
            {topic.learning_outcomes?.length > 0 && <small>Learning outcomes: {topic.learning_outcomes.join('; ')}</small>}
          </div>)}
        </div>
        {analysis.assessments?.length > 0 && <div className="syllabus-assessment-list"><strong>Assessments found in the document</strong>{analysis.assessments.map((item, index) => <span key={`${item.name}-${index}`}>{item.name}{item.date ? ` · ${item.date}` : ''}{item.weight ? ` · ${item.weight}` : ''}</span>)}</div>}
      </div>}

      {plan && <div className="generated-study-plan">
        <div className="syllabus-result-title">
          <div><span className="eyebrow"><Sparkles size={12} /> GENERATED STUDY PLAN</span><h3>{plan.title}</h3></div>
          <span className="syllabus-result-count">{completedActivities.length} activities completed</span>
        </div>
        {plan.rationale && <p className="syllabus-overview-text">{plan.rationale}</p>}
        <div className="generated-plan-days">
          {plan.days.map((day, dayIndex) => <article className="generated-plan-day" key={`${day.day}-${day.focus}`}>
            <div className="generated-day-number">DAY {day.day}</div>
            <div className="generated-day-content">
              <div className="generated-day-heading"><h4>{day.focus}</h4><span>{day.estimated_minutes} min · {day.priority}</span></div>
              <p>{day.objective}</p>
              {day.activities.map((activity, activityIndex) => {
                const key = `${dayIndex}-${activityIndex}`
                const checked = completedActivities.includes(key)
                return <label className={`generated-plan-activity ${checked ? 'completed' : ''}`} key={key}>
                  <input type="checkbox" checked={checked} onChange={() => toggleActivity(key)} />
                  <span>{activity}</span>
                </label>
              })}
            </div>
          </article>)}
        </div>
        {plan.next_steps?.length > 0 && <div className="syllabus-next-steps"><strong>Recommended next steps</strong><ul>{plan.next_steps.map((step, index) => <li key={index}>{step}</li>)}</ul></div>}
        <p className="syllabus-ai-disclaimer">AI-generated suggestions based on the uploaded document. Review dates and requirements against your official course materials.</p>
      </div>}
    </section>
  )
}
