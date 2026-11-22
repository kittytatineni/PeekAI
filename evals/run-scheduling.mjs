import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPracticeWindow, eligibleDates } from '../src/utils/schedulingPolicy.ts'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataset = JSON.parse(fs.readFileSync(path.join(root, 'datasets/scheduling_holdout.json'), 'utf8'))
const baseline = c => ({endExclusive: c.weekEndExclusive, shifted: false})
const score = fn => {
  let correct = 0
  const rows = dataset.cases.map(c => {
    const got = fn(c)
    const pass = got.endExclusive === c.expectedEndExclusive && got.shifted === c.expectedShifted
    if (pass) correct++
    return {id: c.id, pass, expectedEndExclusive: c.expectedEndExclusive ?? null, actualEndExclusive: got.endExclusive ?? null}
  })
  return {correct, total: rows.length, accuracy: correct / rows.length, cases: rows}
}
const current = score(getPracticeWindow)
const oldBaseline = score(baseline)
const dateTests = [
  {name:'exclusive-boundary', pass: eligibleDates(['2026-11-23','2026-11-29','2026-11-30'],'2026-11-23','2026-11-30').join(',') === '2026-11-23,2026-11-29'},
  {name:'no-earlier-dates', pass: eligibleDates(['2026-11-22','2026-11-23'],'2026-11-23').join(',') === '2026-11-23'},
]
const report = {run_at_utc: new Date().toISOString(), dataset: dataset.dataset_id, dataset_origin: dataset.origin, metric: 'exact-match accuracy for practice-window end and shift classification', baseline: oldBaseline, candidate: current, dateTests, caveat:'Unit-level date-policy evaluation only; does not measure end-to-end task placement, LLM quality, or real-world accuracy.'}
const output = path.join(root, 'results', 'scheduling-latest.json')
fs.writeFileSync(output, JSON.stringify(report,null,2)+'\n')
console.log(`Baseline: ${oldBaseline.correct}/${oldBaseline.total} (${(100*oldBaseline.accuracy).toFixed(1)}%)`)
console.log(`Candidate: ${current.correct}/${current.total} (${(100*current.accuracy).toFixed(1)}%)`)
console.log(`Date tests: ${dateTests.filter(t=>t.pass).length}/${dateTests.length}`)
console.log(`Report: ${output}`)
if (current.correct !== current.total || dateTests.some(t=>!t.pass)) process.exitCode = 1
