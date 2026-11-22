
import { useEffect, useState } from 'react'

import Sidebar from './component/layout/Sidebar'
import Topbar from './component/layout/Topbar'

import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Planner from './pages/Planner'
import Calendar from './pages/Calendar'
import StudyCentre from './pages/StudyCentre'
import StudyBuddy from './pages/StudyBuddy'
import PlaceholderPage from './pages/PlaceholderPage'

import { initialCourses } from './data/initialCourses'
import { initialTasks } from './data/initialTasks'

import type { Course, PageName, Task, StudyBlock, WeeklyAvailability } from './types'

import './App.css'
import { tasksFromCourse } from './utils/courseTasks'

function App() {
  // Current page
  const [activePage, setActivePage] = useState<PageName>('Dashboard')

  // Shared application data
  const [tasks, setTasks] = useState<Task[]>(() => { try { const saved = JSON.parse(localStorage.getItem('peekai-tasks-v1') || 'null'); return Array.isArray(saved) ? saved as Task[] : initialTasks } catch { return initialTasks } })
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('peekai-courses-v1')
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed as Course[]
      }
    } catch { /* Fall back to starter courses. */ }
    return initialCourses
  })
  useEffect(() => {
    setTasks(previous => {
      const generated = courses.flatMap(tasksFromCourse)
      const byKey = new Map(generated.map(t => [t.sourceKey, t]))
      const existing = new Set(previous.filter(t => !t.sourceKey || byKey.has(t.sourceKey)).map(t => t.sourceKey))
      const refreshed = previous.filter(t => !t.sourceKey || !t.sourceKey.match(/:topic:\d+:review(?::week:\d+)?$/) || byKey.has(t.sourceKey)).map(t => {
        const updated = byKey.get(t.sourceKey)
        return updated ? { ...t, title: updated.title, time: updated.time, week: updated.week, dueDate: updated.dueDate, availableFrom: updated.availableFrom, blockType: updated.blockType, recurrence: updated.recurrence, status: updated.status } : t
      })
      let id = Math.max(Date.now(), ...previous.map(t => t.id))
      const additions = generated.filter(t => !existing.has(t.sourceKey)).map(t => ({ ...t, id: ++id }))
      return additions.length || refreshed.some((t,i) => JSON.stringify(t) !== JSON.stringify(previous[i])) ? [...refreshed, ...additions] : previous
    })
  }, [courses])

  const [blocks, setBlocks] = useState<StudyBlock[]>(() => {
    try { return JSON.parse(localStorage.getItem('peekai-blocks-v1') || '[]') as StudyBlock[] }
    catch { return [] }
  })
  const [availability, setAvailability] = useState<WeeklyAvailability[]>(() => {
    const defaults = Array.from({ length: 7 }, (_, i) => ({ enabled: i !== 6, start: i < 5 ? '17:00' : '10:00', end: i < 5 ? '21:00' : '17:00' }))
    try { const saved = JSON.parse(localStorage.getItem('peekai-availability-v1') || 'null'); return Array.isArray(saved) && saved.length === 7 ? saved as WeeklyAvailability[] : defaults }
    catch { return defaults }
  })
  useEffect(() => { localStorage.setItem('peekai-blocks-v1', JSON.stringify(blocks)) }, [blocks])
  useEffect(() => { localStorage.setItem('peekai-availability-v1', JSON.stringify(availability)) }, [availability])
  useEffect(() => { localStorage.setItem('peekai-tasks-v1', JSON.stringify(tasks)) }, [tasks])

  // Deleting a course also removes its Planner tasks and linked Calendar sessions.
  // Match by course code because existing tasks/blocks store the code, not course ID.
  function deleteCourseAndWork(courseId: number) {
    const course = courses.find(c => c.id === courseId)
    if (!course) return
    const taskIds = new Set(tasks.filter(t => t.course === course.code).map(t => t.id))
    setTasks(previous => previous.filter(t => t.course !== course.code))
    setBlocks(previous => previous.filter(b =>
      b.course !== course.code && (b.taskId === undefined || !taskIds.has(b.taskId))
    ))
    setCourses(previous => previous.filter(c => c.id !== courseId))
    // Remove obsolete unscheduled-task explanations for deleted tasks.
    try {
      const reasons = JSON.parse(localStorage.getItem('peekai-schedule-reasons') || '{}') as Record<string, string>
      for (const id of taskIds) delete reasons[String(id)]
      localStorage.setItem('peekai-schedule-reasons', JSON.stringify(reasons))
    } catch { /* Invalid cached diagnostics can be ignored. */ }
  }

  // Mobile navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Navigate between pages
  function navigate(page: PageName) {
    setActivePage(page)
    setMobileMenuOpen(false)
  }

  // Toggle task completion
  function toggleTask(id: number) {
    setTasks(previous =>
      previous.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        mobileMenuOpen={mobileMenuOpen}
        onNavigate={navigate}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="main-area">
        <Topbar
          activePage={activePage}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dashboard */}
        {activePage === 'Dashboard' && (
          <Dashboard
            tasks={tasks}
            courses={courses}
            onToggleTask={toggleTask}
            onNavigate={navigate}
          />
        )}

        {/* Courses */}
        {activePage === 'My Courses' && (
          <Courses
            courses={courses}
            setCourses={setCourses}
            onDeleteCourse={deleteCourseAndWork}
          />
        )}

        {/* Planner */}
        {activePage === 'Planner' && (
          <Planner
            tasks={tasks}
            setTasks={setTasks}
            courses={courses}
            blocks={blocks}
            setBlocks={setBlocks}
            onNavigate={setActivePage}
            onToggleTask={toggleTask}
          />
        )}

        {activePage === 'Calendar' && <Calendar tasks={tasks} courses={courses} blocks={blocks} setBlocks={setBlocks} availability={availability} setAvailability={setAvailability} />}

        {activePage === 'Study Centre' && <StudyCentre courses={courses} setTasks={setTasks} />}
        {activePage === 'Study Buddy' && <StudyBuddy />}

        {/* Other pages */}
        {activePage !== 'Dashboard' &&
          activePage !== 'My Courses' &&
          activePage !== 'Planner' &&
          activePage !== 'Calendar' &&
          activePage !== 'Study Centre' &&
          activePage !== 'Study Buddy' && (
            <PlaceholderPage
              page={activePage}
              onBack={() => navigate('Dashboard')}
            />
          )}
      </main>
    </div>
  )
}

export default App
