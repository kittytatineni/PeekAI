import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Download, Plus, Sparkles, Trash2 } from 'lucide-react'
import type { Course, StudyBlock, Task, WeeklyAvailability } from '../types'
import '../styles/calendar.css'
import { getPracticeWindow } from '../utils/schedulingPolicy'

type Props = {
  tasks: Task[]
  courses: Course[]
  blocks: StudyBlock[]
  setBlocks: React.Dispatch<React.SetStateAction<StudyBlock[]>>
  availability: WeeklyAvailability[]
  setAvailability: React.Dispatch<React.SetStateAction<WeeklyAvailability[]>>
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const pad = (n: number) => String(n).padStart(2, '0')
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const minutes = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m }
const clock = (n: number) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`
const mondayOf = (date: Date) => { const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d }
const addDays = (date: Date, n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); return d }
const durationOf = (value: string) => value.includes('hour') ? Math.round(parseFloat(value) * 60) : parseInt(value, 10) || 30
const priorityRank = (p: Task['priority']) => ({ High: 0, Medium: 1, Low: 2 })[p]
const colorOf = (course: string, courses: Course[]) => {
  const index = courses.findIndex(c => c.code === course)
  return ['teal', 'blue', 'purple', 'orange', 'pink'][Math.max(index, 0) % 5]
}
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export default function Calendar({ tasks, courses, blocks, setBlocks, availability, setAvailability }: Props) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [activeTab, setActiveTab] = useState<'calendar' | 'availability'>('calendar')
  const [message, setMessage] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'adaptive' | 'strict' | 'catchup'>(() => (localStorage.getItem('peekai-schedule-mode') as 'adaptive' | 'strict' | 'catchup') || 'adaptive')
  const [dailyLimit, setDailyLimit] = useState(() => Number(localStorage.getItem('peekai-daily-limit') || 180))
  const [breakMinutes, setBreakMinutes] = useState(() => Number(localStorage.getItem('peekai-break-minutes') || 15))
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState(() => localDate(new Date()))
  const [newStart, setNewStart] = useState('17:00')
  const [newDuration, setNewDuration] = useState(60)
  const [newCourse, setNewCourse] = useState('Personal')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [importingCalendar, setImportingCalendar] = useState(false)
  const [importProvider, setImportProvider] = useState<'Google' | 'Moodle' | 'Canvas' | 'Other'>('Google')
  const [importOpen, setImportOpen] = useState(false)
  const [googleToken, setGoogleToken] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const weekDates = useMemo(() => DAY_NAMES.map((_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = localDate(weekDates[6])
  const courseWeekLabels = courses.filter(c => c.termStartDate && /^\d{4}-\d{2}-\d{2}$/.test(c.termStartDate)).map(c => {
    const start = mondayOf(new Date(`${c.termStartDate}T12:00:00`))
    const current = Math.floor((weekStart.getTime() - start.getTime()) / (7 * 86400000)) + 1
    return { code: c.code, week: current, start: localDate(start) }
  })
  const visibleBlocks = blocks.filter(b => b.date >= localDate(weekStart) && b.date <= weekEnd)
  const scheduledTaskIds = new Set(blocks.filter(b => b.taskId !== undefined && b.status !== 'missed').map(b => b.taskId))
  const unscheduled = tasks.filter(t => !t.completed && t.status !== 'deferred' && !scheduledTaskIds.has(t.id))
  const missed = blocks.filter(b => b.status === 'missed')
  const deadlines = courses.flatMap(c => c.assessments.filter(a => /^\d{4}-\d{2}-\d{2}$/.test(a.dueDate)).map(a => ({ id: `${c.id}:${a.id}`, title: a.title, course: c.code, date: a.dueDate })))
  const scheduledMinutes = visibleBlocks.filter(b => b.status !== 'missed').reduce((sum, b) => sum + b.durationMinutes, 0)

  useEffect(() => {
    // A past session with an unfinished linked task is missed, unless already handled.
    const now = new Date()
    const nowDate = localDate(now)
    const nowMinute = now.getHours() * 60 + now.getMinutes()
    setBlocks(previous => {
      let changed = false
      const next = previous.map(b => {
        if (b.taskId === undefined || b.status === 'missed' || b.status === 'completed') return b
        const task = tasks.find(t => t.id === b.taskId)
        if (!task || task.completed) return b
        if (b.date < nowDate || (b.date === nowDate && minutes(b.start) + b.durationMinutes < nowMinute)) {
          changed = true
          return { ...b, status: 'missed' as const, missedAt: now.toISOString() }
        }
        return b
      })
      return changed ? next : previous
    })
  }, [tasks, setBlocks])

  function updateAvailability(index: number, patch: Partial<WeeklyAvailability>) {
    setAvailability(previous => previous.map((a, i) => i === index ? { ...a, ...patch } : a))
  }

  function markMissed(id: number) {
    setBlocks(previous => previous.map(b => b.id === id ? { ...b, status: 'missed', missedAt: new Date().toISOString() } : b))
    setMessage('Session marked missed. Use Recover missed sessions to reschedule without losing your task.')
  }
  function recoverMissed() {
    const toRecover = blocks.filter(b => b.status === 'missed' && b.taskId !== undefined)
    if (!toRecover.length) { setMessage('No missed task sessions to recover.'); return }
    // Remove only missed task-linked blocks; their tasks become eligible again.
    setBlocks(previous => previous.filter(b => !(b.status === 'missed' && b.taskId !== undefined)))
    setMessage(`${toRecover.length} missed session(s) returned to the unscheduled queue. Click Auto-schedule tasks to find new available slots.`)
  }
  function scheduleTasks(fullTerm = false) {
    const schedulingAnchor = weekStart > mondayOf(new Date()) ? weekStart : mondayOf(new Date())
    const schedulingDates = Array.from({ length: fullTerm ? 70 : 7 }, (_, i) => addDays(schedulingAnchor, i))
    const firstDate = localDate(schedulingDates[0])
    const lastDate = localDate(schedulingDates[schedulingDates.length - 1])
    const now = new Date()
    const today = localDate(now)
    const reasons: Record<string, string> = {}
    const generated: StudyBlock[] = []
    let nextId = Math.max(Date.now(), ...blocks.map(b => b.id + 1))
    let catchups = 0
    let excluded = 0
    let noRoom = 0
    const pending = [...unscheduled].sort((a, b) =>
      (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') ||
      priorityRank(a.priority) - priorityRank(b.priority) ||
      (a.availableFrom || '').localeCompare(b.availableFrom || '')
    )

    for (const task of pending) {
      const course = courses.find(c => c.code === task.course)
      const courseMonday = course?.termStartDate && /^\d{4}-\d{2}-\d{2}$/.test(course.termStartDate)
        ? mondayOf(new Date(`${course.termStartDate}T12:00:00`)) : undefined
      const weekStartDate = task.week && courseMonday ? localDate(addDays(courseMonday, (task.week - 1) * 7)) : undefined
      const weekEndExclusive = task.week && courseMonday ? localDate(addDays(courseMonday, task.week * 7)) : undefined
      const deadline = task.dueDate || undefined
      const hardDeadline = task.kind === 'Assessment' ? deadline : undefined
      // Syllabus-generated practice tasks are intentionally released the Monday
      // AFTER the topic is taught. Their target week is the following week.
      // An exclusive upper bound equal to availableFrom creates an empty range.
      const { endExclusive: effectiveEnd } = getPracticeWindow({
        kind: task.kind ?? '',
        availableFrom: task.availableFrom,
        weekEndExclusive,
      })
      const isCatchup = !!(effectiveEnd && effectiveEnd <= firstDate)
      const earliest = task.availableFrom || firstDate
      if (task.week && !weekStartDate) {
        reasons[String(task.id)] = 'Teaching week cannot be calculated. Set the course term start date in Courses.'
        excluded++
        continue
      }
      if (scheduleMode === 'catchup' && !isCatchup) {
        reasons[String(task.id)] = 'Not yet catch-up work. Use Adaptive for upcoming practice.'
        excluded++
        continue
      }
      if (scheduleMode === 'strict' && isCatchup) {
        reasons[String(task.id)] = 'Practice window has passed. Use Adaptive to recover this task.'
        excluded++
        continue
      }
      // Assessment preparation can be scheduled provisionally without a confirmed
      // exam date. Submissions remain blocked until a real deadline is supplied.
      const isSubmission = task.kind === 'Assessment' && /submit|test and submit/i.test(task.title)
      if (isSubmission && !hardDeadline) {
        reasons[String(task.id)] = 'Confirm the exam/submission date in Courses before scheduling submission.'
        excluded++
        continue
      }
      const lowerBound = isCatchup && scheduleMode !== 'strict'
        ? (earliest > firstDate ? earliest : firstDate)
        : (weekStartDate && weekStartDate > earliest ? weekStartDate : earliest)
      const upperBound = isCatchup && scheduleMode !== 'strict' && task.kind !== 'Assessment'
        ? undefined
        : hardDeadline || (task.kind !== 'Assessment' ? effectiveEnd : undefined)
      const length = durationOf(task.time)
      const allDates = schedulingDates.map(d => ({ day: (d.getDay() + 6) % 7, date: localDate(d) }))
      const dateCandidates = allDates.filter(({ date }) =>
        date >= today && date >= lowerBound && (!upperBound || (hardDeadline ? date <= upperBound : date < upperBound)))
      const options = dateCandidates.filter(({ day }) => availability[day]?.enabled)
      if (!options.length) {
        if (hardDeadline && hardDeadline < today) {
          reasons[String(task.id)] = 'Assessment deadline has passed; confirm a new deadline in Courses.'
        } else if (effectiveEnd && effectiveEnd <= firstDate && scheduleMode === 'strict') {
          reasons[String(task.id)] = 'Teaching week is before the selected range. Use Adaptive for catch-up.'
        } else if (earliest > lastDate) {
          reasons[String(task.id)] = `Task is not available until ${earliest}, after the scheduling range ends ${lastDate}. Check availableFrom or schedule a later range.`
        } else if (upperBound && upperBound < firstDate) {
          reasons[String(task.id)] = `Eligible window ended ${upperBound}, before scheduling starts ${firstDate}. Use Adaptive catch-up for practice or review the assessment deadline.`
        } else if (lowerBound >= (upperBound || '9999-12-31') && !hardDeadline) {
          reasons[String(task.id)] = `Task release date (${lowerBound}) is on/after its practice window end (${upperBound}). Review generated dates in Courses.`
        } else if (!dateCandidates.length) {
          reasons[String(task.id)] = `No dates overlap this task's eligible window (${lowerBound} to ${upperBound || 'open'}) and scheduling range (${firstDate} to ${lastDate}).`
        } else {
          reasons[String(task.id)] = `There are ${dateCandidates.length} eligible date(s), but all corresponding weekdays are disabled in My availability.`
        }
        excluded++
        continue
      }
      const load = (date: string) => [...blocks, ...generated]
        .filter(x => x.date === date && x.status !== 'missed' && x.type !== 'personal')
        .reduce((sum, x) => sum + x.durationMinutes, 0)
      options.sort((a, b) => {
        const score = (o: typeof options[number]) => load(o.date) / Math.max(1, dailyLimit) + (o.day >= 5 ? 0.12 : 0)
        return score(a) - score(b) || a.date.localeCompare(b.date)
      })
      let placed = false
      for (const { day, date } of options) {
        const window = availability[day]
        const startWindow = minutes(window.start)
        const endWindow = minutes(window.end)
        if (endWindow <= startWindow) continue
        const occupied = [...blocks.filter(b => b.status !== 'missed'), ...generated].filter(b => b.date === date)
        const used = occupied.filter(b => b.type !== 'personal').reduce((sum, b) => sum + b.durationMinutes, 0)
        if (used + length > dailyLimit) continue
        for (let start = startWindow; start + length <= endWindow; start += 15) {
          if (date === today && start < now.getHours() * 60 + now.getMinutes()) continue
          const overlaps = occupied.some(b => start < minutes(b.start) + b.durationMinutes + breakMinutes && start + length + breakMinutes > minutes(b.start))
          if (overlaps) continue
          generated.push({ id: ++nextId, taskId: task.id, title: task.title, course: task.course,
            date, start: clock(start), durationMinutes: length, type: task.blockType || 'study', status: 'scheduled',
            ...(isCatchup ? { originalDate: weekStartDate } : {}) })
          if (isCatchup) catchups++
          placed = true
          break
        }
        if (placed) break
      }
      if (!placed) {
        reasons[String(task.id)] = `Eligible days exist, but no ${length}-minute slot fits the available hours, ${dailyLimit}-minute daily limit, busy events and ${breakMinutes}-minute breaks.`
        noRoom++
      }
    }
    localStorage.setItem('peekai-schedule-reasons', JSON.stringify(reasons))
    if (generated.length) setBlocks(previous => [...previous, ...generated])
    setMessage(`${generated.length} session(s) scheduled (${catchups} catch-up) for ${firstDate} to ${lastDate}. ${excluded} task(s) outside eligible dates; ${noRoom} task(s) lacked a free slot. Open Planner to review reasons for unscheduled tasks.`)
    setActiveTab('calendar')
  }

  function addBlock(event: React.FormEvent) {
    event.preventDefault()
    if (!newTitle.trim()) return
    setBlocks(previous => [...previous, { id: Date.now(), title: newTitle.trim(), course: newCourse, date: newDate, start: newStart, durationMinutes: newDuration, type: newCourse === 'Personal' ? 'personal' : 'study', status: 'scheduled' }])
    setNewTitle('')
    setMessage('Block added. You can change its date and time below.')
  }

  function updateBlock(id: number, patch: Partial<StudyBlock>) {
    setBlocks(previous => previous.map(b => b.id === id ? { ...b, ...patch } : b))
  }

  // Shared multi-provider calendar import. ICS works for Moodle, Canvas and Google exports.
  async function importICS(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setImportingCalendar(true)
    try {
      const imported: StudyBlock[] = []
      let skipped = 0
      for (const file of files) {
        const source = (await file.text()).replace(/\r?\n[ \t]/g, '')
        const events = source.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || []
        const prop = (body: string, name: string) => {
          const line = body.split(/\r?\n/).find(l => l.split(':')[0].split(';')[0].toUpperCase() === name)
          return line ? line.slice(line.indexOf(':') + 1).trim() : ''
        }
        for (const body of events) {
          const start = prop(body, 'DTSTART'), end = prop(body, 'DTEND')
          const summary = prop(body, 'SUMMARY').replace(/\\([,;\\])/g, '$1').replace(/\\n/gi, ' ')
          // Recurrence with timezone rules must be expanded safely; do not misrepresent unsupported cases.
          if (/RRULE(?:;|:)/i.test(body) || !/^\d{8}T\d{6}Z?$/.test(start) || !/^\d{8}T\d{6}Z?$/.test(end)) { skipped++; continue }
          const parse = (v: string) => {
            const iso = `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}T${v.slice(9,11)}:${v.slice(11,13)}:${v.slice(13,15)}`
            return new Date(iso + (v.endsWith('Z') ? 'Z' : ''))
          }
          const a = parse(start), b = parse(end)
          const duration = Math.round((b.getTime()-a.getTime())/60000)
          if (!Number.isFinite(duration) || duration <= 0 || duration > 1440 || localDate(a) !== localDate(new Date(b.getTime()-1))) { skipped++; continue }
          const uid = prop(body, 'UID') || `${start}:${end}:${summary}`
          imported.push({ id: 0, sourceKey: `ics:${importProvider}:${uid}:${start}`, title: summary || `${importProvider} event`, course: importProvider, date: localDate(a), start: clock(a.getHours()*60+a.getMinutes()), durationMinutes: duration, type: 'personal', status: 'scheduled' })
        }
      }
      setBlocks(previous => {
        const keys = new Set(previous.map(b => b.sourceKey))
        let id = Math.max(Date.now(), ...previous.map(b => b.id))
        const next = imported.filter(b => !keys.has(b.sourceKey)).map(b => ({ ...b, id: ++id }))
        return next.length ? [...previous, ...next] : previous
      })
      setMessage(`${importProvider}: read ${files.length} calendar file(s), ${imported.length} timed events (${skipped} unsupported recurring/all-day/timezone events skipped). Events block study scheduling.`)
    } catch (error) {
      setMessage(`Calendar import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally { setImportingCalendar(false); event.target.value = '' }
  }

  // Google OAuth token flow: read-only, browser token in memory, no credentials stored.
  async function connectGoogle() {
    if (!googleClientId) { setMessage('Set VITE_GOOGLE_CLIENT_ID in your frontend .env.local, then restart Vite. Configure the Google OAuth JavaScript origin in Google Cloud.'); return }
    setGoogleBusy(true)
    try {
      if (!(window as Window & {google?: unknown}).google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://accounts.google.com/gsi/client'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Google sign-in script could not load'))
          document.head.appendChild(script)
        })
      }
      const g = (window as Window & {google?: {accounts: {oauth2: {initTokenClient: (config: Record<string, unknown>) => {requestAccessToken: (options?: Record<string, unknown>) => void}}}}}).google
      if (!g) throw new Error('Google Identity Services unavailable')
      const token = await new Promise<string>((resolve, reject) => {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/calendar.readonly',
          callback: (response: {access_token?: string; error?: string}) => response.access_token ? resolve(response.access_token) : reject(new Error(response.error || 'Google authorization cancelled'))
        })
        client.requestAccessToken({prompt: 'consent'})
      })
      setGoogleToken(token)
      await syncGoogle(token)
    } catch (error) { setMessage(`Google connection: ${error instanceof Error ? error.message : 'Failed'}`) }
    finally { setGoogleBusy(false) }
  }

  async function syncGoogle(token: string) {
    setGoogleBusy(true)
    try {
      const api = async (url: string) => {
        const res = await fetch(url, {headers: {Authorization: `Bearer ${token}`}})
        if (!res.ok) throw new Error(`Google API ${res.status}: ${await res.text()}`)
        return res.json()
      }
      const calendars: {id:string;summary?:string;selected?:boolean}[] = []
      let page = ''
      do {
        const result = await api(`https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`)
        calendars.push(...(result.items || [])); page = result.nextPageToken || ''
      } while (page)
      const from = new Date(Date.now() - 30*86400000).toISOString()
      const to = new Date(Date.now() + 365*86400000).toISOString()
      const incoming: StudyBlock[] = []
      for (const cal of calendars.filter(c => c.selected !== false)) {
        page = ''
        do {
          const params = new URLSearchParams({singleEvents:'true',orderBy:'startTime',maxResults:'2500',timeMin:from,timeMax:to})
          if (page) params.set('pageToken',page)
          const result = await api(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`)
          for (const e of result.items || []) {
            if (e.status === 'cancelled' || e.transparency === 'transparent' || !e.start?.dateTime || !e.end?.dateTime) continue
            const start = new Date(e.start.dateTime), end = new Date(e.end.dateTime)
            const duration = Math.round((end.getTime()-start.getTime())/60000)
            if (duration <= 0 || duration > 1440 || localDate(start) !== localDate(new Date(end.getTime()-1))) continue
            incoming.push({id:0,sourceKey:`google:${cal.id}:${e.id}`,title:e.summary || 'Busy',course:'Google',date:localDate(start),start:clock(start.getHours()*60+start.getMinutes()),durationMinutes:duration,type:'personal',status:'scheduled'})
          }
          page = result.nextPageToken || ''
        } while (page)
      }
      setBlocks(previous => {
        const byKey = new Map(previous.filter(b => !b.sourceKey?.startsWith('google:')).map(b => [b.sourceKey || `local:${b.id}`,b]))
        const existing = new Map(previous.map(b => [b.sourceKey,b]))
        let id = Math.max(Date.now(),...previous.map(b=>b.id))
        for (const b of incoming) byKey.set(b.sourceKey!, {...b,id:existing.get(b.sourceKey)?.id || ++id})
        return Array.from(byKey.values())
      })
      setMessage(`Google connected: synced ${incoming.length} timed busy events from ${calendars.length} calendars (next 365 days). Recurring Google events are expanded by Google. Use Sync Google to refresh.`)
    } catch(error) { setMessage(`Google sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`) }
    finally { setGoogleBusy(false) }
  }

  function exportICS() {
    const stamp = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`
    const events = blocks.filter(b => b.status !== 'missed').map(b => {
      const end = minutes(b.start) + b.durationMinutes
      const endDate = addDays(new Date(`${b.date}T12:00:00`), Math.floor(end / 1440))
      return ['BEGIN:VEVENT', `UID:peekai-${b.id}@local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART:${stamp(b.date, b.start)}`, `DTEND:${stamp(localDate(endDate), clock(end % 1440))}`, `SUMMARY:${icsEscape(b.title)}`, `DESCRIPTION:${icsEscape(`PeekAI study block - ${b.course}`)}`, 'END:VEVENT'].join('\r\n')
    })
    const deadlineEvents = deadlines.map(d => ['BEGIN:VEVENT', `UID:peekai-deadline-${d.id}@local`, `DTSTART;VALUE=DATE:${d.date.replace(/-/g,'')}`, `DTEND;VALUE=DATE:${localDate(addDays(new Date(`${d.date}T12:00:00`),1)).replace(/-/g,'')}`, `SUMMARY:${icsEscape('DEADLINE: ' + d.title)}`, `DESCRIPTION:${icsEscape(d.course + ' assessment deadline')}`, 'END:VEVENT'].join('\r\n'))
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PeekAI//Study Calendar//EN', 'CALSCALE:GREGORIAN', ...events, ...deadlineEvents, 'END:VCALENDAR'].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'peekai-study-calendar.ics'; a.click(); URL.revokeObjectURL(url)
  }

  return <div className="page-content">
    <section className="welcome-row"><div><div className="eyebrow">YOUR STUDY CALENDAR</div><h1>Make time for what matters. <span>✦</span></h1><p>Schedule tasks around your availability, then adjust your week.</p></div></section>
    <section className="planner-summary">
      <div className="planner-summary-card"><span>Scheduled this week</span><strong>{visibleBlocks.length}</strong></div>
      <div className="planner-summary-card"><span>Study hours this week</span><strong>{(scheduledMinutes / 60).toFixed(1)}h</strong></div>
      <div className="planner-summary-card"><span>Unscheduled tasks</span><strong>{unscheduled.length}</strong></div>
    </section>
    <div className="calendar-actions"><label style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>Scheduling mode <select aria-label="Scheduling mode" value={scheduleMode} onChange={e => { const mode = e.target.value as 'adaptive' | 'strict' | 'catchup'; setScheduleMode(mode); localStorage.setItem('peekai-schedule-mode', mode) }}><option value="adaptive">Adaptive (weekly + catch-up)</option><option value="strict">Strict teaching weeks</option><option value="catchup">Catch-up only</option></select></label><div className="calendar-tabs"><button className={activeTab === 'calendar' ? 'selected' : ''} onClick={() => setActiveTab('calendar')}>Weekly calendar</button><button className={activeTab === 'availability' ? 'selected' : ''} onClick={() => setActiveTab('availability')}>My availability</button></div><div className="calendar-action-buttons"><button className="calendar-secondary" onClick={() => setImportOpen(o => !o)}><CalendarDays size={16}/> Import calendars</button><button className="calendar-secondary" onClick={exportICS} disabled={!blocks.length}><Download size={16}/> Export .ics</button><button className="primary-button" onClick={() => scheduleTasks(false)} disabled={!unscheduled.length}><Sparkles size={16}/> Schedule selected week</button><button className="calendar-secondary" onClick={() => scheduleTasks(true)} disabled={!unscheduled.length}>Schedule selected + next 9 weeks</button><button className="calendar-secondary" onClick={() => { if (window.confirm('Clear auto-generated future study sessions? Manual blocks and past sessions stay.')) { const today=localDate(new Date()); setBlocks(prev=>prev.filter(b=>b.taskId===undefined || b.date<today)); setMessage('Future generated sessions cleared. You can now schedule again.') } }}>Reset future schedule</button><button className="calendar-secondary" onClick={recoverMissed} disabled={!missed.some(b => b.taskId !== undefined)}>Recover missed sessions ({missed.length})</button></div></div>
    {importOpen && <section className="panel calendar-settings calendar-import-panel">
      <h3>Connect & import calendars</h3>
      <p>Import Google, Moodle and Canvas commitments into one busy-time calendar. Imported events are not study tasks.</p>
      <div className="calendar-import-controls">
        <button className="primary-button" disabled={googleBusy} onClick={connectGoogle}>{googleBusy ? 'Connecting…' : 'Connect Google Calendar'}</button>
        {googleToken && <button className="calendar-secondary" disabled={googleBusy} onClick={() => syncGoogle(googleToken)}>Sync Google</button>}
        <label>Calendar source <select value={importProvider} onChange={e => setImportProvider(e.target.value as typeof importProvider)}><option>Google</option><option>Moodle</option><option>Canvas</option><option>Other</option></select></label>
        <label className="calendar-secondary" style={{cursor:'pointer'}}>Import .ics files<input type="file" multiple accept=".ics,text/calendar" onChange={importICS} disabled={importingCalendar} style={{display:'none'}}/></label>
      </div>
      <p className="calendar-hint">Google live sync needs a Google Cloud OAuth Web Client ID in VITE_GOOGLE_CLIENT_ID and an authorized JavaScript origin. Moodle and Canvas support multiple .ics exports; live OAuth for those platforms requires institution-specific authorization. Imported recurring .ics events are currently skipped, but Google API recurring events are expanded.</p>
    </section>}
    {message && <p className="calendar-message" role="status">{message}</p>}
    {activeTab === 'availability' ? <section className="panel calendar-settings"><div className="panel-heading"><div><h2>When can you study?</h2><p>Choose recurring weekly windows. Existing commitments can be added as blocks in the calendar.</p></div></div><div className="availability-list">{availability.map((a, i) => <div className="availability-row" key={DAY_NAMES[i]}><label className="availability-day"><input type="checkbox" checked={a.enabled} onChange={e => updateAvailability(i, { enabled: e.target.checked })}/> {DAY_NAMES[i]}</label><label>From <input type="time" disabled={!a.enabled} value={a.start} onChange={e => updateAvailability(i, { start: e.target.value })}/></label><label>Until <input type="time" disabled={!a.enabled} value={a.end} onChange={e => updateAvailability(i, { end: e.target.value })}/></label></div>)}</div><div className="availability-row"><label>Daily study limit <select value={dailyLimit} onChange={e => { const value = Number(e.target.value); setDailyLimit(value); localStorage.setItem('peekai-daily-limit', String(value)) }}><option value={60}>1 hour</option><option value={120}>2 hours</option><option value={180}>3 hours</option><option value={240}>4 hours</option><option value={300}>5 hours</option></select></label><label>Break between sessions <select value={breakMinutes} onChange={e => { const value = Number(e.target.value); setBreakMinutes(value); localStorage.setItem('peekai-break-minutes', String(value)) }}><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={25}>25 minutes</option><option value={30}>30 minutes</option></select></label></div><p className="calendar-hint">Auto-scheduling uses the displayed week as its starting point. Adaptive mode keeps upcoming topics in their teaching weeks and recovers missed weeks as catch-up, respects your daily limit and breaks, and never invents teaching dates. Assign topic weeks and a term start date in Courses. It never deletes existing blocks.</p></section> : <>
      <section className="panel calendar-panel"><div className="calendar-week-header"><div className="calendar-week-nav"><button aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={19}/></button><strong>{weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong><button aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={19}/></button><button className="calendar-today" onClick={() => setWeekStart(mondayOf(new Date()))}>Today</button></div><span><CalendarDays size={16}/> {visibleBlocks.length} blocks</span></div>{courseWeekLabels.length > 0 && <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'10px 0',alignItems:'center'}}>{courseWeekLabels.map(c => <span key={c.code} style={{padding:'6px 10px',background:'#eef5f5',borderRadius:8,color:'#174c52'}}><strong>{c.code}</strong>: {c.week < 1 ? 'Before Week 1' : c.week > 10 ? `After Week 10 (Week ${c.week})` : `Teaching Week ${c.week}`} · Week 1 starts {c.start}</span>)}<button className="calendar-secondary" onClick={() => { const c = courses.find(c => c.termStartDate); if(c?.termStartDate) setWeekStart(mondayOf(new Date(`${c.termStartDate}T12:00:00`))) }}>Jump to Week 1</button></div>}<div style={{display:'flex',flexWrap:'wrap',gap:12,margin:'12px 0'}}><span style={{color:'#a33'}}>● Deadline (fixed)</span><span style={{color:'#b66b08'}}>● Assessment preparation</span><span style={{color:'#6750a4'}}>● Submit / test</span><span style={{color:'#2563eb'}}>● Google</span><span style={{color:'#a21caf'}}>● Moodle</span><span style={{color:'#64748b'}}>● Canvas</span><span style={{color:'#087e70'}}>● Study/revision</span><span>● Missed (grey)</span></div><div className="calendar-scroll"><div className="calendar-grid"><div className="calendar-corner"/>{weekDates.map((date, i) => <div className={`calendar-day-head ${localDate(date) === localDate(new Date()) ? 'is-today' : ''}`} key={i}><span>{DAY_NAMES[i].slice(0, 3)}</span><strong>{date.getDate()}</strong></div>)}<div className="calendar-time-axis">{HOURS.map(hour => <div key={hour}>{pad(hour)}:00</div>)}</div>{weekDates.map((date, day) => <div className="calendar-day-column" key={day}>{HOURS.map(hour => <div className="calendar-hour-line" key={hour}/>)}{deadlines.filter(d => d.date === localDate(date)).map(d => <div key={d.id} className="peek-deadline" title="Fixed assessment deadline">DEADLINE: {d.title}</div>)}{visibleBlocks.filter(b => b.date === localDate(date)).map(b => { const start = minutes(b.start); const top = start / 60 * 64; const height = b.durationMinutes / 60 * 64; return <button key={b.id} className={`calendar-event ${b.status === 'missed' ? 'peek-missed' : b.type === 'personal' ? `peek-external peek-${b.course.toLowerCase().replace(/[^a-z]/g,'')}` : /test|submit|final review/i.test(b.title) ? 'peek-submit' : /plan/i.test(b.title) ? 'peek-plan' : /work|implement|draft/i.test(b.title) && b.type === 'assessment-prep' ? 'peek-work' : b.type === 'assessment-prep' ? 'peek-prep' : b.type === 'study' ? 'peek-study' : `event-${colorOf(b.course, courses)}`}`} style={{ top: `${top}px`, height: `${Math.max(height, 26)}px` }} onClick={() => setEditingId(b.id)} title="Click to edit"><strong>{b.title}</strong><span>{b.status === "missed" ? "MISSED · " : ""}{b.start} · {b.durationMinutes} min</span><small>{b.course}</small></button> })}</div>)}</div></div></section>
      <section className="panel calendar-settings"><div className="panel-heading"><div><h2><Plus size={18}/> Add a block</h2><p>Block out classes, work, commitments or extra study sessions.</p></div></div><form className="calendar-add-form" onSubmit={addBlock}><label>Title<input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Part-time work"/></label><label>Date<input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required/></label><label>Start<input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} required/></label><label>Minutes<input type="number" min="15" max="480" step="15" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} required/></label><label>Course / type<select value={newCourse} onChange={e => setNewCourse(e.target.value)}><option>Personal</option>{courses.map(c => <option key={c.id}>{c.code}</option>)}</select></label><button className="primary-button" type="submit"><Plus size={16}/> Add block</button></form></section>
      <section className="panel calendar-settings"><div className="panel-heading"><div><h2>Scheduled blocks</h2><p>Click a calendar event or Edit below to adjust its time.</p></div></div>{visibleBlocks.length === 0 ? <p className="planner-empty">No blocks this week. Set your availability and auto-schedule your tasks.</p> : visibleBlocks.slice().sort((a,b) => (a.date + a.start).localeCompare(b.date + b.start)).map(b => <div className="calendar-block-row" key={b.id}><div><strong>{b.title}</strong><span>{b.course} · {b.date} · {b.start} · {b.durationMinutes} min · {b.status || "scheduled"}</span></div>{b.taskId !== undefined && b.status !== "missed" && <button className="calendar-secondary" onClick={() => markMissed(b.id)}>Mark missed</button>}<button className="calendar-secondary" onClick={() => setEditingId(b.id)}>Edit</button><button className="calendar-icon-button" aria-label={`Delete ${b.title}`} onClick={() => setBlocks(previous => previous.filter(item => item.id !== b.id))}><Trash2 size={17}/></button></div>)}</section>
    </>}
    {editingId !== null && (() => { const b = blocks.find(item => item.id === editingId); if (!b) return null; return <div className="calendar-modal-backdrop" onClick={() => setEditingId(null)}><div className="calendar-modal" role="dialog" aria-modal="true" aria-label="Edit study block" onClick={e => e.stopPropagation()}><h2>Edit block</h2><label>Title<input value={b.title} onChange={e => updateBlock(b.id, { title: e.target.value })}/></label><label>Date<input type="date" value={b.date} onChange={e => updateBlock(b.id, { date: e.target.value })}/></label><label>Start time<input type="time" value={b.start} onChange={e => updateBlock(b.id, { start: e.target.value })}/></label><label>Duration (minutes)<input type="number" min="15" step="15" value={b.durationMinutes} onChange={e => updateBlock(b.id, { durationMinutes: Math.max(15, Number(e.target.value) || 15) })}/></label><div className="calendar-modal-actions"><button className="calendar-secondary" onClick={() => setEditingId(null)}>Done</button>{b.taskId !== undefined && b.status !== "missed" && <button className="calendar-secondary" onClick={() => { markMissed(b.id); setEditingId(null) }}>Mark missed</button>}<button className="calendar-delete" onClick={() => { setBlocks(previous => previous.filter(item => item.id !== b.id)); setEditingId(null) }}>Delete block</button></div></div></div> })()}
    <p className="calendar-hint">Missed sessions stay visible until recovered. Recovery puts their task back into the queue; Auto-schedule finds a future slot. Fixed deadlines never move automatically.</p>
    <p className="calendar-hint">Use Import calendars for Google OAuth read-only sync or Google, Moodle and Canvas .ics exports. Imported busy events block scheduling. Scheduling is conflict-aware and rule-based; GLM analysis of commitments is not yet connected.</p>
  </div>
}
