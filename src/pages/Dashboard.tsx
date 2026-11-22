
import { useState } from 'react'

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Circle,
  GraduationCap,
  Sparkles,
  Target,
  ArrowUpRight,
  Brain,
} from 'lucide-react'

import type { Task, Course, PageName } from '../types'

type DashboardProps = {
  tasks: Task[]
  courses: Course[]
  onToggleTask: (id: number) => void
  onNavigate: (page: PageName) => void
}

function Dashboard({
  tasks,
  courses,
  onToggleTask,
  onNavigate,
}: DashboardProps) {
  const [briefingExpanded, setBriefingExpanded] = useState(false)

  const completedTasks = tasks.filter(task => task.completed).length

  const assessments = courses.flatMap(course =>
    course.assessments.map(assessment => ({
      ...assessment,
      courseCode: course.code,
    }))
  )

  const upcomingAssessments = assessments
    .filter(assessment => assessment.status !== 'Completed')
    .sort(
      (a, b) =>
        new Date(a.dueDate).getTime() -
        new Date(b.dueDate).getTime()
    )
    .slice(0, 3)

  function getDateParts(dateString: string) {
    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return { day: '--', month: 'TBA' }
    }

    return {
      day: date.getDate().toString(),
      month: date.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase(),
    }
  }

  return (
    <div className="page-content">

      {/* Welcome section */}
      <section className="welcome-row">
        <div>
          <div className="eyebrow">YOUR ACADEMIC OVERVIEW</div>
          <h1>Welcome to PeekAI <span>✦</span></h1>
          <p>Let's make today a little more manageable.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => onNavigate('Planner')}
        >
          <CalendarDays size={15} />
          View my planner
        </button>
      </section>

      {/* Statistics */}
      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            Active courses
            <div className="stat-icon teal">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="stat-number">{courses.length}</div>
          <div className="stat-foot">Your current subjects</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            Assessments
            <div className="stat-icon purple">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="stat-number">{assessments.length}</div>
          <div className="stat-foot">Across all your courses</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            Tasks completed
            <div className="stat-icon green">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-number">
            {completedTasks}
            <span className="stat-total"> / {tasks.length}</span>
          </div>
          <div className="stat-foot">Keep building momentum</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            Study time
            <div className="stat-icon orange">
              <Clock3 size={18} />
            </div>
          </div>
          <div className="stat-number">
            3<span className="stat-unit"> hrs</span>
          </div>
          <div className="stat-foot">Your weekly study goal</div>
        </div>

      </section>

      {/* AI briefing */}
      <section className="briefing-card">
        <div className="briefing-glow" />

        <div className="briefing-content">
          <div className="briefing-label">
            <Sparkles size={14} />
            YOUR PEEKAI BRIEFING
          </div>

          <h2>A clearer path starts here.</h2>

          <p>
            You've got {tasks.filter(task => !task.completed).length} tasks
            still on your list. Let's focus on what matters most and make
            steady progress towards your academic goals.
          </p>

          <button
            className="briefing-link"
            onClick={() => setBriefingExpanded(!briefingExpanded)}
          >
            {briefingExpanded ? 'Show less' : 'See your recommendations'}
            <ArrowUpRight size={14} />
          </button>

          {briefingExpanded && (
            <div className="briefing-extra">
              <strong>Your suggested next steps</strong>
              <p>
                Start with your highest-priority incomplete task, then
                review the upcoming assessment deadlines in your planner.
              </p>
            </div>
          )}
        </div>

        <div className="briefing-art">
          <div className="art-circle">
            <Brain size={48} />
          </div>
          <Sparkles className="art-sparkle" size={23} />
        </div>
      </section>

      {/* Today's priorities and courses */}
      <section className="dashboard-grid">

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Today's priorities</h2>
              <p>Small steps make a big difference.</p>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate('Planner')}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          <div className="task-list dashboard-scroll-tasks">
            {tasks.map(task => (
              <div
                className={`task-row ${task.completed ? 'task-completed' : ''}`}
                key={task.id}
              >
                <button
                  className="task-check"
                  onClick={() => onToggleTask(task.id)}
                  aria-label={
                    task.completed
                      ? `Mark ${task.title} incomplete`
                      : `Complete ${task.title}`
                  }
                >
                  {task.completed
                    ? <CheckCircle2 size={19} />
                    : <Circle size={19} />}
                </button>

                <div className="task-details">
                  <strong>{task.title}</strong>
                  <span>{task.course} · {task.time}</span>
                </div>

                <span className={`priority priority-${task.priority.toLowerCase()}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>

          <button
            className="add-task-button"
            onClick={() => onNavigate('Planner')}
          >
            + Add or organise tasks
          </button>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>My courses</h2>
              <p>Your academic workspace.</p>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate('My Courses')}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          {courses.map(course => (
            <div className="course-row" key={course.id}>
              <div className={`course-symbol course-${course.color}`}>
                {course.code.charAt(0)}
              </div>

              <div className="course-details">
                <strong>{course.code}</strong>
                <span>{course.name}</span>
              </div>

              <ChevronRight size={17} />
            </div>
          ))}
        </div>

      </section>

      {/* Deadlines and focus recommendation */}
      <section className="bottom-grid">

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Coming up</h2>
              <p>Your upcoming assessment deadlines.</p>
            </div>

            <CalendarDays size={18} className="muted-icon" />
          </div>

          {upcomingAssessments.map((assessment, index) => {
            const date = getDateParts(assessment.dueDate)

            return (
              <div className="deadline-row" key={`${assessment.courseCode}-${assessment.id}`}>
                <div className="deadline-date">
                  <strong>{date.day}</strong>
                  <span>{date.month}</span>
                </div>

                <div className="deadline-info">
                  <strong>{assessment.title}</strong>
                  <span>{assessment.courseCode} · {assessment.weight}</span>
                </div>

                <span className={`deadline-tag ${index === 0 ? 'urgent' : ''}`}>
                  {index === 0 ? 'Upcoming' : 'Due soon'}
                </span>
              </div>
            )
          })}

          {upcomingAssessments.length === 0 && (
            <p className="planner-empty">No upcoming assessments.</p>
          )}
        </div>

        <div className="focus-card">
          <div className="focus-icon">
            <Target size={20} />
          </div>

          <h2>Your next best step</h2>

          <p>
            Consistency matters more than perfection. Pick one task,
            give it your full attention, and build momentum from there.
          </p>

          <button onClick={() => onNavigate('Planner')}>
            Open my planner <ArrowUpRight size={14} />
          </button>
        </div>

      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <span>
          <Sparkles size={12} />
          Powered by PeekAI
        </span>
        <span>Your academic companion.</span>
      </footer>

    </div>
  )
}

export default Dashboard
