import { Brain, BookOpen, ArrowRight, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import type { Course, Task } from '../types'
import AdaptiveQuiz from './AdaptiveQuiz'
import { studyContent } from '../data/studyContent'
import '../styles/study-centre-v2.css'

export default function StudyCentre({ courses, setTasks }: { courses: Course[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
  const syllabusCourses = useMemo(() => courses.filter(c => (c.syllabus?.topics?.length ?? 0) > 0), [courses])
  const contentCount = courses.filter(c => (studyContent[c.code] || []).length > 0).length
  return <div className="page-content study-v2">
    <header className="study-v2-header">
      <div><div className="eyebrow"><Sparkles size={14}/> PERSONALISED LEARNING</div><h1>Study Centre</h1><p>Practise what matters. Get feedback, identify gaps, and approve your next study steps.</p></div>
      <div className="study-v2-icon"><Brain size={28}/></div>
    </header>
    <div className="study-v2-intro"><BookOpen size={20}/><div><strong>Learning grounded in your courses</strong><p>{syllabusCourses.length} syllabus-ready course{syllabusCourses.length === 1 ? '' : 's'} · {contentCount} course{contentCount === 1 ? '' : 's'} with sample lesson notes. Your adaptive quizzes use imported syllabus topics.</p></div><ArrowRight size={17}/></div>
    <AdaptiveQuiz courses={courses} setTasks={setTasks}/>
  </div>
}
