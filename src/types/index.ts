export type Task = {
  id: number
  title: string
  course: string
  time: string
  priority: 'High' | 'Medium' | 'Low'
  completed: boolean
  sourceKey?: string
  kind?: 'Topic' | 'Assessment' | 'Revision' | 'Manual'
  week?: number
  dueDate?: string // ISO YYYY-MM-DD
  availableFrom?: string
  blockType?: 'study' | 'assessment-prep'
  recurrence?: 'weekly' | 'spaced'
  status?: 'active' | 'deferred'
}

export type Assessment = {
  id: number
  title: string
  dueDate: string
  weight: string
  status: 'Upcoming' | 'In progress' | 'Completed'
}

export type Course = {
  id: number
  code: string
  name: string
  description: string
  color: string
  assessments: Assessment[]
  syllabus?: import('../services/aiServices').SyllabusAnalysis
  termStartDate?: string // first Monday of teaching week 1
  topicWeeks?: Record<string, number> // explicit teaching week overrides
  syllabusFilename?: string
}

export type PageName =
  | 'Dashboard'
  | 'My Courses'
  | 'Planner'
  | 'Study Centre'
  | 'Study Buddy'
  | 'Calendar'
  | 'Grade Tracker'
  | 'Settings'

export type StudyQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export type SyllabusTopic = {
  id: string
  title: string
  description: string
  outcomes: string[]
  lesson: string[]
  questions: StudyQuestion[]
}

export type TopicProgress = {
  attempts: number
  correct: number
  lastPractised?: string
}

export type StudyBlock = {
  sourceKey?: string // Stable UID for imported external calendar events
  id: number
  taskId?: number
  title: string
  course: string
  date: string // YYYY-MM-DD in local time
  start: string // HH:mm in local time
  durationMinutes: number
  type?: 'study' | 'assessment-prep' | 'deadline' | 'personal'
  status?: 'scheduled' | 'completed' | 'missed'
  missedAt?: string
  originalDate?: string
}

export type WeeklyAvailability = {
  enabled: boolean
  start: string
  end: string
}
