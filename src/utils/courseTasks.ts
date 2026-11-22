import type { Course, Task } from '../types'

const parseWeek = (text: string): number | undefined => {
  const m = (text || '').match(/\b(?:week|wk)\s*([0-9]{1,2})\b/i)
  return m ? Number(m[1]) : undefined
}
const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00`).getTime())
const weekDate = (start: string | undefined, week: number | undefined, offset = 0): string | undefined => {
  if (!start || !validDate(start) || !week) return undefined
  const d = new Date(`${start}T12:00:00`)
  d.setDate(d.getDate() + (week - 1) * 7 + offset)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const before = (date: string | undefined, days: number): string | undefined => {
  if (!date || !validDate(date)) return undefined
  const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()-days)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
export function tasksFromCourse(course: Course): Task[] {
  if (!course.syllabus) return []
  const result: Task[] = []
  const make = (key: string, title: string, time: string, kind: Task['kind'], priority: Task['priority'], extra: Partial<Task> = {}) =>
    result.push({ id: 0, sourceKey: `${course.id}:${key}`, title, course: course.code, time, kind, priority, completed: false, ...extra })
  course.syllabus.topics.forEach((topic, i) => {
    const week = course.topicWeeks?.[String(i)] || parseWeek(topic.source_evidence)
    const start = weekDate(course.termStartDate, week)
    // Unknown weeks must be confirmed; never schedule every topic immediately.
    const eligibility = start ? { week, availableFrom: start, status: 'active' as const } : { week, status: 'deferred' as const }
    make(`topic:${i}:learn`, `Learn: ${topic.title}`, '45 min', 'Topic', 'Medium', { ...eligibility, dueDate: weekDate(course.termStartDate,week,7), blockType: 'study' })
    make(`topic:${i}:practice`, `Practise: ${topic.title}`, '45 min', 'Topic', 'Medium', { ...eligibility, availableFrom: weekDate(course.termStartDate, week, 2), dueDate: weekDate(course.termStartDate,week,7), blockType: 'study' })
    // Separate recurring weekly review occurrences, not a single 'recurrence' flag.
    if (week && start) for (let reviewWeek = week + 1; reviewWeek <= 10; reviewWeek++) {
      make(`topic:${i}:review:week:${reviewWeek}`, `Weekly review: ${topic.title} (Week ${reviewWeek})`, '30 min', 'Revision', 'Low', {
        week: reviewWeek, availableFrom: weekDate(course.termStartDate, reviewWeek),
        dueDate: weekDate(course.termStartDate, reviewWeek, 7),
        recurrence: 'weekly', blockType: 'study'
      })
    }
  })
  course.syllabus.assessments.forEach((a, i) => {
    const due = validDate(a.date?.trim() || '') ? a.date.trim() : undefined
    const week = parseWeek(a.date || '')
    const deadline = due || weekDate(course.termStartDate, week)
    const isRecurring = /\b(weekly|each week|every week|lab|tutorial|quiz)\b/i.test(a.name)
    if (isRecurring && course.termStartDate && !due) {
      for (let w = 1; w <= 10; w++) {
        const d = weekDate(course.termStartDate, w, 5)
        make(`assessment:${i}:week:${w}`, `${a.name} — Week ${w}`, '60 min', 'Assessment', 'High', { week: w, availableFrom: weekDate(course.termStartDate,w), dueDate: d, recurrence: 'weekly', blockType: 'assessment-prep' })
      }
    } else {
      const from = before(deadline, 14)
      make(`assessment:${i}:plan`, `Plan: ${a.name}`, '60 min', 'Assessment', 'High', { dueDate: deadline, availableFrom: from, blockType: 'assessment-prep', week, status: !deadline ? 'deferred' : 'active' })
      make(`assessment:${i}:work1`, `Work on: ${a.name} (part 1)`, '90 min', 'Assessment', 'High', { dueDate: deadline, availableFrom: before(deadline, 10), blockType: 'assessment-prep', status: !deadline ? 'deferred' : 'active' })
      make(`assessment:${i}:work2`, `Work on: ${a.name} (part 2)`, '90 min', 'Assessment', 'High', { dueDate: deadline, availableFrom: before(deadline, 6), blockType: 'assessment-prep', status: !deadline ? 'deferred' : 'active' })
      make(`assessment:${i}:review`, `Test and submit: ${a.name}`, '60 min', 'Assessment', 'High', { dueDate: deadline, availableFrom: before(deadline, 3), blockType: 'assessment-prep', status: !deadline ? 'deferred' : 'active' })
    }
  })
  return result
}
