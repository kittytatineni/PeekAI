
import { useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Plus, Upload, LoaderCircle, Sparkles, Trash2
} from 'lucide-react'

import type { Course } from '../types'
import { analyseSyllabus, type SyllabusAnalysis } from '../services/aiServices'

type CoursesProps = {
  courses: Course[]
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>
  onDeleteCourse: (courseId: number) => void
}

export default function Courses({
  courses,
  setCourses,
  onDeleteCourse
}: CoursesProps) {
  const [selectedCourseId, setSelectedCourseId] =
    useState<number | null>(null)

  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [analysis, setAnalysis] = useState<SyllabusAnalysis | null>(null)
  const [filename, setFilename] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function uploadSyllabus(file?: File) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 10 * 1024 * 1024) {
      setUploadError('Choose a PDF smaller than 10 MB.')
      return
    }
    setUploadError('')
    setAnalysis(null)
    setAnalysing(true)
    try {
      const result = await analyseSyllabus(file)
      setAnalysis(result)
      setFilename(file.name)
      setNewCourseCode(result.course_code)
      setNewCourseName(result.course_name)
      setShowAddCourse(true)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Syllabus analysis failed.')
    } finally {
      setAnalysing(false)
    }
  }


  const [termStartDate, setTermStartDate] = useState('')

  const selectedCourse = courses.find(
    course => course.id === selectedCourseId
  )

  function addCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newCourseCode.trim() || !newCourseName.trim()) return

    setCourses(previous => [
      ...previous,
      {
        id: Date.now(),
        code: newCourseCode.trim().toUpperCase(),
        name: newCourseName.trim(),
        description: analysis?.overview
          ? analysis.overview.length > 120
            ? analysis.overview.slice(0, 117).trimEnd() + '...'
            : analysis.overview
          : 'Your course workspace.',
        color: 'blue',
        syllabus: analysis ?? undefined,
        termStartDate: termStartDate || undefined,
        syllabusFilename: analysis ? filename : '',
        assessments: analysis?.assessments.map((a, i) => ({
          id: Date.now() + i + 1,
          title: a.name,
          dueDate: a.date || 'Not specified',
          weight: a.weight,
          status: 'Upcoming' as const
        })) ?? []
      }
    ])

    setNewCourseCode('')
    setNewCourseName('')
    setShowAddCourse(false)
    setAnalysis(null)
    setTermStartDate('')
  }

  function deleteCourse(id: number) {
    const course = courses.find(item => item.id === id)

    if (!course) return

    const confirmed = window.confirm(
      `Delete ${course.code} - ${course.name}? This will also permanently remove its Planner tasks and Calendar blocks.`
    )

    if (!confirmed) return

    onDeleteCourse(id)

    if (selectedCourseId === id) {
      setSelectedCourseId(null)
    }
  }

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">YOUR ACADEMIC HUB</div>

          <h1>
            {selectedCourse ? selectedCourse.code : 'Your courses'}
            <span> ✦</span>
          </h1>

          <p>
            {selectedCourse
              ? 'Everything you need to stay on top of this course.'
              : 'All your subjects, assessments and academic progress in one place.'}
          </p>
        </div>

        {selectedCourse ? (
          <button
            className="primary-button"
            onClick={() => setSelectedCourseId(null)}
          >
            Back to courses
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={() => setShowAddCourse(!showAddCourse)}
          >
            <Plus size={17} />
            Add course
          </button>
        )}
      </section>

      {selectedCourse ? (
        <div className="course-detail-page">
          <div className="course-detail-card">
            <div className={`course-symbol course-${selectedCourse.color}`}>
              {selectedCourse.code.charAt(0)}
            </div>

            <div>
              <div className="eyebrow">{selectedCourse.code}</div>
              <h2>{selectedCourse.name}</h2>
              <p>{selectedCourse.description}</p>
            </div>
          </div>

          {selectedCourse.syllabus && <section className="panel assessments-panel"><label>Teaching Week 1 starts (Monday): <input type="date" value={selectedCourse.termStartDate || ''} onChange={e => setCourses(prev => prev.map(c => c.id === selectedCourse.id ? {...c, termStartDate: e.target.value || undefined} : c))}/></label><p>Set the first teaching Monday, then assign a teaching week to each topic below. Unassigned topics will not be auto-scheduled.</p></section>}
          {selectedCourse.syllabus && <section className="panel assessments-panel">
            <div className="panel-heading"><div><h2>Course topics</h2><p>Extracted from {selectedCourse.syllabusFilename || 'your syllabus'}</p></div><Sparkles size={20} className="muted-icon" /></div>
            {selectedCourse.syllabus.topics.map((topic, index) => <details className="syllabus-course-topic" key={`${topic.title}-${index}`}>
              <summary><strong>{index + 1}. {topic.title}</strong><span>{topic.subtopics.length} subtopics</span></summary>
              {topic.subtopics.length > 0 && <><h4>Subtopics</h4><ul>{topic.subtopics.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
              {topic.learning_outcomes.length > 0 && <><h4>Learning outcomes</h4><ul>{topic.learning_outcomes.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
              {topic.prerequisites.length > 0 && <p><strong>Prerequisites:</strong> {topic.prerequisites.join(', ')}</p>}
              <label style={{display:'flex',alignItems:'center',gap:8,margin:'10px 0'}}>Teaching week
                <select value={selectedCourse.topicWeeks?.[String(index)] || (topic.source_evidence?.match(/\b(?:week|wk)\s*(\d+)\b/i)?.[1] ?? '')} onChange={e => setCourses(prev => prev.map(c => c.id === selectedCourse.id ? {...c, topicWeeks: {...c.topicWeeks, [String(index)]: Number(e.target.value) || 0}} : c))}>
                  <option value="">Select week</option>
                  {Array.from({length:10},(_,w)=><option key={w} value={w+1}>Week {w+1}</option>)}
                </select>
              </label>
              {topic.source_evidence && <p className="syllabus-source">Source: {topic.source_evidence}</p>}
            </details>)}
          </section>}
          <div className="panel assessments-panel">
            <div className="panel-heading">
              <div>
                <h2>Assessments</h2>
                <p>Your coursework and upcoming deadlines.</p>
              </div>

              <CalendarDays size={20} className="muted-icon" />
            </div>

            {selectedCourse.assessments.map(assessment => (
              <div className="assessment-row" key={assessment.id}>
                <div className="assessment-icon">
                  <BookOpen size={19} />
                </div>

                <div className="assessment-info">
                  <strong>{assessment.title}</strong>
                  <span>
                    Due {assessment.dueDate} · Weight {assessment.weight}
                  </span>
                </div>

                <span
                  className={`assessment-status status-${assessment.status
                    .toLowerCase()
                    .replace(' ', '-')}`}
                >
                  {assessment.status}
                </span>
              </div>
            ))}
          </div>
          {selectedCourse.syllabus && <section className="panel assessments-panel"><div className="panel-heading"><div><h2>Important course information</h2><p>Verify these requirements against your current course outline.</p></div></div><ul className="syllabus-notes">{selectedCourse.syllabus.study_notes.map((note, i) => <li key={i}>{note}</li>)}</ul></section>}
        </div>
      ) : (
        <>
          <section className="panel syllabus-upload-panel">
            <div className="panel-heading"><div><h2><Sparkles size={18} /> Create a course from a syllabus</h2><p>Upload a text-based PDF and review the extracted details before saving.</p></div></div>
            <label className="syllabus-upload-label"><Upload size={19} /> {analysing ? 'Analysing syllabus…' : 'Choose syllabus PDF'}<input type="file" accept=".pdf,application/pdf" disabled={analysing} onChange={event => { void uploadSyllabus(event.target.files?.[0]); event.target.value = '' }} /></label>
            {analysing && <p role="status"><LoaderCircle size={15} /> Reading your course outline with PeekAI…</p>}
            {uploadError && <p role="alert" className="syllabus-upload-error">{uploadError}</p>}
          </section>
          {showAddCourse && (
            <div className="panel add-course-panel">
              <div className="panel-heading">
                <div>
                  <h2>Add a course</h2>
                  <p>{analysis ? 'Review the AI-extracted details before creating your course.' : 'Build your academic workspace.'}</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setShowAddCourse(false)}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={addCourse}>
                <label>Course code</label>
                <input
                  value={newCourseCode}
                  onChange={event =>
                    setNewCourseCode(event.target.value)
                  }
                  placeholder="e.g. COMP2521"
                  required
                />

                <label>Course name</label>
                <input
                  value={newCourseName}
                  onChange={event =>
                    setNewCourseName(event.target.value)
                  }
                  placeholder="e.g. Data Structures and Algorithms"
                  required
                />

                {analysis && <label style={{display:'block', margin:'12px 0'}}>Teaching Week 1 starts (Monday) <input type="date" value={termStartDate} onChange={e => setTermStartDate(e.target.value)} required={!!analysis} /> <small>Required to unlock topics in the correct week. Verify against your term timetable.</small></label>}
                {analysis && <div className="syllabus-review"><strong>Extracted from {filename}</strong><p>{analysis.overview}</p><p>{analysis.topics.length} topics · {analysis.assessments.length} assessments</p><h4>Assessments — verify dates and weights</h4>{analysis.assessments.map((a,i) => <p key={i}>{a.name}: {a.date || 'Date not specified'} · {a.weight || 'Weight not specified'}</p>)}<small>Imported dates may be historical. Check your current term's outline before scheduling.</small></div>}
                <button className="primary-button" type="submit">
                  <Plus size={16} />
                  Save course
                </button>
              </form>
            </div>
          )}

          <section className="course-grid">
          {courses.map(course => (
            <div className="course-card" key={course.id}>
              <div className="course-card-top">
                <div className={`course-symbol course-${course.color}`}>
                  {course.code.charAt(0)}
                </div>

                <button
                  type="button"
                  className="delete-course-button"
                  onClick={() => deleteCourse(course.id)}
                  aria-label={`Delete ${course.code}`}
                  title="Delete course"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <button
                type="button"
                className="course-card-content"
                onClick={() => setSelectedCourseId(course.id)}
              >
                <div className="eyebrow">{course.code}</div>
                <h2>{course.name}</h2>
                <p>{course.description}</p>

                <div className="course-card-footer">
                  <span>
                    <CalendarDays size={15} />
                    {course.assessments.length} assessments
                  </span>

                  <span>
                    View course <ChevronRight size={15} />
                  </span>
                </div>
              </button>
            </div>
          ))}
        </section>
        </>
      )}
    </div>
  )
}
