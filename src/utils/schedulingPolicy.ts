/** Pure scheduling date policy. Dates are ISO YYYY-MM-DD; upper bounds exclusive. */
type PracticeCase = { kind: string; availableFrom?: string; weekEndExclusive?: string }
function plusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
export function getPracticeWindow(task: PracticeCase): { endExclusive?: string; shifted: boolean } {
  const end = task.weekEndExclusive
  const start = task.availableFrom
  if (task.kind === 'Assessment' || !end || !start) return { endExclusive: end, shifted: false }
  if (start >= end && start < plusDays(end, 7)) return { endExclusive: plusDays(end, 7), shifted: true }
  return { endExclusive: end, shifted: false }
}
export function eligibleDates(dates: string[], earliest: string, endExclusive?: string): string[] {
  return dates.filter(d => d >= earliest && (!endExclusive || d < endExclusive))
}
