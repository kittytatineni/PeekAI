
import { useMemo, useState } from 'react'
import { CheckCircle2, Circle, Plus } from 'lucide-react'

import type { Course, Task, StudyBlock } from '../types'

type PlannerProps = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  courses: Course[]
  blocks: StudyBlock[]
  setBlocks: React.Dispatch<React.SetStateAction<StudyBlock[]>>
  onToggleTask: (id: number) => void
  onNavigate?: (page: 'Calendar') => void
}

export default function Planner({
  tasks,
  setTasks,
  courses,
  blocks,
  setBlocks,
  onToggleTask,
  onNavigate
}: PlannerProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCourse, setNewTaskCourse] = useState(
    courses[0]?.code ?? ''
  )
  const [newTaskTime, setNewTaskTime] = useState('30 min')
  const [newTaskPriority, setNewTaskPriority] =
    useState<'High' | 'Medium' | 'Low'>('Medium')

  const [tab, setTab] = useState<'all' | 'scheduled' | 'unscheduled' | 'missed'>('all')
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [expandedAdd, setExpandedAdd] = useState(false)
  const today = new Date().toLocaleDateString('sv-SE')
  const schedulingReasons: Record<string, string> = (() => { try { return JSON.parse(localStorage.getItem('peekai-schedule-reasons') || '{}') } catch { return {} } })()
  const blockFor = (id: number) => blocks.filter(b => b.taskId === id && b.status !== 'missed').sort((a,b) => (a.date+a.start).localeCompare(b.date+b.start))[0]
  const missedFor = (id: number) => blocks.some(b => b.taskId === id && b.status === 'missed')
  const statusOf = (task: Task) => task.completed ? 'completed' : task.status === 'deferred' ? 'deferred' : blockFor(task.id) ? 'scheduled' : missedFor(task.id) ? 'missed' : 'unscheduled'
  const filtered = useMemo(() => tasks.filter(task => {
    const status = statusOf(task)
    const block = blockFor(task.id)
    const text = `${task.title} ${task.course}`.toLowerCase()
    if (tab !== 'all' && status !== tab) return false
    if (query && !text.includes(query.toLowerCase())) return false
    if (courseFilter !== 'all' && task.course !== courseFilter) return false
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
    if (timeFilter === 'overdue' && !(task.dueDate && task.dueDate < today && !task.completed)) return false
    if (timeFilter === 'today' && block?.date !== today) return false
    if (timeFilter === 'week' && !(block && block.date >= today && block.date <= new Date(Date.now()+7*86400000).toLocaleDateString('sv-SE'))) return false
    if (timeFilter === 'no-date' && (block || task.dueDate)) return false
    return true
  }), [tasks, blocks, tab, query, courseFilter, priorityFilter, timeFilter, today])
  const updateTask = (id: number, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    setBlocks(prev => prev.map(b => b.taskId === id ? { ...b, ...(patch.title !== undefined ? {title:patch.title} : {}), ...(patch.course !== undefined ? {course:patch.course} : {}), ...(patch.time !== undefined ? {durationMinutes: patch.time === '2 hours' ? 120 : Number.parseInt(patch.time,10) || 30} : {}) } : b))
  }
  const removeTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setBlocks(prev => prev.filter(b => b.taskId !== id))
  }
  const recover = (id: number) => setBlocks(prev => prev.filter(b => !(b.taskId === id && b.status === 'missed')))
  const unschedule = (id: number) => setBlocks(prev => prev.filter(b => b.taskId !== id || b.status === 'missed'))
  const completed = tasks.filter(task => task.completed).length

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!newTaskTitle.trim()) return

    setTasks(previous => [
      ...previous,
      {
        id: Date.now(),
        title: newTaskTitle.trim(),
        course: newTaskCourse,
        time: newTaskTime,
        priority: newTaskPriority,
        completed: false
      }
    ])

    setNewTaskTitle('')
  }

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">YOUR SMART PLANNER</div>
          <h1>Let's get things done. <span>✦</span></h1>
          <p>Syllabus topics and assessments are added automatically. Adjust priorities and schedule your week in Calendar.</p>
        </div>

        <div className="planner-progress">
          <strong>{completed}/{tasks.length}</strong>
          <span>Tasks completed</span>
        </div>
      </section>

      {onNavigate && <button type="button" className="primary-button" onClick={() => onNavigate('Calendar')} style={{ marginBottom: 18 }}>Open smart calendar</button>}
      <section className="planner-summary">
        <Summary label="Total tasks" value={tasks.length} />
        <Summary label="Remaining" value={tasks.length - completed} />
        <Summary label="Completed" value={completed} />
        <Summary label="Unscheduled" value={tasks.filter(t=>statusOf(t)==='unscheduled').length} />
        <Summary label="Missed" value={tasks.filter(t=>statusOf(t)==='missed').length} />
      </section>

      <section className="panel planner-panel">
        <button type="button" className="planner-add-toggle" onClick={() => setExpandedAdd(v => !v)}>{expandedAdd ? "− Hide task form" : "+ Add a task"}</button>
        {expandedAdd && <div>
        <div className="panel-heading">
          <div>
            <h2>Add a task</h2>
            <p>Break your academic workload into smaller actions.</p>
          </div>
          <Plus size={20} className="muted-icon" />
        </div>

        <form className="planner-form" onSubmit={addTask}>
          <div className="planner-field planner-title-field">
            <label>Task name</label>
            <input
              value={newTaskTitle}
              onChange={event => setNewTaskTitle(event.target.value)}
              placeholder="e.g. Revise graph algorithms"
              required
            />
          </div>

          <div className="planner-field">
            <label>Course</label>
            <select
              value={newTaskCourse}
              onChange={event => setNewTaskCourse(event.target.value)}
            >
              {courses.map(course => (
                <option key={course.id} value={course.code}>
                  {course.code}
                </option>
              ))}
            </select>
          </div>

          <div className="planner-field">
            <label>Estimated time</label>
            <select
              value={newTaskTime}
              onChange={event => setNewTaskTime(event.target.value)}
            >
              {['15 min', '30 min', '45 min', '60 min', '90 min', '2 hours'].map(time => (
                <option key={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="planner-field">
            <label>Priority</label>
            <select
              value={newTaskPriority}
              onChange={event =>
                setNewTaskPriority(event.target.value as 'High' | 'Medium' | 'Low')
              }
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <button className="primary-button" type="submit">
            <Plus size={16} />
            Add task
          </button>
        </form>
        </div>}
      </section>

      <section className="panel planner-panel">
        <div className="panel-heading"><div><h2>Task workspace</h2><p>Search, edit and recover work without leaving Planner.</p></div><span className="task-count">{filtered.length} shown</span></div>
        <div className="planner-tabs">{(['all','scheduled','unscheduled','missed'] as const).map(value => <button type="button" key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{value[0].toUpperCase()+value.slice(1)} ({value === 'all' ? tasks.length : tasks.filter(t => statusOf(t) === value).length})</button>)}</div>
        <div className="planner-filters">
          <input aria-label="Search tasks" placeholder="Search by name or course…" value={query} onChange={e => setQuery(e.target.value)}/>
          <select aria-label="Filter course" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}><option value="all">All courses</option>{Array.from(new Set([...courses.map(c=>c.code),...tasks.map(t=>t.course)])).filter(Boolean).map(c => <option key={c}>{c}</option>)}</select>
          <select aria-label="Filter priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="all">All priorities</option>{['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}</select>
          <select aria-label="Filter time" value={timeFilter} onChange={e => setTimeFilter(e.target.value)}><option value="all">Any time</option><option value="today">Today</option><option value="week">Next 7 days</option><option value="overdue">Overdue deadline</option><option value="no-date">No date</option></select>
          <button type="button" className="planner-clear" onClick={() => {setQuery('');setCourseFilter('all');setPriorityFilter('all');setTimeFilter('all');setTab('all')}}>Clear</button>
        </div>
        <div className="planner-task-list planner-scroll-list">
          {!filtered.length && <p className="planner-empty">No matching tasks. Try clearing your filters.</p>}
          {filtered.map(task => { const block=blockFor(task.id); const status=statusOf(task); return <div className={`planner-task-row planner-workspace-row ${task.completed ? 'task-completed' : ''}`} key={task.id}>
            <button type="button" className="task-check" onClick={() => onToggleTask(task.id)} aria-label={`Toggle ${task.title}`}>{task.completed ? <CheckCircle2 size={21}/> : <Circle size={21}/>}</button>
            <div className="task-details"><strong>{task.title}</strong><span>{task.course} · {task.time}{task.week ? ` · Week ${task.week}` : ''}{task.dueDate ? ` · Due ${task.dueDate}` : ''}</span><small className={`planner-status planner-status-${status}`}>{status}{block ? ` · ${block.date} ${block.start}` : ''}</small>{status === 'unscheduled' && task.status === 'deferred' && <small style={{color:'#9b6a28',display:'block',marginTop:4}}>Needs course setup: confirm teaching week or assessment deadline in Courses before scheduling.</small>}{status === 'unscheduled' && schedulingReasons[String(task.id)] && <small style={{color:'var(--text-muted, #9b6a28)',display:'block',marginTop:4}}>Why unscheduled: {schedulingReasons[String(task.id)]}</small>}{status === 'scheduled' && block?.originalDate && <small style={{display:'block',marginTop:4}}>Catch-up · originally Week {task.week || '?'} </small>}</div>
            <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
            <div className="planner-row-actions"><button type="button" onClick={() => setEditingId(editingId===task.id?null:task.id)}>Edit</button>{status==='missed' && <button type="button" onClick={() => recover(task.id)}>Recover</button>}{status==='scheduled' && <button type="button" onClick={() => unschedule(task.id)}>Unschedule</button>}<button type="button" aria-label={`Delete ${task.title}`} onClick={() => {if(window.confirm(`Delete ${task.title} and its linked calendar sessions?`))removeTask(task.id)}}>Delete</button></div>
            {editingId===task.id && <div className="planner-edit"><label>Name<input value={task.title} onChange={e=>updateTask(task.id,{title:e.target.value})}/></label><label>Course<select value={task.course} onChange={e=>updateTask(task.id,{course:e.target.value})}>{Array.from(new Set([task.course,...courses.map(c=>c.code)])).map(c=><option key={c}>{c}</option>)}</select></label><label>Priority<select value={task.priority} onChange={e=>updateTask(task.id,{priority:e.target.value as Task['priority']})}>{['High','Medium','Low'].map(v=><option key={v}>{v}</option>)}</select></label><label>Duration<select value={task.time} onChange={e=>updateTask(task.id,{time:e.target.value})}>{Array.from(new Set([task.time,'15 min','30 min','45 min','60 min','90 min','2 hours'])).map(v=><option key={v}>{v}</option>)}</select></label><label>Deadline<input type="date" value={task.dueDate||''} onChange={e=>updateTask(task.id,{dueDate:e.target.value||undefined})}/></label>{block && <><label>Scheduled date<input type="date" value={block.date} onChange={e=>setBlocks(prev=>prev.map(b=>b.id===block.id?{...b,date:e.target.value}:b))}/></label><label>Start<input type="time" value={block.start} onChange={e=>setBlocks(prev=>prev.map(b=>b.id===block.id?{...b,start:e.target.value}:b))}/></label></>}<button type="button" onClick={()=>setEditingId(null)}>Done</button>{!block && <button type="button" onClick={()=>onNavigate?.('Calendar')}>Schedule in Calendar</button>}</div>}
          </div>})}
        </div>
      </section>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="planner-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
